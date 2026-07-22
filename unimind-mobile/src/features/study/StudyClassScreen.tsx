import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing } from '../../theme';
import { Flashcards, Sessions, StudyCards, Subjects } from '../../db';
import type { ClassSession, Subject } from '../../db/types';
import type { StudyCard } from '../../db/repositories/studyCards';
import { StudyCardView } from './StudyCardView';
import { AIService, MissingKeyError, AIError } from '../../ai';
import type { RootStackParamList } from '../../navigation/types';
import { useRootNav } from '../../navigation/hooks';

type R = RouteProp<RootStackParamList, 'StudyClass'>;

export function StudyClassScreen() {
  const nav = useRootNav();
  const route = useRoute<R>();
  const { sessionId } = route.params;

  const [session, setSession] = useState<ClassSession | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [cardCount, setCardCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const s = await Sessions.getSession(sessionId);
    setSession(s);
    if (s) {
      setSubject(await Subjects.getSubject(s.subject_id));
      setCards(await StudyCards.cardsForSession(sessionId));
      setCardCount(await Flashcards.countFlashcards(s.subject_id));
    }
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const generate = async () => {
    setBusy(true);
    try {
      const n = await AIService.generateStudyCards(sessionId);
      if (n === 0) {
        Alert.alert('Sin apuntes', 'La IA no pudo generar apuntes de esta clase.');
      }
      await load();
    } catch (e) {
      if (e instanceof MissingKeyError) {
        Alert.alert('IA no configurada', 'Configura tu API key de texto en Más → IA.');
      } else {
        Alert.alert('Error', (e as AIError).message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen onRefresh={load}>
      <View>
        <Text variant="title">{session?.topic || 'Apuntes de clase'}</Text>
        <Text variant="muted">
          {subject?.name}
          {session?.date ? `  ·  ${session.date}` : ''}
        </Text>
      </View>

      {cards.length === 0 ? (
        <EmptyState
          emoji="✨"
          title="Sin apuntes todavía"
          message="Genera apuntes visuales (idea, fórmula desglosada y ejemplo) a partir de las notas de esta clase."
        >
          <Button
            label="Generar apuntes con IA"
            onPress={generate}
            loading={busy}
            fullWidth={false}
            style={{ marginTop: spacing.lg }}
          />
        </EmptyState>
      ) : (
        <>
          {cards.map((c) => (
            <StudyCardView key={c.id} card={c} />
          ))}
          <Button
            label="Regenerar apuntes"
            onPress={generate}
            loading={busy}
            variant="secondary"
          />
        </>
      )}

      {subject && cardCount > 0 ? (
        <Button
          label={`🎴 Repasar ${cardCount} flashcards`}
          onPress={() => nav.navigate('Review', { subjectId: subject.id })}
          variant="secondary"
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({});
