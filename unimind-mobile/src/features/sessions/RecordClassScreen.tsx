import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import {
  useAudioRecorder,
  AudioModule,
  setAudioModeAsync,
} from 'expo-audio';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, spacing } from '../../theme';
import { Sessions, Subjects } from '../../db';
import type { Subject } from '../../db/types';
import {
  AIService,
  transcribeSegments,
  MissingSttKeyError,
  MissingKeyError,
  AIError,
} from '../../ai';
import { LECTURE_PRESET, SEGMENT_SECONDS } from './recordingPreset';
import type { RootStackParamList } from '../../navigation/types';
import { useRootNav } from '../../navigation/hooks';

type R = RouteProp<RootStackParamList, 'RecordClass'>;
type Phase = 'idle' | 'recording' | 'recorded' | 'processing' | 'done';

function fmt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function RecordClassScreen() {
  const nav = useRootNav();
  const route = useRoute<R>();
  const { sessionId } = route.params;

  const recorder = useAudioRecorder(LECTURE_PRESET);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [segmentCount, setSegmentCount] = useState(0);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{ notes: number; tasks: number } | null>(
    null,
  );

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);
  const segments = useRef<string[]>([]);
  const rotating = useRef(false);

  useEffect(() => {
    (async () => {
      const s = await Sessions.getSession(sessionId);
      if (s) setSubject(await Subjects.getSubject(s.subject_id));
    })();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [sessionId]);

  // Corta el segmento actual y arranca el siguiente sin perder la grabación.
  const rotateSegment = async () => {
    if (rotating.current) return;
    rotating.current = true;
    try {
      await recorder.stop();
      if (recorder.uri) segments.current.push(recorder.uri);
      setSegmentCount(segments.current.length);
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      // Si falla la rotación, seguimos con lo grabado.
    } finally {
      rotating.current = false;
    }
  };

  const startRecording = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permiso denegado',
          'Necesito acceso al micrófono para grabar la clase.',
        );
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      segments.current = [];
      secondsRef.current = 0;
      setSegmentCount(0);
      setSeconds(0);
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('recording');
      timer.current = setInterval(() => {
        secondsRef.current += 1;
        setSeconds(secondsRef.current);
        if (secondsRef.current % SEGMENT_SECONDS === 0) rotateSegment();
      }, 1000);
    } catch (e) {
      Alert.alert('Error al grabar', (e as Error).message);
    }
  };

  const stopRecording = async () => {
    if (timer.current) clearInterval(timer.current);
    try {
      await recorder.stop();
      if (recorder.uri) segments.current.push(recorder.uri);
      setSegmentCount(segments.current.length);
      setPhase('recorded');
    } catch (e) {
      Alert.alert('Error al detener', (e as Error).message);
      setPhase('idle');
    }
  };

  const process = async () => {
    if (segments.current.length === 0) return;
    setPhase('processing');
    try {
      setProgress(
        `Transcribiendo ${segments.current.length} segmento(s) en paralelo…`,
      );
      const transcript = await transcribeSegments(segments.current);
      if (transcript.length === 0) {
        Alert.alert('Sin audio', 'No se detectó voz en la grabación.');
        setPhase('recorded');
        return;
      }
      setProgress('Organizando notas y tareas con IA…');
      const res = await AIService.structureTranscript(sessionId, transcript);
      setResult({ notes: res.notesAdded, tasks: res.tasksAdded });
      setPhase('done');
    } catch (e) {
      if (e instanceof MissingSttKeyError) {
        Alert.alert(
          'Transcripción no configurada',
          'Configura tu API key de transcripción (Groq) en Más → IA.',
        );
      } else if (e instanceof MissingKeyError) {
        Alert.alert('IA no configurada', 'Configura tu API key de texto en Más → IA.');
      } else {
        Alert.alert('Error', (e as AIError).message);
      }
      setPhase('recorded');
    } finally {
      setProgress('');
    }
  };

  const nextCutIn = SEGMENT_SECONDS - (seconds % SEGMENT_SECONDS);

  return (
    <Screen>
      <Text variant="title">Grabar clase</Text>
      <Text variant="muted">{subject?.name}</Text>

      <Card accent={phase === 'recording' ? colors.danger : colors.primaryBorder}>
        <View style={styles.center}>
          <Text style={styles.timer} weight="700">
            {fmt(seconds)}
          </Text>
          <Text variant="muted">
            {phase === 'recording'
              ? '🔴 Grabando…'
              : phase === 'recorded'
                ? 'Grabación lista'
                : phase === 'processing'
                  ? '⏳ Procesando'
                  : 'Listo para grabar'}
          </Text>
          {phase === 'recording' ? (
            <Text variant="faint">
              Segmentos guardados: {segmentCount} · próximo corte en {fmt(nextCutIn)}
            </Text>
          ) : null}
          {phase === 'recorded' ? (
            <Text variant="faint">{segmentCount} segmento(s) de ~20 min</Text>
          ) : null}
        </View>
      </Card>

      {phase === 'idle' ? (
        <Button label="● Empezar a grabar" onPress={startRecording} />
      ) : null}

      {phase === 'recording' ? (
        <Button label="■ Detener" onPress={stopRecording} variant="danger" />
      ) : null}

      {phase === 'recorded' ? (
        <>
          <Button label="✨ Transcribir y organizar con IA" onPress={process} />
          <Button
            label="Grabar de nuevo"
            onPress={startRecording}
            variant="secondary"
          />
        </>
      ) : null}

      {phase === 'processing' ? (
        <Card accent={colors.primaryBorder}>
          <Text variant="body">⏳ {progress}</Text>
          <Text variant="faint" style={{ marginTop: spacing.xs }}>
            Puede tardar según la duración de la clase.
          </Text>
        </Card>
      ) : null}

      {phase === 'done' && result ? (
        <>
          <Card accent={colors.primaryBorder}>
            <Text variant="subheading">¡Listo! 🎉</Text>
            <Text variant="body" style={{ marginTop: spacing.sm }}>
              📝 {result.notes} notas · 📌 {result.tasks} tareas detectadas
            </Text>
            <Text variant="muted" style={{ marginTop: spacing.xs }}>
              La IA separó lo explicativo (notas) de lo que el profe pidió (tareas).
            </Text>
          </Card>
          <Button
            label="Ver la clase"
            onPress={() => nav.navigate('ActiveClass', { sessionId })}
          />
        </>
      ) : null}

      <Text variant="faint">
        Audio ligero (mono) y corte automático cada 20 min: una clase de 2 h ≈ 22 MB
        en varios trozos, sin fallar por tamaño. Verifica que grabar la clase esté
        permitido.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  timer: { fontSize: 48, color: colors.text },
});
