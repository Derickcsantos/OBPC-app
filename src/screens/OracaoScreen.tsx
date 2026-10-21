import { Plus, ChevronLeft, ChevronRight, Check, Heart, CalendarDays, Search, X } from 'lucide-react-native';
import { Icon } from '../components/Icon';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AppText as Text,
  AppTextInput as TextInput,
} from '../components/AppText';
import {
  desmarcarOracaoComoOrada,
  getMinhasOracoesOradas,
  getOracoes,
  marcarOracaoComoOrada,
  postOracao,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors, createDynamicStyles } from '../theme/colors';
import { spacing, typography, radius } from '../theme/tokens';
import { Oracao } from '../types';
import axios from 'axios';

type OracaoView = 'list' | 'detail' | 'create';
type PrayerTab = 'all' | 'history' | 'pending';

const getSaoPauloDateKey = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const read = (type: string) => parts.find(part => part.type === type)?.value ?? '';
  return `${read('year')}-${read('month')}-${read('day')}`;
};

export const OracaoScreen = ({ initialTab = 'all' }: { initialTab?: PrayerTab }) => {
  const { user } = useAuth();
  const [view, setView] = useState<OracaoView>('list');
  const [selectedOracao, setSelectedOracao] = useState<Oracao | null>(null);
  const [nome, setNome] = useState('');
  const [pedido, setPedido] = useState('');
  const [mostrarGrupo, setMostrarGrupo] = useState(true);
  const [aceitaLigacao, setAceitaLigacao] = useState(false);
  const [oracoes, setOracoes] = useState<Oracao[]>([]);
  const [historico, setHistorico] = useState<Oracao[]>([]);
  const [activeTab, setActiveTab] = useState<PrayerTab>(initialTab);
  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orandoIds, setOrandoIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const loadOracoes = useCallback(async () => {
    try {
      const [pedidos, oradas] = await Promise.all([
        getOracoes({ q: debouncedSearch || undefined, data: selectedDate ?? undefined, limit: 100 }),
        user ? getMinhasOracoesOradas(1, 100) : Promise.resolve({ items: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 1 } }),
      ]);
      const prayedIds = new Set(oradas.items.map(item => item.oracao_id).filter(Boolean));
      setOracoes(pedidos.items.map(item => ({
        ...item,
        orado_por_mim: Boolean(item.orado_por_mim || item.orado || (item.oracao_id && prayedIds.has(item.oracao_id))),
      })));
      setHistorico(oradas.items.map(item => ({ ...item, orado_por_mim: true })));
    } catch (requestError) {
      console.error('Erro ao carregar pedidos de oração:', requestError);
      Alert.alert('Erro', 'Não foi possível carregar os pedidos de oração.');
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, selectedDate, user]);

  useEffect(() => {
    loadOracoes();
  }, [loadOracoes]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 280);
    return () => clearTimeout(timer);
  }, [search]);

  const resetForm = () => {
    setNome('');
    setPedido('');
    setMostrarGrupo(true);
    setAceitaLigacao(false);
  };

  const openDetail = (oracao: Oracao) => {
    setSelectedOracao(oracao);
    setView('detail');
  };

  const openCreate = () => {
    resetForm();
    setSelectedOracao(null);
    setView('create');
  };

  const goToList = () => {
    setSelectedOracao(null);
    setView('list');
  };

  const handleSubmit = async () => {
    if (!nome.trim() || !pedido.trim()) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha seu nome e o pedido de oração.',
      );
      return;
    }

    setSubmitting(true);
    try {
      await postOracao({
        nome_pedido: nome.trim(),
        descricao_pedido: pedido.trim(),
        mostrar_grupo: mostrarGrupo,
        aceita_ligacao: aceitaLigacao,
        status: 'em andamento',
      });

      Alert.alert(
        'Pedido enviado',
        'Recebemos seu pedido e estaremos em oração.',
      );
      resetForm();
      setView('list');
      loadOracoes();
    } catch (requestError) {
      console.error('Erro ao enviar pedido de oração:', requestError);
      Alert.alert('Não enviado', 'Não foi possível enviar seu pedido agora.');
    } finally {
      setSubmitting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOracoes();
  };

  const localMatches = useCallback((item: Oracao) => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    const matchesText = !term || `${item.nome_pedido ?? ''} ${item.descricao_pedido ?? ''}`.toLocaleLowerCase('pt-BR').includes(term);
    const matchesDate = !selectedDate || getSaoPauloDateKey(item.created_at) === selectedDate;
    return matchesText && matchesDate;
  }, [search, selectedDate]);

  const visibleOracoes = activeTab === 'history'
    ? historico.filter(localMatches)
    : activeTab === 'pending'
      ? oracoes.filter(item => !item.orado && !item.orado_por_mim).filter(localMatches)
      : oracoes;

  const handleOrado = async (oracao: Oracao) => {
    const id = oracao.oracao_id;
    if (!user) {
      Alert.alert('Entre na sua conta', 'Faca login no perfil para marcar que orou.');
      return;
    }
    if (!id || id.startsWith('offline-') || orandoIds.has(id)) return;

    const marked = Boolean(oracao.orado_por_mim || oracao.orado);
    const applyState = (value: boolean) => {
      setOracoes(current => current.map(item => item.oracao_id === id ? { ...item, orado: value, orado_por_mim: value } : item));
      setSelectedOracao(current => current?.oracao_id === id ? { ...current, orado: value, orado_por_mim: value } : current);
      setHistorico(current => value
        ? current.some(item => item.oracao_id === id) ? current : [{ ...oracao, orado: true, orado_por_mim: true }, ...current]
        : current.filter(item => item.oracao_id !== id));
    };
    setOrandoIds(current => new Set(current).add(id));
    applyState(!marked);
    try {
      if (marked) await desmarcarOracaoComoOrada(id);
      else await marcarOracaoComoOrada(id);
    } catch (error) {
      console.error('Erro ao marcar pedido como orado:', error);
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const message = status === 401
        ? 'Sua sessao expirou. Saia do perfil, entre novamente e tente de novo.'
        : axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : 'Verifique sua conexão e tente novamente.';
      applyState(marked);
      Alert.alert('Não foi possível atualizar', message);
    } finally {
      setOrandoIds(current => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  if (view === 'detail' && selectedOracao) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TopBar title="Pedido de oração" onBack={goToList} />
        <View style={styles.detailCard}>
          <Text style={styles.detailStatus}>
            {selectedOracao.status || 'em andamento'}
          </Text>
          <Text style={styles.detailName}>
            {selectedOracao.nome_pedido || 'Pedido de oração'}
          </Text>
          <Text style={styles.detailText}>
            {selectedOracao.descricao_pedido || 'Sem descrição.'}
          </Text>

          <View style={styles.detailMeta}>
            <InfoPill
              label={
                selectedOracao.mostrar_grupo
                  ? 'Visivel ao grupo'
                  : 'Pedido reservado'
              }
            />
            <InfoPill
              label={
                selectedOracao.aceita_ligacao ? 'Aceita ligacao' : 'Sem ligacao'
              }
            />
          </View>
          <OradoButton oracao={selectedOracao} loading={Boolean(selectedOracao.oracao_id && orandoIds.has(selectedOracao.oracao_id))} marked={Boolean(selectedOracao.orado || selectedOracao.orado_por_mim)} onPress={() => handleOrado(selectedOracao)} />
        </View>
      </ScrollView>
    );
  }

  if (view === 'create') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TopBar title="Novo pedido" onBack={goToList} />

          <View style={styles.form}>
            <Text style={styles.label}>Seu nome</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Digite seu nome"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Pedido</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={pedido}
              onChangeText={setPedido}
              placeholder="Escreva seu pedido aqui"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={7}
              textAlignVertical="top"
            />

            <ToggleRow
              label="Mostrar no grupo de oração"
              value={mostrarGrupo}
              onValueChange={setMostrarGrupo}
            />
            <ToggleRow
              label="Aceito receber uma ligacao"
              value={aceitaLigacao}
              onValueChange={setAceitaLigacao}
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                submitting && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Enviar pedido</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.kicker}>Intercessao</Text>
            <Text style={styles.title}>Pedidos de oração</Text>
          </View>
          {loadingList ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : null}
        </View>

        {user ? (
          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, activeTab === 'all' && styles.tabActive]} onPress={() => setActiveTab('all')}>
              <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.tabActive]} onPress={() => setActiveTab('history')}>
              <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Já orei</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'pending' && styles.tabActive]} onPress={() => setActiveTab('pending')}>
              <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Ainda não orei</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.filterBlock}>
          <View style={styles.filterRow}>
            <View style={styles.searchBox}>
              <Icon as={Search} size={18} color={colors.textSecondary} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Buscar pedidos" placeholderTextColor={colors.textSecondary} style={styles.searchInput} accessibilityLabel="Buscar pedidos de oração" />
              {search ? <TouchableOpacity accessibilityLabel="Limpar busca" onPress={() => setSearch('')}><Icon as={X} size={17} color={colors.textSecondary} /></TouchableOpacity> : null}
            </View>
            <TouchableOpacity accessibilityLabel={calendarOpen ? 'Fechar calendário' : 'Filtrar por data'} accessibilityState={{ expanded: calendarOpen, selected: Boolean(selectedDate) }} style={[styles.calendarButton, (calendarOpen || selectedDate) && styles.calendarButtonActive]} onPress={() => setCalendarOpen(value => !value)}>
              <Icon as={CalendarDays} size={20} color={calendarOpen || selectedDate ? colors.white : colors.primary} />
            </TouchableOpacity>
          </View>
          {calendarOpen ? <PrayerCalendar month={visibleMonth} selectedDate={selectedDate} onMonthChange={setVisibleMonth} onSelectDate={date => { setSelectedDate(date); setCalendarOpen(false); }} /> : null}
        </View>

        {visibleOracoes.length ? (
          visibleOracoes.map((oracao, index) => (
            <View
              key={oracao.oracao_id || `oracao-${index}`}
              style={styles.prayerCard}
            >
              <TouchableOpacity activeOpacity={0.82} onPress={() => openDetail(oracao)}>
                <View style={styles.prayerHeader}>
                  <Text style={styles.prayerName} numberOfLines={1}>
                    {oracao.nome_pedido || 'Pedido de oração'}
                  </Text>
                  <Text style={styles.prayerStatus}>
                    {oracao.status || 'em andamento'}
                  </Text>
                </View>
                <Text style={styles.prayerText} numberOfLines={3}>
                  {oracao.descricao_pedido || 'Toque para ver detalhes.'}
                </Text>
                <Text style={styles.openText}>Abrir pedido</Text>
              </TouchableOpacity>
              <OradoButton oracao={oracao} loading={Boolean(oracao.oracao_id && orandoIds.has(oracao.oracao_id))} marked={Boolean(oracao.orado || oracao.orado_por_mim)} onPress={() => handleOrado(oracao)} compact />
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            {activeTab === 'history' ? 'Você ainda não marcou nenhum pedido como orado.' : activeTab === 'pending' ? 'Não há pedidos pendentes para você.' : 'Nenhum pedido de oração no momento.'}
          </Text>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        activeOpacity={0.86}
        onPress={openCreate}
      >
        <Icon as={Plus} color={colors.white} style={styles.floatingButtonIcon} />
        <Text style={styles.floatingButtonText}>Novo pedido</Text>
      </TouchableOpacity>
    </View>
  );
};

const PrayerCalendar = ({ month, selectedDate, onMonthChange, onSelectDate }: {
  month: Date;
  selectedDate: string | null;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: string | null) => void;
}) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstWeekDay = new Date(year, monthIndex, 1).getDay();
  const cells = [...Array(firstWeekDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  while (cells.length % 7) cells.push(null);
  const keyFor = (day: number) => `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarTitle}>{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month)}</Text>
        <View style={styles.calendarNavigation}>
          <TouchableOpacity accessibilityLabel="Mês anterior" style={styles.calendarNavButton} onPress={() => onMonthChange(new Date(year, monthIndex - 1, 1))}><Icon as={ChevronLeft} size={18} /></TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Próximo mês" style={styles.calendarNavButton} onPress={() => onMonthChange(new Date(year, monthIndex + 1, 1))}><Icon as={ChevronRight} size={18} /></TouchableOpacity>
        </View>
      </View>
      <View style={styles.calendarGrid}>
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((label, index) => <Text key={`${label}-${index}`} style={styles.weekLabel}>{label}</Text>)}
        {cells.map((day, index) => day ? (() => { const date = keyFor(day); const selected = selectedDate === date; return <TouchableOpacity key={date} accessibilityRole="button" accessibilityState={{ selected }} style={[styles.dayCell, selected && styles.dayCellSelected]} onPress={() => onSelectDate(selected ? null : date)}><Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day}</Text></TouchableOpacity>; })() : <View key={`empty-${index}`} style={styles.dayCell} />)}
      </View>
      {selectedDate ? <TouchableOpacity onPress={() => onSelectDate(null)} style={styles.clearDateButton}><Text style={styles.clearDateText}>Limpar data</Text></TouchableOpacity> : null}
    </View>
  );
};

const TopBar = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <View style={styles.topBar}>
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      style={styles.backButton}
      onPress={onBack}
    >
      <Icon as={ChevronLeft} />
    </TouchableOpacity>
    <Text style={styles.topBarTitle}>{title}</Text>
    <View style={styles.backButtonPlaceholder} />
  </View>
);

const InfoPill = ({ label }: { label: string }) => (
  <View style={styles.infoPill}>
    <Text style={styles.infoPillText}>{label}</Text>
  </View>
);

const OradoButton = ({ oracao, loading, marked, onPress, compact = false }: { oracao: Oracao; loading: boolean; marked: boolean; onPress: () => void; compact?: boolean }) => {
  const disabled = loading || !oracao.oracao_id || oracao.oracao_id.startsWith('offline-');
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: marked }}
      style={[styles.prayedButton, compact && styles.prayedButtonCompact, marked && styles.prayedButtonMarked]}
      disabled={disabled}
      onPress={onPress}
    >
      {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Icon as={marked ? Check : Heart} size={17} color={colors.primary} />}
      <Text style={styles.prayedButtonText}>{marked ? 'Você orou · desfazer' : 'Marcar como orado'}</Text>
    </TouchableOpacity>
  );
};

const ToggleRow = ({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => (
  <View style={styles.toggleRow}>
    <Text style={styles.toggleLabel}>{label}</Text>
    <Switch
      accessibilityLabel={label}
      {...(Platform.OS === 'web' ? { activeThumbColor: colors.primary } : {})}
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.primarySoft }}
      thumbColor={value ? colors.primary : colors.textSecondary}
    />
  </View>
);

const styles = createDynamicStyles(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    padding: spacing.page,
    paddingBottom: 88,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kicker: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '600',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterBlock: { marginBottom: spacing.md },
  filterRow: { flexDirection: 'row', gap: spacing.sm },
  searchBox: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  searchInput: { flex: 1, minHeight: 42, color: colors.textPrimary, fontSize: typography.body, paddingVertical: 0 },
  calendarButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface },
  calendarButtonActive: { backgroundColor: colors.primary },
  calendarCard: { marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  calendarTitle: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '600', textTransform: 'capitalize' },
  calendarNavigation: { flexDirection: 'row', gap: 6 },
  calendarNavButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekLabel: { width: '14.2857%', textAlign: 'center', color: colors.textSecondary, fontSize: typography.caption, marginBottom: 4 },
  dayCell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  dayCellSelected: { backgroundColor: colors.primary },
  dayText: { color: colors.textPrimary, fontSize: typography.caption },
  dayTextSelected: { color: colors.white, fontWeight: '600' },
  clearDateButton: { alignSelf: 'flex-start', marginTop: 6, paddingVertical: 6 },
  clearDateText: { color: colors.accent, fontSize: typography.caption, fontWeight: '600' },
  tab: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: '600', textAlign: 'center' },
  tabTextActive: { color: colors.white },
  prayerCard: {
    padding: spacing.md,
    marginBottom: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  prayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  prayerName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.subtitle,
    fontWeight: '600',
    paddingRight: 12,
  },
  prayerStatus: {
    color: colors.success,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  prayerText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 21,
  },
  openText: {
    color: colors.accent,
    fontSize: typography.caption,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  floatingButton: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.page,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  floatingButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '600',
  },
  topBar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  backButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  topBarTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.heading,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  detailStatus: {
    alignSelf: 'flex-start',
    color: colors.success,
    fontSize: typography.caption,
    fontWeight: '600',

    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    marginBottom: 16,
  },
  detailName: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: typography.subtitle,
    lineHeight: 25,
    marginTop: 14,
    textAlign: 'center',
  },
  detailMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.section,
  },
  infoPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    marginRight: 8,
    marginBottom: 8,
  },
  infoPillText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: '600',
  },
  form: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    minHeight: 44,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: typography.body,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 150,
  },
  toggleRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
    paddingRight: 12,
  },
  primaryButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.section,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '600',
  },
  prayedButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  prayedButtonCompact: { alignSelf: 'flex-start', marginTop: 12 },
  prayedButtonMarked: { opacity: 0.65 },
  prayedButtonText: { color: colors.primary, fontWeight: '600' },
  floatingButtonIcon: { marginRight: 8 },
}));
