import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing, radius } from '../../theme';
import { Flashcards } from '../../db';
import type { Flashcard } from '../../db/types';
import type { RootStackParamList } from '../../navigation/types';

type R = RouteProp<RootStackParamList, 'Review'>;

export function ReviewScreen() {
  const route = useRoute<R>();
  const { subjectId } = route.params;

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ good: 0, bad: 0 });
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setCards(await Flashcards.flashcardsForSubject(subjectId));
  }, [subjectId]);

  useEffect(() => {
    load();
  }, [load]);

  const grade = async (difficulty: number) => {
    const card = cards[index];
    if (card) await Flashcards.reviewFlashcard(card.id, difficulty);
    setStats((s) => ({
      good: s.good + (difficulty <= 1 ? 1 : 0),
      bad: s.bad + (difficulty >= 3 ? 1 : 0),
    }));
    if (index + 1 >= cards.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setRevealed(false);
    }
  };

  if (cards.length === 0) {
    return (
      <Screen>
        <EmptyState
          emoji="🎴"
          title="Sin flashcards"
          message="Cierra una clase con IA o graba una clase para generar tarjetas."
        />
      </Screen>
    );
  }

  if (done) {
    return (
      <Screen>
        <Card accent={colors.primaryBorder}>
          <Text variant="subheading">¡Repaso terminado! 🎉</Text>
          <Text variant="muted" style={{ marginTop: spacing.sm }}>
            Dominadas: {stats.good} · A reforzar: {stats.bad}
          </Text>
        </Card>
        <Button
          label="Repasar de nuevo"
          onPress={() => {
            setIndex(0);
            setRevealed(false);
            setStats({ good: 0, bad: 0 });
            setDone(false);
            load();
          }}
        />
      </Screen>
    );
  }

  const card = cards[index];
  return (
    <Screen scroll={false}>
      <Text variant="muted">
        {index + 1} / {cards.length}
      </Text>

      <Pressable style={styles.bigCard} onPress={() => setRevealed(true)}>
        <Text variant="faint">{revealed ? 'Respuesta' : 'Pregunta'}</Text>
        <Text variant="heading" style={styles.cardText}>
          {revealed ? card.answer : card.question}
        </Text>
        {!revealed ? (
          <Text variant="faint" style={{ marginTop: spacing.lg }}>
            Toca para ver la respuesta
          </Text>
        ) : null}
      </Pressable>

      {revealed ? (
        <View style={styles.gradeRow}>
          <Button label="No lo sabía" onPress={() => grade(3)} variant="danger" style={styles.flex} />
          <Button label="Más o menos" onPress={() => grade(2)} variant="secondary" style={styles.flex} />
          <Button label="Dominado" onPress={() => grade(1)} style={styles.flex} />
        </View>
      ) : (
        <Button label="Mostrar respuesta" onPress={() => setRevealed(true)} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bigCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { textAlign: 'center', marginTop: spacing.md },
  gradeRow: { flexDirection: 'row', gap: spacing.sm },
});
