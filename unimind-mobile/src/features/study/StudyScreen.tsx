import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing, radius } from '../../theme';
import { Flashcards, Subjects } from '../../db';
import type { Flashcard, Subject } from '../../db/types';
import { useRootNav } from '../../navigation/hooks';

export function StudyScreen() {
  const nav = useRootNav();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);

  // Estado de la sesión de repaso
  const [reviewing, setReviewing] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [stats, setStats] = useState({ good: 0, bad: 0 });

  const load = useCallback(async () => {
    const list = await Subjects.listSubjects();
    setSubjects(list);
    const current = subjectId ?? list[0]?.id ?? null;
    setSubjectId(current);
    if (current) setCards(await Flashcards.flashcardsForSubject(current));
  }, [subjectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const selectSubject = async (id: string) => {
    setSubjectId(id);
    setReviewing(false);
    setCards(await Flashcards.flashcardsForSubject(id));
  };

  const startReview = () => {
    setReviewing(true);
    setIndex(0);
    setRevealed(false);
    setStats({ good: 0, bad: 0 });
  };

  const grade = async (difficulty: number) => {
    const card = cards[index];
    if (card) await Flashcards.reviewFlashcard(card.id, difficulty);
    setStats((s) => ({
      good: s.good + (difficulty <= 1 ? 1 : 0),
      bad: s.bad + (difficulty >= 3 ? 1 : 0),
    }));
    if (index + 1 >= cards.length) {
      setReviewing(false);
      if (subjectId) setCards(await Flashcards.flashcardsForSubject(subjectId));
    } else {
      setIndex(index + 1);
      setRevealed(false);
    }
  };

  if (subjects.length === 0) {
    return (
      <Screen>
        <Text variant="title">Estudio</Text>
        <EmptyState
          emoji="🎓"
          title="Nada que estudiar todavía"
          message="Crea materias, toma notas en clase y cierra la clase con IA para generar flashcards."
        />
      </Screen>
    );
  }

  // Modo repaso activo
  if (reviewing && cards.length > 0) {
    const card = cards[index];
    return (
      <Screen scroll={false}>
        <View style={styles.reviewHeader}>
          <Text variant="muted">
            {index + 1} / {cards.length}
          </Text>
          <Pressable onPress={() => setReviewing(false)} hitSlop={8}>
            <Text style={{ color: colors.textMuted }}>Salir</Text>
          </Pressable>
        </View>

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

  const currentSubject = subjects.find((s) => s.id === subjectId);

  return (
    <Screen onRefresh={load}>
      <Text variant="title">Estudio</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {subjects.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => selectSubject(s.id)}
            style={[
              styles.chip,
              subjectId === s.id && { backgroundColor: colors.surfaceAlt, borderColor: s.color },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text variant="body">{s.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {stats.good + stats.bad > 0 && !reviewing ? (
        <Card accent={colors.primaryBorder}>
          <Text variant="subheading">¡Repaso terminado! 🎉</Text>
          <Text variant="muted">
            Dominadas: {stats.good} · A reforzar: {stats.bad}
          </Text>
        </Card>
      ) : null}

      <Card>
        <Text variant="subheading">{currentSubject?.name}</Text>
        <Text variant="muted" style={{ marginVertical: spacing.sm }}>
          {cards.length} flashcards disponibles
        </Text>
        {cards.length > 0 ? (
          <Button label="Iniciar repaso de 5 min" onPress={startReview} />
        ) : (
          <Text variant="faint">
            Aún no hay flashcards. Cierra una clase con IA o pregunta a la IA para generarlas.
          </Text>
        )}
      </Card>

      <Button
        label="Preguntar / explicar duda con IA"
        onPress={() => subjectId && nav.navigate('Explain', { subjectId })}
        variant="secondary"
      />

      {/* Vista previa de tarjetas */}
      {cards.slice(0, 5).map((c) => (
        <Card key={c.id}>
          <Text variant="body" weight="600">{c.question}</Text>
          <Text variant="muted" style={{ marginTop: spacing.xs }}>{c.answer}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chips: { gap: spacing.sm, paddingVertical: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
