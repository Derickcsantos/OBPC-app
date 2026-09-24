import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, Search, X } from 'lucide-react-native';
import { Icon } from '../components/Icon';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  AppText as Text,
  AppTextInput as TextInput,
} from '../components/AppText';
import {
  API_BASE_URL,
  createEventoInscricao,
  getEventoById,
  getEventos,
} from '../services/api';
import { colors } from '../theme/colors';
import { spacing, typography, radius } from '../theme/tokens';
import { Evento } from '../types';

const formatDate = (date?: string) => {
  if (!date) {
    return 'Data a confirmar';
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate);
};

const formatTime = (time?: string | null) => (time ? time.slice(0, 5) : null);

const toImageUrl = (value?: string | null) => {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${API_BASE_URL}${value}`;
  }

  return `${API_BASE_URL}/${value}`;
};

const getImageValue = (
  item:
    | string
    | {
        url?: string | null;
        url_imagem?: string | null;
        imagem_url?: string | null;
        imagem_evento?: string | null;
      },
) => {
  if (typeof item === 'string') {
    return item;
  }

  return (
    item.url || item.url_imagem || item.imagem_url || item.imagem_evento || ''
  );
};

export const EventosScreen = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const sortedEventos = useMemo(() => {
    return [...eventos].sort((a, b) => {
      const first = new Date(a.data_evento).getTime();
      const second = new Date(b.data_evento).getTime();
      return (
        (Number.isNaN(first) ? 0 : first) - (Number.isNaN(second) ? 0 : second)
      );
    });
  }, [eventos]);

  const filteredEventos = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return sortedEventos.filter(evento => {
      const matchesName = !term || (evento.nome_evento || '').toLocaleLowerCase('pt-BR').includes(term);
      const matchesDate = !selectedDate || getDateKey(evento.data_evento) === selectedDate;
      return matchesName && matchesDate;
    });
  }, [search, selectedDate, sortedEventos]);

  const loadEventos = useCallback(async () => {
    setError('');

    try {
      setEventos(await getEventos());
    } catch (requestError) {
      setError('Nao foi possivel carregar os eventos.');
      console.error('Erro ao carregar eventos:', requestError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEventos();
  }, [loadEventos]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEventos();
  };

  const openEvento = async (evento: Evento) => {
    setSelectedEvento(evento);

    if (!evento.evento_id) {
      return;
    }

    setDetailLoading(true);
    setError('');

    try {
      setSelectedEvento(await getEventoById(evento.evento_id));
    } catch (requestError) {
      console.error('Erro ao carregar evento:', requestError);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando eventos</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedEvento ? (
        <EventoDetail
          evento={selectedEvento}
          loading={detailLoading}
          onBack={() => setSelectedEvento(null)}
        />
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.kicker}>Agenda OBPC</Text>
            <Text style={styles.title}>Eventos</Text>
          </View>

          <View style={styles.filters}>
            <View style={styles.searchBox}>
              <Icon as={Search} size={18} color={colors.textSecondary} />
              <TextInput
                accessibilityLabel="Buscar eventos pelo nome"
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar evento pelo nome"
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
              />
              {search ? (
                <TouchableOpacity accessibilityLabel="Limpar busca" onPress={() => setSearch('')} style={styles.clearButton}>
                  <Icon as={X} size={17} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
            <EventCalendar
              eventos={sortedEventos}
              month={visibleMonth}
              selectedDate={selectedDate}
              onMonthChange={setVisibleMonth}
              onSelectDate={setSelectedDate}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <FlatList
            data={filteredEventos}
            keyExtractor={(item, index) =>
              item.evento_id || `${item.nome_evento}-${index}`
            }
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              search || selectedDate ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Nenhum evento nesse filtro</Text>
                  <Text style={styles.emptyText}>Altere a busca ou escolha outra data.</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={() => { setSearch(''); setSelectedDate(null); }}>
                    <Text style={styles.retryText}>Limpar filtros</Text>
                  </TouchableOpacity>
                </View>
              ) : <EmptyState onRetry={loadEventos} />
            }
            renderItem={({ item }) => (
              <EventoItem evento={item} onPress={() => openEvento(item)} />
            )}
          />
        </>
      )}
    </View>
  );
};

const EventoItem = ({
  evento,
  onPress,
}: {
  evento: Evento;
  onPress: () => void;
}) => {
  const mainImage = getMainImage(evento);

  return (
    <TouchableOpacity
      style={styles.eventCard}
      activeOpacity={0.84}
      onPress={onPress}
    >
      {mainImage ? (
        <Image
          source={{ uri: mainImage }}
          style={styles.eventImage}
          resizeMode="contain"
        />
      ) : null}
      <Text style={styles.eventDate}>{formatDate(evento.data_evento)}</Text>
      <Text style={styles.eventTitle}>{evento.nome_evento || 'Evento'}</Text>
      <Text style={styles.eventDescription} numberOfLines={3}>
        {evento.descricao_evento || 'Descricao indisponivel.'}
      </Text>
      <View style={styles.eventMetaRow}>
        {evento.numero_vagas !== undefined && evento.numero_vagas !== null ? (
          <Text style={styles.eventMeta}>{evento.numero_vagas} vagas</Text>
        ) : null}
        {formatTime(evento.hora_inicio) ? (
          <Text style={styles.eventMeta}>{formatTime(evento.hora_inicio)}</Text>
        ) : null}
      </View>
      <Text style={styles.registrationHint}>Inscricao disponivel</Text>
      <Text style={styles.openDetailText}>Ver detalhes</Text>
    </TouchableOpacity>
  );
};

const getDateKey = (value?: string | Date) => {
  if (!value) return '';
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const EventCalendar = ({ eventos, month, selectedDate, onMonthChange, onSelectDate }: {
  eventos: Evento[];
  month: Date;
  selectedDate: string | null;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date: string | null) => void;
}) => {
  const eventDates = useMemo(() => new Set(eventos.map(item => getDateKey(item.data_evento))), [eventos]);
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekDay = new Date(year, monthIndex, 1).getDay();
  const cells: Array<number | null> = [
    ...Array.from({ length: firstWeekDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month);

  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <View style={styles.calendarTitleWrap}>
          <Icon as={CalendarDays} size={18} color={colors.textPrimary} />
          <Text style={styles.calendarTitle}>{monthLabel}</Text>
        </View>
        <View style={styles.calendarNavigation}>
          <TouchableOpacity accessibilityLabel="Mes anterior" style={styles.calendarNavButton} onPress={() => onMonthChange(new Date(year, monthIndex - 1, 1))}>
            <Icon as={ChevronLeft} size={18} />
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Proximo mes" style={styles.calendarNavButton} onPress={() => onMonthChange(new Date(year, monthIndex + 1, 1))}>
            <Icon as={ChevronRight} size={18} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.calendarGrid}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((label, index) => <Text key={`${label}-${index}`} style={styles.weekLabel}>{label}</Text>)}
        {cells.map((day, index) => {
          if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
          const date = getDateKey(new Date(year, monthIndex, day));
          const selected = selectedDate === date;
          const hasEvent = eventDates.has(date);
          return (
            <TouchableOpacity key={date} accessibilityRole="button" accessibilityState={{ selected }} style={[styles.dayCell, selected && styles.dayCellSelected]} onPress={() => onSelectDate(selected ? null : date)}>
              <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day}</Text>
              {hasEvent ? <View style={[styles.eventDot, selected && styles.eventDotSelected]} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
      {selectedDate ? (
        <TouchableOpacity onPress={() => onSelectDate(null)} style={styles.showAllButton}>
          <Text style={styles.showAllText}>Mostrar todas as datas</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const getMainImage = (evento: Evento) =>
  toImageUrl(
    evento.url_capa ||
      evento.foto_principal_url ||
      evento.foto_principal ||
      evento.imagem_evento ||
      evento.imagem_url ||
      evento.capa_evento ||
      evento.capa_url ||
      null,
  );

const getRegistrationLink = (evento: Evento) =>
  evento.link_inscricao ||
  evento.url_inscricao ||
  evento.inscricao_url ||
  evento.link_evento ||
  null;

const getAuxiliaryPhotos = (evento: Evento) => {
  const photos =
    evento.fotos_auxiliares || evento.imagens_evento || evento.imagens;

  if (!Array.isArray(photos)) {
    return [];
  }

  return photos
    .slice()
    .sort((a, b) => {
      const first = typeof a === 'string' ? 0 : (a.ordem ?? 0);
      const second = typeof b === 'string' ? 0 : (b.ordem ?? 0);
      return first - second;
    })
    .map(item => toImageUrl(getImageValue(item)))
    .filter((photo): photo is string => Boolean(photo));
};

const EventoDetail = ({
  evento,
  loading,
  onBack,
}: {
  evento: Evento;
  loading: boolean;
  onBack: () => void;
}) => {
  const { width } = useWindowDimensions();
  const imageWidth = Math.max(width - spacing.page * 2, 0);
  const [activePhoto, setActivePhoto] = useState(0);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openLink = async () => {
    const registrationLink = getRegistrationLink(evento);

    if (!registrationLink) {
      return;
    }

    const canOpen = await Linking.canOpenURL(registrationLink);

    if (canOpen) {
      Linking.openURL(registrationLink);
    }
  };

  const mainImage = getMainImage(evento);
  const auxiliaryPhotos = getAuxiliaryPhotos(evento);
  const observations = evento.observacao_evento || evento.observacoes_evento;
  const address = evento.endereco_evento || evento.local;
  const registrationLink = getRegistrationLink(evento);
  const carouselPhotos = [mainImage, ...auxiliaryPhotos].filter(
    (photo): photo is string => Boolean(photo),
  );
  const isFull = evento.numero_vagas === 0;

  const handleCarouselScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / imageWidth,
    );
    setActivePhoto(nextIndex);
  };

  const handleSubmit = async () => {
    const trimmedName = nome.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = telefone.trim();

    if (!trimmedName || !trimmedEmail || trimmedPhone.length < 8) {
      Alert.alert('Dados obrigatorios', 'Preencha nome, email e telefone.');
      return;
    }

    if (isFull) {
      Alert.alert(
        'Evento lotado',
        'Nao ha vagas disponiveis para este evento.',
      );
      return;
    }

    setSubmitting(true);

    try {
      await createEventoInscricao(evento.evento_id, {
        nome: trimmedName,
        email: trimmedEmail,
        telefone: trimmedPhone,
      });
      setNome('');
      setEmail('');
      setTelefone('');
      Alert.alert(
        'Inscricao confirmada',
        'Sua inscricao foi realizada com sucesso.',
      );
    } catch (requestError: any) {
      const status = requestError?.response?.status;
      const message = requestError?.response?.data?.message;
      Alert.alert(
        status === 409 ? 'Evento lotado' : 'Nao foi possivel inscrever',
        message || 'Tente novamente em instantes.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.detailContainer}
      contentContainerStyle={styles.detailContent}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Icon as={ArrowLeft} size={18} />
        <Text style={styles.backButtonText}>Voltar</Text>
      </TouchableOpacity>

      <View style={styles.heroImageWrap}>
        {carouselPhotos.length ? (
          <>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleCarouselScroll}
              style={styles.carousel}
            >
              {carouselPhotos.map((photo, index) => (
                <Image
                  key={`${photo}-${index}`}
                  source={{ uri: photo }}
                  style={[styles.heroImage, { width: imageWidth }]}
                  resizeMode="contain"
                />
              ))}
            </ScrollView>
            {carouselPhotos.length > 1 ? (
              <View style={styles.dots}>
                {carouselPhotos.map((_, index) => (
                  <View
                    key={`dot-${index}`}
                    style={[
                      styles.dot,
                      activePhoto === index && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.heroPlaceholder}>
            <Text style={styles.heroPlaceholderText}>OBPC</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.detailLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.detailLoadingText}>Atualizando detalhes</Text>
        </View>
      ) : null}

      <Text style={styles.detailDate}>{formatDate(evento.data_evento)}</Text>
      <Text style={styles.detailTitle}>{evento.nome_evento || 'Evento'}</Text>
      <View style={styles.detailFacts}>
        {formatTime(evento.hora_inicio) ? (
          <InfoPill
            label="Inicio"
            value={formatTime(evento.hora_inicio) || ''}
          />
        ) : null}
        {evento.numero_vagas !== undefined && evento.numero_vagas !== null ? (
          <InfoPill label="Vagas" value={`${evento.numero_vagas}`} />
        ) : null}
      </View>
      <Text style={styles.detailText}>
        {evento.descricao_evento || 'Descricao indisponivel.'}
      </Text>

      {observations ? (
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Observacoes</Text>
          <Text style={styles.detailText}>{observations}</Text>
        </View>
      ) : null}

      {address ? (
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Endereco</Text>
          <Text style={styles.detailText}>{address}</Text>
        </View>
      ) : null}

      {evento.responsavel_nome || evento.responsavel_telefone ? (
        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>Responsavel</Text>
          {evento.responsavel_nome ? (
            <Text style={styles.detailText}>{evento.responsavel_nome}</Text>
          ) : null}
          {evento.responsavel_telefone ? (
            <Text style={styles.detailText}>{evento.responsavel_telefone}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.registrationCard}>
        <Text style={styles.registrationTitle}>Inscricao</Text>
        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder="Nome completo"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          value={telefone}
          onChangeText={setTelefone}
          placeholder="Telefone"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          style={styles.input}
        />
        <TouchableOpacity
          style={[
            styles.detailLinkButton,
            isFull && styles.detailLinkButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={submitting || isFull}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.linkButtonText}>
              {isFull ? 'Evento lotado' : 'Confirmar inscricao'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {registrationLink ? (
        <TouchableOpacity style={styles.externalButton} onPress={openLink}>
          <Text style={styles.externalButtonText}>Abrir link do evento</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
};

const InfoPill = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoPill}>
    <Text style={styles.infoPillLabel}>{label}</Text>
    <Text style={styles.infoPillValue}>{value}</Text>
  </View>
);

const EmptyState = ({ onRetry }: { onRetry: () => void }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyTitle}>Nenhum evento encontrado</Text>
    <Text style={styles.emptyText}>
      Puxe para atualizar ou tente novamente.
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
      <Text style={styles.retryText}>Tentar novamente</Text>
    </TouchableOpacity>
  </View>
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
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.section,
    paddingBottom: 12,
  },
  filters: { paddingHorizontal: spacing.page, paddingBottom: 14 },
  searchBox: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.inputBackground,
  },
  searchInput: { flex: 1, minHeight: 44, color: colors.textPrimary, paddingVertical: 0 },
  clearButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  calendarCard: { marginTop: 12, padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  calendarTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calendarTitle: { color: colors.textPrimary, fontWeight: '600', textTransform: 'capitalize' },
  calendarNavigation: { flexDirection: 'row' },
  calendarNavButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekLabel: { width: '14.285%', textAlign: 'center', color: colors.textSecondary, fontSize: typography.caption, paddingVertical: 6 },
  dayCell: { width: '14.285%', height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  dayCellSelected: { backgroundColor: colors.primary },
  dayText: { color: colors.textPrimary, fontSize: typography.caption },
  dayTextSelected: { color: colors.white, fontWeight: '600' },
  eventDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2, backgroundColor: colors.primary },
  eventDotSelected: { backgroundColor: colors.white },
  showAllButton: { minHeight: 36, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  showAllText: { color: colors.textPrimary, fontWeight: '600', fontSize: typography.caption },
  kicker: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  title: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '600',
  },
  errorText: {
    marginHorizontal: spacing.page,
    marginBottom: 10,
    color: colors.danger,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.bottom,
  },
  eventCard: {
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  eventImage: {
    width: '100%',
    height: 132,
    backgroundColor: colors.surfaceMuted,
  },
  eventDate: {
    marginHorizontal: 16,
    marginTop: 16,
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  eventTitle: {
    marginHorizontal: 16,
    marginTop: 7,
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '600',
  },
  eventDescription: {
    marginHorizontal: 16,
    marginTop: 7,
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 21,
  },
  eventMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    marginTop: 10,
  },
  eventMeta: {
    marginRight: 8,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  linkButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  openDetailText: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  registrationHint: {
    marginHorizontal: 16,
    marginTop: 10,
    color: colors.accent,
    fontWeight: '600',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  detailContent: {
    paddingBottom: spacing.bottom,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    alignSelf: 'flex-start',
    marginHorizontal: spacing.page,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  backButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  heroImageWrap: {
    height: 236,
    marginHorizontal: spacing.page,
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  carousel: {
    width: '100%',
    height: '100%',
  },
  heroImage: {
    height: '100%',
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginHorizontal: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.white,
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  heroPlaceholderText: {
    color: colors.primary,
    fontSize: typography.title,
    fontWeight: '600',
  },
  detailLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.page,
    marginTop: 12,
  },
  detailLoadingText: {
    marginLeft: 8,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  detailDate: {
    marginHorizontal: spacing.page,
    marginTop: spacing.section,
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  detailTitle: {
    marginHorizontal: spacing.page,
    marginTop: 8,
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '600',
  },
  detailText: {
    marginHorizontal: spacing.page,
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 23,
  },
  detailFacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: spacing.page,
    marginTop: 12,
  },
  infoPill: {
    marginRight: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  infoPillLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  infoPillValue: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: '600',
    marginTop: 2,
  },
  detailSection: {
    marginTop: spacing.section,
  },
  detailSectionTitle: {
    marginHorizontal: spacing.page,
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: '600',
  },
  registrationCard: {
    marginHorizontal: spacing.page,
    marginTop: spacing.section,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  registrationTitle: {
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    minHeight: 44,
    marginBottom: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
    fontSize: typography.body,
  },
  detailLinkButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  detailLinkButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  externalButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.page,
    marginTop: 14,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  externalButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.section,
    paddingHorizontal: spacing.page,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  retryText: {
    color: colors.white,
    fontWeight: '600',
  },
});
