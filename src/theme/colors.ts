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

// Android system attributes vary between manufacturers and can resolve text and
// backgrounds to the same color. App-owned day/night resources keep the palette
// deterministic and still react to Appearance.setColorScheme.
const background = dynamic('--obpc-background', '#FFFFFF', '#000000', '@color/obpc_background');
const surface = dynamic('--obpc-surface', '#FFFFFF', '#111111', '@color/obpc_surface');
const muted = dynamic('--obpc-muted', '#F2F2F2', '#202020', '@color/obpc_muted');
const primary = dynamic('--obpc-primary', '#111111', '#FFFFFF', '@color/obpc_primary');
const secondary = dynamic('--obpc-secondary', '#666666', '#AFAFAF', '@color/obpc_secondary');
const border = dynamic('--obpc-border', '#DEDEDE', '#383838', '@color/obpc_border');
const inverted = dynamic('--obpc-inverted', '#FFFFFF', '#000000', '@color/obpc_inverted');

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
