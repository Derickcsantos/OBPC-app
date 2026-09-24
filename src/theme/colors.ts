import { DynamicColorIOS, Platform, PlatformColor, type ColorValue } from 'react-native';

const dynamic = (cssVariable: string, light: string, dark: string, androidAttribute: string): ColorValue => {
  if (Platform.OS === 'web') {
    return `var(${cssVariable}, ${light})`;
  }

  if (Platform.OS === 'ios') {
    return DynamicColorIOS({ light, dark });
  }

  if (Platform.OS === 'android') {
    return PlatformColor(androidAttribute);
  }

  return light;
};

const background = dynamic('--obpc-background', '#FFFFFF', '#000000', '?android:attr/colorBackground');
const surface = dynamic('--obpc-surface', '#FFFFFF', '#111111', '?android:attr/colorBackgroundFloating');
const muted = dynamic('--obpc-muted', '#F2F2F2', '#202020', '?android:attr/colorBackgroundFloating');
const primary = dynamic('--obpc-primary', '#111111', '#FFFFFF', '?android:attr/textColorPrimary');
const secondary = dynamic('--obpc-secondary', '#666666', '#AFAFAF', '?android:attr/textColorSecondary');
const border = dynamic('--obpc-border', '#DEDEDE', '#383838', '?android:attr/textColorSecondary');
const inverted = dynamic('--obpc-inverted', '#FFFFFF', '#000000', '?android:attr/colorBackground');

export const colors = {
  background,
  surface,
  surfaceMuted: muted,
  primary,
  primarySoft: muted,
  accent: primary,
  accentSoft: muted,
  textPrimary: primary,
  textSecondary: secondary,
  textInverted: inverted,
  border,
  inputBackground: muted,
  success: primary,
  danger: primary,
  cardShadow: '#000000',
  white: inverted,
  black: primary,
  homeShortcutBackground: muted,
};
