# Plan: App de Control Operativo — Departamento de Elaboración Cervecera

## Resumen
SPA con sidebar fijo + header, 5 vistas (Dashboard, Agenda, Extracto 72hrs, Curvas de Fermentación, Purgas de Trub) usando React + TanStack Router + Tailwind + shadcn/ui + Recharts. Datos de prueba realistas en memoria (sin backend).

## Stack y librerías
- TanStack Start (ya configurado en el template) + TypeScript
- Tailwind v4 + shadcn/ui (button, card, table, dialog, select, badge, input, avatar, calendar, form, dropdown-menu, sidebar, tooltip)
- Recharts para gráficos
- date-fns para fechas
- Lucide React para íconos

## Sistema de diseño (src/styles.css)
Tokens semánticos en oklch:
- `--background`: gris muy claro (slate-50)
- `--sidebar` / `--sidebar-foreground`: azul marino oscuro (slate-900)
- `--primary`: ámbar/dorado (amber-500) con `--primary-foreground` oscuro
- `--card`: blanco con sombra suave, radius redondeado
- Tokens de estado: `--status-ok` (verde), `--status-warn` (amarillo), `--status-bad` (rojo)
- Sombras suaves vía `--shadow-card`

Todo se aplica con clases semánticas (bg-primary, text-sidebar-foreground, etc.) — sin colores directos en componentes.

## Estructura de rutas (file-based)
```
src/routes/
  __root.tsx           → shell html/body (existente)
  _app.tsx             → layout con SidebarProvider + AppSidebar + Header + <Outlet/>
  _app.index.tsx       → Dashboard (/)
  _app.agenda.tsx      → /agenda
  _app.extracto.tsx    → /extracto
  _app.curvas.tsx      → /curvas
  _app.purgas.tsx      → /purgas
  index.tsx            → redirect a /  (o reemplazar contenido)
```
Cada ruta define su `head()` con título y descripción propios.

## Componentes compartidos
- `src/components/app-sidebar.tsx` — Sidebar shadcn con 5 links + íconos Lucide (Home, Calendar, Beaker, LineChart, ClipboardList), highlight de ruta activa vía `useRouterState`.
- `src/components/app-header.tsx` — fecha/hora actual (actualiza cada minuto), input de búsqueda global, avatar.
- `src/components/kpi-card.tsx` — tarjeta de métrica reutilizable (valor grande, label, ícono, color de estado opcional).
- `src/components/status-badge.tsx` — Badge tipado: "En Rango" / "En Observación" / "Desviado" / "Mala" / "Regular" / "Buena".

## Datos de prueba (src/data/)
Archivos TS con mock realista:
- `tanks.ts` — TK-101 a TK-145 con marcas (Lager Premium, IPA Dorada, Pilsner Clásica, Stout Imperial, Weissbier, etc.)
- `extracto-72.ts` — ~30 filas con OG, lecturas 24/48/72h y estado calculado
- `fermentacion.ts` — generador de curva 15 días por tanque: extracto descendente 15→2 ºP, temp estable 12-15ºC con caída a -1ºC en maduración
- `purgas.ts` — ~20 tanques con hasta 10 purgas c/u (hora + análisis visual)
- `agenda-events.ts` — eventos del mes actual (turnos/mantenimiento/CIP)
- `alertas.ts` y `produccion-semanal.ts` para el dashboard

## Detalle de vistas

### 1. Dashboard (`/`)
- 4 KPI cards: Tanques en Fermentación (45), Extractos fuera de rango (2, rojo), Purgas pendientes hoy (8), Mantenimientos programados (3).
- Grid 2 columnas: tabla "Últimas Alertas" (5 filas: tanque, tipo, hora, severidad badge) + BarChart Recharts "Volumen Producción Semanal" (L-D, hectolitros).

### 2. Agenda (`/agenda`)
- Vista calendario mensual usando shadcn Calendar como base + grilla custom para eventos coloreados (azul=turnos, naranja=mantenimiento, verde=CIP).
- Toggle Mes/Semana.
- Botón primario "Nuevo Evento" → Dialog con form (título, fecha inicio, fecha fin, tipo via Select, descripción Textarea). Estado local — agrega al array de eventos.

### 3. Extracto 72 Hrs (`/extracto`)
- DataTable shadcn con header sticky y paginación (10/página).
- Columnas: Marca, Tanque, Fecha Llenado, OG (ºP), 24h, 48h, 72h, Estado (Badge).
- Lógica de estado: diferencia vs curva esperada determina En Rango / Observación / Desviado.
- Filtros arriba: Input búsqueda por tanque + Select de marca.

### 4. Curvas de Fermentación (`/curvas`)
- Select de tanque arriba (TK-101 ... TK-145).
- ComposedChart Recharts, ejes Y dobles:
  - X: días 1-15
  - Y izq (azul): Extracto Aparente ºP, curva descendente sigmoide 15→2
  - Y der (rojo): Temperatura ºC, plateau 12-15ºC con caída a -1ºC días 12-15
- Tooltip personalizado mostrando día, extracto, temperatura, fase (Fermentación / Diacetilo / Maduración).

### 5. Purgas de Trub (`/purgas`)
- Botón "Registrar Nueva Purga" → Dialog (tanque, # purga, hora, análisis visual).
- Tabla con scroll horizontal (`overflow-x-auto`): Tanque, Marca, Fecha Llenado, Horas Reposo, luego 10 grupos Purga 1..10 cada uno con sub-columnas Hora + Análisis Visual (ícono circular: rojo=Mala, amarillo=Regular, verde=Buena), columna final Total.
- Header agrupado con dos niveles (`<TableHead colSpan={2}>` para cada Purga N).

## Detalles técnicos
- **Sidebar collapse:** usar `collapsible="icon"` con `SidebarTrigger` en el header.
- **Datos:** todo en memoria; mutaciones (nuevo evento, nueva purga) con `useState` local en cada ruta. Sin Lovable Cloud por ahora.
- **Fecha/hora live:** `useEffect` con `setInterval(60000)` en el header.
- **Búsqueda global:** solo UI (input controlado) — no funcional cross-vista en v1.
- **Sin imágenes generadas:** solo íconos Lucide + tipografía + color.

## Fuera de alcance (v1)
- Backend / persistencia (no se enciende Lovable Cloud salvo que se pida).
- Auth / multiusuario.
- Exportación a Excel.
- Edición inline de tabla de extractos.

¿Procedo con esta estructura o quieres ajustar algo (paleta exacta, alcance de mutaciones, agregar persistencia con Lovable Cloud)?
