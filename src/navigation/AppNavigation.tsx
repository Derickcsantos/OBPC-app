import React, { useState } from 'react';
import { Image, ImageSourcePropType, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../components/AppText';
import { Header } from '../components/Header';
import BibleIcon from '../assets/books-study-learning-education-reading-library-svgrepo-com.svg';
import CalendarIcon from '../assets/calendar-svgrepo-com.svg';
import PrayerIcon from '../assets/hands-pray-svgrepo-com.svg';
import MinistryIcon from '../assets/heart-svgrepo-com.svg';
import { BibliaScreen } from '../screens/BibliaScreen';
import { ConfiguracoesScreen } from '../screens/ConfiguracoesScreen';
import { EventosScreen } from '../screens/EventosScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MinisteriosScreen } from '../screens/MinisteriosScreen';
import { OracaoScreen } from '../screens/OracaoScreen';
import { PessoaScreen } from '../screens/PessoaScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SobreScreen } from '../screens/SobreScreen';
import { colors } from '../theme/colors';
import { Pessoa } from '../types';

type AppRoute = 'Inicio' | 'Ministerios' | 'Oracao' | 'Biblia' | 'Eventos' | 'Sobre' | 'Perfil' | 'Configuracoes' | 'Pessoa';
type TabRoute = 'Inicio' | 'Ministerios' | 'Oracao' | 'Biblia' | 'Eventos';
type TabIcon = React.FC<{ width?: number; height?: number; opacity?: number; color?: string }>;

const logoIcon = require('../../logo.jpg') as ImageSourcePropType;

const tabs: Array<{ key: TabRoute; label: string; Icon?: TabIcon; image?: ImageSourcePropType }> = [
  { key: 'Inicio', label: 'Início', image: logoIcon },
  { key: 'Ministerios', label: 'Ministérios', Icon: MinistryIcon },
  { key: 'Biblia', label: 'Bíblia', Icon: BibleIcon },
  { key: 'Oracao', label: 'Oração', Icon: PrayerIcon },
  { key: 'Eventos', label: 'Eventos', Icon: CalendarIcon },
];

const menuItems: Array<{ key: AppRoute; label: string }> = [
  { key: 'Inicio', label: 'Início' },
  { key: 'Ministerios', label: 'Ministérios' },
  { key: 'Oracao', label: 'Orações' },
  { key: 'Biblia', label: 'Bíblia' },
  { key: 'Eventos', label: 'Eventos' },
  { key: 'Sobre', label: 'Sobre' },
  { key: 'Perfil', label: 'Perfil' },
  { key: 'Configuracoes', label: 'Configurações' },
];

const titles: Record<AppRoute, string> = {
  Inicio: 'Inicio',
  Ministerios: 'Ministerios',
  Oracao: 'Oracao',
  Biblia: 'Biblia',
  Eventos: 'Eventos',
  Sobre: 'Sobre',
  Perfil: 'Perfil',
  Configuracoes: 'Configurações',
  Pessoa: 'Pessoa',
};

export const AppNavigation = () => {
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
          <PessoaScreen pessoa={selectedPerson} onBack={() => navigate('Sobre')} />
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
    <View style={styles.container}>
      {!(currentRoute === 'Biblia' && bibleReadingMode) ? (
        <Header title={titles[currentRoute]} onMenuPress={() => setSidebarOpen(true)} onProfilePress={() => navigate('Perfil')} />
      ) : null}
      <View style={styles.content}>{renderScreen()}</View>

      <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
        <View style={styles.tabBar}>
          {tabs.map(tab => {
            const active = currentRoute === tab.key;
            const iconColor = active ? colors.white : colors.accentSoft;

            return (
              <Pressable key={tab.key} style={[styles.tabButton, active && styles.tabButtonActive]} onPress={() => navigate(tab.key)}>
                <View style={styles.tabIconFrame}>
                  {tab.Icon ? (
                    <tab.Icon width={22} height={22} color={iconColor} opacity={active ? 1 : 0.78} />
                  ) : (
                    <Image source={tab.image} style={styles.tabImageIcon} resizeMode="contain" />
                  )}
                </View>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>

      {sidebarOpen ? <Sidebar currentRoute={currentRoute} onClose={() => setSidebarOpen(false)} onNavigate={navigate} /> : null}
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
    <Pressable style={styles.sidebarBackdrop} onPress={onClose} />
    <SafeAreaView edges={['top', 'bottom']} style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarKicker}>OBPC</Text>
        <Text style={styles.sidebarTitle}>Menu</Text>
      </View>

      {menuItems.map(item => {
        const active = currentRoute === item.key;
        return (
          <Pressable key={item.key} style={[styles.menuItem, active && styles.menuItemActive]} onPress={() => onNavigate(item.key)}>
            <Text style={[styles.menuItemText, active && styles.menuItemTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </SafeAreaView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
  },
  bottomSafe: {
    backgroundColor: colors.white,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: Platform.OS === 'ios' ? 4 : 12,
    padding: 6,
    minHeight: 68,
    borderRadius: 28,
    backgroundColor: colors.primary,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  tabButtonActive: {
  },
  tabIconFrame: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  tabImageIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  tabLabel: {
    color: colors.accentSoft,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  tabLabelActive: {
    color: colors.white,
  },
  sidebarLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    flexDirection: 'row',
  },
  sidebarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  sidebar: {
    width: 292,
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 14,
  },
  sidebarHeader: {
    paddingTop: 18,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  sidebarKicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  sidebarTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  menuItem: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
  },
  menuItemActive: {
    backgroundColor: colors.primarySoft,
  },
  menuItemText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '900',
  },
  menuItemTextActive: {
    color: colors.primary,
  },
});
