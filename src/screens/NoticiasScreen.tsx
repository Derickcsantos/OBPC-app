import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text } from '../components/AppText';
import { Icon } from '../components/Icon';
import { getNoticias } from '../services/api';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/tokens';
import { Noticia } from '../types';

const formatDate = (value?: string) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('pt-BR').format(date) : '';
};

export const NoticiasScreen = () => {
  const [items, setItems] = useState<Noticia[]>([]);
  const [selected, setSelected] = useState<Noticia | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => { try { setError(''); setItems(await getNoticias()); } catch { setError('Não foi possível carregar as notícias.'); } finally { setLoading(false); setRefreshing(false); } }, []);
  useEffect(() => { load(); }, [load]);

  if (selected) return <ScrollView style={styles.container} contentContainerStyle={styles.content}><Pressable style={styles.back} onPress={() => setSelected(null)}><Icon as={ArrowLeft} size={18} /><Text style={styles.backText}>Voltar</Text></Pressable>{selected.url_capa || selected.imagem_url ? <Image source={{ uri: selected.url_capa ?? selected.imagem_url ?? '' }} style={styles.detailImage} resizeMode="cover" /> : null}<Text style={styles.detailDate}>{formatDate(selected.data_noticia)}</Text><Text style={styles.detailTitle}>{selected.nome_noticia}</Text><Text style={styles.detailBody}>{selected.mensagem_noticia}</Text>{selected.observacao_noticia ? <View style={styles.note}><Text style={styles.noteText}>{selected.observacao_noticia}</Text></View> : null}</ScrollView>;

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}><Text style={styles.heading}>Notícias</Text><Text style={styles.subtitle}>Acompanhe as novidades da nossa comunidade.</Text>{loading ? <ActivityIndicator color={colors.primary} style={styles.state} /> : null}{error ? <Text style={styles.error}>{error}</Text> : null}{!loading && !error && !items.length ? <Text style={styles.subtitle}>Nenhuma notícia publicada.</Text> : null}{items.map(item => <Pressable key={item.noticia_id} style={styles.card} onPress={() => setSelected(item)}>{item.url_capa || item.imagem_url ? <Image source={{ uri: item.url_capa ?? item.imagem_url ?? '' }} style={styles.cardImage} resizeMode="cover" /> : null}<View style={styles.cardBody}><Text style={styles.date}>{formatDate(item.data_noticia)}</Text><Text style={styles.title}>{item.nome_noticia}</Text><Text style={styles.excerpt} numberOfLines={3}>{item.mensagem_noticia}</Text><View style={styles.readMore}><Text style={styles.readMoreText}>Ler notícia</Text><Icon as={ChevronRight} size={17} color={colors.primary} /></View></View></Pressable>)}</ScrollView>;
};

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.page, paddingBottom: 42 }, heading: { color: colors.textPrimary, fontSize: typography.title, fontWeight: '600' }, subtitle: { color: colors.textSecondary, lineHeight: 21, marginTop: 5 }, state: { marginTop: 30 }, error: { color: colors.danger, marginTop: 18 }, card: { overflow: 'hidden', marginTop: 16, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface }, cardImage: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surfaceMuted }, cardBody: { padding: spacing.md }, date: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: '600' }, title: { color: colors.textPrimary, fontSize: typography.subtitle, fontWeight: '600', marginTop: 6 }, excerpt: { color: colors.textSecondary, lineHeight: 21, marginTop: 8 }, readMore: { flexDirection: 'row', alignItems: 'center', marginTop: 12 }, readMoreText: { color: colors.primary, fontWeight: '600' }, back: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44, alignSelf: 'flex-start' }, backText: { color: colors.primary, fontWeight: '600' }, detailImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, marginTop: 6 }, detailDate: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: '600', marginTop: 18 }, detailTitle: { color: colors.textPrimary, fontSize: typography.title, fontWeight: '600', marginTop: 7 }, detailBody: { color: colors.textSecondary, fontSize: typography.subtitle, lineHeight: 26, marginTop: 16 }, note: { padding: spacing.md, marginTop: 18, borderRadius: radius.md, backgroundColor: colors.surfaceMuted }, noteText: { color: colors.textSecondary, lineHeight: 21 } });
