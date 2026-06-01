# Modo Dark / Light

## Fecha: Marzo 2026

## Contexto
Se implementó un toggle de tema oscuro/claro para mejorar la experiencia de usuario, especialmente en entornos con poca luz.

## Enfoque
- Tailwind CSS `darkMode: 'class'` — el tema se controla agregando/removiendo la clase `dark` en `<html>`
- React Context (`ThemeContext`) para gestionar el estado del tema
- Persistencia en `localStorage` (clave `"theme"`)

## Implementación

### ThemeContext (`src/context/ThemeContext.tsx`)
- `ThemeProvider` lee el tema inicial de localStorage, fallback a "light"
- Expone `theme` y `toggleTheme`
- Agrega/remueve clase `dark` en `document.documentElement`

### Toggle en Header
- Botón sol/luna en la esquina superior derecha del Header
- Tooltip dinámico: "Modo oscuro" / "Modo claro"

### Mapeo de colores
| Light | Dark |
|-------|------|
| `bg-white` | `dark:bg-gray-900` |
| `bg-gray-50` | `dark:bg-gray-950` |
| `text-gray-900` | `dark:text-white` |
| `text-gray-600` | `dark:text-gray-300` |
| `text-gray-500` | `dark:text-gray-400` |
| `border-gray-200` | `dark:border-gray-700` |
| `border-gray-100` | `dark:border-gray-800` |
| `hover:bg-gray-50` | `dark:hover:bg-gray-800` |

## Archivos modificados
- `tailwind.config.js` — `darkMode: 'class'`
- `src/index.css` — transición suave de colores
- `src/context/ThemeContext.tsx` — nuevo contexto
- `src/App.tsx` — `ThemeProvider` wrapper
- `src/components/Layout/Header.tsx` — toggle button
- `src/components/Layout/Sidebar.tsx`
- `src/components/Layout/DashboardLayout.tsx`
- `src/components/Table/DataTable.tsx`
- `src/components/Stats/StatCard.tsx`
- `src/components/Stats/DepartmentCard.tsx`
- `src/components/Stats/StatsSummary.tsx`
- `src/components/Stats/EmployeeCard.tsx`
- `src/components/Stats/DashboardDepartmentDetail.tsx`
- `src/components/Employee/EmployeeDetail.tsx`
- `src/components/Charts/ChartPanel.tsx`
- `src/components/Charts/BarChartView.tsx`
- `src/components/Charts/LineChartView.tsx`
- `src/components/Charts/PieChartView.tsx`
- `src/components/Charts/ChartSelector.tsx`
- `src/components/Upload/FileDropZone.tsx`
- `src/components/Schedule/ScheduleView.tsx`
- `src/components/Schedule/DepartmentCards.tsx`
- `src/components/Schedule/DepartmentDetail.tsx`

## Fix posterior
Las tablas (`<table>`) no tenían color de texto base, causando texto invisible en modo oscuro. Se agregó `text-gray-900 dark:text-gray-200` a las 3 tablas del sistema.
