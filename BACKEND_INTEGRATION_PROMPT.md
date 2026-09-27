# Prompt para implementar o suporte no backend

Implemente no backend da API OBPC os contratos necessários para o frontend React Native/Expo já preparado. Preserve autenticação Bearer JWT, isolamento por usuário e os formatos públicos existentes.

## Autenticação e autorização

- Faça `POST /api/auth/google` retornar `user.role` obrigatoriamente como `user | admin`.
- Nunca derive papel no frontend. Valide o JWT em todas as rotas abaixo.
- Rotas `/api/usuarios/me/*` devem usar exclusivamente o `usuario_id` do JWT, ignorando qualquer ID de usuário enviado pelo cliente.
- Rotas `/api/admin/*` devem responder `403` para usuários não administradores.

## Formato de resposta e paginação

- Resposta de item: `{ "data": { ... } }`.
- Resposta de lista: `{ "data": [], "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 1 } }`.
- Aceite `page` e `limit`, com padrão 1/20 e limite máximo 100.

## Upload administrativo

Crie `POST /api/admin/uploads`, autenticado e exclusivo para admin, usando `multipart/form-data`:

- Campo `file`: obrigatório; JPEG, PNG ou WebP; máximo 8 MB.
- Campo `context`: obrigatório; um de `ministerios | eventos | noticias | mensagens | louvores`.
- Valide MIME pelo conteúdo real, gere nome aleatório, remova metadados inseguros e não aceite SVG/HTML.
- Armazene em serviço persistente configurado no ambiente, gere URL HTTPS pública e retorne `{ "data": { "url": "https://..." } }`.
- Em falha, não retorne URL parcial; use `400` para arquivo inválido, `413` para tamanho, `401/403` para autenticação e `500/503` para indisponibilidade do storage.
- Registre usuário, contexto, MIME, tamanho e chave do objeto sem gravar o conteúdo do arquivo nos logs.

## Recursos integrados

- Garanta os endpoints idempotentes de oração:
  - `POST /api/oracoes/:id/orado` retorna `{ data: { usuario_id, oracao_id, orado: true, created_at } }`.
  - `DELETE /api/oracoes/:id/orado` retorna `{ data: { usuario_id, oracao_id, orado: false } }` mesmo quando a marcação já não existir.
  - Listas públicas de oração devem incluir `orado_por_mim` quando autenticadas.
  - A lista admin deve incluir `orado_por_mim` e `total_oracoes`.
- Implemente anotações privadas em `/api/usuarios/me/anotacoes`, validando título opcional com até 200 caracteres, conteúdo obrigatório com até 20.000 e pelo menos uma referência bíblica válida.
- Implemente destaques privados em `/api/usuarios/me/destaques`; `PUT` deve fazer upsert pela combinação usuário/versão/livro/capítulo/versículo/estilo. Aceite somente estilos `background | underline` e cores `yellow | green | blue | pink | purple`.
- Implemente `/api/admin/usuarios`, detalhe, alteração de papel e consulta das orações de um usuário. Impeça que o último administrador ativo seja rebaixado.
- Proteja as mutações existentes de ministérios, eventos, notícias, mensagens e louvores para admin e aceite as URLs produzidas pelo endpoint de upload nos campos de mídia correspondentes.

## Integridade e testes

- Use constraints únicos para marcações de oração e destaques; operações idempotentes não podem duplicar registros sob concorrência.
- Garanta que consultas privadas sempre filtrem pelo usuário autenticado.
- Cubra autenticação, `403`, paginação, isolamento entre dois usuários, idempotência, concorrência, validação de arquivo, falha de storage, CRUD e alteração de papel.
- Entregue migrações reversíveis, documentação OpenAPI e exemplos `curl` sem executar deploy ou migração de produção automaticamente.
