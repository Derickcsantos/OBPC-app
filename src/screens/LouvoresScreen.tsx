import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppTextInput as TextInput } from '../components/AppText';
import { WebView } from 'react-native-webview';
import { AppText as Text } from '../components/AppText';
import { getLouvores } from '../services/api';
import { colors, createDynamicStyles } from '../theme/colors';
import { radius, spacing, typography } from '../theme/tokens';
import { Louvor } from '../types';

const youtubeId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return match?.[1] ?? null;
};

export const LouvoresScreen = () => {
  const [items, setItems] = useState<Louvor[]>([]); const [selectedId, setSelectedId] = useState<string | null>(null); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { try { setItems(await getLouvores()); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const filteredItems = useMemo(() => { const term = query.trim().toLocaleLowerCase('pt-BR'); return term ? items.filter(item => `${item.nome_louvor} ${item.observacao_louvor ?? ''}`.toLocaleLowerCase('pt-BR').includes(term)) : items; }, [items, query]);
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  return <View style={styles.container}><FlatList data={filteredItems} keyExtractor={item => item.louvor_id} contentContainerStyle={styles.list} ListHeaderComponent={<TextInput value={query} onChangeText={setQuery} placeholder="Buscar louvor" placeholderTextColor={colors.textSecondary} style={styles.searchInput} />} renderItem={({ item }) => { const id = youtubeId(item.url_louvor); const playing = selectedId === item.louvor_id && Boolean(id); const embedUrl = id ? `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&controls=1&rel=0&enablejsapi=1` : ''; return <View style={[styles.card, playing && styles.active]}>{id ? playing ? <View style={styles.preview}>{Platform.OS === 'web' ? <iframe src={embedUrl} title={item.nome_louvor} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen style={webFrameStyle} /> : <WebView source={{ uri: embedUrl, headers: { Referer: 'https://com.obpcapp' } }} allowsFullscreenVideo allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} />}</View> : <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Tocar ${item.nome_louvor}`} style={styles.preview} onPress={() => setSelectedId(item.louvor_id)}><Image source={{ uri: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` }} style={styles.thumbnail} /><View style={styles.playOverlay}><Text style={styles.playSymbol}>▶</Text></View></TouchableOpacity> : null}<TouchableOpacity disabled={!id} onPress={() => id && setSelectedId(item.louvor_id)}><Text style={styles.title}>{item.nome_louvor}</Text>{item.observacao_louvor ? <Text style={styles.description}>{item.observacao_louvor}</Text> : null}<Text style={styles.play}>{id ? playing ? 'Reproduzindo neste card' : 'Tocar no app' : 'Link de video invalido'}</Text></TouchableOpacity></View>; }} ListEmptyComponent={<Text style={styles.empty}>{query ? 'Nenhum louvor encontrado.' : 'Nenhum louvor cadastrado.'}</Text>} /></View>;
};
const webFrameStyle = { width: '100%', height: '100%', border: 0 } as React.CSSProperties;
const styles = createDynamicStyles(() => StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }, list: { padding: spacing.page }, searchInput: { minHeight: 46, paddingHorizontal: 12, marginBottom: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.inputBackground }, card: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, marginBottom: 10 }, active: { borderColor: colors.primary }, preview: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surfaceMuted, marginBottom: 12 }, thumbnail: { width: '100%', height: '100%' }, playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.24)' }, playSymbol: { color: '#FFFFFF', fontSize: 42 }, title: { color: colors.textPrimary, fontSize: typography.subtitle, fontWeight: '600' }, description: { color: colors.textSecondary, marginTop: 5 }, play: { color: colors.primary, fontWeight: '600', marginTop: 10 }, empty: { color: colors.textSecondary } }));
