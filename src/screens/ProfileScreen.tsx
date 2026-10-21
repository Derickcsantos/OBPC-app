import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { useAuth } from '../context/AuthContext';
import { colors, createDynamicStyles } from '../theme/colors';
import { spacing, typography, radius } from '../theme/tokens';
import GoogleIcon from '../assets/google-icon-logo-svgrepo-com.svg';
import {
  adicionarMinisterioInteresse,
  getMeusMinisteriosInteresse,
  getMinisterios,
  removerMinisterioInteresse,
  deleteMyAccount,
} from '../services/api';
import { Ministerio } from '../types';

const logo = require('../../logo.jpg');

export const ProfileScreen = () => {
  const { user, isRestoring, isSigningIn, signInWithGoogle, signInWithApple, signOut } =
    useAuth();
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [interesses, setInteresses] = useState<Set<string>>(new Set());
  const [loadingMinisterios, setLoadingMinisterios] = useState(false);
  const [savingMinisterio, setSavingMinisterio] = useState<string | null>(null);
  const [ministeriosError, setMinisteriosError] = useState('');

  useEffect(() => {
    let active = true;
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(available => {
        if (active) setAppleSignInAvailable(available);
      }).catch(() => {
        if (active) setAppleSignInAvailable(false);
      });
    }
    return () => { active = false; };
  }, []);

  const loadMinisterios = useCallback(async () => {
    if (!user) {
      setMinisterios([]);
      setInteresses(new Set());
      return;
    }

    setLoadingMinisterios(true);
    setMinisteriosError('');
    try {
      const todos = await getMinisterios();
      setMinisterios(todos);
      try {
        const selecionados = await getMeusMinisteriosInteresse();
        setInteresses(new Set(selecionados.map(item => item.ministerio_id)));
      } catch (interestError) {
        console.error('Erro ao carregar interesses em ministérios:', interestError);
        setInteresses(new Set());
        setMinisteriosError('Os ministérios estão disponíveis; tente marcar seu interesse novamente.');
      }
    } catch (error) {
      console.error('Erro ao carregar interesses em ministérios:', error);
      setMinisteriosError('Não foi possível carregar seus ministérios.');
    } finally {
      setLoadingMinisterios(false);
    }
  }, [user]);

  useEffect(() => {
    loadMinisterios();
  }, [loadMinisterios]);

  const toggleMinisterio = async (ministerio: Ministerio, nextValue: boolean) => {
    const id = ministerio.ministerio_id;
    if (!id || savingMinisterio) return;

    const previous = new Set(interesses);
    const next = new Set(previous);
    nextValue ? next.add(id) : next.delete(id);
    setInteresses(next);
    setSavingMinisterio(id);
    setMinisteriosError('');

    try {
      if (nextValue) await adicionarMinisterioInteresse(id);
      else await removerMinisterioInteresse(id);
    } catch (error) {
      console.error('Erro ao atualizar interesse em ministério:', error);
      setInteresses(previous);
      setMinisteriosError('Não foi possível salvar essa alteração.');
    } finally {
      setSavingMinisterio(null);
    }
  };

  const ministeriosSelecionados = useMemo(() => interesses.size, [interesses]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert(
        'Login com Google',
        error instanceof Error
          ? error.message
          : 'Não foi possível entrar com o Google.',
      );
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
    } catch (error) {
      Alert.alert(
        'Login com Apple',
        error instanceof Error ? error.message : 'Não foi possível entrar com a Apple.',
      );
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
    } catch {
      Alert.alert(
        'Sair da conta',
        'Não foi possível encerrar a sessão. Tente novamente.',
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = () => Alert.alert(
    'Excluir minha conta',
    'Sua conta, marcações, anotações, interesses e inscrições em eventos serão removidos. Esta ação não pode ser desfeita.',
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir minha conta', style: 'destructive', onPress: async () => {
        setIsDeletingAccount(true);
        try {
          await deleteMyAccount();
          try { await signOut(); } catch { /* O contexto ainda limpa a sessão no finally. */ }
        } catch {
          Alert.alert('Não foi possível excluir a conta', 'Verifique sua conexão e tente novamente.');
        } finally {
          setIsDeletingAccount(false);
        }
      } },
    ],
  );

  if (isRestoring) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileHeader}>
        <Image
          source={user?.avatar_url ? { uri: user.avatar_url } : logo}
          style={styles.avatar}
          resizeMode="cover"
        />
        <Text style={styles.name}>{user?.nome_usuario || 'Membro da OBPC'}</Text>
        <Text style={styles.subtitle}>
          {user?.email_usuario || 'Entre para acessar seu perfil'}
        </Text>
      </View>

      {user ? (
        <>
          <View style={styles.card}>
            <InfoRow label="Nome" value={user.nome_usuario} />
            <InfoRow label="E-mail" value={user.email_usuario} />
            <InfoRow label="Papel" value={user.role === 'admin' ? 'Administrador' : 'Usuário'} />
            <InfoRow label="Igreja" value="OBPC" />
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionHeadingText}>
                <Text style={styles.sectionTitle}>Ministérios de interesse</Text>
                <Text style={styles.paragraph}>
                  {ministeriosSelecionados
                    ? `${ministeriosSelecionados} selecionado${ministeriosSelecionados === 1 ? '' : 's'}`
                    : 'Marque onde você gostaria de servir.'}
                </Text>
              </View>
              {loadingMinisterios ? <ActivityIndicator color={colors.primary} /> : null}
            </View>

            {ministeriosError ? <Text style={styles.inlineError}>{ministeriosError}</Text> : null}
            {!loadingMinisterios && ministerios.map(ministerio => {
              const active = interesses.has(ministerio.ministerio_id);
              const saving = savingMinisterio === ministerio.ministerio_id;
              return (
                <View key={ministerio.ministerio_id} style={styles.ministerioRow}>
                  <Text style={styles.ministerioName}>{ministerio.nome_ministerio}</Text>
                  {saving ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Switch
                      accessibilityLabel={`Interesse em ${ministerio.nome_ministerio}`}
                      value={active}
                      onValueChange={value => toggleMinisterio(ministerio, value)}
                      disabled={Boolean(savingMinisterio)}
                      trackColor={{ false: colors.border, true: colors.textSecondary }}
                      thumbColor={active ? colors.primary : colors.surface}
                    />
                  )}
                </View>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isSigningOut}
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
          >
            {isSigningOut ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Text style={styles.secondaryButtonText}>Sair da conta</Text>
            )}
          </Pressable>

          <Pressable accessibilityRole="button" disabled={isDeletingAccount} onPress={handleDeleteAccount} style={styles.deleteAccountButton}>
            {isDeletingAccount ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.deleteAccountText}>Excluir minha conta</Text>}
          </Pressable>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Acesse sua conta</Text>
          <Text style={styles.paragraph}>
            Entre com o Google para carregar seu nome, e-mail e foto e acessar
            os recursos vinculados ao seu perfil.
          </Text>

          <Pressable
            accessibilityRole="button"
            disabled={isSigningIn}
            onPress={handleSignIn}
            style={({ pressed }) => [
              styles.googleButton,
              pressed && styles.buttonPressed,
            ]}
          >
            {isSigningIn ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <GoogleIcon width={24} height={24} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Entrar com Google</Text>
              </>
            )}
          </Pressable>
          {appleSignInAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              accessibilityLabel="Entrar com Apple"
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={radius.md}
              onPress={handleAppleSignIn}
              pointerEvents={isSigningIn ? 'none' : 'auto'}
              style={[styles.appleButton, isSigningIn && styles.disabledButton]}
            />
          ) : null}
        </View>
      )}
    </ScrollView>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = createDynamicStyles(() => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.page,
    paddingBottom: 34,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.section,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.md,
    borderColor: colors.border,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '600',
    marginTop: 16,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: '600',
    marginTop: 4,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    marginBottom: 14,
  },
  infoRow: {
    paddingVertical: 8,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionHeadingText: { flex: 1 },
  inlineError: { color: colors.danger, marginTop: 10 },
  ministerioRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 10,
    paddingTop: 10,
  },
  ministerioName: { flex: 1, color: colors.textPrimary, fontWeight: '600' },
  paragraph: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 21,
  },
  googleButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.section,
    paddingHorizontal: spacing.page,
    borderRadius: radius.md,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  googleIcon: {
    marginRight: 10,
  },
  appleButton: { width: '100%', height: 44, marginTop: spacing.sm },
  disabledButton: { opacity: 0.5 },
  googleButtonText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.page,
    borderColor: colors.danger,
    borderRadius: radius.md,
  },
  secondaryButtonText: {
    color: colors.danger,
    fontSize: typography.body,
    fontWeight: '600',
  },
  deleteAccountButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 20 },
  deleteAccountText: { color: colors.danger, fontWeight: '600', textDecorationLine: 'underline' },
  buttonPressed: {
    opacity: 0.78,
  },
}));
