import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

const logo = require('../../logo.jpg');

export const ProfileScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <Image source={logo} style={styles.avatar} resizeMode="cover" />
        <Text style={styles.name}>Membro OBPC</Text>
        <Text style={styles.subtitle}>Perfil do aplicativo</Text>
      </View>

      <View style={styles.card}>
        <InfoRow label="Nome" value="Visitante" />
        <InfoRow label="Igreja" value="OBPC" />
        <InfoRow label="Status" value="Conectado ao app" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Preferencias</Text>
        <Text style={styles.paragraph}>Em breve voce podera editar seus dados, acompanhar pedidos e salvar leituras favoritas.</Text>
      </View>
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
});
