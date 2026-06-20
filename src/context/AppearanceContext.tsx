import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getCachedValue, setCachedValue } from '../services/offlineStorage';

export type FontSizePreference = 'small' | 'normal' | 'large';

interface AppearanceContextValue {
  fontSizePreference: FontSizePreference;
  fontSizeOffset: number;
  setFontSizePreference: (value: FontSizePreference) => void;
}

const FONT_SIZE_KEY = 'settings:font-size';

const fontSizeOffsets: Record<FontSizePreference, number> = {
  small: -2,
  normal: 0,
  large: 4,
};

const AppearanceContext = createContext<AppearanceContextValue>({
  fontSizePreference: 'normal',
  fontSizeOffset: 0,
  setFontSizePreference: () => undefined,
});

export const AppearanceProvider = ({ children }: React.PropsWithChildren) => {
  const [fontSizePreference, setPreference] = useState<FontSizePreference>('normal');

  useEffect(() => {
    getCachedValue<FontSizePreference>(FONT_SIZE_KEY).then(savedPreference => {
      if (savedPreference && savedPreference in fontSizeOffsets) {
        setPreference(savedPreference);
      }
    });
  }, []);

  const setFontSizePreference = (value: FontSizePreference) => {
    setPreference(value);
    void setCachedValue(FONT_SIZE_KEY, value);
  };

  const value = useMemo(
    () => ({
      fontSizePreference,
      fontSizeOffset: fontSizeOffsets[fontSizePreference],
      setFontSizePreference,
    }),
    [fontSizePreference],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
};

export const useAppearance = () => useContext(AppearanceContext);
