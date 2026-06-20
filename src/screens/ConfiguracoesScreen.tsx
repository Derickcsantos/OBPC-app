import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { FontSizePreference, useAppearance } from '../context/AppearanceContext';
import { colors } from '../theme/colors';

const options: Array<{ value: FontSizePreference; title: string; description: string; preview: string }> = [
  { value: 'small', title: 'Pequeno', description: '2 pontos menor', preview: 'Aa' },
  { value: 'normal', title: 'Normal', description: 'Tamanho padrão', preview: 'Aa' },
  { value: 'large', title: 'Grande', description: '4 pontos maior', preview: 'Aa' },
];

export const ConfiguracoesScreen = () => {
  const { fontSizePreference, setFontSizePreference } = useAppearance();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Configurações</Text>
      <Text style={styles.subtitle}>
        Escolha o tamanho usado em todos os textos do aplicativo. A preferência fica salva neste dispositivo.
      </Text>

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
              <Text style={[styles.preview, option.value === 'small' && styles.previewSmall, option.value === 'large' && styles.previewLarge]}>
                {option.preview}
              </Text>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioActive]}>{active ? <View style={styles.radioDot} /> : null}</View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 40 },
  title: { color: colors.textPrimary, fontSize: 28, fontWeight: '900' },
  subtitle: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 20 },
  card: { padding: 18, borderRadius: 22, backgroundColor: colors.surface },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 8 },
  option: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: { borderColor: colors.accent, backgroundColor: colors.surfaceMuted },
  preview: { width: 48, color: colors.primary, fontSize: 20, fontWeight: '900' },
  previewSmall: { fontSize: 18 },
  previewLarge: { fontSize: 24 },
  optionText: { flex: 1 },
  optionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  optionDescription: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
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
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
});