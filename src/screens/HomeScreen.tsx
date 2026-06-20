import React from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
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
  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroLogoFrame}>
          <Image source={logo} style={styles.heroLogo} resizeMode="contain" />
        </View>
      </View>

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
