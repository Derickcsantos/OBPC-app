import React from 'react';
import { Image, Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from './AppText';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

interface HeaderProps {
  title: string;
  onMenuPress: () => void;
  onProfilePress: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuPress, onProfilePress }) => {
  const { user } = useAuth();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={styles.container}>
        <Pressable style={styles.iconButton} onPress={onMenuPress}>
          <Text style={styles.iconText}>☰</Text>
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <Pressable style={styles.iconButton} onPress={onProfilePress}>
          {user?.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.profileImage} />
          ) : (
            <Text style={styles.profileText}>{user?.nome_usuario?.trim().charAt(0).toUpperCase() || 'U'}</Text>
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
    height: 64,
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
    backgroundColor: colors.homeShortcutBackground,
  },
  iconText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
    marginTop: -2,
  },
  profileText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
    width: 30,
    height: 30,
    lineHeight: 30,
    textAlign: 'center',
    borderRadius: 15,
    backgroundColor: colors.homeShortcutBackground,
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
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
