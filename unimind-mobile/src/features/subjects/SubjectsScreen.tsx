import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { colors, spacing, radius } from '../../theme';
import { Subjects } from '../../db';
import type { Subject } from '../../db/types';
import { summarizeAbsences, riskColor, riskLabel } from '../../utils/attendance';
import { useRootNav } from '../../navigation/hooks';

interface Row {
  subject: Subject;
  used: number;
  remaining: number;
  risk: ReturnType<typeof summarizeAbsences>['risk'];
}

export function SubjectsScreen() {
  const nav = useRootNav();
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = useCallback(async () => {
    const subjects = await Subjects.listSubjects();
    const out: Row[] = [];
    for (const s of subjects) {
      const used = await Subjects.absencesUsed(s.id);
      const sum = summarizeAbsences(used, s.absence_limit);
      out.push({ subject: s, used, remaining: sum.remaining, risk: sum.risk });
    }
    setRows(out);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen onRefresh={load}>
      <View style={styles.header}>
        <Text variant="title">Materias</Text>
        <Button
          label="+ Nueva"
          onPress={() => nav.navigate('SubjectForm', {})}
          variant="secondary"
          fullWidth={false}
          style={styles.newBtn}
        />
      </View>

      {rows && rows.length === 0 ? (
        <EmptyState
          emoji="📚"
          title="Aún no tienes materias"
          message="Crea tu primera materia con horario y límite de faltas para empezar a controlar tu semestre."
        >
          <Button
            label="Crear materia"
            onPress={() => nav.navigate('SubjectForm', {})}
            fullWidth={false}
            style={{ marginTop: spacing.lg }}
          />
        </EmptyState>
      ) : (
        <View style={{ gap: spacing.md }}>
          {rows?.map(({ subject, used, remaining, risk }) => (
            <Card
              key={subject.id}
              onPress={() => nav.navigate('SubjectMemory', { subjectId: subject.id })}
            >
              <View style={styles.row}>
                <View style={[styles.dot, { backgroundColor: subject.color }]} />
                <View style={styles.flex}>
                  <Text variant="subheading">{subject.name}</Text>
                  <Text variant="muted">
                    {subject.professor || 'Sin profesor'}
                    {subject.room ? `  ·  ${subject.room}` : ''}
                  </Text>
                </View>
                <Badge label={riskLabel(risk)} color={riskColor(risk)} soft />
              </View>

              <View style={styles.faltaBar}>
                <Text variant="faint">
                  Faltas: {used} usadas · {remaining} restantes de {subject.absence_limit}
                </Text>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.min(
                          subject.absence_limit > 0
                            ? (used / subject.absence_limit) * 100
                            : 0,
                          100,
                        )}%`,
                        backgroundColor: riskColor(risk),
                      },
                    ]}
                  />
                </View>
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newBtn: { height: 40, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  faltaBar: { marginTop: spacing.md, gap: spacing.sm },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4 },
});
