import { ArrowLeft, X } from 'lucide-react-native';
import { Icon } from '../components/Icon';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
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
}) => {
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const { width } = useWindowDimensions();
  const photoWidth = width - (spacing.page * 2);
  const photos = useMemo(() => {
    const urls = [pessoa.url_imagem, ...(pessoa.imagens ?? []).sort((first, second) => (first.ordem ?? 0) - (second.ordem ?? 0)).map(image => image.url_imagem)]
      .filter((url): url is string => Boolean(url));
    return [...new Set(urls)];
  }, [pessoa.imagens, pessoa.url_imagem]);

  return <>
  <ScrollView
    style={styles.container}
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}
  >
    <TouchableOpacity style={styles.backButton} onPress={onBack}>
      <Icon as={ArrowLeft} size={18} />
      <Text style={styles.backText}>Voltar</Text>
    </TouchableOpacity>

    <View>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={event => setPhotoIndex(Math.round(event.nativeEvent.contentOffset.x / photoWidth))}>
        {(photos.length ? photos : [undefined]).map((url, index) => <Pressable key={url ?? 'fallback'} accessibilityRole="button" accessibilityLabel={`Ampliar foto ${index + 1} de ${pessoa.nome}`} onPress={() => { setPhotoIndex(index); setPhotoOpen(true); }}><Image source={url ? { uri: url } : fallbackImage} style={[styles.photo, { width: photoWidth }]} resizeMode="contain" /></Pressable>)}
      </ScrollView>
      {photos.length > 1 ? <View style={styles.dots}>{photos.map((url, index) => <View key={url} style={[styles.dot, index === photoIndex && styles.dotActive]} />)}</View> : null}
      <Text style={styles.photoHint}>{photos.length > 1 ? 'Deslize para ver as fotos · toque para ampliar' : 'Toque para ampliar'}</Text>
    </View>
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
  <Modal visible={photoOpen} animationType="fade" transparent={false} onRequestClose={() => setPhotoOpen(false)}>
    <View style={styles.photoViewer}>
      <Pressable accessibilityRole="button" accessibilityLabel="Fechar foto" style={styles.closePhoto} onPress={() => setPhotoOpen(false)}><Icon as={X} color="#FFFFFF" /></Pressable>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: photoIndex * width, y: 0 }} onMomentumScrollEnd={event => setPhotoIndex(Math.round(event.nativeEvent.contentOffset.x / width))}>
        {(photos.length ? photos : [undefined]).map(url => <Image key={url ?? 'fallback'} source={url ? { uri: url } : fallbackImage} style={[styles.fullPhoto, { width }]} resizeMode="contain" />)}
      </ScrollView>
      <Text style={styles.fullPhotoName}>{pessoa.nome || 'Pessoa'}</Text>
    </View>
  </Modal>
  </>;
};

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
    aspectRatio: 4 / 5,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  photoHint: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    textAlign: 'center',
    marginTop: 6,
  },
  photoViewer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  closePhoto: {
    position: 'absolute',
    top: 44,
    right: 16,
    zIndex: 2,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPhoto: { height: '82%' },
  dots: { position: 'absolute', bottom: 30, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.58)' },
  dotActive: { width: 16, backgroundColor: colors.white },
  fullPhotoName: { color: '#FFFFFF', fontSize: typography.subtitle, fontWeight: '600', marginTop: 10 },
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
