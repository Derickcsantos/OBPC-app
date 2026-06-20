import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { checkHealth } from '../services/api';
import { colors } from '../theme/colors';
import BibleIcon from '../assets/books-study-learning-education-reading-library-svgrepo-com.svg';
import CalendarIcon from '../assets/calendar-svgrepo-com.svg';
import PrayerIcon from '../assets/hands-pray-svgrepo-com.svg';
import InstagramIcon from '../assets/instagram-svgrepo-com.svg';
import MinistryIcon from '../assets/heart-svgrepo-com.svg';
import WhatsappIcon from '../assets/whatsapp-svgrepo-com.svg';
import ChurchIcon from '../assets/church-svgrepo-com.svg';

const logo = require('../../logo.jpg');
type ShortcutIcon = React.FC<{ width?: number; height?: number }>;

export type HomeShortcutRoute = 'Ministerios' | 'Biblia' | 'Oracao' | 'Eventos' | 'Sobre';

interface HomeScreenProps {
  onNavigate: (route: HomeShortcutRoute) => void;
}

const openExternalUrl = async (url: string) => {
  const supported = await Linking.canOpenURL(url);

  if (supported) {
    Linking.openURL(url);
  }
};

export const HomeScreen = ({ onNavigate }: HomeScreenProps) => {
  const [apiStatus, setApiStatus] = useState('verificando');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setError('');

    try {
      const health = await checkHealth();
      setApiStatus(health.status ?? 'ok');
    } catch (requestError) {
      setApiStatus('offline');
      setError('Nao foi possivel verificar a conexao agora.');
      console.error('Erro ao carregar dados da Home:', requestError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando aplicativo OBPC</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.hero}>
        <View style={styles.heroLogoFrame}>
          <Image source={logo} style={styles.heroLogo} resizeMode="contain" />
        </View>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, apiStatus === 'ok' ? styles.statusOnline : styles.statusOffline]} />
          <Text style={styles.statusText}>API {apiStatus}</Text>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.shortcutsGrid}>
        <Shortcut Icon={MinistryIcon} label="Ministerios" onPress={() => onNavigate('Ministerios')} />
        <Shortcut Icon={BibleIcon} label="Biblia" onPress={() => onNavigate('Biblia')} />
        <Shortcut Icon={PrayerIcon} label="Oracoes" onPress={() => onNavigate('Oracao')} />
        <Shortcut Icon={CalendarIcon} label="Eventos" onPress={() => onNavigate('Eventos')} />
        <Shortcut Icon={InstagramIcon} label="Instagram" onPress={() => openExternalUrl('https://www.instagram.com/obpcfreguesiaoficial/')} />
        <Shortcut Icon={WhatsappIcon} label="WhatsApp" onPress={() => openExternalUrl('https://w.app/obpc')} />
        <Shortcut icon="L" label="Louvores" />
        <Shortcut icon="MSG" label="Mensagens" />
        <Shortcut Icon={ChurchIcon} label="Igreja" onPress={() => onNavigate('Sobre')} />
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const Shortcut = ({
  icon,
  Icon,
  label,
  onPress,
}: {
  icon?: string;
  Icon?: ShortcutIcon;
  label: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity style={styles.shortcutItem} activeOpacity={onPress ? 0.78 : 1} onPress={onPress}>
    <View style={styles.shortcutIconWrap}>
      {Icon ? <Icon width={32} height={32} /> : <Text style={styles.shortcutIcon}>{icon}</Text>}
    </View>
    <Text style={styles.shortcutLabel} numberOfLines={2}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 26,
    paddingBottom: 18,
    backgroundColor: colors.white,
  },
  heroLogoFrame: {
    width: 138,
    height: 138,
    padding: 5,
    borderRadius: 28,
    overflow: 'hidden',
  },
  heroLogo: {
    width: '100%',
    height: '100%',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusOnline: {
    backgroundColor: '#b0e7c5',
  },
  statusOffline: {
    backgroundColor: '#F59D8D',
  },
  statusText: {
    color: colors.primary,
    fontWeight: '800',
    textTransform: 'uppercase',
    fontSize: 11,
  },
  errorText: {
    margin: 16,
    color: colors.danger,
    fontWeight: '700',
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 4,
  },
  shortcutItem: {
    width: '33.333%',
    alignItems: 'center',
    paddingVertical: 14,
  },
  shortcutIconWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.homeShortcutBackground,
  },
  shortcutIcon: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  shortcutLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 28,
  },
});
