import { getDb } from '../sqlite';
import { newId } from '../../utils/ids';
import type { ScheduleBlock, Subject } from '../types';

export interface ScheduleInput {
  subject_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  room_override?: string | null;
}

export interface ClassOfDay extends ScheduleBlock {
  subject: Subject;
}

export async function listBlocksForSubject(
  subjectId: string,
): Promise<ScheduleBlock[]> {
  const db = await getDb();
  return db.getAllAsync<ScheduleBlock>(
    'SELECT * FROM schedule_blocks WHERE subject_id = ? ORDER BY weekday, start_time;',
    subjectId,
  );
}

export async function addBlock(input: ScheduleInput): Promise<string> {
  const db = await getDb();
  const id = newId('blk_');
  await db.runAsync(
    `INSERT INTO schedule_blocks
      (id, subject_id, weekday, start_time, end_time, room_override, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    id,
    input.subject_id,
    input.weekday,
    input.start_time,
    input.end_time,
    input.room_override ?? null,
    new Date().toISOString(),
  );
  return id;
}

export async function deleteBlock(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM schedule_blocks WHERE id = ?;', id);
}

// Clases de un día de la semana, con su materia, ordenadas por hora.
export async function classesForWeekday(
  weekday: number,
): Promise<ClassOfDay[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ScheduleBlock & Record<string, unknown>>(
    `SELECT b.*,
        s.name AS s_name, s.professor AS s_professor, s.room AS s_room,
        s.color AS s_color, s.absence_limit AS s_absence_limit,
        s.retardo_value AS s_retardo_value, s.notes AS s_notes,
        s.created_at AS s_created_at, s.updated_at AS s_updated_at
     FROM schedule_blocks b
     JOIN subjects s ON s.id = b.subject_id
     WHERE b.weekday = ?
     ORDER BY b.start_time ASC;`,
    weekday,
  );

  return rows.map((r) => ({
    id: r.id,
    subject_id: r.subject_id,
    weekday: r.weekday,
    start_time: r.start_time,
    end_time: r.end_time,
    room_override: r.room_override,
    created_at: r.created_at,
    subject: {
      id: r.subject_id,
      name: r.s_name as string,
      professor: (r.s_professor as string) ?? null,
      room: (r.s_room as string) ?? null,
      color: r.s_color as string,
      absence_limit: r.s_absence_limit as number,
      retardo_value: r.s_retardo_value as number,
      notes: (r.s_notes as string) ?? null,
      created_at: r.s_created_at as string,
      updated_at: r.s_updated_at as string,
    },
  }));
}
