import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing } from '../../theme';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  accent?: string; // color de borde/acento opcional
}

export function Card({ children, onPress, style, padded = true, accent }: Props) {
  const base: ViewStyle = {
    ...styles.card,
    ...(padded ? styles.padded : null),
    ...(accent
      ? { borderColor: accent, backgroundColor: colors.surfaceAlt }
      : null),
    ...style,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          base,
          pressed && { backgroundColor: colors.surfacePressed },
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  padded: { padding: spacing.lg },
});
