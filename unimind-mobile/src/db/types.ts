// Tipos del modelo de datos (espejo de las tablas SQLite del brief).

import type { AttendanceStatus } from '../utils/attendance';

export type NoteType =
  | 'idea'
  | 'duda'
  | 'tarea'
  | 'formula'
  | 'ejemplo'
  | 'no_entendi';

export type SessionStatus = 'abierta' | 'cerrada';

export interface Subject {
  id: string;
  name: string;
  professor: string | null;
  room: string | null;
  color: string;
  absence_limit: number;
  retardo_value: number; // valor de falta de un retardo (0, 0.5 o 1)
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleBlock {
  id: string;
  subject_id: string;
  weekday: number; // 0=Dom ... 6=Sáb
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  room_override: string | null;
  created_at: string;
}

export interface ClassSession {
  id: string;
  subject_id: string;
  date: string; // YYYY-MM-DD
  start_time: string | null;
  end_time: string | null;
  topic: string | null;
  status: SessionStatus;
  ai_summary: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  subject_id: string;
  session_id: string | null;
  date: string;
  status: AttendanceStatus;
  absence_value: number;
  comment: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  subject_id: string;
  session_id: string | null;
  type: NoteType;
  raw_text: string;
  cleaned_text: string | null;
  understanding_level: number | null; // 0-3, autoevaluación
  created_at: string;
}

export interface Task {
  id: string;
  subject_id: string | null;
  session_id: string | null;
  title: string;
  due_date: string | null;
  source: 'manual' | 'ia';
  completed: number; // 0/1
  created_at: string;
}

export interface Flashcard {
  id: string;
  subject_id: string;
  session_id: string | null;
  question: string;
  answer: string;
  difficulty: number; // 0=nueva,1=fácil,2=media,3=difícil
  last_reviewed_at: string | null;
  created_at: string;
}

export interface AIEvent {
  id: string;
  subject_id: string | null;
  session_id: string | null;
  action: string;
  input_hash: string | null;
  output_text: string | null;
  model: string | null;
  token_estimate: number | null;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}
