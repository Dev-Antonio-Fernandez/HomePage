import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing } from '../../theme';
import { Flashcards, StudyCards, Subjects } from '../../db';
import type { Subject } from '../../db/types';
import { useRootNav } from '../../navigation/hooks';

interface Row {
  subject: Subject;
  apuntes: number;
  flashcards: number;
}

export function StudyScreen() {
  const nav = useRootNav();
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = useCallback(async () => {
    const subjects = await Subjects.listSubjects();
    const out: Row[] = [];
    for (const s of subjects) {
      const [cards, fc] = await Promise.all([
        StudyCards.cardsForSubject(s.id),
        Flashcards.countFlashcards(s.id),
      ]);
      out.push({ subject: s, apuntes: cards.length, flashcards: fc });
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
      <Text variant="title">Estudio 🎒</Text>
      <Text variant="muted">
        Tus cuadernos: apuntes explicados y modo examen por materia.
      </Text>

      {rows && rows.length === 0 ? (
        <EmptyState
          emoji="📚"
          title="Sin cuadernos todavía"
          message="Crea materias en la pestaña Clases y aquí tendrás su cuaderno de estudio."
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {rows?.map(({ subject, apuntes, flashcards }) => (
            <Card
              key={subject.id}
              onPress={() => nav.navigate('SubjectStudy', { subjectId: subject.id })}
            >
              <View style={styles.row}>
                {/* Lomo del cuaderno */}
                <View style={[styles.spine, { backgroundColor: subject.color }]} />
                <View style={styles.flex}>
                  <Text variant="subheading">{subject.name}</Text>
                  <Text variant="faint">
                    {apuntes} apuntes · {flashcards} flashcards
                  </Text>
                </View>
                <Text variant="faint" style={styles.chev}>›</Text>
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
  spine: { width: 8, height: 46, borderRadius: 3 },
  chev: { fontSize: 22 },
});
