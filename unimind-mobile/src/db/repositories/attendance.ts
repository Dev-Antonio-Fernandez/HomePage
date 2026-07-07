import { getDb } from '../sqlite';
import { newId } from '../../utils/ids';
import { isoDate } from '../../utils/dates';
import {
  defaultAbsenceValue,
  type AttendanceStatus,
} from '../../utils/attendance';
import type { AttendanceRecord } from '../types';

export async function markAttendance(params: {
  subjectId: string;
  sessionId?: string | null;
  status: AttendanceStatus;
  retardoValue?: number;
  comment?: string | null;
  date?: string;
}): Promise<string> {
  const db = await getDb();
  const id = newId('att_');
  const value = defaultAbsenceValue(params.status, params.retardoValue ?? 0.5);
  await db.runAsync(
    `INSERT INTO attendance_records
      (id, subject_id, session_id, date, status, absence_value, comment, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    id,
    params.subjectId,
    params.sessionId ?? null,
    params.date ?? isoDate(),
    params.status,
    value,
    params.comment ?? null,
    new Date().toISOString(),
  );
  return id;
}

export async function attendanceForSubject(
  subjectId: string,
): Promise<AttendanceRecord[]> {
  const db = await getDb();
  return db.getAllAsync<AttendanceRecord>(
    'SELECT * FROM attendance_records WHERE subject_id = ? ORDER BY date DESC, created_at DESC;',
    subjectId,
  );
}

// ¿Ya se marcó asistencia para una sesión concreta?
export async function attendanceForSession(
  sessionId: string,
): Promise<AttendanceRecord | null> {
  const db = await getDb();
  return db.getFirstAsync<AttendanceRecord>(
    'SELECT * FROM attendance_records WHERE session_id = ? LIMIT 1;',
    sessionId,
  );
}
