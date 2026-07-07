// Utilidades de fecha/hora locales. Se evita depender de librerías externas.

export const WEEKDAYS_SHORT = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
export const WEEKDAYS_LONG = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

// weekday: 0 = domingo ... 6 = sábado (igual que Date.getDay()).
export function todayWeekday(): number {
  return new Date().getDay();
}

// Devuelve YYYY-MM-DD en horario local.
export function isoDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// "HH:MM" actual.
export function currentHM(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
}

// Convierte "HH:MM" a minutos desde medianoche.
export function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(':').map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

// Los 7 días a partir de hoy (para el selector semanal del inicio).
export function weekDates(from: Date = new Date()): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    return d;
  });
}

// Diferencia legible entre ahora y una hora "HH:MM" de hoy.
// Devuelve texto tipo "En 18 min", "En 2h 18m", "Ahora", "Terminó".
export function relativeToNow(startHM: string, endHM?: string): string {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = hmToMinutes(startHM);
  const endMin = endHM ? hmToMinutes(endHM) : startMin + 60;

  if (nowMin >= startMin && nowMin < endMin) return 'Ahora';
  if (nowMin >= endMin) return 'Terminó';

  const diff = startMin - nowMin;
  if (diff < 60) return `En ${diff} min`;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m === 0 ? `En ${h}h` : `En ${h}h ${m}m`;
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
