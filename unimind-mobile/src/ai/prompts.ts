// Prompts base del brief. Se mantienen centralizados para poder ajustarlos
// sin tocar la lógica del servicio.

import type { Note, NoteType } from '../db/types';

const NOTE_TYPE_LABEL: Record<NoteType, string> = {
  idea: 'Idea',
  duda: 'Duda',
  tarea: 'Tarea',
  formula: 'Fórmula',
  ejemplo: 'Ejemplo',
  no_entendi: 'No entendí',
};

export function cleanNotePrompt(params: {
  subject: string;
  noteType: NoteType;
  rawText: string;
}) {
  const system =
    'Eres un asistente académico. Limpia notas rápidas del usuario sin inventar datos.';
  const user = `Materia: ${params.subject}. Tipo de nota: ${NOTE_TYPE_LABEL[params.noteType]}. Nota original: ${params.rawText}

Responde en español con:
1. Nota limpia y clara.
2. Si aplica, concepto clave.
3. Si aplica, duda o tarea detectada.
No agregues información que no esté implícita.`;
  return { system, user };
}

function notesToContext(notes: Note[]): string {
  if (notes.length === 0) return '(Sin notas registradas.)';
  return notes
    .map((n) => {
      const label = NOTE_TYPE_LABEL[n.type];
      return `- [${label}] ${n.cleaned_text || n.raw_text}`;
    })
    .join('\n');
}

export function summarizePrompt(params: {
  subject: string;
  topic: string | null;
  notes: Note[];
}) {
  const system =
    'Eres un asistente académico. Resume clases usando solo las notas del usuario, sin inventar.';
  const user = `Materia: ${params.subject}. Tema: ${params.topic || 'Sin especificar'}.
Notas de la clase:
${notesToContext(params.notes)}

Genera un resumen claro de la clase con exactamente 5 puntos importantes en español. Sé conciso.`;
  return { system, user };
}

export function questionsPrompt(params: { subject: string; notes: Note[] }) {
  const system =
    'Eres un tutor. Creas preguntas de repaso basadas solo en las notas del usuario.';
  const user = `Materia: ${params.subject}.
Notas:
${notesToContext(params.notes)}

Genera preguntas de repaso tipo examen en español. Devuelve SOLO un JSON válido con esta forma:
{"flashcards":[{"question":"...","answer":"..."}]}
Entre 4 y 8 tarjetas. No agregues texto fuera del JSON.`;
  return { system, user };
}

export function detectTasksPrompt(params: { subject: string; notes: Note[] }) {
  const system =
    'Eres un asistente que detecta tareas y entregas mencionadas en notas, sin inventar.';
  const user = `Materia: ${params.subject}.
Notas:
${notesToContext(params.notes)}

Extrae tareas o entregas mencionadas. Devuelve SOLO un JSON válido:
{"tasks":[{"title":"...","due_date":null}]}
Si no hay tareas claras, devuelve {"tasks":[]}. due_date en formato YYYY-MM-DD o null.`;
  return { system, user };
}

export function explainPrompt(params: {
  subject: string;
  context: string;
  question: string;
}) {
  const system =
    'Eres tutor personal del usuario. Usa solo el contexto de sus notas.';
  const user = `Contexto de la materia: ${params.context || '(sin contexto)'}
Pregunta del usuario: ${params.question}

Responde en español con explicación clara, un ejemplo y 3 preguntas cortas para verificar comprensión.`;
  return { system, user };
}

// Clasifica una transcripción de clase en notas de estudio vs tareas.
export function structurePrompt(params: {
  subject: string;
  transcript: string;
}) {
  const system =
    'Eres un asistente académico que organiza la transcripción de una clase. ' +
    'Distingues entre conocimiento para estudiar (notas) y cosas por hacer (tareas). ' +
    'No inventas nada que no esté en la transcripción.';
  const user = `Materia: ${params.subject}.
Transcripción de la clase:
"""
${params.transcript}
"""

Analiza la transcripción y devuelve SOLO un JSON válido con esta forma exacta:
{
  "summary": "resumen breve de la clase en 5 puntos",
  "notes": [{"type": "idea|duda|formula|ejemplo", "text": "..."}],
  "tasks": [{"title": "...", "due_date": null}]
}

Reglas:
- "notes": conceptos, explicaciones, fórmulas o ejemplos importantes para estudiar.
- "tasks": SOLO cosas que el profesor pidió hacer o entregar (tareas, ejercicios, lecturas, entregas, exámenes). Si menciona una fecha, ponla en due_date con formato YYYY-MM-DD; si no, null.
- Si no hay tareas claras, devuelve "tasks": [].
- Responde en español. No agregues texto fuera del JSON.`;
  return { system, user };
}

// Genera apuntes de estudio VISUALES a partir de las notas de una clase.
export function studyCardsPrompt(params: {
  subject: string;
  topic: string | null;
  notes: Note[];
}) {
  const system =
    'Eres un tutor que crea apuntes de estudio claros y visuales para un ' +
    'estudiante que aprende mejor con ejemplos y fórmulas bien desglosadas. ' +
    'No inventas contenido que no esté en las notas.';
  const user = `Materia: ${params.subject}. Tema: ${params.topic || 'Sin especificar'}.
Notas de la clase:
${notesToContext(params.notes)}

Crea apuntes de estudio. Devuelve SOLO un JSON válido con esta forma exacta:
{
  "cards": [
    {
      "title": "nombre del concepto",
      "idea": "explicación en UNA frase simple y clara",
      "formula_latex": "fórmula en LaTeX o null si el concepto no tiene fórmula",
      "breakdown": [{"symbol": "σ", "meaning": "qué significa ese símbolo en español simple"}],
      "steps": ["ejemplo numérico paso a paso, un paso por elemento del arreglo"],
      "check": ["1 o 2 preguntas cortas para verificar comprensión"]
    }
  ]
}

Reglas:
- Un "card" por concepto importante de la clase (entre 1 y 6).
- "formula_latex": usa LaTeX válido (ej. "\\\\sigma = \\\\sqrt{\\\\frac{\\\\sum (x_i - \\\\mu)^2}{N}}"). Si el concepto NO tiene fórmula, pon null y deja "breakdown" vacío.
- "breakdown": explica cada símbolo de la fórmula con lenguaje cotidiano. Vacío si no hay fórmula.
- "steps": ejemplo concreto con números reales, resuelto paso a paso.
- Responde en español. No agregues texto fuera del JSON.`;
  return { system, user };
}

export { NOTE_TYPE_LABEL };
