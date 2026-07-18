import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing } from '../../theme';
import { Tasks } from '../../db';
import type { TaskWithSubject } from '../../db/repositories/tasks';
import { isoDate } from '../../utils/dates';

export function TasksScreen() {
  const [pending, setPending] = useState<TaskWithSubject[]>([]);
  const [newTask, setNewTask] = useState('');

  const load = useCallback(async () => {
    setPending(await Tasks.pendingTasks());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const add = async () => {
    if (newTask.trim().length === 0) return;
    await Tasks.createTask({ title: newTask.trim() });
    setNewTask('');
    load();
  };

  const complete = async (id: string) => {
    await Tasks.toggleTask(id, true);
    load();
  };

  return (
    <Screen onRefresh={load}>
      <Text variant="title">Pendientes</Text>

      <View style={styles.addRow}>
        <View style={styles.flex}>
          <Input
            value={newTask}
            onChangeText={setNewTask}
            placeholder="Nueva tarea rápida"
          />
        </View>
        <Button label="+" onPress={add} fullWidth={false} style={styles.addBtn} />
      </View>

      {pending.length === 0 ? (
        <EmptyState emoji="🎉" title="Sin pendientes" message="Estás al día." />
      ) : (
        <View style={{ gap: spacing.sm }}>
          <SectionHeader title={`${pending.length} por hacer`} />
          {pending.map((t) => (
            <Card key={t.id} padded={false}>
              <Pressable style={styles.taskRow} onPress={() => complete(t.id)}>
                <View style={styles.checkbox} />
                <View style={styles.flex}>
                  <Text variant="body" weight="600">
                    {t.title}
                  </Text>
                  {t.subject_name ? (
                    <Text variant="faint">{t.subject_name}</Text>
                  ) : null}
                </View>
                {t.due_date ? (
                  <Badge
                    label={t.due_date === isoDate() ? 'Hoy' : t.due_date.slice(5)}
                    color={t.due_date === isoDate() ? colors.danger : colors.textMuted}
                    soft
                  />
                ) : null}
                {t.source === 'ia' ? <Text variant="faint">IA</Text> : null}
              </Pressable>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  addRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  addBtn: { width: 50, height: 50 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textFaint,
  },
});
