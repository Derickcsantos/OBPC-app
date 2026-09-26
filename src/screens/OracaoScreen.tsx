import { Plus, ChevronLeft, Check } from 'lucide-react-native';
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
import { getOracoes, marcarOracaoComoOrada, postOracao } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { spacing, typography, radius } from '../theme/tokens';
import { Oracao } from '../types';
import axios from 'axios';

type OracaoView = 'list' | 'detail' | 'create';

export const OracaoScreen = () => {
  const { user } = useAuth();
  const [view, setView] = useState<OracaoView>('list');
  const [selectedOracao, setSelectedOracao] = useState<Oracao | null>(null);
  const [nome, setNome] = useState('');
  const [pedido, setPedido] = useState('');
  const [mostrarGrupo, setMostrarGrupo] = useState(true);
  const [aceitaLigacao, setAceitaLigacao] = useState(false);
  const [oracoes, setOracoes] = useState<Oracao[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orandoIds, setOrandoIds] = useState<Set<string>>(new Set());
  const [oradosIds, setOradosIds] = useState<Set<string>>(new Set());

  const loadOracoes = useCallback(async () => {
    try {
      setOracoes(await getOracoes());
    } catch (requestError) {
      console.error('Erro ao carregar pedidos de oracao:', requestError);
      Alert.alert('Erro', 'Nao foi possivel carregar os pedidos de oracao.');
    } finally {
      setLoadingList(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOracoes();
  }, [loadOracoes]);

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
        'Campos obrigatorios',
        'Preencha seu nome e o pedido de oracao.',
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
        'Recebemos seu pedido e estaremos em oracao.',
      );
      resetForm();
      setView('list');
      loadOracoes();
    } catch (requestError) {
      console.error('Erro ao enviar pedido de oracao:', requestError);
      Alert.alert('Nao enviado', 'Nao foi possivel enviar seu pedido agora.');
    } finally {
      setSubmitting(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOracoes();
  };

  const handleOrado = async (oracao: Oracao) => {
    const id = oracao.oracao_id;
    if (!user) {
      Alert.alert('Entre na sua conta', 'Faca login no perfil para marcar que orou.');
      return;
    }
    if (!id || id.startsWith('offline-') || orandoIds.has(id) || oradosIds.has(id) || oracao.orado_por_mim || oracao.orado) return;

    setOrandoIds(current => new Set(current).add(id));
    try {
      await marcarOracaoComoOrada(id);
      setOradosIds(current => new Set(current).add(id));
      setOracoes(current => current.map(item => item.oracao_id === id ? { ...item, orado_por_mim: true } : item));
      setSelectedOracao(current => current?.oracao_id === id ? { ...current, orado_por_mim: true } : current);
    } catch (error) {
      console.error('Erro ao marcar pedido como orado:', error);
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const message = status === 401
        ? 'Sua sessao expirou. Saia do perfil, entre novamente e tente de novo.'
        : axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : 'Verifique sua conexao e tente novamente.';
      Alert.alert('Nao foi possivel marcar', message);
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
        <TopBar title="Pedido de oracao" onBack={goToList} />
        <View style={styles.detailCard}>
          <Text style={styles.detailStatus}>
            {selectedOracao.status || 'em andamento'}
          </Text>
          <Text style={styles.detailName}>
            {selectedOracao.nome_pedido || 'Pedido de oracao'}
          </Text>
          <Text style={styles.detailText}>
            {selectedOracao.descricao_pedido || 'Sem descricao.'}
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
          <OradoButton oracao={selectedOracao} loading={Boolean(selectedOracao.oracao_id && orandoIds.has(selectedOracao.oracao_id))} marked={Boolean(selectedOracao.orado || selectedOracao.orado_por_mim || (selectedOracao.oracao_id && oradosIds.has(selectedOracao.oracao_id)))} onPress={() => handleOrado(selectedOracao)} />
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
              label="Mostrar no grupo de oracao"
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
            <Text style={styles.title}>Pedidos de oracao</Text>
          </View>
          {loadingList ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : null}
        </View>

        {oracoes.length ? (
          oracoes.map((oracao, index) => (
            <View
              key={oracao.oracao_id || `oracao-${index}`}
              style={styles.prayerCard}
            >
              <TouchableOpacity activeOpacity={0.82} onPress={() => openDetail(oracao)}>
                <View style={styles.prayerHeader}>
                  <Text style={styles.prayerName} numberOfLines={1}>
                    {oracao.nome_pedido || 'Pedido de oracao'}
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
              <OradoButton oracao={oracao} loading={Boolean(oracao.oracao_id && orandoIds.has(oracao.oracao_id))} marked={Boolean(oracao.orado || oracao.orado_por_mim || (oracao.oracao_id && oradosIds.has(oracao.oracao_id)))} onPress={() => handleOrado(oracao)} compact />
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            Nenhum pedido de oracao no momento.
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
  const disabled = loading || marked || !oracao.oracao_id || oracao.oracao_id.startsWith('offline-');
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: marked }}
      style={[styles.prayedButton, compact && styles.prayedButtonCompact, marked && styles.prayedButtonMarked]}
      disabled={disabled}
      onPress={onPress}
    >
      {loading ? <ActivityIndicator size="small" color={colors.primary} /> : <Icon as={Check} size={17} color={colors.primary} />}
      <Text style={styles.prayedButtonText}>{marked ? 'Voce orou' : 'Marcar como orado'}</Text>
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

const styles = StyleSheet.create({
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
});
