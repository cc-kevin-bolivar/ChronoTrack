import { useCallback, useMemo, useState } from 'react';
import { useScheduleState, useScheduleDispatch, minutesToTimeStr, timeStrToMinutes } from '../../context/ScheduleContext';
import type { ScheduleRange } from '../../types/data';

let rangeIdCounter = 0;
function generateRangeId(): string {
  return `range_${Date.now()}_${++rangeIdCounter}`;
}

interface Props {
  department: string;
  onBack: () => void;
}

export function DepartmentDetail({ department, onBack }: Props) {
  const schedules = useScheduleState();
  const {
    setDepartmentSchedule, setEmployeeSchedule, resetEmployeeSchedule,
    addScheduleRange, updateScheduleRange, removeScheduleRange,
  } = useScheduleDispatch();

  const [expandedEmp, setExpandedEmp] = useState<string | null>(null);

  const deptSchedule = schedules[department];

  const deptEntry = deptSchedule ? minutesToTimeStr(deptSchedule.entryTime) : '08:00';
  const deptExit = deptSchedule ? minutesToTimeStr(deptSchedule.exitTime) : '18:00';

  const employees = useMemo(() => {
    if (!deptSchedule) return [];
    return deptSchedule.employees;
  }, [deptSchedule]);

  const handleDeptEntryChange = useCallback((value: string) => {
    if (!value || !deptSchedule) return;
    setDepartmentSchedule(department, timeStrToMinutes(value), deptSchedule.exitTime);
  }, [department, deptSchedule, setDepartmentSchedule]);

  const handleDeptExitChange = useCallback((value: string) => {
    if (!value || !deptSchedule) return;
    setDepartmentSchedule(department, deptSchedule.entryTime, timeStrToMinutes(value));
  }, [department, deptSchedule, setDepartmentSchedule]);

  const handleEmpEntryChange = useCallback((employeeId: string, value: string) => {
    if (!value) return;
    const emp = deptSchedule?.employees.find((e) => e.employeeId === employeeId);
    if (!emp) return;
    setEmployeeSchedule(department, employeeId, timeStrToMinutes(value), emp.exitTime);
  }, [department, deptSchedule, setEmployeeSchedule]);

  const handleEmpExitChange = useCallback((employeeId: string, value: string) => {
    if (!value) return;
    const emp = deptSchedule?.employees.find((e) => e.employeeId === employeeId);
    if (!emp) return;
    setEmployeeSchedule(department, employeeId, emp.entryTime, timeStrToMinutes(value));
  }, [department, deptSchedule, setEmployeeSchedule]);

  const hasCustomSchedule = useCallback((emp: { entryTime: number | null; exitTime: number | null; scheduleRanges: ScheduleRange[] }) => {
    return emp.entryTime !== null || emp.exitTime !== null || emp.scheduleRanges.length > 0;
  }, []);

  const handleAddRange = useCallback((employeeId: string) => {
    const newRange: ScheduleRange = {
      id: generateRangeId(),
      startDate: '',
      endDate: '',
      entryTime: deptSchedule?.entryTime ?? 480,
      exitTime: deptSchedule?.exitTime ?? 1080,
    };
    addScheduleRange(department, employeeId, newRange);
    setExpandedEmp(employeeId);
  }, [department, deptSchedule, addScheduleRange]);

  const handleRangeChange = useCallback((
    employeeId: string, rangeId: string,
    field: keyof ScheduleRange, value: string
  ) => {
    const emp = deptSchedule?.employees.find((e) => e.employeeId === employeeId);
    const range = emp?.scheduleRanges.find((r) => r.id === rangeId);
    if (!range) return;

    const updated = { ...range };
    if (field === 'startDate' || field === 'endDate') {
      updated[field] = value;
    } else if (field === 'entryTime' || field === 'exitTime') {
      if (!value) return;
      updated[field] = timeStrToMinutes(value);
    }
    updateScheduleRange(department, employeeId, updated);
  }, [department, deptSchedule, updateScheduleRange]);

  if (!deptSchedule) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-sm">Departamento no encontrado</p>
        <button onClick={onBack} className="mt-2 text-blue-600 text-sm hover:underline">Volver</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Volver a departamentos
        </button>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{department}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {employees.length} {employees.length === 1 ? 'colaborador' : 'colaboradores'}
        </p>
      </div>

      {/* Department-wide schedule */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Horario general del departamento</h4>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hora de entrada</label>
            <input
              type="time"
              value={deptEntry}
              onChange={(e) => handleDeptEntryChange(e.target.value)}
              className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hora de salida</label>
            <input
              type="time"
              value={deptExit}
              onChange={(e) => handleDeptExitChange(e.target.value)}
              className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
          Este horario aplica a todos los colaboradores del departamento que no tengan un horario personalizado.
        </p>
      </div>

      {/* Employee list */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Horarios individuales</h4>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {employees.map((emp) => {
            const isCustom = hasCustomSchedule(emp);
            const isExpanded = expandedEmp === emp.employeeId;
            const displayEntry = emp.entryTime !== null
              ? minutesToTimeStr(emp.entryTime)
              : deptEntry;
            const displayExit = emp.exitTime !== null
              ? minutesToTimeStr(emp.exitTime)
              : deptExit;

            return (
              <div key={emp.employeeId}>
                <div className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {emp.employeeName.charAt(0).toUpperCase()}
                  </div>

                  {/* Name & ID */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{emp.employeeName}</p>
                      {isCustom && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          Personalizado
                        </span>
                      )}
                      {emp.scheduleRanges.length > 0 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                          {emp.scheduleRanges.length} {emp.scheduleRanges.length === 1 ? 'rango' : 'rangos'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">ID: {emp.employeeId}</p>
                  </div>

                  {/* Time inputs */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div>
                      <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">Entrada</label>
                      <input
                        type="time"
                        value={displayEntry}
                        onChange={(e) => handleEmpEntryChange(emp.employeeId, e.target.value)}
                        className={`border rounded-lg px-2 py-1.5 text-xs w-28 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-200 ${
                          isCustom ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">Salida</label>
                      <input
                        type="time"
                        value={displayExit}
                        onChange={(e) => handleEmpExitChange(emp.employeeId, e.target.value)}
                        className={`border rounded-lg px-2 py-1.5 text-xs w-28 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-200 ${
                          isCustom ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700'
                        }`}
                      />
                    </div>

                    {/* Expand/collapse ranges button */}
                    <button
                      onClick={() => setExpandedEmp(isExpanded ? null : emp.employeeId)}
                      className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-500 transition-colors"
                      title="Rangos de horario por fechas"
                    >
                      <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>

                    {/* Reset button */}
                    {isCustom && (
                      <button
                        onClick={() => resetEmployeeSchedule(department, emp.employeeId)}
                        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors"
                        title="Restaurar horario del departamento"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable schedule ranges */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-1 ml-12 border-l-2 border-purple-200 dark:border-purple-800 space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Horarios por rango de fechas (tienen prioridad sobre el horario base)
                    </p>

                    {emp.scheduleRanges.map((range) => (
                      <div
                        key={range.id}
                        className="flex items-center gap-2 flex-wrap bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2"
                      >
                        <div>
                          <label className="block text-[10px] text-gray-400 dark:text-gray-500">Desde</label>
                          <input
                            type="date"
                            value={range.startDate}
                            onChange={(e) => handleRangeChange(emp.employeeId, range.id, 'startDate', e.target.value)}
                            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 dark:text-gray-500">Hasta</label>
                          <input
                            type="date"
                            value={range.endDate}
                            onChange={(e) => handleRangeChange(emp.employeeId, range.id, 'endDate', e.target.value)}
                            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded px-2 py-1 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 dark:text-gray-500">Entrada</label>
                          <input
                            type="time"
                            value={minutesToTimeStr(range.entryTime)}
                            onChange={(e) => handleRangeChange(emp.employeeId, range.id, 'entryTime', e.target.value)}
                            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded px-2 py-1 text-xs w-24"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-400 dark:text-gray-500">Salida</label>
                          <input
                            type="time"
                            value={minutesToTimeStr(range.exitTime)}
                            onChange={(e) => handleRangeChange(emp.employeeId, range.id, 'exitTime', e.target.value)}
                            className="border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 rounded px-2 py-1 text-xs w-24"
                          />
                        </div>
                        <button
                          onClick={() => removeScheduleRange(department, emp.employeeId, range.id)}
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors self-end mb-0.5"
                          title="Eliminar rango"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => handleAddRange(emp.employeeId)}
                      className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium mt-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Agregar rango de fechas
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
