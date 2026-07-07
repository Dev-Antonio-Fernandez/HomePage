import { colors } from '../../theme';
import type { NoteType } from '../../db/types';

export interface NoteTypeMeta {
  type: NoteType;
  label: string;
  emoji: string;
  color: string;
}

// Tipos de nota rápida del brief: idea, duda, tarea, fórmula, ejemplo, no entendí.
export const NOTE_TYPES: NoteTypeMeta[] = [
  { type: 'idea', label: 'Idea', emoji: '💡', color: colors.primary },
  { type: 'duda', label: 'Duda', emoji: '❓', color: colors.info },
  { type: 'tarea', label: 'Tarea', emoji: '📌', color: colors.warning },
  { type: 'formula', label: 'Fórmula', emoji: '🧮', color: colors.success },
  { type: 'ejemplo', label: 'Ejemplo', emoji: '📎', color: '#22D3EE' },
  { type: 'no_entendi', label: 'No entendí', emoji: '🚧', color: colors.danger },
];

export function noteTypeMeta(type: NoteType): NoteTypeMeta {
  return NOTE_TYPES.find((n) => n.type === type) ?? NOTE_TYPES[0];
}
