import { ArrowLeft } from 'lucide-react-native';
import { Icon } from '../components/Icon';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  useWindowDimensions,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { getMinisterios } from '../services/api';
import { colors } from '../theme/colors';
import { spacing, typography, radius } from '../theme/tokens';
import { Ministerio } from '../types';

const logo = require('../../logo.jpg');

const getMinisterioImage = (ministerio: Ministerio) =>
  ministerio.fotos
    ?.filter(foto => Boolean(foto.url_imagem))
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))[0]?.url_imagem ??
  ministerio.imagem_url ??
  null;

const openLink = async (url?: string | null) => {
  if (!url || !url.startsWith('http')) {
    return;
  }

  const supported = await Linking.canOpenURL(url);
  if (supported) {
    Linking.openURL(url);
  }
};

export const MinisteriosScreen = () => {
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [selectedMinisterio, setSelectedMinisterio] =
    useState<Ministerio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadMinisterios = useCallback(async () => {
    setError('');

    try {
      setMinisterios(await getMinisterios());
    } catch (requestError) {
      setError('Nao foi possivel carregar os ministerios.');
      console.error('Erro ao carregar ministerios:', requestError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMinisterios();
  }, [loadMinisterios]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMinisterios();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {selectedMinisterio ? (
        <MinisterioDetail
          ministerio={selectedMinisterio}
          onBack={() => setSelectedMinisterio(null)}
        />
      ) : (
        <>
          <Text style={styles.title}>Servindo juntos</Text>
          <Text style={styles.subtitle}>
            Conheca os ministerios ativos e encontre um lugar para caminhar com
            a igreja.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {ministerios.length ? (
            ministerios.map((item, index) => (
              <TouchableOpacity
                key={item.ministerio_id || `ministerio-${index}`}
                style={styles.card}
                activeOpacity={0.84}
                onPress={() => setSelectedMinisterio(item)}
              >
                <Image
                  source={
                    getMinisterioImage(item)
                      ? { uri: getMinisterioImage(item)! }
                      : logo
                  }
                  style={styles.cardCover}
                  resizeMode={getMinisterioImage(item) ? 'cover' : 'contain'}
                />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>
                    {item.nome_ministerio || 'Ministerio'}
                  </Text>
                  <Text style={styles.cardDescription}>
                    {item.descricao_ministerio || 'Descricao em breve.'}
                  </Text>
                  <Text style={styles.cardLink}>Ver detalhes</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                Nenhum ministerio encontrado
              </Text>
              <Text style={styles.emptyText}>
                Puxe para atualizar ou tente novamente mais tarde.
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const MinisterioDetail = ({
  ministerio,
  onBack,
}: {
  ministerio: Ministerio;
  onBack: () => void;
}) => (
  <View>
    <TouchableOpacity style={styles.backButton} onPress={onBack}>
      <Icon as={ArrowLeft} size={18} />
      <Text style={styles.backButtonText}>Voltar</Text>
    </TouchableOpacity>

    <MinistryPhotoCarousel ministerio={ministerio} />

    <View style={styles.detailBody}>
      <Text style={styles.detailKicker}>Ministério</Text>
      <Text style={styles.detailTitle}>
        {ministerio.nome_ministerio || 'Ministério'}
      </Text>
      <Text style={styles.detailDescription}>
        {ministerio.descricao_ministerio || 'Descricao em breve.'}
      </Text>

      {ministerio.url_ministerio ? (
        <TouchableOpacity
          style={styles.openButton}
          onPress={() => openLink(ministerio.url_ministerio)}
        >
          <Text style={styles.openButtonText}>Abrir link do ministerio</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

const MinistryPhotoCarousel = ({ ministerio }: { ministerio: Ministerio }) => {
  const { width } = useWindowDimensions();
  const carouselWidth = Math.max(0, width - spacing.page * 2);
  const photos = (ministerio.fotos ?? [])
    .filter(photo => Boolean(photo.url_imagem))
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const imageUrls = photos.map(photo => photo.url_imagem);

  if (!imageUrls.length && ministerio.imagem_url) {
    imageUrls.push(ministerio.imagem_url);
  }

  if (!imageUrls.length) {
    return (
      <Image
        source={logo}
        style={[styles.detailCover, { width: carouselWidth }]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photoCarousel}
      >
        {imageUrls.map((url, index) => (
          <Image
            key={`${url}-${index}`}
            source={{ uri: url }}
            style={[styles.carouselImage, { width: carouselWidth }]}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      {imageUrls.length > 1 ? (
        <Text style={styles.photoHint}>
          Deslize para ver as {imageUrls.length} fotos
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.page,
    paddingBottom: 34,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
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
  errorText: {
    color: colors.danger,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    marginBottom: spacing.section,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  cardCover: {
    height: 170,
    width: '100%',
    backgroundColor: colors.surfaceMuted,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardBody: {
    padding: spacing.md,
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 22,
  },
  cardLink: {
    color: colors.accent,
    fontSize: typography.body,
    fontWeight: '600',
    marginTop: 14,
  },
  emptyState: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: 6,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    alignSelf: 'flex-start',
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  detailCover: {
    height: 250,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  photoCarousel: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  carouselImage: {
    height: 250,
    backgroundColor: colors.surfaceMuted,
  },
  photoHint: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    textAlign: 'center',
    marginTop: 8,
  },
  detailKicker: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  detailTitle: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '600',
    marginTop: 4,
  },
  detailBody: {
    marginTop: 16,
  },
  detailDescription: {
    color: colors.textSecondary,
    fontSize: typography.subtitle,
    lineHeight: 24,
    marginTop: 12,
  },
  openButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.section,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  openButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
});
