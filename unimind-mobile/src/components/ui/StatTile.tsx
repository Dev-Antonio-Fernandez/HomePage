import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing, fontSize } from '../../theme';
import { Text } from './Text';

interface Props {
  label: string;
  value: string;
  icon?: React.ReactNode;
  valueColor?: string;
  onPress?: () => void;
}

export function StatTile({ label, value, icon, valueColor, onPress }: Props) {
  const content = (
    <>
      <View style={styles.labelRow}>
        <Text variant="faint">{label}</Text>
        {onPress ? <Text variant="faint">›</Text> : null}
      </View>
      <View style={styles.row}>
        <Text
          style={{ fontSize: fontSize.xxl, color: valueColor ?? colors.text }}
          weight="700"
        >
          {value}
        </Text>
        {icon}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.tile,
          pressed && { backgroundColor: colors.surfacePressed },
        ]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={styles.tile}>{content}</View>;
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    minHeight: 84,
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
