import { ImagePlus, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppText as Text } from './AppText';
import { Icon } from './Icon';
import { uploadAdminMedia } from '../services/api';
import { AdminContentKind } from '../types';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/tokens';

export const MediaPicker = ({ context, value, onChange }: { context: AdminContentKind; value?: string | null; onChange: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false);
  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Permissão necessária', 'Permita o acesso às fotos para enviar uma imagem.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.86 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const url = await uploadAdminMedia({ uri: asset.uri, name: asset.fileName || `imagem-${Date.now()}.jpg`, type: asset.mimeType || 'image/jpeg' }, context);
      onChange(url);
    } catch { Alert.alert('Upload não concluído', 'Não foi possível enviar a imagem.'); }
    finally { setUploading(false); }
  };
  return <View style={styles.container}>
    {value ? <Image source={{ uri: value }} style={styles.preview} resizeMode="contain" /> : null}
    <View style={styles.actions}>
      <Pressable accessibilityLabel="Selecionar imagem" disabled={uploading} style={styles.button} onPress={pick}>{uploading ? <ActivityIndicator color={colors.primary} /> : <><Icon as={ImagePlus} size={18} /><Text style={styles.text}>{value ? 'Substituir' : 'Selecionar imagem'}</Text></>}</Pressable>
      {value ? <Pressable accessibilityLabel="Remover imagem" style={styles.iconButton} onPress={() => onChange('')}><Icon as={Trash2} size={18} /></Pressable> : null}
    </View>
  </View>;
};

const styles = StyleSheet.create({ container: { marginBottom: spacing.md }, preview: { width: '100%', height: 150, borderRadius: radius.md, backgroundColor: colors.surfaceMuted }, actions: { flexDirection: 'row', gap: 8, marginTop: 8 }, button: { minHeight: 44, flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceMuted }, iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceMuted }, text: { color: colors.textPrimary, fontWeight: '600' } });
