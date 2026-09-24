import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import { getCachedValue, setCachedValue } from '../services/offlineStorage';

export type FontSizePreference = 'small' | 'normal' | 'large';
export type ThemePreference = 'light' | 'dark';

interface AppearanceContextValue {
  fontSizePreference: FontSizePreference;
  fontSizeOffset: number;
  setFontSizePreference: (value: FontSizePreference) => void;
  themePreference: ThemePreference;
  setThemePreference: (value: ThemePreference) => void;
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
  setThemePreference: () => undefined,
});

export const AppearanceProvider = ({ children }: React.PropsWithChildren) => {
  const [fontSizePreference, setPreference] = useState<FontSizePreference>('normal');
  const [themePreference, setTheme] = useState<ThemePreference>('light');

  useEffect(() => {
    getCachedValue<FontSizePreference>(FONT_SIZE_KEY).then(savedPreference => {
      if (savedPreference && savedPreference in fontSizeOffsets) {
        setPreference(savedPreference);
      }
    });
    getCachedValue<ThemePreference>(THEME_KEY).then(savedTheme => {
      if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' && typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(themePreference);
    }

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const root = document.documentElement;
      const dark = themePreference === 'dark';
      root.style.setProperty('--obpc-background', dark ? '#000000' : '#FFFFFF');
      root.style.setProperty('--obpc-surface', dark ? '#111111' : '#FFFFFF');
      root.style.setProperty('--obpc-muted', dark ? '#202020' : '#F2F2F2');
      root.style.setProperty('--obpc-primary', dark ? '#FFFFFF' : '#111111');
      root.style.setProperty('--obpc-secondary', dark ? '#AFAFAF' : '#666666');
      root.style.setProperty('--obpc-border', dark ? '#383838' : '#DEDEDE');
      root.style.setProperty('--obpc-inverted', dark ? '#000000' : '#FFFFFF');
      root.style.colorScheme = themePreference;
    }
  }, [themePreference]);

  const setFontSizePreference = (value: FontSizePreference) => {
    setPreference(value);
    setCachedValue(FONT_SIZE_KEY, value);
  };

  const setThemePreference = (value: ThemePreference) => {
    setTheme(value);
    setCachedValue(THEME_KEY, value);
  };

  const value = useMemo(
    () => ({
      fontSizePreference,
      fontSizeOffset: fontSizeOffsets[fontSizePreference],
      setFontSizePreference,
      themePreference,
      setThemePreference,
    }),
    [fontSizePreference, themePreference],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
};

export const useAppearance = () => useContext(AppearanceContext);
