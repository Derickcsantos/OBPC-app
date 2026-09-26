import {
  House,
  Heart,
  BookOpen,
  HandHeart,
  CalendarDays,
  BookOpenText,
  Church,
  UserRound,
  Settings,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { Icon } from '../components/Icon';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../components/AppText';
import { Header } from '../components/Header';
import { BibliaScreen } from '../screens/BibliaScreen';
import { ConfiguracoesScreen } from '../screens/ConfiguracoesScreen';
import { EventosScreen } from '../screens/EventosScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MensagensScreen } from '../screens/MensagensScreen';
import { MinisteriosScreen } from '../screens/MinisteriosScreen';
import { OracaoScreen } from '../screens/OracaoScreen';
import { PessoaScreen } from '../screens/PessoaScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SobreScreen } from '../screens/SobreScreen';
import { colors } from '../theme/colors';
import { useAppearance } from '../context/AppearanceContext';
import { Pessoa } from '../types';

type AppRoute =
  | 'Inicio'
  | 'Ministerios'
  | 'Oracao'
  | 'Biblia'
  | 'Eventos'
  | 'Mensagens'
  | 'Sobre'
  | 'Perfil'
  | 'Configuracoes'
  | 'Pessoa';
type TabRoute = 'Inicio' | 'Ministerios' | 'Oracao' | 'Biblia' | 'Eventos';
const routeIcons: Record<AppRoute, LucideIcon> = {
  Inicio: House,
  Ministerios: Heart,
  Biblia: BookOpen,
  Oracao: HandHeart,
  Eventos: CalendarDays,
  Mensagens: BookOpenText,
  Sobre: Church,
  Perfil: UserRound,
  Configuracoes: Settings,
  Pessoa: UserRound,
};
const tabs: Array<{ key: TabRoute; label: string }> = [
  { key: 'Inicio', label: 'Início' },
  { key: 'Ministerios', label: 'Ministérios' },
  { key: 'Biblia', label: 'Bíblia' },
  { key: 'Oracao', label: 'Oração' },
  { key: 'Eventos', label: 'Eventos' },
];

const menuItems: Array<{ key: AppRoute; label: string }> = [
  { key: 'Inicio', label: 'Início' },
  { key: 'Ministerios', label: 'Ministérios' },
  { key: 'Oracao', label: 'Orações' },
  { key: 'Biblia', label: 'Bíblia' },
  { key: 'Eventos', label: 'Eventos' },
  { key: 'Mensagens', label: 'Mensagens' },
  { key: 'Sobre', label: 'Sobre' },
  { key: 'Perfil', label: 'Perfil' },
  { key: 'Configuracoes', label: 'Configurações' },
];

const titles: Record<AppRoute, string> = {
  Inicio: 'Início',
  Ministerios: 'Ministérios',
  Oracao: 'Oração',
  Biblia: 'Bíblia',
  Eventos: 'Eventos',
  Mensagens: 'Mensagens',
  Sobre: 'Sobre',
  Perfil: 'Perfil',
  Configuracoes: 'Configurações',
  Pessoa: 'Pessoa',
};

export const AppNavigation = () => {
  const { themePreference } = useAppearance();
  const isDark = themePreference === 'dark';
  const chromeBackground = isDark ? '#000000' : '#FFFFFF';
  const activeColor = isDark ? '#FFFFFF' : '#111111';
  const inactiveColor = isDark ? '#AFAFAF' : '#666666';
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('Inicio');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Pessoa | null>(null);
  const [bibleReadingMode, setBibleReadingMode] = useState(false);

  const navigate = (route: AppRoute) => {
    setCurrentRoute(route);
    setSidebarOpen(false);
    if (route !== 'Biblia') {
      setBibleReadingMode(false);
    }
  };

  const renderScreen = () => {
    switch (currentRoute) {
      case 'Inicio':
        return <HomeScreen onNavigate={navigate} />;
      case 'Ministerios':
        return <MinisteriosScreen />;
      case 'Oracao':
        return <OracaoScreen />;
      case 'Biblia':
        return <BibliaScreen onReadingModeChange={setBibleReadingMode} />;
      case 'Eventos':
        return <EventosScreen />;
      case 'Mensagens':
        return <MensagensScreen />;
      case 'Sobre':
        return (
          <SobreScreen
            onSelectPerson={person => {
              setSelectedPerson(person);
              navigate('Pessoa');
            }}
          />
        );
      case 'Perfil':
        return <ProfileScreen />;
      case 'Configuracoes':
        return <ConfiguracoesScreen />;
      case 'Pessoa':
        return selectedPerson ? (
          <PessoaScreen
            pessoa={selectedPerson}
            onBack={() => navigate('Sobre')}
          />
        ) : (
          <SobreScreen
            onSelectPerson={person => {
              setSelectedPerson(person);
              navigate('Pessoa');
            }}
          />
        );
      default:
        return <HomeScreen onNavigate={navigate} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: chromeBackground }]}>
      {!(currentRoute === 'Biblia' && bibleReadingMode) ? (
        <Header
          title={titles[currentRoute]}
          onMenuPress={() => setSidebarOpen(true)}
          onProfilePress={() => navigate('Perfil')}
        />
      ) : null}
      <View style={styles.content}>{renderScreen()}</View>

      <SafeAreaView
        edges={['bottom']}
        style={[styles.bottomSafe, { backgroundColor: chromeBackground }]}
      >
        <View style={[styles.tabBar, { backgroundColor: chromeBackground }]}>
          {tabs.map(tab => {
            const active = currentRoute === tab.key;
            const iconColor = active ? activeColor : inactiveColor;

            return (
              <Pressable
                key={tab.key}
                accessibilityRole="tab"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: active }}
                style={[
                  styles.tabButton,
                  tab.key === 'Ministerios' && styles.wideTab,
                  active && styles.tabButtonActive,
                ]}
                onPress={() => navigate(tab.key)}
              >
                <View style={styles.tabIconFrame}>
                  <Icon
                    as={routeIcons[tab.key]}
                    size={22}
                    color={iconColor}
                    strokeWidth={active ? 2.1 : 1.75}
                  />
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    { color: inactiveColor },
                    active && styles.tabLabelActive,
                    active && { color: activeColor },
                  ]}
                  numberOfLines={2}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>

      {sidebarOpen ? (
        <Sidebar
          currentRoute={currentRoute}
          onClose={() => setSidebarOpen(false)}
          onNavigate={navigate}
        />
      ) : null}
    </View>
  );
};

const Sidebar = ({
  currentRoute,
  onClose,
  onNavigate,
}: {
  currentRoute: AppRoute;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
}) => (
  <View style={styles.sidebarLayer}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Fechar menu"
      style={styles.sidebarBackdrop}
      onPress={onClose}
    />
    <SafeAreaView edges={['top', 'bottom']} style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarKicker}>OBPC</Text>
        <Text style={styles.sidebarTitle}>Menu</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar menu"
          onPress={onClose}
          style={styles.closeMenu}
        >
          <Icon as={X} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {menuItems.map(item => {
          const active = currentRoute === item.key;
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.menuItem, active && styles.menuItemActive]}
              onPress={() => onNavigate(item.key)}
            >
              <Icon
                as={routeIcons[item.key]}
                color={active ? colors.textPrimary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.menuItemText,
                  active && styles.menuItemTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1 },
  bottomSafe: { backgroundColor: colors.white },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 56,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 4,
  },
  tabButton: {
    flex: 1,
    minHeight: 56,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideTab: { flex: 1.4 },
  tabButtonActive: {},
  tabIconFrame: { height: 24, alignItems: 'center', justifyContent: 'center' },
  tabLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    marginTop: 3,
    textAlign: 'center',
  },
  tabLabelActive: { color: colors.textPrimary, fontWeight: '600' },
  sidebarLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    flexDirection: 'row',
  },
  sidebarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sidebar: {
    width: 280,
    maxWidth: '85%',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  sidebarHeader: { paddingVertical: 16, marginBottom: 8 },
  sidebarKicker: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  sidebarTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
    marginTop: 4,
  },
  closeMenu: {
    position: 'absolute',
    right: 0,
    top: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItem: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuItemActive: { backgroundColor: colors.surfaceMuted },
  menuItemText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
  },
  menuItemTextActive: { color: colors.textPrimary, fontWeight: '600' },
});
