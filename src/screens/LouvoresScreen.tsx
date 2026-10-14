import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { AppText as Text } from '../components/AppText';
import { getLouvores } from '../services/api';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/tokens';
import { Louvor } from '../types';

const youtubeId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return match?.[1] ?? null;
};

export const LouvoresScreen = () => {
  const [items, setItems] = useState<Louvor[]>([]); const [selected, setSelected] = useState<Louvor | null>(null); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { try { setItems(await getLouvores()); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const embedUrl = useMemo(() => selected ? youtubeId(selected.url_louvor) : null, [selected]);
  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  return <View style={styles.container}>{selected && embedUrl ? <View style={styles.player}>{Platform.OS === 'web' ? <iframe src={`https://www.youtube.com/embed/${embedUrl}?autoplay=1&playsinline=1`} title={selected.nome_louvor} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={webFrameStyle} /> : <WebView source={{ uri: `https://www.youtube.com/embed/${embedUrl}?autoplay=1&playsinline=1` }} allowsFullscreenVideo mediaPlaybackRequiresUserAction={false} />}</View> : null}<FlatList data={items} keyExtractor={item => item.louvor_id} contentContainerStyle={styles.list} renderItem={({ item }) => { const id = youtubeId(item.url_louvor); return <TouchableOpacity style={[styles.card, selected?.louvor_id === item.louvor_id && styles.active]} onPress={() => setSelected(item)}>{id ? <View style={styles.preview}><Image source={{ uri: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` }} style={styles.thumbnail} /><View style={styles.playOverlay}><Text style={styles.playSymbol}>▶</Text></View></View> : null}<Text style={styles.title}>{item.nome_louvor}</Text>{item.observacao_louvor ? <Text style={styles.description}>{item.observacao_louvor}</Text> : null}<Text style={styles.play}>{id ? 'Tocar no app' : 'Link de video invalido'}</Text></TouchableOpacity>; }} ListEmptyComponent={<Text style={styles.empty}>Nenhum louvor cadastrado.</Text>} /></View>;
};
const webFrameStyle = { width: '100%', height: '100%', border: 0 } as React.CSSProperties;
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }, player: { width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.black }, list: { padding: spacing.page }, card: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, marginBottom: 10 }, active: { borderColor: colors.primary }, preview: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.surfaceMuted, marginBottom: 12 }, thumbnail: { width: '100%', height: '100%' }, playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.24)' }, playSymbol: { color: '#FFFFFF', fontSize: 42 }, title: { color: colors.textPrimary, fontSize: typography.subtitle, fontWeight: '600' }, description: { color: colors.textSecondary, marginTop: 5 }, play: { color: colors.primary, fontWeight: '600', marginTop: 10 }, empty: { color: colors.textSecondary } });
