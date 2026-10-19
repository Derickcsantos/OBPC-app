import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { Icon } from '../components/Icon';
import { getAuditLog, getAuditLogs } from '../services/api';
import { AuditLog } from '../types';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/tokens';

const categories = [
  { value: 'Todas', label: 'Todas' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'ministerios', label: 'Ministérios' },
  { value: 'usuarios', label: 'Conteúdo pessoal' },
  { value: 'conta', label: 'Conta' },
  { value: 'planos-estudo', label: 'Planos de leitura' },
];

export const AdminLogsScreen = () => {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [category, setCategory] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (nextPage = 1, filter = category) => {
    setLoading(true); setError('');
    try {
      const result = await getAuditLogs(nextPage, 20, filter === 'Todas' ? undefined : filter);
      setItems(result.items); setPage(result.pagination.page); setPages(result.pagination.totalPages);
    } catch {
      setError('Não foi possível carregar os logs.');
    } finally { setLoading(false); }
  }, [category]);
  useEffect(() => { load(1, category); }, [load, category]);

  const openDetail = async (item: AuditLog) => {
    setSelected(item);
    try { setSelected(await getAuditLog(item.log_id)); } catch { setError('Não foi possível carregar os detalhes deste log.'); }
  };

  return <View style={styles.container}>
    <View style={styles.header}><Icon as={ClipboardList} color={colors.primary} /><Text style={styles.title}>{selected ? 'Detalhe do log' : 'Logs'}</Text></View>
    {selected ? <ScrollView contentContainerStyle={styles.content}>
      <Pressable style={styles.back} onPress={() => setSelected(null)}><Icon as={ChevronLeft} size={18} /><Text style={styles.backText}>Voltar para os logs</Text></Pressable>
      <View style={styles.card}><Text style={styles.label}>Data</Text><Text style={styles.value}>{new Date(selected.created_at).toLocaleString('pt-BR')}</Text><Text style={styles.label}>Categoria</Text><Text style={styles.value}>{selected.category}</Text><Text style={styles.label}>Ação</Text><Text style={styles.value}>{selected.action}</Text><Text style={styles.label}>Resultado</Text><Text style={styles.value}>{selected.status_code}</Text><Text style={styles.label}>Usuário</Text><Text style={styles.value}>{selected.actor_id || 'Conta removida ou ação anônima'}</Text></View>
    </ScrollView> : <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{categories.map(item => <Pressable key={item.value} onPress={() => setCategory(item.value)} style={[styles.filter, category === item.value && styles.filterActive]}><Text style={[styles.filterText, category === item.value && styles.filterTextActive]}>{item.label}</Text></Pressable>)}</ScrollView>
      {loading ? <ActivityIndicator color={colors.primary} style={styles.loading} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScrollView contentContainerStyle={styles.content}>{!loading && !items.length && !error ? <Text style={styles.empty}>Nenhum log encontrado.</Text> : null}{items.map(item => <Pressable key={item.log_id} style={styles.row} onPress={() => openDetail(item)}><View style={styles.rowMain}><Text style={styles.rowTitle}>{item.action}</Text><Text style={styles.meta}>{item.category} · {new Date(item.created_at).toLocaleString('pt-BR')}</Text></View><Icon as={ChevronRight} size={18} /></Pressable>)}<View style={styles.pager}><Pressable disabled={page <= 1 || loading} onPress={() => load(page - 1)}><Icon as={ChevronLeft} /></Pressable><Text style={styles.meta}>{page} de {pages}</Text><Pressable disabled={page >= pages || loading} onPress={() => load(page + 1)}><Icon as={ChevronRight} /></Pressable></View></ScrollView>
    </>}
  </View>;
};

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: spacing.page }, title: { color: colors.textPrimary, fontSize: typography.heading, fontWeight: '600' }, filters: { gap: 8, paddingHorizontal: spacing.page, paddingVertical: 8 }, filter: { minHeight: 38, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 18, backgroundColor: colors.surfaceMuted }, filterActive: { backgroundColor: colors.primary }, filterText: { color: colors.textSecondary, fontSize: typography.caption }, filterTextActive: { color: colors.white }, content: { padding: spacing.page, paddingBottom: 30 }, row: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md, marginBottom: 8, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }, rowMain: { flex: 1 }, rowTitle: { color: colors.textPrimary, fontWeight: '600' }, meta: { marginTop: 5, color: colors.textSecondary, fontSize: typography.caption }, pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 18 }, card: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }, label: { marginTop: 12, color: colors.textSecondary, fontSize: typography.caption, fontWeight: '600' }, value: { marginTop: 4, color: colors.textPrimary, lineHeight: 22 }, back: { flexDirection: 'row', alignItems: 'center', minHeight: 44, marginBottom: 10, gap: 6 }, backText: { color: colors.primary, fontWeight: '600' }, loading: { margin: 20 }, error: { padding: spacing.page, color: colors.danger }, empty: { paddingVertical: 30, textAlign: 'center', color: colors.textSecondary } });
