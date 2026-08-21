// Horario real del usuario (Mercadotecnia y Dirección Comercial - LOYOLA 2023).
// Se carga con un toque desde Ajustes para no capturar todo a mano.
// weekday: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie.

import { Schedule, Subjects } from '../../db';
import { subjectColors } from '../../theme';

interface SeedBlock {
  days: number[];
  start: string;
  end: string;
}

interface SeedSubject {
  name: string;
  room: string | null;
  absence_limit: number;
  blocks: SeedBlock[];
}

// Límite de faltas por defecto (ajústalo por materia después si tu regla es otra).
const DEFAULT_ABSENCE_LIMIT = 3;

export const MI_HORARIO: SeedSubject[] = [
  {
    name: 'Alternativas de Solución de Problemas Profesionales',
    room: null,
    absence_limit: DEFAULT_ABSENCE_LIMIT,
    blocks: [{ days: [2, 4], start: '11:00', end: '13:00' }],
  },
  {
    name: 'Dibujo Vectorial',
    room: 'UL2',
    absence_limit: DEFAULT_ABSENCE_LIMIT,
    blocks: [{ days: [1, 3], start: '07:00', end: '09:00' }],
  },
  {
    name: 'Estadística Aplicada a los Negocios',
    room: null,
    absence_limit: DEFAULT_ABSENCE_LIMIT,
    blocks: [{ days: [1, 3], start: '11:00', end: '13:00' }],
  },
  {
    name: 'Taller de Investigación de Mercados Cualitativa',
    room: null,
    absence_limit: DEFAULT_ABSENCE_LIMIT,
    blocks: [{ days: [2, 4], start: '07:00', end: '09:00' }],
  },
  {
    name: 'Taller de Tecnologías I',
    room: 'S2',
    absence_limit: DEFAULT_ABSENCE_LIMIT,
    blocks: [{ days: [1, 3], start: '09:00', end: '11:00' }],
  },
  {
    name: 'Upper-Intermediate',
    room: null,
    absence_limit: DEFAULT_ABSENCE_LIMIT,
    blocks: [{ days: [2, 4, 5], start: '09:00', end: '11:00' }],
  },
];

// Inserta las materias y sus horarios. Devuelve cuántas materias creó.
export async function seedMySchedule(): Promise<number> {
  let created = 0;
  for (let i = 0; i < MI_HORARIO.length; i++) {
    const s = MI_HORARIO[i];
    const subjectId = await Subjects.createSubject({
      name: s.name,
      professor: null,
      room: s.room,
      color: subjectColors[i % subjectColors.length],
      absence_limit: s.absence_limit,
      retardo_value: 0.5,
      notes: null,
    });
    for (const b of s.blocks) {
      for (const day of b.days) {
        await Schedule.addBlock({
          subject_id: subjectId,
          weekday: day,
          start_time: b.start,
          end_time: b.end,
        });
      }
    }
    created++;
  }
  return created;
}
