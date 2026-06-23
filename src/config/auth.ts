export const GOOGLE_ANDROID_CLIENT_ID =
  '834990693788-m4h155cvvhhvu4el6ihv2j5ur3u53704.apps.googleusercontent.com';

export const GOOGLE_IOS_CLIENT_ID =
  '834990693788-n2fg81bltsntguugdca3j0i11i8ejb6h.apps.googleusercontent.com';

export const GOOGLE_WEB_CLIENT_ID_FALLBACK =
  '834990693788-blaeeg6ufaju63bcnbjen61n5hbpls08.apps.googleusercontent.com';

// O Google exige um OAuth Client ID do tipo "Aplicativo da Web" para emitir
// o ID token usado pelo backend, principalmente no Android.
// Client ID nao e segredo. Mantemos fallback para builds EAS/GitHub em que o
// .env local nao foi enviado.
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || GOOGLE_WEB_CLIENT_ID_FALLBACK;
