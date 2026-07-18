import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import {
  useAudioRecorder,
  RecordingPresets,
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
  transcribeAudio,
  MissingSttKeyError,
  MissingKeyError,
  AIError,
} from '../../ai';
import type { RootStackParamList } from '../../navigation/types';
import { useRootNav } from '../../navigation/hooks';

type R = RouteProp<RootStackParamList, 'RecordClass'>;
type Phase = 'idle' | 'recording' | 'recorded' | 'processing' | 'done';

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function RecordClassScreen() {
  const nav = useRootNav();
  const route = useRoute<R>();
  const { sessionId } = route.params;

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<{ notes: number; tasks: number } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const s = await Sessions.getSession(sessionId);
      if (s) setSubject(await Subjects.getSubject(s.subject_id));
    })();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [sessionId]);

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
      await recorder.prepareToRecordAsync();
      recorder.record();
      setSeconds(0);
      setPhase('recording');
      timer.current = setInterval(() => setSeconds((v) => v + 1), 1000);
    } catch (e) {
      Alert.alert('Error al grabar', (e as Error).message);
    }
  };

  const stopRecording = async () => {
    if (timer.current) clearInterval(timer.current);
    try {
      await recorder.stop();
      setAudioUri(recorder.uri ?? null);
      setPhase('recorded');
    } catch (e) {
      Alert.alert('Error al detener', (e as Error).message);
      setPhase('idle');
    }
  };

  const process = async () => {
    if (!audioUri) return;
    setPhase('processing');
    try {
      setProgress('Transcribiendo la clase…');
      const transcript = await transcribeAudio(audioUri);
      if (transcript.length === 0) {
        Alert.alert('Sin audio', 'No se detectó voz en la grabación.');
        setPhase('recorded');
        return;
      }
      setProgress('Organizando notas y tareas…');
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

  return (
    <Screen>
      <Text variant="title">Grabar clase</Text>
      <Text variant="muted">{subject?.name}</Text>

      {/* Estado de grabación */}
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
        Consejo: usa el micrófono del teléfono cerca del profesor. Verifica que
        grabar la clase esté permitido.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  timer: { fontSize: 48, color: colors.text },
});
