import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { getPlanoEstudo, getPlanoEstudoDiaTextos, getPlanosEstudo } from '../services/api';
import { colors } from '../theme/colors';
import { PlanoEstudo, PlanoEstudoDia, PlanoEstudoDiaTextos, PlanoEstudoLeitura } from '../types';

const DEFAULT_VERSION = 'nvi';

const getPlanIdentifier = (plano: PlanoEstudo) => plano.slug || plano.plano_estudo_id;

const getReadingText = (leitura: PlanoEstudoLeitura) => {
  const chapterText = leitura.texto?.chapter_text?.trim();

  if (chapterText) {
    return chapterText;
  }

  const verses = leitura.texto?.verses ?? [];

  if (verses.length) {
    return verses.map(verse => `${verse.verse}. ${verse.text}`).join('\n');
  }

  return 'Texto indisponivel para esta leitura.';
};

const getDurationLabel = (plano: PlanoEstudo) => {
  const total = plano.quantidade_dias ?? plano.duracao_dias;

  if (!total) {
    return 'Plano de estudo';
  }

  return `${total} dias`;
};

export const MensagensScreen = () => {
  const [planos, setPlanos] = useState<PlanoEstudo[]>([]);
  const [selectedPlano, setSelectedPlano] = useState<PlanoEstudo | null>(null);
  const [dias, setDias] = useState<PlanoEstudoDia[]>([]);
  const [selectedDia, setSelectedDia] = useState<PlanoEstudoDia | null>(null);
  const [diaTextos, setDiaTextos] = useState<PlanoEstudoDiaTextos | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const sortedPlanos = useMemo(
    () => [...planos].sort((a, b) => (a.titulo || '').localeCompare(b.titulo || '', 'pt-BR')),
    [planos],
  );

  const sortedDias = useMemo(() => [...dias].sort((a, b) => a.dia - b.dia), [dias]);
  const leituras = useMemo(() => diaTextos?.dia.leituras ?? [], [diaTextos]);

  const loadPlanos = useCallback(async () => {
    setError('');

    try {
      setPlanos(await getPlanosEstudo());
    } catch (requestError) {
      setError('Nao foi possivel carregar os planos de estudo.');
      console.error('Erro ao carregar planos de estudo:', requestError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPlanos();
  }, [loadPlanos]);

  const onRefresh = () => {
    setRefreshing(true);

    if (selectedPlano && selectedDia) {
      openDia(selectedPlano, selectedDia, true);
      return;
    }

    if (selectedPlano) {
      openPlano(selectedPlano, true);
      return;
    }

    loadPlanos();
  };

  const openPlano = async (plano: PlanoEstudo, refreshingCurrent = false) => {
    const identifier = getPlanIdentifier(plano);

    if (!identifier) {
      return;
    }

    setSelectedPlano(plano);
    setSelectedDia(null);
    setDiaTextos(null);
    setDetailLoading(true);
    setError('');

    try {
      const detalhe = await getPlanoEstudo(identifier);
      setSelectedPlano(current => ({ ...plano, ...(detalhe.plano ?? current) }));
      setDias(detalhe.dias);
    } catch (requestError) {
      setError('Nao foi possivel carregar os dias deste plano.');
      console.error('Erro ao carregar dias do plano:', requestError);
    } finally {
      setDetailLoading(false);
      setRefreshing(false);
      if (!refreshingCurrent) {
        setLoading(false);
      }
    }
  };

  const openDia = async (plano: PlanoEstudo, dia: PlanoEstudoDia, refreshingCurrent = false) => {
    const identifier = getPlanIdentifier(plano);

    if (!identifier) {
      return;
    }

    setSelectedDia(dia);
    setDetailLoading(true);
    setError('');

    try {
      setDiaTextos(await getPlanoEstudoDiaTextos(identifier, dia.dia, DEFAULT_VERSION));
    } catch (requestError) {
      setError('Nao foi possivel carregar os textos deste dia.');
      console.error('Erro ao carregar textos do dia:', requestError);
    } finally {
      setDetailLoading(false);
      setRefreshing(false);
      if (!refreshingCurrent) {
        setLoading(false);
      }
    }
  };

  const goBack = () => {
    setError('');

    if (selectedDia) {
      setSelectedDia(null);
      setDiaTextos(null);
      return;
    }

    if (selectedPlano) {
      setSelectedPlano(null);
      setDias([]);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando planos</Text>
      </View>
    );
  }

  if (selectedPlano && selectedDia) {
    return (
      <View style={styles.container}>
        <ReadingHeader
          plano={selectedPlano}
          dia={selectedDia}
          loading={detailLoading}
          onBack={goBack}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <FlatList
          data={leituras}
          keyExtractor={(item, index) => item.plano_estudo_leitura_id || `${item.referencia}-${index}`}
          contentContainerStyle={styles.readingContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            detailLoading ? (
              <InlineLoading text="Buscando textos" />
            ) : (
              <EmptyState title="Nenhum texto encontrado" onRetry={() => openDia(selectedPlano, selectedDia)} />
            )
          }
          renderItem={({ item, index }) => <ReadingItem leitura={item} fallbackOrder={index + 1} />}
          initialNumToRender={2}
          maxToRenderPerBatch={4}
          windowSize={5}
        />
      </View>
    );
  }

  if (selectedPlano) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.kicker}>{getDurationLabel(selectedPlano)}</Text>
          <Text style={styles.title}>{selectedPlano.titulo || 'Plano de estudo'}</Text>
          {selectedPlano.descricao ? <Text style={styles.subtitle}>{selectedPlano.descricao}</Text> : null}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <FlatList
          data={sortedDias}
          keyExtractor={(item, index) => item.plano_estudo_dia_id || `${item.dia}-${index}`}
          contentContainerStyle={styles.daysContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            detailLoading ? (
              <InlineLoading text="Carregando dias" />
            ) : (
              <EmptyState title="Nenhum dia encontrado" onRetry={() => openPlano(selectedPlano)} />
            )
          }
          renderItem={({ item }) => <DayItem dia={item} onPress={() => openDia(selectedPlano, item)} />}
          initialNumToRender={24}
          maxToRenderPerBatch={24}
          windowSize={7}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Mensagens</Text>
        <Text style={styles.title}>Planos de estudo</Text>
        <Text style={styles.subtitle}>Escolha um plano, acompanhe os dias e leia os textos separados para cada etapa.</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <FlatList
        data={sortedPlanos}
        keyExtractor={(item, index) => getPlanIdentifier(item) || `${item.titulo}-${index}`}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={<EmptyState title="Nenhum plano encontrado" onRetry={loadPlanos} />}
        renderItem={({ item }) => <PlanoItem plano={item} onPress={() => openPlano(item)} />}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
      />
    </View>
  );
};

const PlanoItem = ({ plano, onPress }: { plano: PlanoEstudo; onPress: () => void }) => (
  <TouchableOpacity style={styles.planCard} activeOpacity={0.84} onPress={onPress}>
    <View style={styles.planIcon}>
      <Text style={styles.planIconText}>{String(plano.titulo || 'P').slice(0, 1).toUpperCase()}</Text>
    </View>
    <View style={styles.planTextBlock}>
      <Text style={styles.planTitle}>{plano.titulo || 'Plano de estudo'}</Text>
      {plano.descricao ? (
        <Text style={styles.planDescription} numberOfLines={2}>
          {plano.descricao}
        </Text>
      ) : null}
      <Text style={styles.planMeta}>{getDurationLabel(plano)}</Text>
    </View>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>
);

const DayItem = ({ dia, onPress }: { dia: PlanoEstudoDia; onPress: () => void }) => (
  <TouchableOpacity style={styles.dayCard} activeOpacity={0.78} onPress={onPress}>
    <View style={styles.dayNumberBox}>
      <Text style={styles.dayNumber}>{dia.dia}</Text>
    </View>
    <View style={styles.dayTextBlock}>
      <Text style={styles.dayTitle}>{dia.titulo || `Dia ${dia.dia}`}</Text>
      {dia.quantidade_leituras ? <Text style={styles.dayMeta}>{dia.quantidade_leituras} leituras</Text> : null}
    </View>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>
);

const ReadingHeader = ({
  plano,
  dia,
  loading,
  onBack,
}: {
  plano: PlanoEstudo;
  dia: PlanoEstudoDia;
  loading: boolean;
  onBack: () => void;
}) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.backButton} onPress={onBack}>
      <Text style={styles.backButtonText}>Voltar</Text>
    </TouchableOpacity>
    <Text style={styles.kicker}>{plano.titulo || 'Plano de estudo'}</Text>
    <Text style={styles.title}>{dia.titulo || `Dia ${dia.dia}`}</Text>
    {loading ? (
      <View style={styles.detailLoading}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.detailLoadingText}>Atualizando textos</Text>
      </View>
    ) : null}
  </View>
);

const ReadingItem = ({ leitura, fallbackOrder }: { leitura: PlanoEstudoLeitura; fallbackOrder: number }) => (
  <View style={styles.readingBlock}>
    <View style={styles.readingTopRow}>
      <Text style={styles.readingOrder}>{String(leitura.ordem ?? fallbackOrder).padStart(2, '0')}</Text>
      <Text style={styles.readingReference}>{leitura.referencia || 'Leitura'}</Text>
    </View>
    <Text style={styles.readingText}>{getReadingText(leitura)}</Text>
  </View>
);

const InlineLoading = ({ text }: { text: string }) => (
  <View style={styles.inlineLoading}>
    <ActivityIndicator size="small" color={colors.primary} />
    <Text style={styles.inlineLoadingText}>{text}</Text>
  </View>
);

const EmptyState = ({ title, onRetry }: { title: string; onRetry: () => void }) => (
  <ScrollView contentContainerStyle={styles.emptyState}>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyText}>Puxe para atualizar ou tente novamente.</Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryText}>Tentar novamente</Text>
    </TouchableOpacity>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: colors.white,
  },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  errorText: {
    marginHorizontal: 18,
    marginBottom: 10,
    color: colors.danger,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 96,
  },
  daysContent: {
    paddingHorizontal: 14,
    paddingBottom: 96,
  },
  readingContent: {
    paddingHorizontal: 18,
    paddingBottom: 110,
  },
  planCard: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  planIcon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
  },
  planIconText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  planTextBlock: {
    flex: 1,
    paddingHorizontal: 13,
  },
  planTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  planDescription: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  planMeta: {
    marginTop: 8,
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  arrow: {
    color: colors.accent,
    fontSize: 28,
    fontWeight: '900',
  },
  dayCard: {
    width: '100%',
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayNumberBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  dayNumber: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  dayTextBlock: {
    flex: 1,
    paddingHorizontal: 12,
  },
  dayTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  dayMeta: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
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
  detailLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  detailLoadingText: {
    marginLeft: 8,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  readingBlock: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  readingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },
  readingOrder: {
    width: 34,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
  },
  readingReference: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  readingText: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 25,
  },
  inlineLoading: {
    alignItems: 'center',
    paddingVertical: 34,
  },
  inlineLoadingText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 38,
    paddingHorizontal: 18,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: colors.white,
    fontWeight: '900',
  },
});
