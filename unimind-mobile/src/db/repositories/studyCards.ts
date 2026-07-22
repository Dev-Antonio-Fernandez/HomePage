import { getDb } from '../sqlite';
import { newId } from '../../utils/ids';

// Estructura visual de un apunte de estudio (se guarda como JSON en content).
export interface StudyCardContent {
  idea: string; // idea en una frase
  formula_latex?: string | null; // fórmula en LaTeX (opcional)
  breakdown?: { symbol: string; meaning: string }[]; // desglose de la fórmula
  steps?: string[]; // ejemplo numérico paso a paso
  check?: string[]; // 1-2 preguntas de verificación
}

export interface StudyCard {
  id: string;
  subject_id: string;
  session_id: string | null;
  title: string;
  content: StudyCardContent;
  created_at: string;
}

interface Row {
  id: string;
  subject_id: string;
  session_id: string | null;
  title: string;
  content: string;
  created_at: string;
}

function parse(r: Row): StudyCard {
  let content: StudyCardContent = { idea: '' };
  try {
    content = JSON.parse(r.content) as StudyCardContent;
  } catch {
    // contenido corrupto: deja idea vacía
  }
  return { ...r, content };
}

export async function createStudyCard(params: {
  subject_id: string;
  session_id?: string | null;
  title: string;
  content: StudyCardContent;
}): Promise<string> {
  const db = await getDb();
  const id = newId('stc_');
  await db.runAsync(
    `INSERT INTO study_cards (id, subject_id, session_id, title, content, created_at)
     VALUES (?, ?, ?, ?, ?, ?);`,
    id,
    params.subject_id,
    params.session_id ?? null,
    params.title,
    JSON.stringify(params.content),
    new Date().toISOString(),
  );
  return id;
}

export async function cardsForSession(sessionId: string): Promise<StudyCard[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    'SELECT * FROM study_cards WHERE session_id = ? ORDER BY created_at ASC;',
    sessionId,
  );
  return rows.map(parse);
}

export async function cardsForSubject(subjectId: string): Promise<StudyCard[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Row>(
    'SELECT * FROM study_cards WHERE subject_id = ? ORDER BY created_at DESC;',
    subjectId,
  );
  return rows.map(parse);
}

export async function countForSession(sessionId: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM study_cards WHERE session_id = ?;',
    sessionId,
  );
  return row?.n ?? 0;
}

export async function deleteCardsForSession(sessionId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM study_cards WHERE session_id = ?;', sessionId);
}
