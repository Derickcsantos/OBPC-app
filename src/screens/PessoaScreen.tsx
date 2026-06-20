import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { colors } from '../theme/colors';
import { Pessoa } from '../types';

const fallbackImage = require('../../logo.jpg');

const openContact = async (url: string) => {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  }
};

export const PessoaScreen = ({ pessoa, onBack }: { pessoa: Pessoa; onBack: () => void }) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <TouchableOpacity style={styles.backButton} onPress={onBack}>
      <Text style={styles.backText}>‹ Voltar</Text>
    </TouchableOpacity>

    <Image source={pessoa.url_imagem ? { uri: pessoa.url_imagem } : fallbackImage} style={styles.photo} resizeMode="cover" />
    <Text style={styles.name}>{pessoa.nome || 'Nome não informado'}</Text>
    <Text style={styles.role}>{pessoa.cargo || 'Cargo não informado'}</Text>

    <View style={styles.aboutCard}>
      <Text style={styles.sectionLabel}>Sobre</Text>
      <Text style={styles.about}>{pessoa.sobre || 'Informações em breve.'}</Text>
    </View>

    {(pessoa.telefone || pessoa.email) ? (
      <View style={styles.contactCard}>
        <Text style={styles.sectionLabel}>Contato</Text>
        {pessoa.telefone ? (
          <TouchableOpacity style={styles.contactRow} onPress={() => openContact(`tel:${pessoa.telefone}`)}>
            <Text style={styles.contactLabel}>Telefone</Text>
            <Text style={styles.contactValue}>{pessoa.telefone}</Text>
          </TouchableOpacity>
        ) : null}
        {pessoa.email ? (
          <TouchableOpacity style={styles.contactRow} onPress={() => openContact(`mailto:${pessoa.email}`)}>
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
  content: { padding: 18, paddingBottom: 42 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 10 },
  backText: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  photo: { width: '100%', height: 360, borderRadius: 26, backgroundColor: colors.surfaceMuted },
  name: { color: colors.textPrimary, fontSize: 30, fontWeight: '900', marginTop: 20 },
  role: { color: colors.accent, fontSize: 17, fontWeight: '900', marginTop: 4 },
  aboutCard: { marginTop: 22, padding: 18, borderRadius: 22, backgroundColor: colors.surface },
  sectionLabel: { color: colors.accent, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  about: { color: colors.textSecondary, fontSize: 16, lineHeight: 25, marginTop: 10 },
  contactCard: { marginTop: 14, padding: 18, borderRadius: 22, backgroundColor: colors.surface },
  contactRow: { marginTop: 14 },
  contactLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  contactValue: { color: colors.primary, fontSize: 16, fontWeight: '900', marginTop: 3 },
});
