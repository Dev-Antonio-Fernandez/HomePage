import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { colors, spacing } from '../../theme';
import { Flashcards, Sessions, StudyCards, Subjects } from '../../db';
import type { ClassSession, Subject } from '../../db/types';
import type { StudyCard } from '../../db/repositories/studyCards';
import { StudyCardView } from './StudyCardView';
import type { RootStackParamList } from '../../navigation/types';
import { useRootNav } from '../../navigation/hooks';

type R = RouteProp<RootStackParamList, 'SubjectStudy'>;

export function SubjectStudyScreen() {
  const nav = useRootNav();
  const route = useRoute<R>();
  const { subjectId } = route.params;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [flashCount, setFlashCount] = useState(0);

  const load = useCallback(async () => {
    const [s, c, ses, fc] = await Promise.all([
      Subjects.getSubject(subjectId),
      StudyCards.cardsForSubject(subjectId),
      Sessions.sessionsForSubject(subjectId),
      Flashcards.countFlashcards(subjectId),
    ]);
    setSubject(s);
    setCards(c);
    setSessions(ses);
    setFlashCount(fc);
  }, [subjectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen onRefresh={load}>
      <View style={styles.header}>
        <View style={[styles.spine, { backgroundColor: subject?.color ?? colors.primary }]} />
        <Text variant="title" style={styles.flex}>
          {subject?.name ?? 'Materia'}
        </Text>
      </View>

      {/* Acciones principales */}
      <Button
        label="📝  Modo examen"
        onPress={() => nav.navigate('Exam', { subjectId })}
      />
      {flashCount > 0 ? (
        <Button
          label={`🎴  Repasar ${flashCount} flashcards`}
          onPress={() => nav.navigate('Review', { subjectId })}
          variant="secondary"
        />
      ) : null}

      {/* Apuntes de toda la materia */}
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Apuntes" />
        {cards.length === 0 ? (
          <Card>
            <Text variant="muted">
              Aún no hay apuntes. Abre una clase de abajo y genera sus apuntes con IA.
            </Text>
          </Card>
        ) : (
          cards.map((c) => <StudyCardView key={c.id} card={c} />)
        )}
      </View>

      {/* Clases (para generar/ver apuntes por clase) */}
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Clases" />
        {sessions.length === 0 ? (
          <Card><Text variant="muted">Aún no has iniciado clases de esta materia.</Text></Card>
        ) : (
          sessions.map((s) => (
            <Card key={s.id} onPress={() => nav.navigate('StudyClass', { sessionId: s.id })}>
              <View style={styles.classRow}>
                <Text variant="body" weight="600" style={styles.flex}>
                  {s.topic || 'Clase sin tema'}
                </Text>
                <Text variant="faint">{s.date}</Text>
              </View>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  spine: { width: 6, height: 32, borderRadius: 3 },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
