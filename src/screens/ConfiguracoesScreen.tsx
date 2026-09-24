import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import {
  FontSizePreference,
  useAppearance,
} from '../context/AppearanceContext';
import { colors } from '../theme/colors';
import { spacing, typography, radius } from '../theme/tokens';

const options: Array<{
  value: FontSizePreference;
  title: string;
  description: string;
  preview: string;
}> = [
  {
    value: 'small',
    title: 'Pequeno',
    description: '2 pontos menor',
    preview: 'Aa',
  },
  {
    value: 'normal',
    title: 'Normal',
    description: 'Tamanho padrão',
    preview: 'Aa',
  },
  {
    value: 'large',
    title: 'Grande',
    description: '4 pontos maior',
    preview: 'Aa',
  },
];

export const ConfiguracoesScreen = () => {
  const { fontSizePreference, setFontSizePreference, themePreference, setThemePreference } = useAppearance();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Configurações</Text>
      <Text style={styles.subtitle}>
        Escolha o tamanho usado em todos os textos do aplicativo. A preferência
        fica salva neste dispositivo.
      </Text>

      <View style={styles.card}>
        <View style={styles.themeRow}>
          <View style={styles.optionText}>
            <Text style={styles.sectionTitle}>Modo escuro</Text>
            <Text style={styles.optionDescription}>Interface em preto, branco e tons de cinza.</Text>
          </View>
          <Switch
            accessibilityLabel="Ativar modo escuro"
            value={themePreference === 'dark'}
            onValueChange={active => setThemePreference(active ? 'dark' : 'light')}
            {...(Platform.OS === 'web' ? { activeThumbColor: colors.primary } : {})}
            trackColor={{ false: colors.border, true: colors.textSecondary }}
            thumbColor={themePreference === 'dark' ? colors.primary : colors.surface}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Tamanho da fonte</Text>
        {options.map(option => {
          const active = option.value === fontSizePreference;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              style={[styles.option, active && styles.optionActive]}
              onPress={() => setFontSizePreference(option.value)}
            >
              <Text
                style={[
                  styles.preview,
                  option.value === 'small' && styles.previewSmall,
                  option.value === 'large' && styles.previewLarge,
                ]}
              >
                {option.preview}
              </Text>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.page, paddingBottom: 40 },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: spacing.section,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: 14,
  },
  themeRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '600',
    marginBottom: 8,
  },
  option: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 10,
    borderRadius: radius.md,
    borderColor: colors.border,
  },
  optionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceMuted,
  },
  preview: {
    width: 48,
    color: colors.primary,
    fontSize: typography.heading,
    fontWeight: '600',
  },
  previewSmall: { fontSize: 18 },
  previewLarge: { fontSize: 24 },
  optionText: { flex: 1, paddingVertical: 8 },
  optionTitle: {
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: '600',
  },
  optionDescription: {
    color: colors.textSecondary,
    fontSize: typography.body,
    marginTop: 3,
  },
  radio: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioActive: { borderColor: colors.accent },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
});
