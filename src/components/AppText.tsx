import React from 'react';
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  TextInputProps,
  TextProps,
} from 'react-native';
import { useAppearance } from '../context/AppearanceContext';

const useScaledStyle = (style: TextProps['style'] | TextInputProps['style']) => {
  const { fontSizeOffset } = useAppearance();
  const flattened = StyleSheet.flatten(style) ?? {};
  const baseFontSize = typeof flattened.fontSize === 'number' ? flattened.fontSize : 14;
  const lineHeight =
    typeof flattened.lineHeight === 'number'
      ? Math.max(flattened.lineHeight + fontSizeOffset, baseFontSize + fontSizeOffset)
      : undefined;

  return [style, { fontSize: Math.max(8, baseFontSize + fontSizeOffset), ...(lineHeight ? { lineHeight } : {}) }];
};

export const AppText = ({ style, ...props }: TextProps) => {
  const scaledStyle = useScaledStyle(style);
  return <NativeText {...props} style={scaledStyle} />;
};

export const AppTextInput = ({ style, ...props }: TextInputProps) => {
  const scaledStyle = useScaledStyle(style);
  return <NativeTextInput {...props} style={scaledStyle} />;
};
