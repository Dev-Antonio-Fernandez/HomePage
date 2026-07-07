import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { colors, radius, spacing, fontSize } from '../../theme';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  style,
  fullWidth = true,
}: Props) {
  const isDisabled = disabled || loading;
  const palette = getPalette(variant);

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border },
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && { opacity: 0.85 },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <View style={styles.inner}>
          {icon}
          <Text style={{ color: palette.text, fontSize: fontSize.md }} weight="600">
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function getPalette(variant: Variant) {
  switch (variant) {
    case 'secondary':
      return { bg: colors.surfaceAlt, border: colors.border, text: colors.text };
    case 'ghost':
      return { bg: 'transparent', border: colors.border, text: colors.textMuted };
    case 'danger':
      return { bg: colors.dangerSoft, border: colors.danger, text: colors.danger };
    case 'primary':
    default:
      return { bg: colors.primaryStrong, border: colors.primaryStrong, text: colors.white };
  }
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  fullWidth: { alignSelf: 'stretch' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  disabled: { opacity: 0.5 },
});
