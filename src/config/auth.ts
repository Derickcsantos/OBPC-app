export const GOOGLE_ANDROID_CLIENT_ID =
  '834990693788-m4h155cvvhhvu4el6ihv2j5ur3u53704.apps.googleusercontent.com';

export const GOOGLE_IOS_CLIENT_ID =
  '834990693788-n2fg81bltsntguugdca3j0i11i8ejb6h.apps.googleusercontent.com';

// O Google exige um OAuth Client ID do tipo "Aplicativo da Web" para emitir
// o ID token usado pelo backend, principalmente no Android.
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
