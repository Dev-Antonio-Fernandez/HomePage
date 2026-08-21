import { getDb } from '../sqlite';
import { newId } from '../../utils/ids';
import type { Task } from '../types';

export interface TaskInput {
  subject_id?: string | null;
  session_id?: string | null;
  title: string;
  due_date?: string | null;
  source?: 'manual' | 'ia';
}

export interface TaskWithSubject extends Task {
  subject_name: string | null;
  subject_color: string | null;
}

export async function createTask(input: TaskInput): Promise<string> {
  const db = await getDb();
  const id = newId('tsk_');
  await db.runAsync(
    `INSERT INTO tasks
      (id, subject_id, session_id, title, due_date, source, completed, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?);`,
    id,
    input.subject_id ?? null,
    input.session_id ?? null,
    input.title,
    input.due_date ?? null,
    input.source ?? 'manual',
    new Date().toISOString(),
  );
  return id;
}

export async function toggleTask(id: string, completed: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE tasks SET completed = ? WHERE id = ?;',
    completed ? 1 : 0,
    id,
  );
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM tasks WHERE id = ?;', id);
}

export async function pendingTasks(): Promise<TaskWithSubject[]> {
  const db = await getDb();
  return db.getAllAsync<TaskWithSubject>(
    `SELECT t.*, s.name AS subject_name, s.color AS subject_color
     FROM tasks t
     LEFT JOIN subjects s ON s.id = t.subject_id
     WHERE t.completed = 0
     ORDER BY (t.due_date IS NULL), t.due_date ASC, t.created_at DESC;`,
  );
}

export async function tasksForSubject(subjectId: string): Promise<Task[]> {
  const db = await getDb();
  return db.getAllAsync<Task>(
    'SELECT * FROM tasks WHERE subject_id = ? ORDER BY completed ASC, created_at DESC;',
    subjectId,
  );
}

export async function countPending(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM tasks WHERE completed = 0;',
  );
  return row?.n ?? 0;
}
