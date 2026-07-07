import { getDb } from '../sqlite';
import { newId } from '../../utils/ids';
import type { Note, NoteType } from '../types';

export interface NoteInput {
  subject_id: string;
  session_id?: string | null;
  type: NoteType;
  raw_text: string;
  understanding_level?: number | null;
}

export async function createNote(input: NoteInput): Promise<string> {
  const db = await getDb();
  const id = newId('not_');
  await db.runAsync(
    `INSERT INTO notes
      (id, subject_id, session_id, type, raw_text, cleaned_text, understanding_level, created_at)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?);`,
    id,
    input.subject_id,
    input.session_id ?? null,
    input.type,
    input.raw_text,
    input.understanding_level ?? null,
    new Date().toISOString(),
  );
  return id;
}

export async function setCleanedText(
  id: string,
  cleaned: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE notes SET cleaned_text = ? WHERE id = ?;',
    cleaned,
    id,
  );
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM notes WHERE id = ?;', id);
}

export async function notesForSession(sessionId: string): Promise<Note[]> {
  const db = await getDb();
  return db.getAllAsync<Note>(
    'SELECT * FROM notes WHERE session_id = ? ORDER BY created_at ASC;',
    sessionId,
  );
}

export async function notesForSubject(subjectId: string): Promise<Note[]> {
  const db = await getDb();
  return db.getAllAsync<Note>(
    'SELECT * FROM notes WHERE subject_id = ? ORDER BY created_at DESC;',
    subjectId,
  );
}

export async function getNote(id: string): Promise<Note | null> {
  const db = await getDb();
  return db.getFirstAsync<Note>('SELECT * FROM notes WHERE id = ?;', id);
}

// Notas marcadas como duda para el modo repaso.
export async function doubtsForSubject(subjectId: string): Promise<Note[]> {
  const db = await getDb();
  return db.getAllAsync<Note>(
    `SELECT * FROM notes
      WHERE subject_id = ? AND type IN ('duda','no_entendi')
      ORDER BY created_at DESC;`,
    subjectId,
  );
}
