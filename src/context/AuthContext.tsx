import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../config/auth';
import { googleLogin, setApiAccessToken } from '../services/api';
import { AuthSession, AuthUser } from '../types/auth';

const SESSION_STORAGE_KEY = 'obpc.auth.session';

interface AuthContextValue {
  session: AuthSession | null;
  user: AuthUser | null;
  isRestoring: boolean;
  isSigningIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type NativeGoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

const loadNativeGoogleSignin = (): NativeGoogleSigninModule | null => {
  if (Platform.OS === 'web') return null;

  try {
    const nativeModule = require('@react-native-google-signin/google-signin') as NativeGoogleSigninModule;
    nativeModule.GoogleSignin.configure({
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
      profileImageSize: 240,
    });
    return nativeModule;
  } catch {
    return null;
  }
};

const nativeGoogleSignin = loadNativeGoogleSignin();

type GoogleCredentialResponse = { credential?: string };
type GooglePromptNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason?: () => string;
  getSkippedReason?: () => string;
  getDismissedReason?: () => string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (callback?: (notification: GooglePromptNotification) => void) => void;
        };
      };
    };
  }
}

let googleIdentityScriptPromise: Promise<void> | null = null;

const loadGoogleIdentityScript = (): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('Login Google indisponivel neste ambiente.'));
  }

  if (window.google?.accounts.id) return Promise.resolve();
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;

  const scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-obpc-google-identity]');
    const script = existing ?? document.createElement('script');

    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Nao foi possivel carregar o login Google.')), { once: true });

    if (!existing) {
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.obpcGoogleIdentity = 'true';
      document.head.appendChild(script);
    }
  }).catch(error => {
    googleIdentityScriptPromise = null;
    throw error;
  });

  googleIdentityScriptPromise = scriptPromise;
  return scriptPromise;
};

const getGoogleWebIdToken = async (): Promise<string> => {
  await loadGoogleIdentityScript();

  return new Promise((resolve, reject) => {
    const googleIdentity = window.google?.accounts.id;
    if (!googleIdentity) {
      reject(new Error('Login Google indisponivel. Recarregue a pagina.'));
      return;
    }

    let settled = false;
    googleIdentity.initialize({
      client_id: GOOGLE_WEB_CLIENT_ID,
      cancel_on_tap_outside: false,
      use_fedcm_for_prompt: true,
      callback: response => {
        if (settled) return;
        settled = true;
        if (response.credential) resolve(response.credential);
        else reject(new Error('O Google nao retornou um token de identidade.'));
      },
    });
    googleIdentity.prompt(notification => {
      if (settled || (!notification.isNotDisplayed() && !notification.isSkippedMoment() && !notification.isDismissedMoment())) return;
      settled = true;
      const reason = notification.getNotDisplayedReason?.() || notification.getSkippedReason?.() || notification.getDismissedReason?.();
      reject(new Error(reason ? `Login Google nao exibido: ${reason}.` : 'Login Google cancelado ou indisponivel.'));
    });
  });
};

const saveSession = async (session: AuthSession) => {
  const value = JSON.stringify(session);

  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, value);
};

const readSession = async (): Promise<AuthSession | null> => {
  const value =
    Platform.OS === 'web'
      ? await AsyncStorage.getItem(SESSION_STORAGE_KEY)
      : await SecureStore.getItemAsync(SESSION_STORAGE_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    await clearStoredSession();
    return null;
  }
};

const clearStoredSession = async () => {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
};

const getSignInErrorMessage = (error: unknown): string => {
  if (nativeGoogleSignin?.isErrorWithCode(error)) {
    if (error.code === 'DEVELOPER_ERROR' || error.message?.includes('DEVELOPER_ERROR')) {
      return [
        'Configuração do Google Sign-In inválida no Android.',
        'Confira no Google Cloud/Firebase se existe um OAuth Client Android com package com.obpcapp e o SHA-1 do certificado usado para assinar este APK.',
        'Confira também se EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID é um Client ID do tipo Aplicativo da Web.',
      ].join('\n\n');
    }

    if (error.code === nativeGoogleSignin.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'O Google Play Services não está disponível ou precisa ser atualizado.';
    }

    if (error.code === nativeGoogleSignin.statusCodes.IN_PROGRESS) {
      return 'O login com Google já está em andamento.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Não foi possível entrar com o Google. Tente novamente.';
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedSession = await readSession();
        setApiAccessToken(storedSession?.access_token ?? null);
        setSession(storedSession);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();
  }, []);

  const signInWithGoogle = async () => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error(
        'Configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID com o OAuth Client ID do tipo Aplicativo da Web.',
      );
    }

    setIsSigningIn(true);

    try {
      if (Platform.OS === 'web') {
        const idToken = await getGoogleWebIdToken();
        const nextSession = await googleLogin(idToken);
        await saveSession(nextSession);
        setApiAccessToken(nextSession.access_token);
        setSession(nextSession);
        return;
      }

      if (!nativeGoogleSignin) {
        throw new Error(
          'O login Google exige um development build ou APK proprio. O restante do app pode ser usado normalmente no Expo Go.',
        );
      }

      if (Platform.OS === 'android') {
        await nativeGoogleSignin.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await nativeGoogleSignin.GoogleSignin.signIn();

      if (!nativeGoogleSignin.isSuccessResponse(response)) {
        return;
      }

      const idToken = response.data.idToken;

      if (!idToken) {
        throw new Error('O Google não retornou um token de identidade.');
      }

      const nextSession = await googleLogin(idToken);
      await saveSession(nextSession);
      setApiAccessToken(nextSession.access_token);
      setSession(nextSession);
    } catch (error) {
      throw new Error(getSignInErrorMessage(error));
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    try {
      if (nativeGoogleSignin) await nativeGoogleSignin.GoogleSignin.signOut();
    } finally {
      await clearStoredSession();
      setApiAccessToken(null);
      setSession(null);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isRestoring,
      isSigningIn,
      signInWithGoogle,
      signOut,
    }),
    [isRestoring, isSigningIn, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
};
