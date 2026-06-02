# Botón flotante para exportar a Excel

## Fecha: Marzo 2026

## Contexto
Se necesitaba un botón visible y accesible para que el usuario pudiera exportar los datos de asistencia a un archivo Excel directamente desde la vista de lista.

## Implementación
- Se agregó un botón flotante verde posicionado en la esquina inferior derecha (`fixed bottom-6 right-6`) con ícono de descarga y texto "Exportar Excel".
- Inicialmente sin funcionalidad (placeholder), luego conectado al exportador.

## Archivos modificados
- `src/components/Table/DataTable.tsx` — botón flotante con `position: fixed`

## Resultado
Botón siempre visible al usuario cuando hay datos cargados, sin interferir con el contenido de la tabla.
