import axios from 'axios';
import { marcarOracaoComoOrada } from '../src/services/api';

const apiClient = (axios.create as jest.Mock).mock.results[0].value;

describe('marcarOracaoComoOrada', () => {
  beforeEach(() => {
    apiClient.post.mockReset();
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
});
