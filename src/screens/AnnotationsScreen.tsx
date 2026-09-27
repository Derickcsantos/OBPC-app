import { ChevronLeft, Edit3, Trash2 } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import { Icon } from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { createAnnotation, deleteAnnotation, getAnnotations, updateAnnotation } from '../services/api';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/tokens';
import { Annotation, AnnotationPayload, BibleReference } from '../types';

const referenceLabel = (reference: BibleReference) => `${reference.book}:${reference.chapter}:${reference.verse}`;

export const AnnotationsScreen = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Annotation[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Annotation | null>(null);
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
      console.error('Erro ao carregar anotacoes:', loadError);
      setError('Não foi possível carregar suas anotações.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

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
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.titulo || 'Anotação sem título'}</Text>
            <Text style={styles.references}>{item.versiculos.map(referenceLabel).join(' · ')}</Text>
            <Text style={styles.body} numberOfLines={4}>{item.conteudo}</Text>
            <View style={styles.actions}>
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
      <View style={styles.modalLayer}><Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{annotation ? 'Editar anotação' : 'Nova anotação'}</Text>
          <TextInput value={title} onChangeText={setTitle} maxLength={200} placeholder="Título opcional" placeholderTextColor={colors.textSecondary} style={styles.input} />
          <TextInput value={content} onChangeText={setContent} maxLength={20000} multiline textAlignVertical="top" placeholder="Escreva sua reflexão" placeholderTextColor={colors.textSecondary} style={[styles.input, styles.textArea]} />
          <View style={styles.sheetActions}><Pressable style={styles.cancelButton} onPress={onClose}><Text style={styles.cancelText}>Cancelar</Text></Pressable><Pressable disabled={saving} style={styles.saveButton} onPress={save}>{saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Salvar</Text>}</Pressable></View>
        </View>
      </View>
    </Modal>
  );
};

const CenteredMessage = ({ title, text }: { title: string; text: string }) => <View style={styles.center}><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{text}</Text></View>;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.page, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.page, backgroundColor: colors.background },
  headingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.section }, headingText: { flex: 1 },
  title: { color: colors.textPrimary, fontSize: typography.title, fontWeight: '600' }, subtitle: { color: colors.textSecondary, marginTop: 5, lineHeight: 21 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  stateGap: { marginVertical: 24 }, error: { color: colors.danger, padding: spacing.md }, empty: { color: colors.textSecondary, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md },
  card: { padding: spacing.md, marginBottom: 10, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, backgroundColor: colors.surface },
  cardTitle: { color: colors.textPrimary, fontSize: typography.subtitle, fontWeight: '600' }, references: { color: colors.textSecondary, fontSize: typography.caption, marginTop: 5 }, body: { color: colors.textSecondary, lineHeight: 21, marginTop: 10 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }, smallIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 10 }, pageButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.md }, pageText: { color: colors.textSecondary }, nextIcon: { transform: [{ rotate: '180deg' }] },
  modalLayer: { flex: 1, justifyContent: 'flex-end' }, backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.48)' }, sheet: { padding: spacing.page, paddingBottom: 30, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.surface }, sheetTitle: { color: colors.textPrimary, fontSize: typography.heading, fontWeight: '600', marginBottom: 14 },
  input: { minHeight: 46, color: colors.textPrimary, backgroundColor: colors.inputBackground, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, marginBottom: 12 }, textArea: { minHeight: 150 }, sheetActions: { flexDirection: 'row', gap: 10 }, cancelButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center' }, cancelText: { color: colors.textSecondary, fontWeight: '600' }, saveButton: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primary }, saveText: { color: colors.white, fontWeight: '600' },
});
