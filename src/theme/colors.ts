import type { ColorValue } from 'react-native';
import type { ThemePreference } from '../context/AppearanceContext';

export type AppColors = {
  background: ColorValue;
  surface: ColorValue;
  surfaceMuted: ColorValue;
  primary: ColorValue;
  primarySoft: ColorValue;
  accent: ColorValue;
  accentSoft: ColorValue;
  textPrimary: ColorValue;
  textSecondary: ColorValue;
  textInverted: ColorValue;
  border: ColorValue;
  inputBackground: ColorValue;
  success: ColorValue;
  danger: ColorValue;
  cardShadow: ColorValue;
  white: ColorValue;
  black: ColorValue;
  homeShortcutBackground: ColorValue;
};

const lightColors: AppColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F2F2F2',
  primary: '#111111',
  primarySoft: '#F2F2F2',
  accent: '#111111',
  accentSoft: '#F2F2F2',
  textPrimary: '#111111',
  textSecondary: '#666666',
  textInverted: '#FFFFFF',
  border: '#DEDEDE',
  inputBackground: '#F2F2F2',
  success: '#111111',
  danger: '#111111',
  cardShadow: '#000000',
  white: '#FFFFFF',
  black: '#111111',
  homeShortcutBackground: '#F2F2F2',
};

const darkColors: AppColors = {
  background: '#000000',
  surface: '#111111',
  surfaceMuted: '#202020',
  primary: '#FFFFFF',
  primarySoft: '#202020',
  accent: '#FFFFFF',
  accentSoft: '#202020',
  textPrimary: '#FFFFFF',
  textSecondary: '#AFAFAF',
  textInverted: '#000000',
  border: '#383838',
  inputBackground: '#202020',
  success: '#FFFFFF',
  danger: '#FFFFFF',
  cardShadow: '#000000',
  white: '#000000',
  black: '#FFFFFF',
  homeShortcutBackground: '#202020',
};

let activeTheme: ThemePreference = 'light';

export const setActiveTheme = (theme: ThemePreference): void => {
  activeTheme = theme;
};

export const getThemeColors = (theme: ThemePreference): AppColors =>
  theme === 'dark' ? darkColors : lightColors;

// Keep existing screen styles theme-aware, even though their style objects
// are declared at module scope.
export const colors = new Proxy(lightColors, {
  get: (_target, key: keyof AppColors) => getThemeColors(activeTheme)[key],
});

export const createDynamicStyles = <T extends object>(
  factory: () => T,
): T => {
  const cache = new Map<ThemePreference, T>();
  return new Proxy({} as T, {
    get: (_target, key: string | symbol) => {
      let styles = cache.get(activeTheme);
      if (!styles) {
        styles = factory();
        cache.set(activeTheme, styles);
      }
      return styles[key as keyof T];
    },
  });
};
