# Exportación de Excel de control de asistencia

## Fecha: Marzo 2026

## Contexto
Los usuarios necesitaban descargar un reporte Excel formateado con los registros de asistencia, organizado por empleado y por día, con formato condicional para identificar tardanzas visualmente.

## Estructura del Excel generado
- **Columnas fijas**: Team, User ID, User Name
- **Check-in time**: Entrada y Salida programados del colaborador
- **Columnas dinámicas por día**: cada fecha tiene par Entrada/Salida
- **Formato de fechas**: "martes 01 de abril del 2025"

## Características
- Horas en formato 12h (a.m./p.m.)
- Formato condicional: verde si entrada <= horario programado, rojo si es tarde
- Encabezados en negrita con fondo azul, subencabezados en azul claro
- Merge de celdas para agrupar Entrada/Salida bajo cada día
- Filas superiores y columnas fijas congeladas
- Anchos de columna automáticos

## Dependencia agregada
- `xlsx-js-style` — fork de SheetJS con soporte de estilos

## Archivos creados/modificados
- `src/utils/excelExporter.ts` — nueva función `exportAttendanceExcel`
- `src/components/Table/DataTable.tsx` — conexión del botón con el exportador

## Datos técnicos
- Los datos se pivotean de filas planas (1 registro/empleado/día) a una matriz (1 fila/empleado, columnas por día)
- Se usa `getEmployeeLimits` del `ScheduleContext` para obtener horarios programados
- La columna "Check-in time" muestra el horario configurado, no el primer registro real
