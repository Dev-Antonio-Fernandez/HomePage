// Exportación a Markdown/texto para respaldo (requisito del MVP).

import type { ClassSession, Note, Subject, Task } from '../db/types';
import { noteTypeMeta } from '../features/notes/noteTypes';

export function buildSubjectMarkdown(params: {
  subject: Subject;
  sessions: ClassSession[];
  notes: Note[];
  tasks: Task[];
  used: number;
}): string {
  const { subject, sessions, notes, tasks, used } = params;
  const lines: string[] = [];

  lines.push(`# ${subject.name}`);
  if (subject.professor) lines.push(`**Profesor:** ${subject.professor}`);
  lines.push(
    `**Faltas:** ${used} usadas de ${subject.absence_limit} permitidas`,
  );
  lines.push('');

  lines.push('## Temas vistos');
  if (sessions.length === 0) lines.push('_Sin clases registradas._');
  for (const s of sessions) {
    lines.push(`### ${s.date} — ${s.topic || 'Sin tema'}`);
    if (s.ai_summary) lines.push(s.ai_summary);
    const sessionNotes = notes.filter((n) => n.session_id === s.id);
    for (const n of sessionNotes) {
      const meta = noteTypeMeta(n.type);
      lines.push(`- ${meta.emoji} **${meta.label}:** ${n.cleaned_text || n.raw_text}`);
    }
    lines.push('');
  }

  const pending = tasks.filter((t) => t.completed === 0);
  if (pending.length > 0) {
    lines.push('## Tareas pendientes');
    for (const t of pending) {
      lines.push(`- [ ] ${t.title}${t.due_date ? ` (para ${t.due_date})` : ''}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('_Exportado desde UniMind Mobile._');
  return lines.join('\n');
}
