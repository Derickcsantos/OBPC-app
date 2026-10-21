import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { AppText as Text } from '../components/AppText';
import { API_BASE_URL } from '../services/api';
import { colors, createDynamicStyles } from '../theme/colors';

export type LegalDocument = 'privacy-policy' | 'terms-of-use';

export const LegalDocumentScreen = ({ document }: { document: LegalDocument }) => {
  const url = new URL(`/${document}`, API_BASE_URL).toString();
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        originWhitelist={['https://*', 'http://*']}
        startInLoadingState
        renderLoading={() => <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Carregando documento…</Text></View>}
        javaScriptEnabled={false}
        accessibilityLabel={document === 'privacy-policy' ? 'Política de Privacidade' : 'Termos de Uso'}
      />
    </View>
  );
};

const styles = createDynamicStyles(() => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
}));
