import React from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { Platform } from 'react-native';
import { colors } from '../theme/colors';

// Statically imported SVG components ship with the bundle, including offline.
export const Icon = ({
  as: Component,
  size = 20,
  color = colors.textPrimary,
  strokeWidth = 1.75,
  ...props
}: LucideProps & { as: LucideIcon }) => (
  <Component
    size={size}
    color={color}
    strokeWidth={strokeWidth}
    {...(Platform.OS === 'web' ? {} : { accessible: false })}
    {...props}
  />
);
