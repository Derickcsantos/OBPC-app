import { ArrowLeft } from 'lucide-react-native';
import { Icon } from '../components/Icon';
import React from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { colors } from '../theme/colors';
import { spacing, typography, radius } from '../theme/tokens';
import { Pessoa } from '../types';

const fallbackImage = require('../../logo.jpg');

const openContact = async (url: string) => {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  }
};

export const PessoaScreen = ({
  pessoa,
  onBack,
}: {
  pessoa: Pessoa;
  onBack: () => void;
}) => (
  <ScrollView
    style={styles.container}
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}
  >
    <TouchableOpacity style={styles.backButton} onPress={onBack}>
      <Icon as={ArrowLeft} size={18} />
      <Text style={styles.backText}>Voltar</Text>
    </TouchableOpacity>

    <Image
      source={pessoa.url_imagem ? { uri: pessoa.url_imagem } : fallbackImage}
      style={styles.photo}
      resizeMode="contain"
    />
    <Text style={styles.name}>{pessoa.nome || 'Nome não informado'}</Text>
    <Text style={styles.role}>{pessoa.cargo || 'Cargo não informado'}</Text>

    <View style={styles.aboutCard}>
      <Text style={styles.sectionLabel}>Sobre</Text>
      <Text style={styles.about}>
        {pessoa.sobre || 'Informações em breve.'}
      </Text>
    </View>

    {pessoa.telefone || pessoa.email ? (
      <View style={styles.contactCard}>
        <Text style={styles.sectionLabel}>Contato</Text>
        {pessoa.telefone ? (
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => openContact(`tel:${pessoa.telefone}`)}
          >
            <Text style={styles.contactLabel}>Telefone</Text>
            <Text style={styles.contactValue}>{pessoa.telefone}</Text>
          </TouchableOpacity>
        ) : null}
        {pessoa.email ? (
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => openContact(`mailto:${pessoa.email}`)}
          >
            <Text style={styles.contactLabel}>E-mail</Text>
            <Text style={styles.contactValue}>{pessoa.email}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    ) : null}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.page, paddingBottom: 42 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 10,
  },
  backText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  photo: {
    width: '100%',
    height: 280,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '600',
    marginTop: spacing.section,
  },
  role: {
    color: colors.accent,
    fontSize: typography.subtitle,
    fontWeight: '600',
    marginTop: 4,
  },
  aboutCard: {
    marginTop: spacing.section,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  sectionLabel: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  about: {
    color: colors.textSecondary,
    fontSize: typography.subtitle,
    lineHeight: 25,
    marginTop: 10,
  },
  contactCard: {
    marginTop: 14,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  contactRow: { minHeight: 44, marginTop: 14 },
  contactLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  contactValue: {
    color: colors.primary,
    fontSize: typography.subtitle,
    fontWeight: '600',
    marginTop: 3,
  },
});
