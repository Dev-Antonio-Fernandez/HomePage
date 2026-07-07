// Migraciones simples basadas en PRAGMA user_version.
// Cada entrada del array es una versión; se aplican en orden las que falten.

import type { SQLiteDatabase } from 'expo-sqlite';

const MIGRATIONS: string[] = [
  // v1 — esquema base del MVP
  `
  CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    professor TEXT,
    room TEXT,
    color TEXT NOT NULL DEFAULT '#8B5CF6',
    absence_limit INTEGER NOT NULL DEFAULT 5,
    retardo_value REAL NOT NULL DEFAULT 0.5,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS schedule_blocks (
    id TEXT PRIMARY KEY NOT NULL,
    subject_id TEXT NOT NULL,
    weekday INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    room_override TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS class_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    subject_id TEXT NOT NULL,
    date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    topic TEXT,
    status TEXT NOT NULL DEFAULT 'abierta',
    ai_summary TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY NOT NULL,
    subject_id TEXT NOT NULL,
    session_id TEXT,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    absence_value REAL NOT NULL DEFAULT 0,
    comment TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY NOT NULL,
    subject_id TEXT NOT NULL,
    session_id TEXT,
    type TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    cleaned_text TEXT,
    understanding_level INTEGER,
    created_at TEXT NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY NOT NULL,
    subject_id TEXT,
    session_id TEXT,
    title TEXT NOT NULL,
    due_date TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY NOT NULL,
    subject_id TEXT NOT NULL,
    session_id TEXT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty INTEGER NOT NULL DEFAULT 0,
    last_reviewed_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ai_events (
    id TEXT PRIMARY KEY NOT NULL,
    subject_id TEXT,
    session_id TEXT,
    action TEXT NOT NULL,
    input_hash TEXT,
    output_text TEXT,
    model TEXT,
    token_estimate INTEGER,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_schedule_subject ON schedule_blocks(subject_id);
  CREATE INDEX IF NOT EXISTS idx_schedule_weekday ON schedule_blocks(weekday);
  CREATE INDEX IF NOT EXISTS idx_sessions_subject ON class_sessions(subject_id);
  CREATE INDEX IF NOT EXISTS idx_attendance_subject ON attendance_records(subject_id);
  CREATE INDEX IF NOT EXISTS idx_notes_subject ON notes(subject_id);
  CREATE INDEX IF NOT EXISTS idx_notes_session ON notes(session_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_subject ON tasks(subject_id);
  CREATE INDEX IF NOT EXISTS idx_flashcards_subject ON flashcards(subject_id);
  `,
];

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version;',
  );
  const current = row?.user_version ?? 0;

  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[v]);
    });
    // PRAGMA no admite parámetros; v+1 es un entero controlado por nosotros.
    await db.execAsync(`PRAGMA user_version = ${v + 1};`);
  }
}
