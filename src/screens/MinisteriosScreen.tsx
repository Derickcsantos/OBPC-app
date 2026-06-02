import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getMinisterios } from '../services/api';
import { colors } from '../theme/colors';
import { Ministerio } from '../types';

const logo = require('../../logo.jpg');

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
  const [selectedMinisterio, setSelectedMinisterio] = useState<Ministerio | null>(null);
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {selectedMinisterio ? (
        <MinisterioDetail ministerio={selectedMinisterio} onBack={() => setSelectedMinisterio(null)} />
      ) : (
        <>
          <Text style={styles.title}>Servindo juntos</Text>
          <Text style={styles.subtitle}>Conheca os ministerios ativos e encontre um lugar para caminhar com a igreja.</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {ministerios.length ? (
            ministerios.map((item, index) => (
              <TouchableOpacity
                key={item.ministerio_id || `ministerio-${index}`}
                style={styles.card}
                activeOpacity={0.84}
                onPress={() => setSelectedMinisterio(item)}
              >
                <ImageBackground
                  source={item.imagem_url ? { uri: item.imagem_url } : logo}
                  style={styles.cardCover}
                  imageStyle={styles.cardCoverImage}
                  resizeMode="cover"
                >
                  <View style={styles.cardOverlay}>
                    <Text style={styles.indexLabel}>{String(index + 1).padStart(2, '0')}</Text>
                    <Text style={styles.cardTitle}>{item.nome_ministerio || 'Ministerio'}</Text>
                  </View>
                </ImageBackground>
                <View style={styles.cardBody}>
                  <Text style={styles.cardDescription}>{item.descricao_ministerio || 'Descricao em breve.'}</Text>
                  <Text style={styles.cardLink}>Ver detalhes</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Nenhum ministerio encontrado</Text>
              <Text style={styles.emptyText}>Puxe para atualizar ou tente novamente mais tarde.</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const MinisterioDetail = ({ ministerio, onBack }: { ministerio: Ministerio; onBack: () => void }) => (
  <View>
    <TouchableOpacity style={styles.backButton} onPress={onBack}>
      <Text style={styles.backButtonText}>Voltar</Text>
    </TouchableOpacity>

    <ImageBackground
      source={ministerio.imagem_url ? { uri: ministerio.imagem_url } : logo}
      style={styles.detailCover}
      imageStyle={styles.detailCoverImage}
      resizeMode="cover"
    >
      <View style={styles.detailOverlay}>
        <Text style={styles.detailKicker}>Ministerio</Text>
        <Text style={styles.detailTitle}>{ministerio.nome_ministerio || 'Ministerio'}</Text>
      </View>
    </ImageBackground>

    <View style={styles.detailBody}>
      <Text style={styles.detailDescription}>{ministerio.descricao_ministerio || 'Descricao em breve.'}</Text>

      {ministerio.url_ministerio ? (
        <TouchableOpacity style={styles.openButton} onPress={() => openLink(ministerio.url_ministerio)}>
          <Text style={styles.openButtonText}>Abrir link do ministerio</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 18,
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
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 18,
  },
  errorText: {
    color: colors.danger,
    fontWeight: '800',
    marginBottom: 12,
  },
  card: {
    marginBottom: 18,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  cardCover: {
    height: 170,
    backgroundColor: colors.primary,
  },
  cardCoverImage: {
    opacity: 0.56,
  },
  cardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
    backgroundColor: 'rgba(11,30,24,0.48)',
  },
  indexLabel: {
    color: colors.accentSoft,
    fontSize: 13,
    fontWeight: '900',
  },
  cardTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  cardBody: {
    padding: 18,
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  cardLink: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 14,
    textTransform: 'uppercase',
  },
  emptyState: {
    padding: 22,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: 6,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: '900',
  },
  detailCover: {
    height: 250,
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  detailCoverImage: {
    opacity: 0.62,
  },
  detailOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: 'rgba(11,30,24,0.48)',
  },
  detailKicker: {
    color: colors.accentSoft,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailTitle: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '900',
    marginTop: 4,
  },
  detailBody: {
    marginTop: 16,
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailDescription: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  openButton: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  openButtonText: {
    color: colors.white,
    fontWeight: '900',
  },
});
