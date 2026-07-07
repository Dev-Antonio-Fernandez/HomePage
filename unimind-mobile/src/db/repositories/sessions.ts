import { getDb } from '../sqlite';
import { newId } from '../../utils/ids';
import { isoDate, currentHM } from '../../utils/dates';
import type { ClassSession } from '../types';

export async function openSession(
  subjectId: string,
  opts: { start_time?: string; end_time?: string } = {},
): Promise<string> {
  const db = await getDb();
  const id = newId('ses_');
  await db.runAsync(
    `INSERT INTO class_sessions
      (id, subject_id, date, start_time, end_time, topic, status, ai_summary, created_at)
     VALUES (?, ?, ?, ?, ?, NULL, 'abierta', NULL, ?);`,
    id,
    subjectId,
    isoDate(),
    opts.start_time ?? currentHM(),
    opts.end_time ?? null,
    new Date().toISOString(),
  );
  return id;
}

export async function getSession(id: string): Promise<ClassSession | null> {
  const db = await getDb();
  return db.getFirstAsync<ClassSession>(
    'SELECT * FROM class_sessions WHERE id = ?;',
    id,
  );
}

export async function closeSession(
  id: string,
  data: { topic?: string | null; ai_summary?: string | null },
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE class_sessions
      SET status = 'cerrada', topic = ?, ai_summary = ?, end_time = ?
     WHERE id = ?;`,
    data.topic ?? null,
    data.ai_summary ?? null,
    currentHM(),
    id,
  );
}

export async function setSessionSummary(
  id: string,
  summary: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE class_sessions SET ai_summary = ? WHERE id = ?;',
    summary,
    id,
  );
}

// Sesión de hoy para una materia (para reanudar en vez de duplicar).
export async function todaySessionForSubject(
  subjectId: string,
): Promise<ClassSession | null> {
  const db = await getDb();
  return db.getFirstAsync<ClassSession>(
    `SELECT * FROM class_sessions
      WHERE subject_id = ? AND date = ?
      ORDER BY created_at DESC LIMIT 1;`,
    subjectId,
    isoDate(),
  );
}

// Reanuda la sesión de hoy si existe; si no, crea una nueva.
export async function resumeOrOpen(
  subjectId: string,
  opts: { start_time?: string; end_time?: string } = {},
): Promise<string> {
  const existing = await todaySessionForSubject(subjectId);
  if (existing) return existing.id;
  return openSession(subjectId, opts);
}

export async function lastSessionForSubject(
  subjectId: string,
): Promise<ClassSession | null> {
  const db = await getDb();
  return db.getFirstAsync<ClassSession>(
    `SELECT * FROM class_sessions
      WHERE subject_id = ?
      ORDER BY date DESC, created_at DESC LIMIT 1;`,
    subjectId,
  );
}

// Última clase con resumen para el bloque "Última clase" del inicio.
export async function mostRecentSession(): Promise<
  (ClassSession & { subject_name: string; subject_color: string }) | null
> {
  const db = await getDb();
  return db.getFirstAsync(
    `SELECT cs.*, s.name AS subject_name, s.color AS subject_color
     FROM class_sessions cs
     JOIN subjects s ON s.id = cs.subject_id
     ORDER BY cs.date DESC, cs.created_at DESC LIMIT 1;`,
  );
}

export async function sessionsForSubject(
  subjectId: string,
): Promise<ClassSession[]> {
  const db = await getDb();
  return db.getAllAsync<ClassSession>(
    'SELECT * FROM class_sessions WHERE subject_id = ? ORDER BY date DESC, created_at DESC;',
    subjectId,
  );
}
