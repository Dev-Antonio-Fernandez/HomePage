import React from 'react';
import { Text as RNText, StyleSheet, type TextProps } from 'react-native';
import { colors, fontSize } from '../../theme';

type Variant = 'title' | 'heading' | 'subheading' | 'body' | 'muted' | 'faint' | 'label';

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  weight?: '400' | '500' | '600' | '700';
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  color,
  weight,
  style,
  children,
  ...rest
}: Props) {
  return (
    <RNText
      style={[styles[variant], color ? { color } : null, weight ? { fontWeight: weight } : null, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700' },
  heading: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  subheading: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  body: { color: colors.text, fontSize: fontSize.md, fontWeight: '400' },
  label: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  muted: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '400' },
  faint: { color: colors.textFaint, fontSize: fontSize.sm, fontWeight: '400' },
});
