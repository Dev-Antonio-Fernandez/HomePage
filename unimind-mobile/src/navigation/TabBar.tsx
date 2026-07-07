import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize } from '../theme';
import { Text } from '../components/ui/Text';

const TAB_META: Record<string, { label: string; emoji: string }> = {
  Home: { label: 'Inicio', emoji: '🏠' },
  Subjects: { label: 'Clases', emoji: '📚' },
  NewNoteTab: { label: '', emoji: '+' },
  Study: { label: 'Estudio', emoji: '🎓' },
  More: { label: 'Más', emoji: '≡' },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const meta = TAB_META[route.name] ?? { label: route.name, emoji: '•' };

        if (route.name === 'NewNoteTab') {
          return (
            <View key={route.key} style={styles.item}>
              <Pressable
                style={styles.fab}
                onPress={() =>
                  navigation
                    .getParent()
                    ?.navigate('NewNote', {})
                }
              >
                <Text style={styles.fabPlus}>＋</Text>
              </Pressable>
            </View>
          );
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} style={styles.item} onPress={onPress}>
            <Text
              style={[
                styles.icon,
                { color: focused ? colors.primary : colors.textFaint },
              ]}
            >
              {meta.emoji}
            </Text>
            <Text
              style={{
                fontSize: fontSize.xs,
                color: focused ? colors.primary : colors.textFaint,
              }}
              weight={focused ? '600' : '400'}
            >
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  icon: { fontSize: 20 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: colors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabPlus: { color: colors.white, fontSize: 30, lineHeight: 34, fontWeight: '600' },
});
