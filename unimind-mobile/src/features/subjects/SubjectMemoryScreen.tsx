import React, { useCallback, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { colors, spacing } from '../../theme';
import {
  Attendance,
  Flashcards,
  Notes,
  Sessions,
  Subjects,
  Tasks,
} from '../../db';
import type { ClassSession, Note, Subject, Task } from '../../db/types';
import { summarizeAbsences, riskColor, riskLabel } from '../../utils/attendance';
import { noteTypeMeta } from '../notes/noteTypes';
import { buildSubjectMarkdown } from '../../utils/export';
import type { RootStackParamList } from '../../navigation/types';
import { useRootNav } from '../../navigation/hooks';

type R = RouteProp<RootStackParamList, 'SubjectMemory'>;

export function SubjectMemoryScreen() {
  const nav = useRootNav();
  const route = useRoute<R>();
  const { subjectId } = route.params;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [doubts, setDoubts] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cardCount, setCardCount] = useState(0);
  const [used, setUsed] = useState(0);

  const load = useCallback(async () => {
    const [s, ses, db, tk, cc, records] = await Promise.all([
      Subjects.getSubject(subjectId),
      Sessions.sessionsForSubject(subjectId),
      Notes.doubtsForSubject(subjectId),
      Tasks.tasksForSubject(subjectId),
      Flashcards.countFlashcards(subjectId),
      Attendance.attendanceForSubject(subjectId),
    ]);
    setSubject(s);
    setSessions(ses);
    setDoubts(db);
    setTasks(tk);
    setCardCount(cc);
    setUsed(records.reduce((acc, r) => acc + r.absence_value, 0));
  }, [subjectId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onExport = async () => {
    if (!subject) return;
    const notes = await Notes.notesForSubject(subjectId);
    const md = buildSubjectMarkdown({ subject, sessions, notes, tasks, used });
    await Share.share({ message: md, title: `Resumen ${subject.name}` });
  };

  if (!subject) return <Screen><Text variant="muted">Cargando…</Text></Screen>;

  const sum = summarizeAbsences(used, subject.absence_limit);
  const pendingTasks = tasks.filter((t) => t.completed === 0);

  return (
    <Screen onRefresh={load}>
      <View>
        <View style={styles.titleRow}>
          <View style={[styles.dot, { backgroundColor: subject.color }]} />
          <Text variant="title" style={styles.flex}>{subject.name}</Text>
          <Badge label={riskLabel(sum.risk)} color={riskColor(sum.risk)} soft />
        </View>
        <Text variant="muted">
          {subject.professor || 'Sin profesor'} · Faltas {sum.remaining}/{subject.absence_limit} disponibles
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Preguntar a IA"
          onPress={() => nav.navigate('Explain', { subjectId })}
          fullWidth={false}
          style={styles.actionBtn}
        />
        <Button
          label="Editar"
          onPress={() => nav.navigate('SubjectForm', { subjectId })}
          variant="secondary"
          fullWidth={false}
          style={styles.actionBtn}
        />
      </View>

      {/* Temas vistos */}
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Temas vistos" />
        {sessions.length === 0 ? (
          <Card><Text variant="muted">Aún no hay clases registradas.</Text></Card>
        ) : (
          sessions.map((s) => (
            <Card key={s.id} onPress={() => nav.navigate('ActiveClass', { sessionId: s.id })}>
              <View style={styles.sessionHead}>
                <Text variant="body" weight="600" style={styles.flex}>
                  {s.topic || 'Clase sin tema'}
                </Text>
                <Text variant="faint">{s.date}</Text>
              </View>
              {s.ai_summary ? (
                <Text variant="muted" style={{ marginTop: spacing.xs }} numberOfLines={4}>
                  {s.ai_summary}
                </Text>
              ) : null}
            </Card>
          ))
        )}
      </View>

      {/* Dudas */}
      {doubts.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <SectionHeader title="Dudas y temas débiles" />
          {doubts.slice(0, 6).map((n) => (
            <Card key={n.id} style={{ borderLeftColor: noteTypeMeta(n.type).color, borderLeftWidth: 3 }}>
              <Text variant="body">{n.cleaned_text || n.raw_text}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      {/* Tareas */}
      {pendingTasks.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <SectionHeader title="Tareas pendientes" />
          {pendingTasks.map((t) => (
            <Card key={t.id}>
              <Text variant="body">📌 {t.title}</Text>
              {t.due_date ? <Text variant="faint">Para: {t.due_date}</Text> : null}
            </Card>
          ))}
        </View>
      ) : null}

      {/* Estudio */}
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title="Repaso" />
        <Card>
          <Text variant="body">🎴 {cardCount} flashcards generadas</Text>
          <Text variant="muted" style={{ marginTop: spacing.xs }}>
            Ve a la pestaña Estudio para repasarlas.
          </Text>
        </Card>
      </View>

      <Button label="Exportar resumen (Markdown)" onPress={onExport} variant="secondary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 14, height: 14, borderRadius: 7 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1 },
  sessionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
