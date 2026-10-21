import { ChevronLeft, Edit3, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import { Icon } from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { createAnnotation, deleteAnnotation, getAnnotations, getVerses, updateAnnotation } from '../services/api';
import { colors, createDynamicStyles } from '../theme/colors';
import { radius, spacing, typography } from '../theme/tokens';
import { Annotation, AnnotationPayload, BibleReference } from '../types';

const referenceLabel = (reference: BibleReference, bookName?: string) => `${bookName || `Livro ${reference.book}`} ${reference.chapter}:${reference.verse}`;
const formatAnnotationDate = (value?: string) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('pt-BR').format(date) : '';
};

export const AnnotationsScreen = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Annotation[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Annotation | null>(null);
  const [selected, setSelected] = useState<Annotation | null>(null);
  const [referenceTexts, setReferenceTexts] = useState<Record<string, { text: string; bookName?: string }>>({});
  const [editorOpen, setEditorOpen] = useState(false);

  const load = useCallback(async (nextPage = 1) => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const result = await getAnnotations(nextPage, 20);
      setItems(result.items);
      setPage(result.pagination.page);
      setTotalPages(result.pagination.totalPages);
    } catch (loadError) {
      console.error('Erro ao carregar anotações:', loadError);
      setError('Não foi possível carregar suas anotações.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!selected) { setReferenceTexts({}); return; }
    let active = true;
    Promise.all(selected.versiculos.map(async reference => {
      const verse = (await getVerses(reference.book, reference.chapter, reference.verse, reference.version))[0];
      return [`${reference.version}-${reference.book}-${reference.chapter}-${reference.verse}`, { text: verse?.text ?? 'Texto indisponível.', bookName: verse?.book_name }] as const;
    })).then(entries => { if (active) setReferenceTexts(Object.fromEntries(entries)); }).catch(() => { if (active) setReferenceTexts({}); });
    return () => { active = false; };
  }, [selected]);

  if (!user) {
    return <CenteredMessage title="Entre na sua conta" text="O acesso às anotações é privado e exige autenticação." />;
  }

  const remove = (annotation: Annotation) => {
    Alert.alert('Excluir anotação', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        try {
          await deleteAnnotation(annotation.id);
          await load(page);
        } catch {
          Alert.alert('Não foi possível excluir', 'Tente novamente.');
        }
      } },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headingRow}>
          <View style={styles.headingText}>
            <Text style={styles.title}>Minhas anotações</Text>
            <Text style={styles.subtitle}>Reflexões privadas ligadas aos seus versículos.</Text>
          </View>
        </View>
        {loading ? <ActivityIndicator color={colors.primary} style={styles.stateGap} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && !error && !items.length ? <Text style={styles.empty}>Nenhuma anotação criada. Pressione um versículo na Bíblia para começar.</Text> : null}
        {items.map(item => (
          <View key={item.id} style={styles.card} onTouchEnd={() => setSelected(item)}>
            <Text style={styles.cardTitle}>{item.titulo || 'Anotação sem título'}</Text>
            <Text style={styles.references}>{item.versiculos.map(reference => referenceLabel(reference)).join(' · ')}</Text>
            <Text style={styles.body} numberOfLines={4}>{item.conteudo}</Text>
            <View style={styles.actions}>
              <Text style={styles.date}>{formatAnnotationDate(item.created_at)}</Text>
              <Pressable accessibilityLabel="Editar anotação" style={styles.smallIcon} onPress={() => { setEditing(item); setEditorOpen(true); }}><Icon as={Edit3} size={18} /></Pressable>
              <Pressable accessibilityLabel="Excluir anotação" style={styles.smallIcon} onPress={() => remove(item)}><Icon as={Trash2} size={18} /></Pressable>
            </View>
          </View>
        ))}
        {totalPages > 1 ? (
          <View style={styles.pagination}>
            <Pressable disabled={page <= 1 || loading} style={styles.pageButton} onPress={() => load(page - 1)}><Icon as={ChevronLeft} /></Pressable>
            <Text style={styles.pageText}>{page} de {totalPages}</Text>
            <Pressable disabled={page >= totalPages || loading} style={styles.pageButton} onPress={() => load(page + 1)}><Icon as={ChevronLeft} style={styles.nextIcon} /></Pressable>
          </View>
        ) : null}
      </ScrollView>
      <AnnotationEditor visible={editorOpen} annotation={editing} onClose={() => setEditorOpen(false)} onSaved={() => { setEditorOpen(false); load(page); }} />
      <Modal visible={Boolean(selected)} animationType="slide" onRequestClose={() => setSelected(null)}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Pressable style={styles.backButton} onPress={() => setSelected(null)}><Icon as={ChevronLeft} size={18} /><Text style={styles.backText}>Voltar</Text></Pressable>
          <Text style={styles.detailTitle}>{selected?.titulo || 'Anotação sem título'}</Text>
          <Text style={styles.detailBody}>{selected?.conteudo}</Text>
          <View style={styles.linkedVerses}><Text style={styles.linkedTitle}>Textos vinculados</Text>{selected?.versiculos.map(reference => { const key = `${reference.version}-${reference.book}-${reference.chapter}-${reference.verse}`; const detail = referenceTexts[key]; return <View key={key} style={styles.linkedVerseBlock}><Text style={styles.linkedVerse}>{referenceLabel(reference, detail?.bookName)}</Text><Text style={styles.linkedVerseText}>{detail?.text ?? 'Carregando texto...'}</Text></View>; })}</View>
          {formatAnnotationDate(selected?.created_at) ? <Text style={styles.detailDate}>Criada em {formatAnnotationDate(selected?.created_at)}</Text> : null}
          <View style={styles.detailActions}><Pressable style={styles.detailButton} onPress={() => { if (selected) { setEditing(selected); setEditorOpen(true); setSelected(null); } }}><Text style={styles.detailButtonText}>Editar</Text></Pressable><Pressable style={styles.detailButton} onPress={() => selected && remove(selected)}><Text style={styles.detailButtonText}>Excluir</Text></Pressable></View>
        </ScrollView>
      </Modal>
    </View>
  );
};

export const AnnotationEditor = ({ visible, annotation, references = [], onClose, onSaved }: { visible: boolean; annotation?: Annotation | null; references?: BibleReference[]; onClose: () => void; onSaved: (annotation: Annotation) => void }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(annotation?.titulo ?? '');
    setContent(annotation?.conteudo ?? '');
  }, [annotation, visible]);

  const save = async () => {
    if (!content.trim()) { Alert.alert('Conteúdo obrigatório', 'Escreva sua anotação antes de salvar.'); return; }
    const payload: AnnotationPayload = { titulo: title.trim() || null, conteudo: content.trim(), versiculos: annotation?.versiculos ?? references };
    if (!payload.versiculos.length) { Alert.alert('Selecione versículos', 'A anotação precisa estar ligada a pelo menos um versículo.'); return; }
    setSaving(true);
    try {
      const saved = annotation ? await updateAnnotation(annotation.id, payload) : await createAnnotation(payload);
      onSaved(saved);
    } catch {
      Alert.alert('Não foi possível salvar', 'Verifique sua conexão e tente novamente.');
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalLayer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}><Pressable style={styles.backdrop} onPress={onClose} />
        <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.sheetTitle}>{annotation ? 'Editar anotação' : 'Nova anotação'}</Text>
          <TextInput value={title} onChangeText={setTitle} maxLength={200} placeholder="Título opcional" placeholderTextColor={colors.textSecondary} style={styles.input} />
          <TextInput value={content} onChangeText={setContent} maxLength={20000} multiline textAlignVertical="top" placeholder="Escreva sua reflexão" placeholderTextColor={colors.textSecondary} style={[styles.input, styles.textArea]} />
          <View style={styles.sheetActions}><Pressable style={styles.cancelButton} onPress={onClose}><Text style={styles.cancelText}>Cancelar</Text></Pressable><Pressable disabled={saving} style={styles.saveButton} onPress={save}>{saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Salvar</Text>}</Pressable></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const CenteredMessage = ({ title, text }: { title: string; text: string }) => <View style={styles.center}><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{text}</Text></View>;

const styles = createDynamicStyles(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.page, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.page, backgroundColor: colors.background },
  headingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.section }, headingText: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: typography.title, fontWeight: '600' }, subtitle: { color: colors.textSecondary, marginTop: 5, lineHeight: 21 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  stateGap: { marginVertical: 24 }, error: { color: colors.danger, padding: spacing.md }, empty: { color: colors.textSecondary, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md },
  card: { padding: spacing.md, marginBottom: 10, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface },
  cardTitle: { color: colors.textPrimary, fontSize: typography.subtitle, fontWeight: '600' }, references: { color: colors.textSecondary, fontSize: typography.caption, marginTop: 5 }, body: { color: colors.textSecondary, lineHeight: 21, marginTop: 10 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 8 }, date: { flex: 1, color: colors.textSecondary, fontSize: typography.caption }, smallIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', minHeight: 44, gap: 6, marginBottom: spacing.section }, backText: { color: colors.textPrimary, fontWeight: '600' }, detailTitle: { color: colors.textPrimary, fontSize: typography.title, fontWeight: '600' }, detailBody: { color: colors.textPrimary, lineHeight: 24, marginTop: spacing.section }, linkedVerses: { marginTop: spacing.section, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted }, linkedTitle: { color: colors.textPrimary, fontWeight: '600', marginBottom: 8 }, linkedVerseBlock: { marginTop: 10 }, linkedVerse: { color: colors.textPrimary, fontWeight: '600' }, linkedVerseText: { color: colors.textSecondary, lineHeight: 22, marginTop: 3 }, detailDate: { color: colors.textSecondary, marginTop: spacing.section, fontSize: typography.caption }, detailActions: { flexDirection: 'row', gap: 10, marginTop: spacing.section }, detailButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceMuted }, detailButtonText: { color: colors.textPrimary, fontWeight: '600' },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 10 }, pageButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.md }, pageText: { color: colors.textSecondary }, nextIcon: { transform: [{ rotate: '180deg' }] },
  modalLayer: { flex: 1, justifyContent: 'flex-end' }, backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.48)' }, sheet: { maxHeight: '92%', padding: spacing.page, paddingBottom: 30, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.surface }, sheetContent: { paddingBottom: 24 }, sheetTitle: { color: colors.textPrimary, fontSize: typography.heading, fontWeight: '600', marginBottom: 14 },
  input: { minHeight: 46, color: colors.textPrimary, backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, marginBottom: 12 }, textArea: { minHeight: 150 }, sheetActions: { flexDirection: 'row', gap: 10 }, cancelButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center' }, cancelText: { color: colors.textSecondary, fontWeight: '600' }, saveButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primary }, saveText: { color: colors.white, fontWeight: '600' },
}));
