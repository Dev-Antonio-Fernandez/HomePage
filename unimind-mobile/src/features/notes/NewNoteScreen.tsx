import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { colors, spacing, radius } from '../../theme';
import { Notes, Subjects } from '../../db';
import type { Subject, NoteType } from '../../db/types';
import { NOTE_TYPES } from './noteTypes';
import { AIService, MissingKeyError } from '../../ai';
import type { RootStackParamList } from '../../navigation/types';
import { useRootNav } from '../../navigation/hooks';

type R = RouteProp<RootStackParamList, 'NewNote'>;

export function NewNoteScreen() {
  const nav = useRootNav();
  const route = useRoute<R>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState<string | undefined>(route.params?.subjectId);
  const [type, setType] = useState<NoteType>('idea');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await Subjects.listSubjects();
      setSubjects(list);
      if (!subjectId && list.length > 0) setSubjectId(list[0].id);
    })();
  }, [subjectId]);

  const save = async () => {
    if (!subjectId) {
      Alert.alert('Elige una materia');
      return;
    }
    if (text.trim().length === 0) {
      Alert.alert('Escribe algo en la nota');
      return;
    }
    setSaving(true);
    try {
      await Notes.createNote({
        subject_id: subjectId,
        session_id: route.params?.sessionId ?? null,
        type,
        raw_text: text.trim(),
      });
      nav.goBack();
    } finally {
      setSaving(false);
    }
  };

  const cleanWithAI = async () => {
    if (!subjectId || text.trim().length === 0) return;
    const subject = subjects.find((s) => s.id === subjectId);
    setCleaning(true);
    try {
      const cleaned = await AIService.cleanNote({
        subject: subject?.name ?? 'Materia',
        noteType: type,
        rawText: text.trim(),
        subjectId,
      });
      setText(cleaned);
    } catch (e) {
      if (e instanceof MissingKeyError) {
        Alert.alert('IA no configurada', 'Configura tu API key en Ajustes.');
      } else {
        Alert.alert('Error', (e as Error).message);
      }
    } finally {
      setCleaning(false);
    }
  };

  if (subjects.length === 0) {
    return (
      <Screen>
        <EmptyState
          emoji="📚"
          title="Primero crea una materia"
          message="Necesitas al menos una materia para guardar notas."
        >
          <Button
            label="Crear materia"
            onPress={() => {
              nav.goBack();
              nav.navigate('SubjectForm', {});
            }}
            fullWidth={false}
            style={{ marginTop: spacing.lg }}
          />
        </EmptyState>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="label">Materia</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {subjects.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setSubjectId(s.id)}
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

      <Text variant="label">Tipo de nota</Text>
      <View style={styles.typeGrid}>
        {NOTE_TYPES.map((t) => (
          <Pressable
            key={t.type}
            onPress={() => setType(t.type)}
            style={[
              styles.typeChip,
              type === t.type && { borderColor: t.color, backgroundColor: colors.surfaceAlt },
            ]}
          >
            <Text>{t.emoji}</Text>
            <Text variant="faint">{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <Input label="Nota" value={text} onChangeText={setText} placeholder="Escribe tu nota..." multiline />

      <Button label="Limpiar con IA ✨" onPress={cleanWithAI} variant="secondary" loading={cleaning} />
      <Button label="Guardar nota" onPress={save} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
