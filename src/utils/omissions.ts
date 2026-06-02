import type { Row, AttendanceKeys } from '../types/data';
import { normalizeDateKey } from './excelExporter';

/** Label shown for a late arrival that has been excused via an observation. */
export const JUSTIFIED_LABEL = 'Justificada';

/** True when the record's parsed "Entrada Tardía" marks an actual late arrival. */
export function isLateRow(row: Row): boolean {
  const value = row['Entrada Tardía'];
  return typeof value === 'string' && value.startsWith('Tarde');
}

/**
 * Build the "{employeeId}|{date}" key used to look up observations/omissions
 * for a row. Mirrors the keying used in EmployeeDetail and the Excel exporter.
 */
export function getOmissionKey(row: Row, keys: AttendanceKeys): string | null {
  const empKey = keys.userIdKey ?? keys.userNameKey;
  if (!empKey || !keys.dateKey) return null;
  const empId = String(row[empKey] ?? '').trim();
  const dateKey = normalizeDateKey(row[keys.dateKey]);
  if (!empId || !dateKey) return null;
  return `${empId}|${dateKey}`;
}

/**
 * Return a copy of `rows` where late arrivals flagged as excused are neutralized
 * (no longer counted as late). Non-late rows and rows without an omission are
 * returned untouched so the array keeps reference equality where possible.
 */
export function applyLateOmissions(
  rows: Row[],
  keys: AttendanceKeys,
  omittedSet: Set<string>,
): Row[] {
  if (omittedSet.size === 0) return rows;
  return rows.map((row) => {
    if (!isLateRow(row)) return row;
    const key = getOmissionKey(row, keys);
    if (!key || !omittedSet.has(key)) return row;
    return {
      ...row,
      'Entrada Tardía': JUSTIFIED_LABEL,
      _entradaTardeMin: 0,
      _llegadaTarde: 0,
    };
  });
}
