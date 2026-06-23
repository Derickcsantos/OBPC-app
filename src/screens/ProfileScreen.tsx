import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import GoogleIcon from '../assets/google-icon-logo-svgrepo-com.svg';

const logo = require('../../logo.jpg');

export const ProfileScreen = () => {
  const { user, isRestoring, isSigningIn, signInWithGoogle, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert(
        'Login com Google',
        error instanceof Error ? error.message : 'Não foi possível entrar com o Google.',
      );
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
    } catch {
      Alert.alert('Sair da conta', 'Não foi possível encerrar a sessão. Tente novamente.');
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isRestoring) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <Image source={user?.avatar_url ? { uri: user.avatar_url } : logo} style={styles.avatar} resizeMode="cover" />
        <Text style={styles.name}>{user?.nome_usuario || 'Membro OBPC'}</Text>
        <Text style={styles.subtitle}>{user?.email_usuario || 'Entre para acessar seu perfil'}</Text>
      </View>

      {user ? (
        <>
          <View style={styles.card}>
            <InfoRow label="Nome" value={user.nome_usuario} />
            <InfoRow label="E-mail" value={user.email_usuario} />
            <InfoRow label="Igreja" value="OBPC" />
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isSigningOut}
            onPress={handleSignOut}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          >
            {isSigningOut ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Text style={styles.secondaryButtonText}>Sair da conta</Text>
            )}
          </Pressable>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Acesse sua conta</Text>
          <Text style={styles.paragraph}>
            Entre com o Google para carregar seu nome, e-mail e foto e acessar os recursos vinculados ao seu perfil.
          </Text>

          <Pressable
            accessibilityRole="button"
            disabled={isSigningIn}
            onPress={handleSignIn}
            style={({ pressed }) => [styles.googleButton, pressed && styles.buttonPressed]}
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

const styles = StyleSheet.create({
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
    padding: 18,
    paddingBottom: 34,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 118,
    height: 118,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 16,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  infoRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  paragraph: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  googleButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 16,
  },
  secondaryButtonText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '900',
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
