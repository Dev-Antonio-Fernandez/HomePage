import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';
import { runMigrations } from './migrations';

const DB_NAME = 'unimind.db';

let dbPromise: Promise<SQLiteDatabase> | null = null;

// Devuelve una única instancia de la base de datos, ya migrada.
export function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await runMigrations(db);
      return db;
    })();
  }
  return dbPromise;
}
