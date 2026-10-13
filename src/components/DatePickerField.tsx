import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from './AppText';
import { Icon } from './Icon';
import { colors } from '../theme/colors';
import { radius, spacing, typography } from '../theme/tokens';

export const formatDateBr = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
};

export const toIsoDate = (value: string) => {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const parsed = new Date(`${iso}T00:00:00-03:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(iso) ? iso : null;
};

export const DatePickerField = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => {
  const [open, setOpen] = useState(false);
  const selectedIso = toIsoDate(value);
  const [month, setMonth] = useState(() => {
    const valueDate = selectedIso ? new Date(`${selectedIso}T00:00:00-03:00`) : new Date();
    return new Date(valueDate.getFullYear(), valueDate.getMonth(), 1);
  });
  const year = month.getFullYear(); const monthIndex = month.getMonth();
  const cells = useMemo(() => {
    const values: Array<number | null> = Array(new Date(year, monthIndex, 1).getDay()).fill(null);
    values.push(...Array.from({ length: new Date(year, monthIndex + 1, 0).getDate() }, (_, index) => index + 1));
    while (values.length % 7) values.push(null);
    return values;
  }, [monthIndex, year]);
  const select = (day: number) => { onChange(`${String(day).padStart(2, '0')}/${String(monthIndex + 1).padStart(2, '0')}/${year}`); setOpen(false); };
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.row}><TextInput value={value} onChangeText={onChange} placeholder="dd/mm/aaaa" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={styles.input} /><Pressable accessibilityLabel="Abrir calendário" accessibilityState={{ expanded: open }} style={[styles.button, open && styles.buttonActive]} onPress={() => setOpen(current => !current)}><Icon as={CalendarDays} size={20} color={open ? colors.white : colors.primary} /></Pressable></View>
    {open ? <View style={styles.calendar}><View style={styles.header}><Text style={styles.month}>{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month)}</Text><View style={styles.navigation}><Pressable style={styles.navButton} accessibilityLabel="Mês anterior" onPress={() => setMonth(new Date(year, monthIndex - 1, 1))}><Icon as={ChevronLeft} size={18} /></Pressable><Pressable style={styles.navButton} accessibilityLabel="Próximo mês" onPress={() => setMonth(new Date(year, monthIndex + 1, 1))}><Icon as={ChevronRight} size={18} /></Pressable></View></View><View style={styles.grid}>{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.week}>{day}</Text>)}{cells.map((day, index) => day ? (() => { const iso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; const selected = iso === selectedIso; return <Pressable key={iso} style={[styles.day, selected && styles.daySelected]} onPress={() => select(day)}><Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day}</Text></Pressable>; })() : <View key={`blank-${index}`} style={styles.day} />)}</View>{value ? <Pressable style={styles.clear} onPress={() => { onChange(''); setOpen(false); }}><Icon as={X} size={15} color={colors.textSecondary} /><Text style={styles.clearText}>Limpar data</Text></Pressable> : null}</View> : null}
  </View>;
};

const styles = StyleSheet.create({
  field: { marginBottom: 4 }, label: { color: colors.textPrimary, fontWeight: '600', marginBottom: 7 }, row: { flexDirection: 'row', gap: 8 }, input: { flex: 1, minHeight: 46, paddingHorizontal: 12, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.inputBackground, marginBottom: 10 }, button: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceMuted }, buttonActive: { backgroundColor: colors.primary }, calendar: { marginBottom: spacing.md, padding: spacing.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, month: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '600', textTransform: 'capitalize' }, navigation: { flexDirection: 'row', gap: 6 }, navButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceMuted }, grid: { flexDirection: 'row', flexWrap: 'wrap' }, week: { width: '14.2857%', textAlign: 'center', color: colors.textSecondary, fontSize: typography.caption, marginBottom: 4 }, day: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md }, daySelected: { backgroundColor: colors.primary }, dayText: { color: colors.textPrimary, fontSize: typography.caption }, dayTextSelected: { color: colors.white, fontWeight: '600' }, clear: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, paddingVertical: 6 }, clearText: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: '600' },
});
