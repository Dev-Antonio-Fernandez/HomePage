import { getDb } from '../sqlite';
import { newId } from '../../utils/ids';
import type { Flashcard } from '../types';

export interface FlashcardInput {
  subject_id: string;
  session_id?: string | null;
  question: string;
  answer: string;
}

export async function createFlashcard(input: FlashcardInput): Promise<string> {
  const db = await getDb();
  const id = newId('fla_');
  await db.runAsync(
    `INSERT INTO flashcards
      (id, subject_id, session_id, question, answer, difficulty, last_reviewed_at, created_at)
     VALUES (?, ?, ?, ?, ?, 0, NULL, ?);`,
    id,
    input.subject_id,
    input.session_id ?? null,
    input.question,
    input.answer,
    new Date().toISOString(),
  );
  return id;
}

export async function createFlashcards(
  cards: FlashcardInput[],
): Promise<number> {
  let n = 0;
  for (const c of cards) {
    await createFlashcard(c);
    n++;
  }
  return n;
}

// difficulty: 1=dominado (fácil), 2=media, 3=difícil (repasar pronto)
export async function reviewFlashcard(
  id: string,
  difficulty: number,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE flashcards SET difficulty = ?, last_reviewed_at = ? WHERE id = ?;',
    difficulty,
    new Date().toISOString(),
    id,
  );
}

export async function deleteFlashcard(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM flashcards WHERE id = ?;', id);
}

export async function flashcardsForSubject(
  subjectId: string,
): Promise<Flashcard[]> {
  const db = await getDb();
  // Prioriza las difíciles y las que nunca se han repasado.
  return db.getAllAsync<Flashcard>(
    `SELECT * FROM flashcards WHERE subject_id = ?
      ORDER BY (last_reviewed_at IS NOT NULL), difficulty DESC, created_at DESC;`,
    subjectId,
  );
}

export async function countFlashcards(subjectId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM flashcards WHERE subject_id = ?;',
    subjectId,
  );
  return row?.n ?? 0;
}
