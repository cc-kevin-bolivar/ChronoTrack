import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useDataState } from '../../context/DataContext';
import { useObservations } from '../../context/ObservationContext';
import { useTheme } from '../../context/ThemeContext';
import { normalizeDateKey } from '../../utils/excelExporter';

interface Props {
  employeeId: string;
  onBack: () => void;
}

function parseTimeStr(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

function minutesToDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = Math.round(minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function getCellClass(value: unknown, colKey: string): string {
  if (colKey === 'Entrada Tardía' && typeof value === 'string') {
    if (value.startsWith('Tarde')) return 'text-red-600 dark:text-red-400 font-medium';
    if (value === 'A tiempo') return 'text-green-600 dark:text-green-400';
  }
  if (colKey === 'Salida Tardía' && typeof value === 'string') {
    if (value.startsWith('Extra')) return 'text-amber-600 dark:text-amber-400 font-medium';
    if (value === 'A tiempo') return 'text-green-600 dark:text-green-400';
  }
  return '';
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (value instanceof Date) return value.toLocaleDateString('es-ES');
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toLocaleString('es-ES', { maximumFractionDigits: 2 });
  }
  return String(value);
}

const PIE_COLORS = ['#10b981', '#ef4444']; // green, red

export function EmployeeDetail({ employeeId, onBack }: Props) {
  const { parsedData } = useDataState();
  const { getObservation, setObservation } = useObservations();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const data = useMemo(() => {
    if (!parsedData?.isAttendance || !parsedData.attendanceKeys) return null;

    const { attendanceKeys, rows } = parsedData;
    const idKey = attendanceKeys.userIdKey ?? attendanceKeys.userNameKey;
    if (!idKey) return null;

    const empRows = rows.filter((r) => String(r[idKey] ?? '').trim() === employeeId.trim());
    if (empRows.length === 0) return null;

    const employeeName = attendanceKeys.userNameKey
      ? String(empRows[0][attendanceKeys.userNameKey] ?? employeeId)
      : employeeId;
    const department = attendanceKeys.departmentKey
      ? String(empRows[0][attendanceKeys.departmentKey] ?? '—')
      : '—';
    const empIdDisplay = attendanceKeys.userIdKey
      ? String(empRows[0][attendanceKeys.userIdKey] ?? '')
      : '';

    const totalDays = empRows.length;
    let lateDays = 0;
    let totalLateMinutes = 0;
    let totalExtraMinutes = 0;
    let totalHours = 0;
    const entries: number[] = [];
    const exits: number[] = [];

    for (const row of empRows) {
      const entradaTardia = row['Entrada Tardía'];
      if (typeof entradaTardia === 'string' && entradaTardia.startsWith('Tarde')) {
        lateDays++;
      }
      const lateMins = row['_entradaTardeMin'];
      if (typeof lateMins === 'number') totalLateMinutes += lateMins;

      const extraMins = row['_salidaTardeMin'];
      if (typeof extraMins === 'number') totalExtraMinutes += extraMins;

      const hrs = row['_horasDecimal'];
      if (typeof hrs === 'number') totalHours += hrs;

      if (attendanceKeys.clockInKey) {
        const min = parseTimeStr(row[attendanceKeys.clockInKey]);
        if (min !== null) entries.push(min);
      }
      if (attendanceKeys.clockOutKey) {
        const min = parseTimeStr(row[attendanceKeys.clockOutKey]);
        if (min !== null) exits.push(min);
      }
    }

    const onTimeDays = totalDays - lateDays;
    const avgHoursPerDay = totalDays > 0 ? totalHours / totalDays : 0;
    const earliestEntry = entries.length > 0 ? minutesToTimeStr(Math.min(...entries)) : '—';
    const latestExit = exits.length > 0 ? minutesToTimeStr(Math.max(...exits)) : '—';

    // Table columns for this employee's records
    const tableColumns: string[] = [];
    if (attendanceKeys.dateKey) tableColumns.push(attendanceKeys.dateKey);
    if (attendanceKeys.clockInKey) tableColumns.push(attendanceKeys.clockInKey);
    if (attendanceKeys.clockOutKey) tableColumns.push(attendanceKeys.clockOutKey);
    tableColumns.push('Entrada Tardía', 'Salida Tardía');

    return {
      employeeName,
      department,
      empIdDisplay,
      totalDays,
      lateDays,
      onTimeDays,
      totalLateMinutes,
      totalExtraMinutes,
      totalHours,
      avgHoursPerDay,
      earliestEntry,
      latestExit,
      empRows,
      tableColumns,
    };
  }, [parsedData, employeeId]);

  const [modalInfo, setModalInfo] = useState<{ dateKey: string; dateLabel: string } | null>(null);

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No se encontraron datos para este colaborador.</p>
        <button onClick={onBack} className="mt-2 text-blue-600 dark:text-blue-400 text-sm hover:underline">Volver a lista</button>
      </div>
    );
  }

  const pieData = [
    { name: 'A tiempo', value: data.onTimeDays },
    { name: 'Tarde', value: data.lateDays },
  ];

  const latePercent = data.totalDays > 0
    ? Math.round((data.lateDays / data.totalDays) * 100)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Volver a lista
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xl font-bold">
            {data.employeeName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{data.employeeName}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {data.empIdDisplay && <span>ID: {data.empIdDisplay}</span>}
              {data.department !== '—' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs">
                  {data.department}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Días presentes" value={String(data.totalDays)} color="text-blue-600 dark:text-blue-400" />
        <SummaryCard label="Llegadas tarde" value={`${data.lateDays} de ${data.totalDays}`} sub={`${latePercent}%`} color="text-red-600 dark:text-red-400" />
        <SummaryCard label="Total tiempo tarde" value={minutesToDisplay(data.totalLateMinutes)} color="text-red-600 dark:text-red-400" />
      </div>

      {/* Charts + info row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Pie chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Puntualidad</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={isDark ? { backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' } : undefined}
                labelStyle={isDark ? { color: '#f3f4f6' } : undefined}
                itemStyle={isDark ? { color: '#f3f4f6' } : undefined}
              />
              <Legend wrapperStyle={isDark ? { color: '#d1d5db' } : undefined} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Quick stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Resumen de horarios</h3>
          <div className="space-y-3">
            <InfoRow label="Entrada más temprana" value={data.earliestEntry} />
            <InfoRow label="Salida más tardía" value={data.latestExit} />
            <InfoRow label="Días a tiempo" value={`${data.onTimeDays} de ${data.totalDays}`} valueClass="text-green-600 dark:text-green-400" />
            <InfoRow label="Días con entrada tarde" value={`${data.lateDays} de ${data.totalDays}`} valueClass="text-red-600 dark:text-red-400" />
            <InfoRow label="Promedio minutos tarde (días tarde)" value={data.lateDays > 0 ? minutesToDisplay(Math.round(data.totalLateMinutes / data.lateDays)) : '—'} />
          </div>
        </div>
      </div>

      {/* Records table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Registros de asistencia</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900">
                {data.tableColumns.map((col) => (
                  <th key={col} className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {col}
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  Observación
                </th>
              </tr>
            </thead>
            <tbody>
              {data.empRows.map((row, i) => {
                const dateVal = parsedData?.attendanceKeys?.dateKey ? row[parsedData.attendanceKeys.dateKey] : null;
                const dateStr = normalizeDateKey(dateVal) ?? String(i);
                const dateLabel = dateVal instanceof Date ? dateVal.toLocaleDateString('es-ES') : String(dateVal ?? '');
                const obs = getObservation(employeeId, dateStr);
                return (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100">
                    {data.tableColumns.map((col) => (
                      <td
                        key={col}
                        className={`px-4 py-2.5 whitespace-nowrap ${getCellClass(row[col], col)}`}
                      >
                        {formatCell(row[col])}
                      </td>
                    ))}
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => setModalInfo({ dateKey: dateStr, dateLabel })}
                        className="group flex items-center gap-1.5 min-w-[140px] text-left"
                        title={obs ? 'Editar observación' : 'Agregar observación'}
                      >
                        {obs ? (
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{obs}</span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500 italic">Agregar...</span>
                        )}
                        <svg
                          className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de observación */}
      {modalInfo && (
        <ObservationModal
          employeeName={data.employeeName}
          dateLabel={modalInfo.dateLabel}
          value={getObservation(employeeId, modalInfo.dateKey)}
          onSave={(text) => {
            setObservation(employeeId, modalInfo.dateKey, text);
            setModalInfo(null);
          }}
          onClose={() => setModalInfo(null)}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>
        {value}
        {sub && <span className="text-xs font-normal text-gray-400 dark:text-gray-500 ml-1">{sub}</span>}
      </p>
    </div>
  );
}

function InfoRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-b-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${valueClass ?? 'text-gray-900 dark:text-gray-100'}`}>{value}</span>
    </div>
  );
}

function ObservationModal({
  employeeName,
  dateLabel,
  value,
  onSave,
  onClose,
}: {
  employeeName: string;
  dateLabel: string;
  value: string;
  onSave: (text: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); },
    [onClose]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Observación</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {employeeName} — {dateLabel}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escribe una observación para este registro..."
            rows={4}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100 dark:border-gray-700">
          {value && (
            <button
              onClick={() => onSave('')}
              className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mr-auto"
            >
              Eliminar
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(draft)}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
