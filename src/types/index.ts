export interface Noticia {
  noticia_id: string;
  nome_noticia: string;
  mensagem_noticia: string;
  data_noticia: string;
  observacao_noticia?: string | null;
  url_noticia?: string | null;
  imagem_url?: string | null;
}

export interface Mensagem {
  mensagem_id: string;
  nome_mensagem: string;
  texto_mensagem: string;
}

export interface Evento {
  evento_id: string;
  nome_evento: string;
  descricao_evento: string;
  data_evento: string;
  link_evento?: string | null;
  link_inscricao?: string | null;
  url_inscricao?: string | null;
  inscricao_url?: string | null;
  metodo_inscricao?: string | null;
  local?: string | null;
  endereco_evento?: string | null;
  hora_inicio?: string | null;
  numero_vagas?: number | null;
  observacao_evento?: string | null;
  observacoes_evento?: string | null;
  responsavel_nome?: string | null;
  responsavel_telefone?: string | null;
  url_capa?: string | null;
  imagem_url?: string | null;
  imagem_evento?: string | null;
  capa_evento?: string | null;
  capa_url?: string | null;
  foto_principal?: string | null;
  foto_principal_url?: string | null;
  imagens?: Array<string | { url?: string | null; url_imagem?: string | null; imagem_url?: string | null; ordem?: number | null }>;
  imagens_evento?: Array<string | { url?: string | null; url_imagem?: string | null; imagem_url?: string | null; ordem?: number | null }>;
  fotos_auxiliares?: Array<string | { url?: string | null; url_imagem?: string | null; imagem_url?: string | null; ordem?: number | null }>;
  created_at?: string;
  updated_at?: string;
}

export interface EventoInscricao {
  inscricao_id: number;
  evento_id: string;
  nome: string;
  email: string;
  telefone: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateEventoInscricaoPayload {
  nome: string;
  email: string;
  telefone: string;
}

export interface Louvor {
  louvor_id: string;
  nome_louvor: string;
  url_louvor: string;
  observacao_louvor?: string | null;
}

export interface Ministerio {
  ministerio_id: string;
  nome_ministerio: string;
  descricao_ministerio: string;
  url_ministerio?: string | null;
  imagem_url?: string | null;
}

export interface Usuario {
  usuario_id: string;
  nome_usuario: string;
  telefone_usuario: string;
  email_usuario: string;
  data_nascimento: string;
}

export interface Oracao {
  oracao_id?: string;
  nome_pedido: string;
  descricao_pedido: string;
  mostrar_grupo?: boolean;
  aceita_ligacao?: boolean;
  status?: string;
}

export interface BibleVersion {
  id: number;
  name?: string;
  version?: string;
  abbreviation?: string;
  abbrev?: string;
  [key: string]: unknown;
}

export interface Book {
  id: number;
  name: string;
  author?: string;
  abbrev?: string;
  testament?: number;
}

export interface Chapter {
  id?: number;
  book_id?: number;
  book?: number;
  testament?: number;
  version?: string;
  chapter: number;
  number?: number;
}

export interface Verse {
  id?: number;
  book_id?: number;
  chapter_id?: number;
  version?: string;
  testament?: number;
  book?: number;
  chapter?: number;
  verse: number;
  text: string;
  book_name?: string;
}

export interface ApiResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

export type CreateUsuarioPayload = Omit<Usuario, 'usuario_id'> & {
  senha_usuario: string;
};

export type UpdateUsuarioPayload = Partial<CreateUsuarioPayload>;

export type CreateMinisterioPayload = Omit<Ministerio, 'ministerio_id' | 'imagem_url'>;
export type UpdateMinisterioPayload = Partial<CreateMinisterioPayload>;

export type CreateEventoPayload = Omit<Evento, 'evento_id' | 'local'>;
export type UpdateEventoPayload = Partial<CreateEventoPayload>;

export type CreateNoticiaPayload = Omit<Noticia, 'noticia_id' | 'url_noticia' | 'imagem_url'>;
export type UpdateNoticiaPayload = Partial<CreateNoticiaPayload>;

export type CreateLouvorPayload = Omit<Louvor, 'louvor_id'>;
export type UpdateLouvorPayload = Partial<CreateLouvorPayload>;

export type CreateMensagemPayload = Omit<Mensagem, 'mensagem_id'>;
export type UpdateMensagemPayload = Partial<CreateMensagemPayload>;
