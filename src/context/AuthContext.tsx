import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
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

GoogleSignin.configure({
  iosClientId: GOOGLE_IOS_CLIENT_ID,
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
  profileImageSize: 240,
});

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
  if (isErrorWithCode(error)) {
    if (error.code === 'DEVELOPER_ERROR' || error.message?.includes('DEVELOPER_ERROR')) {
      return [
        'Configuração do Google Sign-In inválida no Android.',
        'Confira no Google Cloud/Firebase se existe um OAuth Client Android com package com.obpcapp e o SHA-1 do certificado usado para assinar este APK.',
        'Confira também se EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID é um Client ID do tipo Aplicativo da Web.',
      ].join('\n\n');
    }

    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'O Google Play Services não está disponível ou precisa ser atualizado.';
    }

    if (error.code === statusCodes.IN_PROGRESS) {
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

    void restoreSession();
  }, []);

  const signInWithGoogle = async () => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error(
        'Configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID com o OAuth Client ID do tipo Aplicativo da Web.',
      );
    }

    setIsSigningIn(true);

    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
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
      await GoogleSignin.signOut();
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
