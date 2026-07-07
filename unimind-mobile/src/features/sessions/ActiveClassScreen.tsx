import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { colors, spacing, radius, fontSize } from '../../theme';
import { Notes, Sessions, Subjects } from '../../db';
import type { ClassSession, Note, Subject } from '../../db/types';
import { NOTE_TYPES, noteTypeMeta } from '../notes/noteTypes';
import type { NoteType } from '../../db/types';
import type { RootStackParamList } from '../../navigation/types';
import { useRootNav } from '../../navigation/hooks';

type R = RouteProp<RootStackParamList, 'ActiveClass'>;

export function ActiveClassScreen() {
  const nav = useRootNav();
  const route = useRoute<R>();
  const { sessionId } = route.params;

  const [session, setSession] = useState<ClassSession | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [active, setActive] = useState<NoteType | null>(null);
  const [draft, setDraft] = useState('');

  const load = useCallback(async () => {
    const s = await Sessions.getSession(sessionId);
    setSession(s);
    if (s) {
      setSubject(await Subjects.getSubject(s.subject_id));
      setNotes(await Notes.notesForSession(sessionId));
    }
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const saveNote = async () => {
    if (!session || !active || draft.trim().length === 0) {
      setActive(null);
      setDraft('');
      return;
    }
    await Notes.createNote({
      subject_id: session.subject_id,
      session_id: session.id,
      type: active,
      raw_text: draft.trim(),
    });
    setDraft('');
    setActive(null);
    load();
  };

  return (
    <Screen>
      {/* Cabecera */}
      <Card accent={subject?.color}>
        <Text variant="heading">{subject?.name ?? 'Clase'}</Text>
        <Text variant="muted">
          {session?.start_time ?? ''}
          {session?.status === 'cerrada' ? '  ·  Cerrada' : '  ·  En curso'}
        </Text>
        {session?.topic ? (
          <Text variant="body" style={{ marginTop: spacing.sm }}>
            Tema: {session.topic}
          </Text>
        ) : null}
      </Card>

      {/* Botones de nota rápida */}
      <View style={{ gap: spacing.sm }}>
        <Text variant="subheading">Captura rápida</Text>
        <View style={styles.grid}>
          {NOTE_TYPES.map((t) => (
            <Pressable
              key={t.type}
              onPress={() => {
                setActive(active === t.type ? null : t.type);
                setDraft('');
              }}
              style={[
                styles.typeBtn,
                active === t.type && { borderColor: t.color, backgroundColor: colors.surfaceAlt },
              ]}
            >
              <Text style={{ fontSize: 20 }}>{t.emoji}</Text>
              <Text variant="faint" style={{ textAlign: 'center' }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {active ? (
          <Card>
            <Text variant="label" color={noteTypeMeta(active).color}>
              {noteTypeMeta(active).emoji} {noteTypeMeta(active).label}
            </Text>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Escribe rápido..."
              placeholderTextColor={colors.textFaint}
              style={styles.draftInput}
              autoFocus
              multiline
              onSubmitEditing={saveNote}
            />
            <Button label="Guardar nota" onPress={saveNote} />
          </Card>
        ) : null}
      </View>

      {/* Cronología */}
      <View style={{ gap: spacing.sm }}>
        <Text variant="subheading">Cronología</Text>
        {notes.length === 0 ? (
          <Card>
            <Text variant="muted">Aún no hay notas. Toca un botón para capturar.</Text>
          </Card>
        ) : (
          notes.map((n) => {
            const meta = noteTypeMeta(n.type);
            return (
              <Card key={n.id} style={{ borderLeftColor: meta.color, borderLeftWidth: 3 }}>
                <View style={styles.noteHead}>
                  <Text variant="label" color={meta.color}>
                    {meta.emoji} {meta.label}
                  </Text>
                  <Text variant="faint">
                    {new Date(n.created_at).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text variant="body">{n.cleaned_text || n.raw_text}</Text>
              </Card>
            );
          })
        )}
      </View>

      {session?.status !== 'cerrada' ? (
        <Button
          label="Cerrar clase"
          onPress={() => nav.navigate('CloseClass', { sessionId })}
          variant="secondary"
        />
      ) : (
        <Button
          label="Ver memoria de la materia"
          onPress={() => session && nav.navigate('SubjectMemory', { subjectId: session.subject_id })}
          variant="secondary"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeBtn: {
    width: '31.5%',
    aspectRatio: 1.4,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  draftInput: {
    color: colors.text,
    fontSize: fontSize.md,
    minHeight: 60,
    textAlignVertical: 'top',
    marginVertical: spacing.md,
  },
  noteHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
});
