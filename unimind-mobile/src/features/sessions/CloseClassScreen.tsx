import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors, spacing, radius } from '../../theme';
import { Attendance, Flashcards, Sessions, Subjects, Tasks } from '../../db';
import type { Subject } from '../../db/types';
import {
  ATTENDANCE_LABELS,
  type AttendanceStatus,
} from '../../utils/attendance';
import { AIService, MissingKeyError, hasApiKey } from '../../ai';
import type { RootStackParamList } from '../../navigation/types';
import { useRootNav } from '../../navigation/hooks';

type R = RouteProp<RootStackParamList, 'CloseClass'>;

const STATUSES: AttendanceStatus[] = ['asistio', 'falto', 'retardo', 'justificada'];

export function CloseClassScreen() {
  const nav = useRootNav();
  const route = useRoute<R>();
  const { sessionId } = route.params;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<AttendanceStatus>('asistio');
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    (async () => {
      const s = await Sessions.getSession(sessionId);
      if (s) {
        setSubject(await Subjects.getSubject(s.subject_id));
        if (s.topic) setTopic(s.topic);
        const att = await Attendance.attendanceForSession(sessionId);
        if (att) {
          setAlreadyMarked(true);
          setStatus(att.status);
        }
      }
    })();
  }, [sessionId]);

  const finish = useCallback(
    async (withAI: boolean) => {
      const s = await Sessions.getSession(sessionId);
      if (!s) return;
      setBusy(true);
      try {
        // 1) Asistencia (si no estaba registrada)
        if (!alreadyMarked) {
          await Attendance.markAttendance({
            subjectId: s.subject_id,
            sessionId,
            status,
            retardoValue: subject?.retardo_value ?? 0.5,
          });
        }
        // 2) Guardar tema y cerrar
        await Sessions.closeSession(sessionId, { topic: topic.trim() || null });

        // 3) Procesamiento IA opcional
        if (withAI) {
          setProgress('Generando resumen...');
          await AIService.summarizeSession(sessionId);

          setProgress('Detectando tareas...');
          const tasks = await AIService.detectTasks(sessionId);
          for (const t of tasks) {
            await Tasks.createTask({
              subject_id: s.subject_id,
              session_id: sessionId,
              title: t.title,
              due_date: t.due_date,
              source: 'ia',
            });
          }

          setProgress('Creando preguntas de repaso...');
          const cards = await AIService.generateQuestions(sessionId);
          await Flashcards.createFlashcards(
            cards.map((c) => ({
              subject_id: s.subject_id,
              session_id: sessionId,
              question: c.question,
              answer: c.answer,
            })),
          );
        }

        nav.navigate('SubjectMemory', { subjectId: s.subject_id });
      } catch (e) {
        if (e instanceof MissingKeyError) {
          Alert.alert(
            'IA no configurada',
            'La clase se guardó, pero necesitas un API key en Ajustes para el procesamiento con IA.',
          );
          nav.navigate('SubjectMemory', { subjectId: s.subject_id });
        } else {
          Alert.alert('Error', (e as Error).message);
        }
      } finally {
        setBusy(false);
        setProgress('');
      }
    },
    [alreadyMarked, nav, sessionId, status, subject, topic],
  );

  const onCloseWithAI = async () => {
    if (!(await hasApiKey())) {
      Alert.alert(
        'Sin API key',
        'No has configurado la IA. Puedes cerrar la clase sin IA y activarla luego en Ajustes.',
      );
      return;
    }
    finish(true);
  };

  return (
    <Screen>
      <Text variant="title">Cerrar clase</Text>
      <Text variant="muted">{subject?.name}</Text>

      <Input
        label="Tema visto hoy"
        value={topic}
        onChangeText={setTopic}
        placeholder="Ej. Cargos y abonos en cuentas de activo"
        multiline
      />

      <View style={{ gap: spacing.sm }}>
        <Text variant="label">Asistencia</Text>
        {alreadyMarked ? (
          <Card>
            <Text variant="muted">
              Ya registraste: {ATTENDANCE_LABELS[status]}
            </Text>
          </Card>
        ) : (
          <View style={styles.attGrid}>
            {STATUSES.map((st) => (
              <Pressable
                key={st}
                onPress={() => setStatus(st)}
                style={[styles.attBtn, status === st && styles.attActive]}
              >
                <Text
                  weight="600"
                  color={status === st ? colors.white : colors.textMuted}
                >
                  {ATTENDANCE_LABELS[st]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {busy && progress ? (
        <Card accent={colors.primaryBorder}>
          <Text variant="body">⏳ {progress}</Text>
        </Card>
      ) : null}

      <Button label="Cerrar y procesar con IA" onPress={onCloseWithAI} loading={busy} />
      <Button
        label="Cerrar sin IA"
        onPress={() => finish(false)}
        variant="secondary"
        disabled={busy}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  attGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  attBtn: {
    flexGrow: 1,
    flexBasis: '47%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  attActive: { backgroundColor: colors.primaryStrong, borderColor: colors.primaryStrong },
});
