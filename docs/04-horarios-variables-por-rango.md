# Horarios variables por rango de fechas

## Fecha: Marzo 2026

## Contexto
El sistema solo permitía asignar un único horario de entrada y salida por colaborador. Esto generaba errores en el cálculo de tardanzas cuando los horarios cambiaban dentro de un mismo período (por ejemplo, un mes).

### Escenario real
- Colaborador "X": semanas 1-2 con horario 6:00–16:00, semanas 3-4 con horario 9:00–18:00
- Colaborador "Y": horarios diferentes cada semana

El sistema comparaba todos los registros contra un solo horario, produciendo cálculos incorrectos.

## Solución implementada

### Modelo de datos
Nueva interfaz `ScheduleRange`:
```typescript
interface ScheduleRange {
  id: string;           // identificador único
  startDate: string;    // "YYYY-MM-DD"
  endDate: string;      // "YYYY-MM-DD"
  entryTime: number;    // minutos desde medianoche
  exitTime: number;     // minutos desde medianoche
}
```

`EmployeeSchedule` ahora incluye `scheduleRanges: ScheduleRange[]`.

### Jerarquía de resolución de horarios
Para cada registro (fila + fecha):
1. Si el empleado tiene un `ScheduleRange` que cubre esa fecha → usar ese rango
2. Si no → usar `entryTime`/`exitTime` del empleado (horario base personalizado)
3. Si esos son `null` → usar el horario del departamento
4. Si no hay departamento configurado → defaults (08:00–18:00)

### Cálculo de tardanzas
`recomputeLateness` ahora extrae la fecha de cada fila y la pasa al callback `getLimits(dept, empId, date)`, permitiendo que cada registro se evalúe contra el horario vigente en esa fecha específica.

### Exportación Excel
- Columnas "Check-in time" muestran "Variable" si el empleado tiene rangos configurados
- El formato condicional (verde/rojo) por día usa el horario correcto para esa fecha

### UI de configuración
- Botón chevron por empleado para expandir/colapsar rangos
- Badge púrpura indica cuántos rangos tiene configurados
- Formulario de rangos: fecha inicio, fecha fin, hora entrada, hora salida
- Botón "+ Agregar rango de fechas" y botón X para eliminar
- Reset limpia horario base y todos los rangos

## Archivos modificados
- `src/types/data.ts` — nueva interfaz `ScheduleRange`, campo `scheduleRanges` en `EmployeeSchedule`
- `src/context/ScheduleContext.tsx` — acciones `ADD_RANGE`, `UPDATE_RANGE`, `REMOVE_RANGE`; `getEmployeeLimits` acepta `date?`
- `src/utils/excelParser.ts` — `recomputeLateness` extrae fecha y la pasa al callback
- `src/context/DataContext.tsx` — callback actualizado con parámetro de fecha
- `src/utils/excelExporter.ts` — formato condicional por fecha, "Variable" en check-in time
- `src/components/Schedule/DepartmentDetail.tsx` — UI completa de gestión de rangos
