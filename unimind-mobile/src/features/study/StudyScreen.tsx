import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing } from '../../theme';
import { Sessions, StudyCards } from '../../db';
import type { ClassSession } from '../../db/types';
import { useRootNav } from '../../navigation/hooks';

type ClassRow = ClassSession & {
  subject_name: string;
  subject_color: string;
};

export function StudyScreen() {
  const nav = useRootNav();
  const [rows, setRows] = useState<ClassRow[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    const list = await Sessions.allSessionsWithSubject();
    setRows(list);
    const c: Record<string, number> = {};
    for (const s of list) c[s.id] = await StudyCards.countForSession(s.id);
    setCounts(c);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen onRefresh={load}>
      <Text variant="title">Estudio</Text>
      <Text variant="muted">
        Tus clases con apuntes explicados por la IA para entenderlos bien.
      </Text>

      {rows && rows.length === 0 ? (
        <EmptyState
          emoji="🎓"
          title="Aún no hay clases"
          message="Inicia y cierra una clase (o grábala) y aquí verás sus apuntes de estudio."
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {rows?.map((s) => (
            <Card
              key={s.id}
              onPress={() => nav.navigate('StudyClass', { sessionId: s.id })}
            >
              <View style={styles.row}>
                <View style={[styles.dot, { backgroundColor: s.subject_color }]} />
                <View style={styles.flex}>
                  <Text variant="subheading">{s.topic || 'Clase sin tema'}</Text>
                  <Text variant="muted">
                    {s.subject_name}
                    {'   ·   '}
                    {s.date}
                  </Text>
                </View>
                {counts[s.id] > 0 ? (
                  <Badge label={`${counts[s.id]} apuntes`} color={colors.primary} soft />
                ) : (
                  <Badge label="Generar" color={colors.textMuted} soft />
                )}
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
