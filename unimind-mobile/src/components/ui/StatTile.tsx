import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing, fontSize } from '../../theme';
import { Text } from './Text';

interface Props {
  label: string;
  value: string;
  icon?: React.ReactNode;
  valueColor?: string;
}

export function StatTile({ label, value, icon, valueColor }: Props) {
  return (
    <View style={styles.tile}>
      <Text variant="faint">{label}</Text>
      <View style={styles.row}>
        <Text
          style={{ fontSize: fontSize.xxl, color: valueColor ?? colors.text }}
          weight="700"
        >
          {value}
        </Text>
        {icon}
      </View>
    </View>
  );
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
