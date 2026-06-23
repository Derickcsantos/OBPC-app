import axios, { AxiosResponse } from 'axios';
import {
  Book,
  BibleVersion,
  Chapter,
  CreateEventoPayload,
  CreateEventoInscricaoPayload,
  CreateLouvorPayload,
  CreateMensagemPayload,
  CreateMinisterioPayload,
  CreateNoticiaPayload,
  CreateUsuarioPayload,
  Evento,
  EventoInscricao,
  Louvor,
  Mensagem,
  Ministerio,
  Noticia,
  Oracao,
  Pessoa,
  UpdateEventoPayload,
  UpdateLouvorPayload,
  UpdateMensagemPayload,
  UpdateMinisterioPayload,
  UpdateNoticiaPayload,
  UpdateUsuarioPayload,
  Usuario,
  Verse,
} from '../types';
import type { AuthSession } from '../types/auth';
import { enqueueValue, getCachedValue, getQueue, isOnline, isWifi, setCachedValue, setQueue } from './offlineStorage';

export const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export const setApiAccessToken = (accessToken: string | null) => {
  if (accessToken) {
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
};

export const googleLogin = async (idToken: string): Promise<AuthSession> => {
  const response = await api.post<AuthSession>('/api/auth/google', {
    id_token: idToken,
  });

  return response.data;
};

export const extractData = <T>(response: AxiosResponse | { data?: unknown }): T => {
  const body = response?.data as { data?: T } | T | undefined;

  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data;
  }

  return body as T;
};

const normalizeArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const uniqueBy = <T>(items: T[], getKey: (item: T, index: number) => string): T[] => {
  const seen = new Set<string>();

  return items.filter((item, index) => {
    const key = getKey(item, index);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const getVerseKey = (item: Verse, index: number, fallbackBookId?: number, fallbackChapterId?: number): string => {
  const cleanText = (item.text || '').replace(/\s+/g, ' ').trim().toLowerCase();
  return `${item.book ?? fallbackBookId ?? 'book'}-${item.chapter ?? fallbackChapterId ?? 'chapter'}-${item.verse ?? index}-${cleanText}`;
};

const getResource = async <T>(path: string): Promise<T[]> => {
  return cachedGet<T[]>(path, async () => {
    const response = await api.get(path);
    return normalizeArray<T>(extractData<unknown>(response));
  });
};

const getResourceById = async <T>(path: string, id: string): Promise<T> => {
  return cachedGet<T>(`${path}/${id}`, async () => {
    const response = await api.get(`${path}/${id}`);
    return extractData<T>(response);
  });
};

const createResource = async <T, Payload>(path: string, payload: Payload): Promise<T> => {
  const response = await api.post(path, payload);
  return extractData<T>(response);
};

const cachedGet = async <T>(cacheKey: string, fetcher: () => Promise<T>): Promise<T> => {
  try {
    const result = await fetcher();
    await setCachedValue(cacheKey, result);
    return result;
  } catch (error) {
    const cached = await getCachedValue<T>(cacheKey);

    if (cached !== null) {
      return cached;
    }

    throw error;
  }
};

const updateResource = async <T, Payload>(path: string, id: string, payload: Payload): Promise<T> => {
  const response = await api.put(`${path}/${id}`, payload);
  return extractData<T>(response);
};

const deleteResource = async <T>(path: string, id: string): Promise<T> => {
  const response = await api.delete(`${path}/${id}`);
  return extractData<T>(response);
};

export const checkHealth = async (): Promise<{ status: string }> => {
  try {
    const response = await api.get('/health');
    await flushPendingWrites();
    return response.data;
  } catch (error) {
    const online = await isOnline();
    return { status: online ? 'indisponivel' : 'offline' };
  }
};

export const getMinisterios = () => getResource<Ministerio>('/api/ministerios');
export const getMinisterioById = (id: string) => getResourceById<Ministerio>('/api/ministerios', id);
export const createMinisterio = (payload: CreateMinisterioPayload) =>
  createResource<Ministerio, CreateMinisterioPayload>('/api/ministerios', payload);
export const updateMinisterio = (id: string, payload: UpdateMinisterioPayload) =>
  updateResource<Ministerio, UpdateMinisterioPayload>('/api/ministerios', id, payload);
export const deleteMinisterio = (id: string) => deleteResource<Ministerio>('/api/ministerios', id);

export const getPessoas = () => getResource<Pessoa>('/api/pessoas');
export const getPessoaById = (id: string) => getResourceById<Pessoa>('/api/pessoas', id);

export const getUsuarios = () => getResource<Usuario>('/api/usuarios');
export const getUsuarioById = (id: string) => getResourceById<Usuario>('/api/usuarios', id);
export const createUsuario = (payload: CreateUsuarioPayload) =>
  createResource<Usuario, CreateUsuarioPayload>('/api/usuarios', payload);
export const updateUsuario = (id: string, payload: UpdateUsuarioPayload) =>
  updateResource<Usuario, UpdateUsuarioPayload>('/api/usuarios', id, payload);
export const deleteUsuario = (id: string) => deleteResource<Usuario>('/api/usuarios', id);

export const getEventos = () => getResource<Evento>('/api/eventos');
export const getEventoById = (id: string) => getResourceById<Evento>('/api/eventos', id);
export const createEvento = (payload: CreateEventoPayload) =>
  createResource<Evento, CreateEventoPayload>('/api/eventos', payload);
export const updateEvento = (id: string, payload: UpdateEventoPayload) =>
  updateResource<Evento, UpdateEventoPayload>('/api/eventos', id, payload);
export const deleteEvento = (id: string) => deleteResource<Evento>('/api/eventos', id);
export const createEventoInscricao = async (eventoId: string, payload: CreateEventoInscricaoPayload) => {
  const response = await api.post(`/api/eventos/${eventoId}/inscricoes`, payload);
  return extractData<EventoInscricao>(response);
};

export const getNoticias = () => getResource<Noticia>('/api/noticias');
export const getNoticiaById = (id: string) => getResourceById<Noticia>('/api/noticias', id);
export const createNoticia = (payload: CreateNoticiaPayload) =>
  createResource<Noticia, CreateNoticiaPayload>('/api/noticias', payload);
export const updateNoticia = (id: string, payload: UpdateNoticiaPayload) =>
  updateResource<Noticia, UpdateNoticiaPayload>('/api/noticias', id, payload);
export const deleteNoticia = (id: string) => deleteResource<Noticia>('/api/noticias', id);

export const getLouvores = () => getResource<Louvor>('/api/louvores');
export const getLouvorById = (id: string) => getResourceById<Louvor>('/api/louvores', id);
export const createLouvor = (payload: CreateLouvorPayload) =>
  createResource<Louvor, CreateLouvorPayload>('/api/louvores', payload);
export const updateLouvor = (id: string, payload: UpdateLouvorPayload) =>
  updateResource<Louvor, UpdateLouvorPayload>('/api/louvores', id, payload);
export const deleteLouvor = (id: string) => deleteResource<Louvor>('/api/louvores', id);

export const getMensagens = () => getResource<Mensagem>('/api/mensagens');
export const getMensagemById = (id: string) => getResourceById<Mensagem>('/api/mensagens', id);
export const createMensagem = (payload: CreateMensagemPayload) =>
  createResource<Mensagem, CreateMensagemPayload>('/api/mensagens', payload);
export const updateMensagem = (id: string, payload: UpdateMensagemPayload) =>
  updateResource<Mensagem, UpdateMensagemPayload>('/api/mensagens', id, payload);
export const deleteMensagem = (id: string) => deleteResource<Mensagem>('/api/mensagens', id);

export const getOracoes = () => getResource<Oracao>('/api/oracoes');
export const getOracaoById = (id: string) => getResourceById<Oracao>('/api/oracoes', id);
export const postOracao = async (oracao: Oracao) => {
  try {
    const created = await createResource<Oracao, Oracao>('/api/oracoes', oracao);
    await mergeCachedOracao(created);
    await flushPendingWrites();
    return created;
  } catch (error) {
    const pendingOracao = {
      ...oracao,
      oracao_id: oracao.oracao_id ?? `offline-${Date.now()}`,
      status: oracao.status ?? 'pendente de sincronizacao',
    };

    await enqueueValue<Oracao>('oracoes:create', pendingOracao);
    await mergeCachedOracao(pendingOracao);
    return pendingOracao;
  }
};
export const updateOracao = (id: string, payload: Partial<Oracao>) =>
  updateResource<Oracao, Partial<Oracao>>('/api/oracoes', id, payload);
export const deleteOracao = (id: string) => deleteResource<Oracao>('/api/oracoes', id);

export const getBibleVersions = async (): Promise<BibleVersion[]> => {
  return cachedGet('biblia:versions', async () => {
    const response = await api.get('/api/biblia/versions');
    return normalizeArray<BibleVersion>(extractData<unknown>(response));
  });
};

export const getBooks = async (testamentId?: number): Promise<Book[]> => {
  return cachedGet(`biblia:books:${testamentId ?? 'all'}`, async () => {
    let books: Book[];

    try {
      const response = await api.get('/api/biblia/books', {
        params: {
          ...(testamentId ? { testament_id: testamentId } : {}),
        },
      });
      books = normalizeArray<Book>(extractData<unknown>(response));
    } catch {
      const response = await api.get('/api/biblia/books');
      books = normalizeArray<Book>(extractData<unknown>(response));
    }

    const canFilterByTestament = books.some(item => typeof item.testament === 'number');
    const filteredBooks = testamentId && canFilterByTestament ? books.filter(item => item.testament === testamentId) : books;
    return uniqueBy(filteredBooks, item => `${item.id}`);
  });
};

export const getChapters = async (bookId: number, version = 'nvi'): Promise<Chapter[]> => {
  return cachedGet(`biblia:chapters:${bookId}:${version}`, async () => {
    let response: AxiosResponse;

    try {
      response = await api.get('/api/biblia/chapters', {
        params: { version, book_id: bookId },
      });
    } catch {
      response = await api.get('/api/biblia/chapters', {
        params: { book_id: bookId },
      });
    }

    const data = extractData<unknown>(response);

    const chapters = normalizeArray<unknown>(data).map((chapter, index) => {
      if (typeof chapter === 'number') {
        return { id: chapter, chapter };
      }

      const item = chapter as Chapter;
      return {
        ...item,
        id: item.id ?? item.chapter ?? item.number ?? index + 1,
        chapter: item.chapter ?? item.number ?? index + 1,
      };
    });

    return uniqueBy(chapters, item => `${item.book ?? bookId}-${item.chapter}`);
  });
};

export const getVerses = async (
  bookId: number,
  chapterId: number,
  verse?: number,
  version = 'nvi',
): Promise<Verse[]> => {
  return cachedGet(`biblia:verses:${bookId}:${chapterId}:${verse ?? 'all'}:${version}`, async () => {
    let response: AxiosResponse;

    try {
      response = await api.get('/api/biblia/verses', {
        params: {
          version,
          book_id: bookId,
          chapter_id: chapterId,
          verse,
        },
      });
    } catch {
      response = await api.get('/api/biblia/verses', {
        params: {
          book_id: bookId,
          chapter_id: chapterId,
          verse,
        },
      });
    }

    return uniqueBy(
      normalizeArray<Verse>(extractData<unknown>(response)),
      (item, index) => getVerseKey(item, index, bookId, chapterId),
    );
  });
};

export const getBookVerses = async (bookId: number, version = 'nvi'): Promise<Verse[]> => {
  return cachedGet(`biblia:book-verses:${bookId}:${version}`, async () => {
    const limit = 100;
    const firstResponse = await api.get(`/api/biblia/books/${bookId}/verses`, {
      params: { version, page: 1, limit },
    });
    const firstPage = normalizeArray<Verse>(extractData<unknown>(firstResponse));
    const pagination = firstResponse.data?.pagination as
      | {
          totalPages?: number;
        }
      | undefined;
    const totalPages = Math.min(pagination?.totalPages ?? 1, 200);
    const allVerses: Verse[] = [...firstPage];

    for (let page = 2; page <= totalPages; page += 4) {
      const pageNumbers = Array.from({ length: Math.min(4, totalPages - page + 1) }, (_, index) => page + index);
      const responses = await Promise.all(
        pageNumbers.map(pageNumber =>
          api.get(`/api/biblia/books/${bookId}/verses`, {
            params: { version, page: pageNumber, limit },
          }),
        ),
      );

      responses.forEach(response => {
        allVerses.push(...normalizeArray<Verse>(extractData<unknown>(response)));
      });
    }

    return uniqueBy(
      allVerses,
      (item, index) => getVerseKey(item, index, bookId),
    ).sort((a, b) => {
      const chapterDiff = (a.chapter ?? 0) - (b.chapter ?? 0);
      return chapterDiff || (a.verse ?? 0) - (b.verse ?? 0);
    });
  });
};

export const searchBible = async (
  keyword: string,
  bookId?: number,
  chapterId?: number,
  version = 'nvi',
): Promise<Verse[]> => {
  return cachedGet(`biblia:search:${keyword}:${bookId ?? 'all'}:${chapterId ?? 'all'}:${version}`, async () => {
    let response: AxiosResponse;

    try {
      response = await api.get('/api/biblia/search', {
        params: {
          version,
          keyword,
          book_id: bookId,
          chapter_id: chapterId,
        },
      });
    } catch {
      response = await api.get('/api/biblia/search', {
        params: {
          keyword,
          book_id: bookId,
          chapter_id: chapterId,
        },
      });
    }

    return uniqueBy(
      normalizeArray<Verse>(extractData<unknown>(response)),
      (item, index) => getVerseKey(item, index, bookId, chapterId),
    );
  });
};

const mergeCachedOracao = async (oracao: Oracao) => {
  const cached = (await getCachedValue<Oracao[]>('/api/oracoes')) ?? [];
  const merged = uniqueBy([oracao, ...cached], (item, index) => `${item.oracao_id ?? `${item.nome_pedido}-${item.descricao_pedido}-${index}`}`);
  await setCachedValue('/api/oracoes', merged);
};

export const flushPendingWrites = async () => {
  const canSync = await isWifi();

  if (!canSync) {
    return;
  }

  const pendingOracoes = await getQueue<Oracao>('oracoes:create');

  if (!pendingOracoes.length) {
    return;
  }

  const remaining: Oracao[] = [];

  for (const pending of pendingOracoes) {
    try {
      const { oracao_id: _offlineId, ...payload } = pending;
      const created = await createResource<Oracao, Oracao>('/api/oracoes', payload);
      await mergeCachedOracao(created);
    } catch {
      remaining.push(pending);
    }
  }

  await setQueue('oracoes:create', remaining);
};

export default api;
