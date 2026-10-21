import React from 'react';
import { StyleSheet, View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppearanceProvider, useAppearance } from '../src/context/AppearanceContext';
import { colors, createDynamicStyles, getThemeColors, setActiveTheme } from '../src/theme/colors';

let changeTheme: ((theme: 'light' | 'dark') => Promise<void>) | undefined;

const contextStyles = createDynamicStyles(() =>
  StyleSheet.create({
    screen: {
      backgroundColor: colors.background,
      color: colors.textPrimary,
    },
  }),
);

const ThemeProbe = () => {
  const appearance = useAppearance();
  changeTheme = appearance.setThemePreference;

  return <View testID="theme-probe" style={contextStyles.screen} />;
};

describe('theme palette', () => {
  afterEach(() => setActiveTheme('light'));

  it('uses light colors as the default palette', () => {
    setActiveTheme('light');

    expect(colors.background).toBe('#FFFFFF');
    expect(getThemeColors('light').textPrimary).toBe('#111111');
  });

  it('updates module scoped styles when the selected theme changes', () => {
    setActiveTheme('light');
    const styles = createDynamicStyles(() =>
      StyleSheet.create({
        screen: {
          backgroundColor: colors.background,
          color: colors.textPrimary,
        },
      }),
    );

    expect(styles.screen).toMatchObject({
      backgroundColor: '#FFFFFF',
      color: '#111111',
    });

    setActiveTheme('dark');

    expect(styles.screen).toMatchObject({
      backgroundColor: '#000000',
      color: '#FFFFFF',
    });
  });

  it('applies and persists changes made through the appearance context', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppearanceProvider>
          <ThemeProbe />
        </AppearanceProvider>,
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      await changeTheme?.('dark');
    });

    expect(renderer!.root.findByProps({ testID: 'theme-probe' }).props.style).toMatchObject({
      backgroundColor: '#000000',
      color: '#FFFFFF',
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'obpcapp:v1:settings:theme',
      '"dark"',
    );

    await ReactTestRenderer.act(async () => renderer!.unmount());
  });

  it('restores a saved theme before its styles are read', async () => {
    await AsyncStorage.setItem('obpcapp:v1:settings:theme', '"dark"');
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <AppearanceProvider>
          <ThemeProbe />
        </AppearanceProvider>,
      );
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(renderer!.root.findByProps({ testID: 'theme-probe' }).props.style).toMatchObject({
      backgroundColor: '#000000',
      color: '#FFFFFF',
    });

    await ReactTestRenderer.act(async () => renderer!.unmount());
    await AsyncStorage.removeItem('obpcapp:v1:settings:theme');
  });
});
