// Lógica de faltas — clara y auditable, tal como exige el brief.
// No se oculta en la IA ni en la base de datos: se calcula aquí de forma explícita.

import { colors } from '../theme/colors';

export type AttendanceStatus = 'asistio' | 'falto' | 'retardo' | 'justificada';

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  asistio: 'Asistí',
  falto: 'Falté',
  retardo: 'Retardo',
  justificada: 'Justificada',
};

// Valor de falta por defecto de cada estado. El retardo es configurable por
// materia (0, 0.5 o 1); aquí va el valor base.
export function defaultAbsenceValue(
  status: AttendanceStatus,
  retardoValue = 0.5,
): number {
  switch (status) {
    case 'falto':
      return 1;
    case 'retardo':
      return retardoValue;
    case 'asistio':
    case 'justificada':
    default:
      return 0;
  }
}

export type RiskLevel = 'ok' | 'medium' | 'high';

export interface AbsenceSummary {
  used: number;
  limit: number;
  remaining: number;
  ratio: number;
  risk: RiskLevel;
}

export function summarizeAbsences(used: number, limit: number): AbsenceSummary {
  const safeLimit = limit > 0 ? limit : 0;
  const remaining = Math.max(safeLimit - used, 0);
  const ratio = safeLimit > 0 ? used / safeLimit : 0;
  let risk: RiskLevel = 'ok';
  if (ratio >= 0.8) risk = 'high';
  else if (ratio >= 0.6) risk = 'medium';
  return { used, limit: safeLimit, remaining, ratio, risk };
}

export function riskColor(risk: RiskLevel): string {
  switch (risk) {
    case 'high':
      return colors.danger;
    case 'medium':
      return colors.warning;
    default:
      return colors.success;
  }
}

export function riskLabel(risk: RiskLevel): string {
  switch (risk) {
    case 'high':
      return 'Riesgo alto';
    case 'medium':
      return 'Cuidado';
    default:
      return 'En regla';
  }
}
