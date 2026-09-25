import {
  Heart,
  BookOpen,
  HandHeart,
  CalendarDays,
  Church,
  BookOpenText,
  Music2,
  Camera,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react-native';
import { Icon } from '../components/Icon';
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
import { useAppearance } from '../context/AppearanceContext';
import { colors } from '../theme/colors';
import { spacing, typography, radius } from '../theme/tokens';

const lightLogo = require('../../logo.jpg');
const darkLogo = require('../assets/logo-completo-dark.jpeg');
type ShortcutIcon = LucideIcon;

export type HomeShortcutRoute =
  'Ministerios' | 'Biblia' | 'Oracao' | 'Eventos' | 'Mensagens' | 'Sobre';

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
  const { themePreference } = useAppearance();
  const logo = themePreference === 'dark' ? darkLogo : lightLogo;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroLogoFrame}>
          <Image source={logo} style={styles.heroLogo} resizeMode="contain" />
        </View>
      </View>

      <View style={styles.shortcutsGrid}>
        <Shortcut
          Icon={Heart}
          label="Ministérios"
          onPress={() => onNavigate('Ministerios')}
        />
        <Shortcut
          Icon={BookOpen}
          label="Bíblia"
          onPress={() => onNavigate('Biblia')}
        />
        <Shortcut
          Icon={HandHeart}
          label="Orações"
          onPress={() => onNavigate('Oracao')}
        />
        <Shortcut
          Icon={CalendarDays}
          label="Eventos"
          onPress={() => onNavigate('Eventos')}
        />
        <Shortcut
          Icon={Camera}
          label="Instagram"
          onPress={() =>
            openExternalUrl('https://www.instagram.com/obpcfreguesiaoficial/')
          }
        />
        <Shortcut
          Icon={MessageCircle}
          label="WhatsApp"
          onPress={() => openExternalUrl('https://w.app/obpc')}
        />
        <Shortcut Icon={Music2} label="Louvores" />
        <Shortcut
          Icon={BookOpenText}
          label="Plano de estudo"
          onPress={() => onNavigate('Mensagens')}
        />
        <Shortcut
          Icon={Church}
          label="Igreja"
          onPress={() => onNavigate('Sobre')}
        />
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const Shortcut = ({
  icon,
  Icon: Glyph,
  label,
  onPress,
}: {
  icon?: string;
  Icon?: ShortcutIcon;
  label: string;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled: !onPress }}
    disabled={!onPress}
    style={styles.shortcutItem}
    activeOpacity={onPress ? 0.78 : 1}
    onPress={onPress}
  >
    <View style={styles.shortcutIconWrap}>
      {Glyph ? (
        <Icon as={Glyph} size={24} />
      ) : (
        <Text style={styles.shortcutIcon}>{icon}</Text>
      )}
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
    paddingTop: spacing.section,
    paddingBottom: 18,
    backgroundColor: colors.white,
  },
  heroLogoFrame: {
    width: 104,
    height: 104,
    padding: 5,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  heroLogo: {
    width: '100%',
    height: '100%',
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.page,
    paddingTop: 10,
    paddingBottom: 4,
  },
  shortcutItem: {
    width: '33.333%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  shortcutIconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.homeShortcutBackground,
  },
  shortcutIcon: {
    color: colors.primary,
    fontSize: typography.heading,
    fontWeight: '600',
  },
  shortcutLabel: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 28,
  },
});
