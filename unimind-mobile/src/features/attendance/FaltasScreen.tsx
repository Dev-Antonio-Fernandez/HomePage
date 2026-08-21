import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing } from '../../theme';
import { Subjects } from '../../db';
import type { Subject } from '../../db/types';
import { summarizeAbsences, riskColor, riskLabel } from '../../utils/attendance';
import { useRootNav } from '../../navigation/hooks';

interface Row {
  subject: Subject;
  used: number;
  remaining: number;
  limit: number;
  ratio: number;
  risk: ReturnType<typeof summarizeAbsences>['risk'];
}

export function FaltasScreen() {
  const nav = useRootNav();
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = useCallback(async () => {
    const subjects = await Subjects.listSubjects();
    const out: Row[] = [];
    for (const s of subjects) {
      const used = await Subjects.absencesUsed(s.id);
      const sum = summarizeAbsences(used, s.absence_limit);
      out.push({
        subject: s,
        used,
        remaining: sum.remaining,
        limit: sum.limit,
        ratio: sum.ratio,
        risk: sum.risk,
      });
    }
    // Ordena por riesgo (las más peligrosas primero).
    out.sort((a, b) => b.ratio - a.ratio);
    setRows(out);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen onRefresh={load}>
      <Text variant="title">Faltas por materia</Text>
      <Text variant="muted">Cuántas faltas te quedan en cada clase.</Text>

      {rows && rows.length === 0 ? (
        <EmptyState
          emoji="✅"
          title="Sin materias"
          message="Importa o crea materias para ver tus faltas."
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {rows?.map((r) => (
            <Card
              key={r.subject.id}
              onPress={() =>
                nav.navigate('SubjectMemory', { subjectId: r.subject.id })
              }
            >
              <View style={styles.head}>
                <View style={[styles.dot, { backgroundColor: r.subject.color }]} />
                <Text variant="subheading" style={styles.flex}>
                  {r.subject.name}
                </Text>
                <Badge label={riskLabel(r.risk)} color={riskColor(r.risk)} soft />
              </View>

              <View style={styles.bigRow}>
                <Text
                  style={{ fontSize: 34, color: riskColor(r.risk) }}
                  weight="700"
                >
                  {r.remaining}
                </Text>
                <Text variant="muted">
                  {' '}
                  restantes de {r.limit}
                </Text>
              </View>

              <Text variant="faint">{r.used} usadas</Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.min(r.ratio * 100, 100)}%`,
                      backgroundColor: riskColor(r.risk),
                    },
                  ]}
                />
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
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.sm },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  fill: { height: 8, borderRadius: 4 },
});
