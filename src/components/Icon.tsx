import React from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { Platform } from 'react-native';
import { colors } from '../theme/colors';
import { useAppearance } from '../context/AppearanceContext';

// Statically imported SVG components ship with the bundle, including offline.
export const Icon = ({
  as: Component,
  size = 20,
  color = colors.textPrimary,
  strokeWidth = 1.75,
  ...props
}: LucideProps & { as: LucideIcon }) => {
  const { themePreference } = useAppearance();
  const dark = themePreference === 'dark';
  let resolvedColor = color;

  // react-native-svg does not consistently resolve Android PlatformColor
  // objects. Lucide receives a concrete monochrome color on every platform.
  if (color === colors.primary || color === colors.textPrimary || color === colors.accent || color === colors.black) {
    resolvedColor = dark ? '#FFFFFF' : '#111111';
  } else if (color === colors.textSecondary) {
    resolvedColor = dark ? '#AFAFAF' : '#666666';
  } else if (color === colors.white || color === colors.textInverted) {
    resolvedColor = dark ? '#000000' : '#FFFFFF';
  } else if (color === colors.border) {
    resolvedColor = dark ? '#383838' : '#DEDEDE';
  }

  return (
    <Component
      size={size}
      color={resolvedColor}
      strokeWidth={strokeWidth}
      {...(Platform.OS === 'web' ? {} : { accessible: false })}
      {...props}
    />
  );
};
