// Servicio de IA con interfaz abstracta y modelos configurables.
// Cliente compatible con la API de OpenAI (funciona con OpenAI, DeepSeek,
// Kimi/Moonshot y cualquier endpoint compatible). La clave y el proveedor
// se configuran en Ajustes; aquí no se hardcodea nada sensible.

import { getApiKey, loadConfig, type AIConfig } from './config';
import {
  cleanNotePrompt,
  summarizePrompt,
  questionsPrompt,
  detectTasksPrompt,
  explainPrompt,
  structurePrompt,
  studyCardsPrompt,
} from './prompts';
import {
  getDb,
  Notes,
  Sessions,
  Subjects,
  Tasks,
  StudyCards,
} from '../db';
import type { StudyCardContent } from '../db/repositories/studyCards';
import { newId } from '../utils/ids';
import type { NoteType } from '../db/types';

export class AIError extends Error {}
export class MissingKeyError extends AIError {
  constructor() {
    super('Falta configurar el API key de IA en Ajustes.');
  }
}

type Tier = 'fast' | 'main' | 'advanced';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function pickModel(cfg: AIConfig, tier: Tier): string {
  if (tier === 'advanced') return cfg.modelAdvanced;
  if (tier === 'main') return cfg.modelMain;
  return cfg.modelFast;
}

async function logEvent(params: {
  action: string;
  model: string;
  output: string;
  subjectId?: string | null;
  sessionId?: string | null;
}) {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO ai_events
        (id, subject_id, session_id, action, input_hash, output_text, model, token_estimate, created_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?);`,
      newId('aie_'),
      params.subjectId ?? null,
      params.sessionId ?? null,
      params.action,
      params.output.slice(0, 4000),
      params.model,
      Math.ceil(params.output.length / 4),
      new Date().toISOString(),
    );
  } catch {
    // El log de IA no debe romper el flujo del usuario.
  }
}

async function chat(
  messages: ChatMessage[],
  tier: Tier,
  meta: { action: string; subjectId?: string | null; sessionId?: string | null },
): Promise<string> {
  const [key, cfg] = await Promise.all([getApiKey(), loadConfig()]);
  if (!key) throw new MissingKeyError();

  const model = pickModel(cfg, tier);
  const url = `${cfg.baseUrl.replace(/\/$/, '')}/chat/completions`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
      }),
    });
  } catch (e) {
    throw new AIError(
      'No se pudo conectar con la IA. Revisa tu conexión o la URL del proveedor.',
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 401) {
      throw new AIError('API key inválida o sin permisos (401).');
    }
    throw new AIError(
      `Error de la IA (${res.status}). ${body.slice(0, 160)}`,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim() ?? '';
  await logEvent({
    action: meta.action,
    model,
    output: content,
    subjectId: meta.subjectId,
    sessionId: meta.sessionId,
  });
  return content;
}

// Extrae el primer bloque JSON de una respuesta (tolera ```json ... ```).
function parseJson<T>(text: string): T | null {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

// ---- Funciones IA del MVP ----

export async function cleanNote(params: {
  subject: string;
  noteType: NoteType;
  rawText: string;
  subjectId?: string;
  noteId?: string;
}): Promise<string> {
  const p = cleanNotePrompt(params);
  const out = await chat(
    [
      { role: 'system', content: p.system },
      { role: 'user', content: p.user },
    ],
    'fast',
    { action: 'cleanNote', subjectId: params.subjectId },
  );
  if (params.noteId) await Notes.setCleanedText(params.noteId, out);
  return out;
}

export async function summarizeSession(sessionId: string): Promise<string> {
  const session = await Sessions.getSession(sessionId);
  if (!session) throw new AIError('Sesión no encontrada.');
  const subject = await Subjects.getSubject(session.subject_id);
  const notes = await Notes.notesForSession(sessionId);
  const p = summarizePrompt({
    subject: subject?.name ?? 'Materia',
    topic: session.topic,
    notes,
  });
  const out = await chat(
    [
      { role: 'system', content: p.system },
      { role: 'user', content: p.user },
    ],
    'main',
    { action: 'summarizeSession', subjectId: session.subject_id, sessionId },
  );
  await Sessions.setSessionSummary(sessionId, out);
  return out;
}

export interface GeneratedCard {
  question: string;
  answer: string;
}

export async function generateQuestions(
  sessionId: string,
): Promise<GeneratedCard[]> {
  const session = await Sessions.getSession(sessionId);
  if (!session) throw new AIError('Sesión no encontrada.');
  const subject = await Subjects.getSubject(session.subject_id);
  const notes = await Notes.notesForSession(sessionId);
  const p = questionsPrompt({ subject: subject?.name ?? 'Materia', notes });
  const out = await chat(
    [
      { role: 'system', content: p.system },
      { role: 'user', content: p.user },
    ],
    'main',
    { action: 'generateQuestions', subjectId: session.subject_id, sessionId },
  );
  const parsed = parseJson<{ flashcards?: GeneratedCard[] }>(out);
  return (parsed?.flashcards ?? []).filter((c) => c.question && c.answer);
}

export interface DetectedTask {
  title: string;
  due_date: string | null;
}

export async function detectTasks(sessionId: string): Promise<DetectedTask[]> {
  const session = await Sessions.getSession(sessionId);
  if (!session) throw new AIError('Sesión no encontrada.');
  const subject = await Subjects.getSubject(session.subject_id);
  const notes = await Notes.notesForSession(sessionId);
  const p = detectTasksPrompt({ subject: subject?.name ?? 'Materia', notes });
  const out = await chat(
    [
      { role: 'system', content: p.system },
      { role: 'user', content: p.user },
    ],
    'fast',
    { action: 'detectTasks', subjectId: session.subject_id, sessionId },
  );
  const parsed = parseJson<{ tasks?: DetectedTask[] }>(out);
  return (parsed?.tasks ?? []).filter((t) => t.title);
}

export interface StructuredResult {
  summary: string;
  notesAdded: number;
  tasksAdded: number;
}

const ALLOWED_NOTE_TYPES: NoteType[] = ['idea', 'duda', 'formula', 'ejemplo'];

// A partir de una transcripción: genera resumen, y reparte el contenido en
// notas de estudio y tareas (según lo que dijo el profesor).
export async function structureTranscript(
  sessionId: string,
  transcript: string,
): Promise<StructuredResult> {
  const session = await Sessions.getSession(sessionId);
  if (!session) throw new AIError('Sesión no encontrada.');
  const subject = await Subjects.getSubject(session.subject_id);

  const p = structurePrompt({
    subject: subject?.name ?? 'Materia',
    transcript,
  });
  const out = await chat(
    [
      { role: 'system', content: p.system },
      { role: 'user', content: p.user },
    ],
    'main',
    { action: 'structureTranscript', subjectId: session.subject_id, sessionId },
  );

  const parsed = parseJson<{
    summary?: string;
    notes?: { type?: string; text?: string }[];
    tasks?: { title?: string; due_date?: string | null }[];
  }>(out);

  const summary = parsed?.summary?.trim() ?? '';
  if (summary) await Sessions.setSessionSummary(sessionId, summary);

  let notesAdded = 0;
  for (const n of parsed?.notes ?? []) {
    if (!n.text) continue;
    const type = (ALLOWED_NOTE_TYPES as string[]).includes(n.type ?? '')
      ? (n.type as NoteType)
      : 'idea';
    await Notes.createNote({
      subject_id: session.subject_id,
      session_id: sessionId,
      type,
      raw_text: n.text,
    });
    notesAdded++;
  }

  let tasksAdded = 0;
  for (const t of parsed?.tasks ?? []) {
    if (!t.title) continue;
    await Tasks.createTask({
      subject_id: session.subject_id,
      session_id: sessionId,
      title: t.title,
      due_date: t.due_date ?? null,
      source: 'ia',
    });
    tasksAdded++;
  }

  return { summary, notesAdded, tasksAdded };
}

interface RawStudyCard extends StudyCardContent {
  title?: string;
}

// Genera apuntes de estudio visuales para una clase y los guarda.
export async function generateStudyCards(sessionId: string): Promise<number> {
  const session = await Sessions.getSession(sessionId);
  if (!session) throw new AIError('Sesión no encontrada.');
  const subject = await Subjects.getSubject(session.subject_id);
  const notes = await Notes.notesForSession(sessionId);
  if (notes.length === 0) {
    throw new AIError('Esta clase no tiene notas para generar apuntes.');
  }

  const p = studyCardsPrompt({
    subject: subject?.name ?? 'Materia',
    topic: session.topic,
    notes,
  });
  const out = await chat(
    [
      { role: 'system', content: p.system },
      { role: 'user', content: p.user },
    ],
    'main',
    { action: 'generateStudyCards', subjectId: session.subject_id, sessionId },
  );

  const parsed = parseJson<{ cards?: RawStudyCard[] }>(out);
  const cards = parsed?.cards ?? [];
  if (cards.length === 0) return 0;

  // Reemplaza los apuntes previos de esta clase.
  await StudyCards.deleteCardsForSession(sessionId);

  let n = 0;
  for (const c of cards) {
    if (!c.title || !c.idea) continue;
    await StudyCards.createStudyCard({
      subject_id: session.subject_id,
      session_id: sessionId,
      title: c.title,
      content: {
        idea: c.idea,
        formula_latex: c.formula_latex ?? null,
        breakdown: c.breakdown ?? [],
        steps: c.steps ?? [],
        check: c.check ?? [],
      },
    });
    n++;
  }
  return n;
}

export async function explainDoubt(params: {
  subjectId: string;
  question: string;
}): Promise<string> {
  const subject = await Subjects.getSubject(params.subjectId);
  const notes = await Notes.notesForSubject(params.subjectId);
  const context = notes
    .slice(0, 20)
    .map((n) => `- ${n.cleaned_text || n.raw_text}`)
    .join('\n');
  const p = explainPrompt({
    subject: subject?.name ?? 'Materia',
    context,
    question: params.question,
  });
  return chat(
    [
      { role: 'system', content: p.system },
      { role: 'user', content: p.user },
    ],
    'main',
    { action: 'explainDoubt', subjectId: params.subjectId },
  );
}
