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
import { Subjects } from '../../db';
import {
  AIService,
  MissingKeyError,
  AIError,
  type ExamQuestion,
} from '../../ai';
import type { RootStackParamList } from '../../navigation/types';
import { useRootNav } from '../../navigation/hooks';

type R = RouteProp<RootStackParamList, 'Exam'>;
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function ExamScreen() {
  const nav = useRootNav();
  const route = useRoute<R>();
  const { subjectId } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [results, setResults] = useState<{ ok: boolean; topic: string }[]>([]);
  const [done, setDone] = useState(false);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = await AIService.generateExam(subjectId, 8);
      if (q.length === 0) {
        setError('La IA no pudo crear preguntas con el material disponible.');
      } else {
        setQuestions(q);
        setIndex(0);
        setSelected(null);
        setResults([]);
        setDone(false);
      }
    } catch (e) {
      if (e instanceof MissingKeyError) {
        setError('Configura tu API key de texto en Más → IA.');
      } else {
        setError((e as AIError).message);
      }
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    generate();
  }, [generate]);

  const answer = (i: number) => {
    if (selected !== null) return; // ya respondió esta
    setSelected(i);
    const q = questions[index];
    setResults((r) => [...r, { ok: i === q.correct, topic: q.topic }]);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setSelected(null);
    }
  };

  if (loading) {
    return (
      <Screen>
        <EmptyState emoji="📝" title="Armando tu examen…" message="La IA está creando las preguntas." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <EmptyState emoji="⚠️" title="No se pudo crear el examen" message={error}>
          <Button label="Reintentar" onPress={generate} fullWidth={false} style={{ marginTop: spacing.lg }} />
        </EmptyState>
      </Screen>
    );
  }

  if (done) {
    const score = results.filter((r) => r.ok).length;
    const total = results.length;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    // Temas a reforzar: los de las preguntas falladas.
    const weak = new Map<string, number>();
    results.filter((r) => !r.ok).forEach((r) => {
      weak.set(r.topic, (weak.get(r.topic) ?? 0) + 1);
    });
    const weakList = [...weak.entries()].sort((a, b) => b[1] - a[1]);

    return (
      <Screen>
        <Card accent={colors.primaryBorder}>
          <Text variant="faint">Tu resultado</Text>
          <Text style={styles.score} weight="700" color={pct >= 60 ? colors.success : colors.danger}>
            {score}/{total}
          </Text>
          <Text variant="subheading">{pct}% de aciertos</Text>
          <Text variant="muted" style={{ marginTop: spacing.xs }}>
            {pct >= 80 ? '¡Excelente, lo dominas! 🎉' : pct >= 60 ? 'Vas bien, refuerza un poco.' : 'A darle: repasa lo de abajo.'}
          </Text>
        </Card>

        <View style={{ gap: spacing.sm }}>
          <Text variant="subheading">📚 Estudia más</Text>
          {weakList.length === 0 ? (
            <Card><Text variant="muted">¡Nada! Contestaste todo bien. 🔥</Text></Card>
          ) : (
            weakList.map(([topic, n]) => (
              <Card key={topic}>
                <Text variant="body" weight="600">{topic}</Text>
                <Text variant="faint">{n} pregunta(s) fallada(s)</Text>
              </Card>
            ))
          )}
        </View>

        <Button label="Hacer otro examen" onPress={generate} />
        <Button label="Volver" onPress={() => nav.goBack()} variant="secondary" />
      </Screen>
    );
  }

  const q = questions[index];
  return (
    <Screen>
      <View style={styles.progressRow}>
        <Text variant="muted">
          Pregunta {index + 1} de {questions.length}
        </Text>
        <Text variant="faint">{q.topic}</Text>
      </View>

      <Card>
        <Text variant="subheading">{q.question}</Text>
      </Card>

      <View style={{ gap: spacing.sm }}>
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct;
          const isSelected = i === selected;
          let bg: string = colors.surface;
          let border: string = colors.border;
          if (selected !== null) {
            if (isCorrect) {
              bg = colors.successSoft;
              border = colors.success;
            } else if (isSelected) {
              bg = colors.dangerSoft;
              border = colors.danger;
            }
          }
          return (
            <Pressable
              key={i}
              onPress={() => answer(i)}
              style={[styles.option, { backgroundColor: bg, borderColor: border }]}
            >
              <View style={styles.letter}>
                <Text weight="700" color={colors.textMuted}>
                  {OPTION_LETTERS[i]}
                </Text>
              </View>
              <Text variant="body" style={styles.flex}>
                {opt}
              </Text>
              {selected !== null && isCorrect ? <Text>✅</Text> : null}
              {selected !== null && isSelected && !isCorrect ? <Text>❌</Text> : null}
            </Pressable>
          );
        })}
      </View>

      {selected !== null ? (
        <Button
          label={index + 1 >= questions.length ? 'Ver resultado' : 'Siguiente'}
          onPress={next}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  letter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: { fontSize: 56, marginVertical: spacing.xs },
});
