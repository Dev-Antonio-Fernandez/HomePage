import { getDb } from '../sqlite';
import { newId } from '../../utils/ids';
import type { Subject } from '../types';

export interface SubjectInput {
  name: string;
  professor?: string | null;
  room?: string | null;
  color: string;
  absence_limit: number;
  retardo_value?: number;
  notes?: string | null;
}

export async function listSubjects(): Promise<Subject[]> {
  const db = await getDb();
  return db.getAllAsync<Subject>(
    'SELECT * FROM subjects ORDER BY name COLLATE NOCASE ASC;',
  );
}

export async function getSubject(id: string): Promise<Subject | null> {
  const db = await getDb();
  return db.getFirstAsync<Subject>('SELECT * FROM subjects WHERE id = ?;', id);
}

export async function createSubject(input: SubjectInput): Promise<string> {
  const db = await getDb();
  const id = newId('sub_');
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO subjects
      (id, name, professor, room, color, absence_limit, retardo_value, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    id,
    input.name,
    input.professor ?? null,
    input.room ?? null,
    input.color,
    input.absence_limit,
    input.retardo_value ?? 0.5,
    input.notes ?? null,
    now,
    now,
  );
  return id;
}

export async function updateSubject(
  id: string,
  input: SubjectInput,
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE subjects SET
      name = ?, professor = ?, room = ?, color = ?,
      absence_limit = ?, retardo_value = ?, notes = ?, updated_at = ?
     WHERE id = ?;`,
    input.name,
    input.professor ?? null,
    input.room ?? null,
    input.color,
    input.absence_limit,
    input.retardo_value ?? 0.5,
    input.notes ?? null,
    now,
    id,
  );
}

export async function deleteSubject(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM subjects WHERE id = ?;', id);
}

// Faltas usadas por materia (suma de absence_value).
export async function absencesUsed(subjectId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ used: number }>(
    'SELECT COALESCE(SUM(absence_value), 0) AS used FROM attendance_records WHERE subject_id = ?;',
    subjectId,
  );
  return row?.used ?? 0;
}
