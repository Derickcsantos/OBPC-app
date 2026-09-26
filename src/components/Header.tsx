import { Menu, UserRound } from 'lucide-react-native';
import { Icon } from './Icon';
import React from 'react';
import { Image, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from './AppText';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { useAppearance } from '../context/AppearanceContext';

interface HeaderProps {
  title: string;
  onMenuPress: () => void;
  onProfilePress: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onMenuPress,
  onProfilePress,
}) => {
  const { user } = useAuth();
  const { themePreference } = useAppearance();
  const isDark = themePreference === 'dark';
  const chromeBackground = isDark ? '#000000' : '#FFFFFF';
  const chromeForeground = isDark ? '#FFFFFF' : '#111111';

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: chromeBackground }]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={chromeBackground}
      />
      <View style={[styles.container, { backgroundColor: chromeBackground }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir menu"
          style={[styles.iconButton, { backgroundColor: chromeBackground }]}
          onPress={onMenuPress}
        >
          <Icon as={Menu} color={chromeForeground} />
        </Pressable>

        <Text
          style={[styles.title, { color: chromeForeground }]}
          numberOfLines={1}
        >
          {title}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
          style={[styles.iconButton, { backgroundColor: chromeBackground }]}
          onPress={onProfilePress}
        >
          {user?.avatar_url ? (
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.profileImage}
            />
          ) : user?.nome_usuario ? (
            <Text
              style={[
                styles.profileText,
                {
                  color: chromeForeground,
                  backgroundColor: chromeBackground,
                },
              ]}
            >
              {user.nome_usuario.trim().charAt(0).toUpperCase()}
            </Text>
          ) : (
            <Icon as={UserRound} color={chromeForeground} />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.white,
  },
  container: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  profileText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    width: 30,
    height: 30,
    lineHeight: 30,
    textAlign: 'center',
    borderRadius: 15,
    backgroundColor: colors.white,
  },
  profileImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
