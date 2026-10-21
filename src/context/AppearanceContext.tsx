import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import { getCachedValue, setCachedValue } from '../services/offlineStorage';
import { getThemeColors, setActiveTheme } from '../theme/colors';

export type FontSizePreference = 'small' | 'normal' | 'large';
export type ThemePreference = 'light' | 'dark';

interface AppearanceContextValue {
  fontSizePreference: FontSizePreference;
  fontSizeOffset: number;
  setFontSizePreference: (value: FontSizePreference) => void;
  themePreference: ThemePreference;
  colors: ReturnType<typeof getThemeColors>;
  setThemePreference: (value: ThemePreference) => Promise<void>;
  preferencesReady: boolean;
}

const FONT_SIZE_KEY = 'settings:font-size';
const THEME_KEY = 'settings:theme';

const fontSizeOffsets: Record<FontSizePreference, number> = {
  small: -2,
  normal: 0,
  large: 4,
};

const AppearanceContext = createContext<AppearanceContextValue>({
  fontSizePreference: 'normal',
  fontSizeOffset: 0,
  setFontSizePreference: () => undefined,
  themePreference: 'light',
  colors: getThemeColors('light'),
  setThemePreference: async () => undefined,
  preferencesReady: false,
});

export const AppearanceProvider = ({ children }: React.PropsWithChildren) => {
  const [fontSizePreference, setPreference] = useState<FontSizePreference>('normal');
  const [themePreference, setTheme] = useState<ThemePreference>('light');
  const [preferencesReady, setPreferencesReady] = useState(false);
  const themeWriteQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    setActiveTheme(themePreference);
  }, [themePreference]);

  useEffect(() => {
    Promise.all([
      getCachedValue<FontSizePreference>(FONT_SIZE_KEY),
      getCachedValue<ThemePreference>(THEME_KEY),
    ])
      .then(([savedPreference, savedTheme]) => {
        if (savedPreference && savedPreference in fontSizeOffsets) {
          setPreference(savedPreference);
        }
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setActiveTheme(savedTheme);
          setTheme(savedTheme);
        }
      })
      .finally(() => setPreferencesReady(true));
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;

    if (Platform.OS !== 'web' && typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(themePreference);
    }

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const root = document.documentElement;
      const palette = getThemeColors(themePreference);
      root.style.setProperty('--obpc-background', String(palette.background));
      root.style.setProperty('--obpc-surface', String(palette.surface));
      root.style.setProperty('--obpc-muted', String(palette.surfaceMuted));
      root.style.setProperty('--obpc-primary', String(palette.primary));
      root.style.setProperty('--obpc-secondary', String(palette.textSecondary));
      root.style.setProperty('--obpc-border', String(palette.border));
      root.style.setProperty('--obpc-inverted', String(palette.textInverted));
      root.style.colorScheme = themePreference;
    }
  }, [preferencesReady, themePreference]);

  const setFontSizePreference = (value: FontSizePreference) => {
    setPreference(value);
    setCachedValue(FONT_SIZE_KEY, value);
  };

  const setThemePreference = async (value: ThemePreference) => {
    setActiveTheme(value);
    setTheme(value);
    themeWriteQueue.current = themeWriteQueue.current
      .catch(() => undefined)
      .then(() => setCachedValue(THEME_KEY, value));
    await themeWriteQueue.current;
  };

  const value = useMemo(
    () => ({
      colors: getThemeColors(themePreference),
      fontSizePreference,
      fontSizeOffset: fontSizeOffsets[fontSizePreference],
      setFontSizePreference,
      themePreference,
      setThemePreference,
      preferencesReady,
    }),
    [fontSizePreference, preferencesReady, themePreference],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
};

export const useAppearance = () => useContext(AppearanceContext);
