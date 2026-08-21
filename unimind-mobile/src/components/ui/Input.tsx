import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors, radius, spacing, fontSize } from '../../theme';
import { Text } from './Text';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text variant="label">{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={[styles.input, rest.multiline && styles.multiline, style]}
        {...rest}
      />
      {hint ? <Text variant="faint">{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
});
