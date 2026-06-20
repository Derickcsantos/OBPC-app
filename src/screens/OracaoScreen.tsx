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
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import { getOracoes, postOracao } from '../services/api';
import { colors } from '../theme/colors';
import { Oracao } from '../types';

type OracaoView = 'list' | 'detail' | 'create';

export const OracaoScreen = () => {
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
      Alert.alert('Campos obrigatorios', 'Preencha seu nome e o pedido de oracao.');
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

      Alert.alert('Pedido enviado', 'Recebemos seu pedido e estaremos em oracao.');
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

  if (view === 'detail' && selectedOracao) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TopBar title="Pedido de oracao" onBack={goToList} />
        <View style={styles.detailCard}>
          <Text style={styles.detailStatus}>{selectedOracao.status || 'em andamento'}</Text>
          <Text style={styles.detailName}>{selectedOracao.nome_pedido || 'Pedido de oracao'}</Text>
          <Text style={styles.detailText}>{selectedOracao.descricao_pedido || 'Sem descricao.'}</Text>

          <View style={styles.detailMeta}>
            <InfoPill label={selectedOracao.mostrar_grupo ? 'Visivel ao grupo' : 'Pedido reservado'} />
            <InfoPill label={selectedOracao.aceita_ligacao ? 'Aceita ligacao' : 'Sem ligacao'} />
          </View>
        </View>
      </ScrollView>
    );
  }

  if (view === 'create') {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

            <ToggleRow label="Mostrar no grupo de oracao" value={mostrarGrupo} onValueChange={setMostrarGrupo} />
            <ToggleRow label="Aceito receber uma ligacao" value={aceitaLigacao} onValueChange={setAceitaLigacao} />

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>Enviar pedido</Text>}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.kicker}>Intercessao</Text>
            <Text style={styles.title}>Pedidos de oracao</Text>
          </View>
          {loadingList ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>

        {oracoes.length ? (
          oracoes.map((oracao, index) => (
            <TouchableOpacity
              key={oracao.oracao_id || `oracao-${index}`}
              style={styles.prayerCard}
              activeOpacity={0.82}
              onPress={() => openDetail(oracao)}
            >
              <View style={styles.prayerHeader}>
                <Text style={styles.prayerName} numberOfLines={1}>
                  {oracao.nome_pedido || 'Pedido de oracao'}
                </Text>
                <Text style={styles.prayerStatus}>{oracao.status || 'em andamento'}</Text>
              </View>
              <Text style={styles.prayerText} numberOfLines={3}>
                {oracao.descricao_pedido || 'Toque para ver detalhes.'}
              </Text>
              <Text style={styles.openText}>Abrir pedido</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhum pedido de oracao no momento.</Text>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.floatingButton} activeOpacity={0.86} onPress={openCreate}>
        <Text style={styles.floatingButtonIcon}>+</Text>
        <Text style={styles.floatingButtonText}>Novo pedido</Text>
      </TouchableOpacity>
    </View>
  );
};

const TopBar = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <View style={styles.topBar}>
    <TouchableOpacity style={styles.backButton} onPress={onBack}>
      <Text style={styles.backButtonText}>‹</Text>
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
    padding: 18,
    paddingBottom: 108,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  prayerCard: {
    padding: 18,
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 2,
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
    fontSize: 17,
    fontWeight: '900',
    paddingRight: 12,
  },
  prayerStatus: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  prayerText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  openText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 12,
    textTransform: 'uppercase',
  },
  emptyText: {
    color: colors.textSecondary,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  floatingButton: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: colors.accent,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  floatingButtonIcon: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
    marginRight: 8,
    marginTop: -2,
  },
  floatingButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  topBar: {
    minHeight: 54,
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
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '700',
    marginTop: -4,
  },
  backButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  topBarTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  detailCard: {
    padding: 22,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailStatus: {
    alignSelf: 'flex-start',
    color: colors.success,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    marginBottom: 16,
  },
  detailName: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 25,
    marginTop: 14,
  },
  detailMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  infoPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
    marginRight: 8,
    marginBottom: 8,
  },
  infoPillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  form: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 150,
  },
  toggleRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    paddingRight: 12,
  },
  primaryButton: {
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: colors.accent,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
