import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing, fontSize } from '../../theme';
import { Text } from './Text';

interface Props {
  label: string;
  color?: string;
  soft?: boolean;
  solid?: boolean;
}

export function Badge({ label, color = colors.primary, soft, solid }: Props) {
  const bg = solid ? color : soft ? withAlpha(color, 0.16) : colors.surfaceAlt;
  const textColor = solid ? colors.white : color;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={{ color: textColor, fontSize: fontSize.xs }} weight="600">
        {label}
      </Text>
    </View>
  );
}

function withAlpha(hex: string, alpha: number): string {
  // Solo soporta #RRGGBB; si no, devuelve el color tal cual.
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
});
