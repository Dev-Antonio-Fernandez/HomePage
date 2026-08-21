import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme';
import { Text } from './Text';

interface Props {
  emoji?: string;
  title: string;
  message?: string;
  children?: React.ReactNode;
}

export function EmptyState({ emoji = '🗒️', title, message, children }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text variant="subheading" style={styles.center}>
        {title}
      </Text>
      {message ? (
        <Text variant="muted" style={styles.center}>
          {message}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emoji: { fontSize: 44, marginBottom: spacing.sm },
  center: { textAlign: 'center' },
});
