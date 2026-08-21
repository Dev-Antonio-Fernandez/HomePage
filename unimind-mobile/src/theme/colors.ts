// Paleta oscura con acentos morados, según la referencia visual del brief.
export const colors = {
  // Fondos
  bg: '#0A0A0D',
  bgElevated: '#111116',
  surface: '#16161D',
  surfaceAlt: '#1C1C25',
  surfacePressed: '#22222D',

  // Bordes / separadores
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',

  // Texto
  text: '#F5F5F7',
  textMuted: '#9A9AA7',
  textFaint: '#6B6B78',

  // Acento principal (morado)
  primary: '#8B5CF6',
  primaryStrong: '#7C3AED',
  primarySoft: 'rgba(139,92,246,0.16)',
  primaryBorder: 'rgba(139,92,246,0.45)',

  // Semánticos
  success: '#34D399',
  successSoft: 'rgba(52,211,153,0.15)',
  warning: '#F59E0B',
  warningSoft: 'rgba(245,158,11,0.15)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.15)',
  info: '#60A5FA',
  infoSoft: 'rgba(96,165,250,0.15)',

  // Utilidad
  white: '#FFFFFF',
  black: '#000000',
} as const;

// Colores predefinidos para asignar a materias.
export const subjectColors = [
  '#8B5CF6', // morado
  '#60A5FA', // azul
  '#34D399', // verde
  '#F59E0B', // ámbar
  '#F87171', // rojo
  '#F472B6', // rosa
  '#22D3EE', // cyan
  '#A3E635', // lima
] as const;

export type ColorName = keyof typeof colors;
