export interface AuthUser {
  usuario_id: string;
  nome_usuario: string;
  email_usuario: string;
  avatar_url: string | null;
}

export interface AuthSession {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}
