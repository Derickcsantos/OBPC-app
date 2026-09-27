import axios from 'axios';
import {
  createAnnotation,
  desmarcarOracaoComoOrada,
  getAdminUsers,
  getHighlights,
  marcarOracaoComoOrada,
  putHighlight,
  updateAdminUserRole,
} from '../src/services/api';

const apiClient = (axios.create as jest.Mock).mock.results[0].value;

describe('marcarOracaoComoOrada', () => {
  beforeEach(() => {
    apiClient.post.mockReset();
    apiClient.get.mockReset();
    apiClient.put.mockReset();
    apiClient.patch.mockReset();
    apiClient.delete.mockReset();
  });

  it('envia o pedido autenticado pelo cliente e exige confirmacao da API', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: { data: { oracao_id: 'pedido/1', orado: true } },
    });

    await expect(marcarOracaoComoOrada('pedido/1')).resolves.toMatchObject({
      orado: true,
    });
    expect(apiClient.post).toHaveBeenCalledWith('/api/oracoes/pedido%2F1/orado');
  });

  it('nao apresenta sucesso quando a API nao confirma a marcacao', async () => {
    apiClient.post.mockResolvedValueOnce({ data: { data: {} } });

    await expect(marcarOracaoComoOrada('pedido-1')).rejects.toThrow(
      'A API nao confirmou',
    );
  });

  it('desmarca a oração de forma idempotente', async () => {
    apiClient.delete.mockResolvedValueOnce({ data: { data: {} } });
    await expect(desmarcarOracaoComoOrada('pedido/1')).resolves.toMatchObject({ orado: false });
    expect(apiClient.delete).toHaveBeenCalledWith('/api/oracoes/pedido%2F1/orado');
  });

  it('normaliza paginação administrativa e envia busca', async () => {
    apiClient.get.mockResolvedValueOnce({ data: { data: [{ usuario_id: 'u1' }], pagination: { current_page: 2, per_page: 20, total_items: 41, total_pages: 3 } } });
    await expect(getAdminUsers(2, 20, 'ana')).resolves.toMatchObject({ items: [{ usuario_id: 'u1' }], pagination: { page: 2, total: 41, totalPages: 3 } });
    expect(apiClient.get).toHaveBeenCalledWith('/api/admin/usuarios', { params: { page: 2, limit: 20, search: 'ana' } });
  });

  it('usa os contratos privados de anotação e destaque', async () => {
    const reference = { version: 'nvi', book: 1, chapter: 1, verse: 1 };
    apiClient.post.mockResolvedValueOnce({ data: { data: { id: 'a1', titulo: null, conteudo: 'Nota', versiculos: [reference] } } });
    apiClient.get.mockResolvedValueOnce({ data: { data: [] } });
    apiClient.put.mockResolvedValueOnce({ data: { data: { id: 'd1', ...reference, style: 'underline', color: 'blue' } } });
    await expect(createAnnotation({ titulo: null, conteudo: 'Nota', versiculos: [reference] })).resolves.toMatchObject({ id: 'a1' });
    await expect(getHighlights('nvi', 1, 1)).resolves.toEqual([]);
    await expect(putHighlight({ ...reference, style: 'underline', color: 'blue' })).resolves.toMatchObject({ id: 'd1' });
  });

  it('altera papel somente pelo endpoint administrativo', async () => {
    apiClient.patch.mockResolvedValueOnce({ data: { data: { usuario_id: 'u1', role: 'admin' } } });
    await expect(updateAdminUserRole('u1', 'admin')).resolves.toMatchObject({ role: 'admin' });
    expect(apiClient.patch).toHaveBeenCalledWith('/api/admin/usuarios/u1/role', { role: 'admin' });
  });
});
