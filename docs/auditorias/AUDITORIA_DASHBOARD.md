# Auditoría Integral — Módulo Dashboard / Panel Principal
## Sistema FONEVI — Fondo de Empleados Docentes

---

**Fecha de auditoría:** 17 de junio de 2026
**Auditor:** Arquitecto de Software Senior / Auditor Técnico
**Versión del sistema:** FONEVI FINAL
**Alcance:** Módulo Dashboard (Panel de Control) — Frontend + Backend + Base de Datos
**Clasificación:** 🔴 **CRÍTICO — No apto para producción en estado actual**

---

## 1. Resumen Ejecutivo

### Estado general del módulo
El Dashboard de FONEVI es funcional como **interfaz de monitoreo visual**, pero presenta deficiencias arquitectónicas profundas que comprometen su confiabilidad como herramienta financiera. Los indicadores se calculan mayoritariamente en el frontend a partir de snapshots de datos cargados en `window.DB`, lo que viola principios fundamentales de integridad financiera y auditoría.

### Nivel de madurez
🟠 **Alpha tardío / Beta temprano** — Visualmente completo, pero arquitectónicamente inmaduro para un sistema financiero de producción.

### Fortalezas
1. **UX sólida**: Skeletons, transiciones, despliegue responsivo, formato de moneda correcto.
2. **Carga paralela**: `Promise.allSettled` permite que fallos parciales no bloqueen todo el Dashboard.
3. **Código organizado**: Separación física en `api.js`, `charts.js`, `loading.js`, `app.js`.
4. **Autenticación JWT** en todos los endpoints del Dashboard.
5. **Chart.js 4** para visualizaciones con configuración centralizada.

### Debilidades
1. **Cálculos financieros en frontend**: Todos los gráficos (barras, línea, dona) se calculan desde datos crudos en `window.pageAportes`/`window.pageCreditos`/`window.DB`.
2. **Carga duplicada de datos**: `app.js` precarga 7 endpoints en cada página, Y `dashboard.html` recarga 6 adicionales. Los mismos datos viajan dos veces.
3. **Ausencia de capa de servicio**: El backend `dashboard.js` es un route handler con lógica inline, sin repositorio, servicio ni caso de uso.
4. **Datos desactualizados**: El Dashboard muestra datos del momento de carga de página. No hay WebSockets, polling, ni refresco periódico.
5. **Hardcoding temporal**: Año `2026` hardcodeado en título, período `"Marzo 2026"` como fallback, regla de mora `"30 días"` en frontend.
6. **Sin trazabilidad**: No se registra quién consultó el Dashboard ni cuándo se generaron las métricas.
7. **Sin caché**: Cada petición a `/api/dashboard/resumen` escanea todas las tablas `socios`, `creditos`, `aportes` completas.

### Riesgos principales
| Riesgo | Nivel | Impacto |
|--------|-------|---------|
| Datos financieros incorrectos por cálculos en frontend | 🔴 Crítico | Usuarios toman decisiones basadas en KPIs erróneos |
| Doble carga de datos (app.js + dashboard.html) | 🟠 Alto | Rendimiento degradado en dispositivos lentos |
| Gráfico de tendencia de ahorro engañoso | 🟠 Alto | Muestra aportes acumulados, NO ahorro real |
| Distribución de fondos conceptualmente incorrecta | 🟡 Medio | Suma conceptos no comparables como si fueran un fondo único |
| Sin protección contra concurrencia en backend | 🟡 Medio | Lecturas inconsistentes durante escrituras concurrentes |

### Conclusión ejecutiva
El Dashboard **no está listo para producción** como herramienta financiera confiable. Su utilidad actual es la de un **tablero de monitoreo visual informativo**, pero no puede usarse como fuente de verdad para la toma de decisiones financieras. Se requiere una reescritura del backend con endpoints dedicados, servicios de negocio y eliminación de cálculos financieros en frontend.

---

## 2. Inventario de Archivos Analizados

### Frontend — Dashboard Directo

| # | Archivo | Rol | Tamaño |
|---|---------|-----|--------|
| 1 | `pages/dashboard.html` | Página principal del Panel de Control | ~20 KB |
| 2 | `css/dashboard.css` | Estilos específicos del Dashboard | ~4 KB |
| 3 | `js/charts.js` | Funciones de gráficos (barras, línea, dona) | ~12 KB |
| 4 | `js/loading.js` | Skeletons y estados de carga | ~8 KB |

### Frontend — Infraestructura Compartida

| # | Archivo | Rol |
|---|---------|-----|
| 5 | `js/api.js` | Cliente HTTP con módulo `dashboard.resumen()` y `dashboard.graficoAnual()` |
| 6 | `js/app.js` | Inicialización global, `window.DB`, `DataHelper`, precarga de datos |
| 7 | `js/layout.js` | Inyección de sidebar/topbar (invocado con "Panel de Control") |
| 8 | `js/roles.js` | RBAC: Dashboard accesible por administrador, tesorero, socio |
| 9 | `js/auth.js` | Autenticación JWT, redirección post-login a dashboard.html |
| 10 | `js/config.js` | URL base del backend |
| 11 | `js/search.js` | Búsqueda global (incluye enlace al Dashboard) |
| 12 | `js/transitions.js` | Animaciones de transición entre páginas |

### Backend — Rutas y Servicios

| # | Archivo | Rol |
|---|---------|-----|
| 13 | `backend/src/routes/dashboard.js` | **Único archivo backend del Dashboard** — 2 endpoints |
| 14 | `backend/src/app.js` | Registro de ruta `/api/dashboard` (línea 108) |
| 15 | `backend/src/middleware/auth.js` | JWT `requireAuth` en endpoints dashboard |
| 16 | `backend/src/middleware/audit.js` | Middleware de auditoría (NO usado por dashboard) |
| 17 | `backend/src/lib/prisma.js` | Singleton Prisma Client |

### Modelo de Datos

| # | Archivo | Rol |
|---|---------|-----|
| 18 | `backend/prisma/schema.prisma` | Esquema completo (modelos Socio, Aporte, Credito, Periodo, Movimiento, SolidaridadMovimiento, etc.) |

### Frontend — Páginas Relacionadas

| # | Archivo | Rol |
|---|---------|-----|
| 19 | `index.html` | Login, redirige a `pages/dashboard.html` |
| 20 | `pages/perfil.html` | Enlace de regreso al Dashboard |
| 21 | `pages/cierre-periodo.html` | Enlace de regreso al Dashboard |

---

## 3. Clasificación por Archivo

### Conservar (con mejoras)

| Archivo | Motivo |
|---------|--------|
| `backend/src/lib/prisma.js` | Singleton correcto, patrón global para evitar múltiples instancias |
| `backend/src/middleware/auth.js` | JWT middleware funcional y correcto |
| `js/config.js` | Centraliza configuración de URL base |
| `js/transitions.js` | Aporta valor UX sin impacto en datos |
| `js/loading.js` | Sistema de skeletons bien diseñado, reutilizable |
| `css/dashboard.css` | Estilos visuales modulares, sin lógica de negocio |

### Refactorizar

| Archivo | Motivo |
|---------|--------|
| `backend/src/routes/dashboard.js` | **CRÍTICO**: Mover lógica a servicio, agregar endpoints faltantes, eliminar cálculos inline |
| `pages/dashboard.html` | **CRÍTICO**: Eliminar cálculos financieros del frontend, cargar KPIs solo desde backend |
| `js/charts.js` | **ALTO**: Los gráficos deben recibir datos precalculados del backend, no calcular en frontend |
| `js/app.js` | **ALTO**: Reducir precarga de datos, evitar duplicación con dashboard.html |
| `js/api.js` | **MEDIO**: El módulo dashboard está bien, pero los otros módulos cargan datos que el dashboard no debería necesitar |
| `js/layout.js` | **BAJO**: Extraer "Panel de Control" a constante configurable |

### Archivar

| Archivo | Motivo |
|---------|--------|
| `backend/server.js` | No es el servidor principal; `app.js` es el archivo de entrada real. Mantener solo como referencia de migración. |

### Eliminar / Reemplazar

| Archivo | Motivo |
|---------|--------|
| N/A | No se recomienda eliminar archivos; todo el código existente puede refactorizarse incrementalmente. |

---

## 4. Riesgos Técnicos Detectados

### 4.1 Consultas masivas sin filtro (backend)

**Archivo:** `backend/src/routes/dashboard.js:9-13`
```javascript
const [socios, creditos, aportes] = await Promise.all([
  prisma.socio.findMany(),
  prisma.credito.findMany(),
  prisma.aporte.findMany(),
]);
```
**Riesgo:** CRÍTICO. En un fondo con 500+ socios y miles de aportes acumulados, esta consulta carga TODAS las filas de 3 tablas en memoria para luego filtrar con JS. No hay paginación, no hay filtro por período, no hay agregación en SQL.

**Impacto:** Degradación de rendimiento conforme crecen los datos. En producción real con años de operaciones, puede llevar a timeouts o OOM.

### 4.2 Cálculos de agregación en JavaScript (backend)

**Archivo:** `backend/src/routes/dashboard.js:15-43`

Todos estos cálculos se hacen en Node.js en lugar de SQL:
- `socios.reduce((t, s) => t + Number(s.ahorroAcumulado), 0)` → Debería ser `SELECT SUM(ahorro_acumulado) FROM socios`
- `creditos.filter(c => c.estado !== 'pagado').reduce(...)` → Debería ser agregación SQL con WHERE
- `aportes.filter(a => a.estado === 'pagado').reduce(...)` → Igual

**Riesgo:** ALTO. Ineficiente, propenso a errores de precisión numérica con `Number()`, y sin beneficio de optimización del motor de base de datos.

### 4.3 Lógica de mora duplicada e inconsistente

**Archivo:** `backend/src/routes/dashboard.js:19-36`
```javascript
const sociosMoraIds = new Set(
  aportes.filter(a => ['mora', 'vencido'].includes(a.estado)).map(a => a.socioId || a.socio_id)
);
const sociosMora = socios.filter(s => String(s.estado || '').toLowerCase() === 'mora');

console.log('SOCIOS MORA DASHBOARD:', sociosMora.map(s => ({...})));
```
**Riesgo:** ALTO. Existen **dos lógicas diferentes** para determinar socios en mora:
1. `sociosMoraIds`: Socios que tienen al menos un aporte en estado `'mora'` o `'vencido'`.
2. `sociosMora`: Socios cuyo campo `estado` es `'mora'`.

Estos dos conjuntos NO son equivalentes y pueden dar resultados diferentes. Solo se usa `sociosMora` (la segunda) en la respuesta. Además, queda código muerto (`sociosMoraIds` se calcula pero nunca se usa).

Adicionalmente, hay un `console.log` de depuración (líneas 29-36) que expone datos de socios en la consola del servidor en producción.

### 4.4 Total recaudado sin filtrar por período

**Archivo:** `backend/src/routes/dashboard.js:61`
```javascript
total_recaudado: aportePagados.reduce((t, a) => t + Number(a.monto), 0),
```
**Riesgo:** ALTO. `aportePagados` se calcula en línea 37 como `aportes.filter(a => a.estado === 'pagado')` — esto incluye **todos los aportes pagados de la historia**, no solo los del período activo. El nombre `total_recaudado` sugiere que es del mes actual, pero es el total histórico.

### 4.5 Cálculos financieros en frontend

**Archivo:** `js/charts.js:62-187` (`crearGraficoBarras`), `js/charts.js:194-332` (`crearGraficoLinea`), `js/charts.js:338-416` (`crearGraficoDistribucion`)

**Riesgo:** CRÍTICO. Los tres gráficos principales del Dashboard realizan agregaciones financieras directamente en el navegador del usuario:

- `crearGraficoBarras`: Suma aportes por mes desde `window.pageAportes`
- `crearGraficoLinea`: Calcula tendencia acumulada desde `window.pageAportes` (ver sección 10)
- `crearGraficoDistribucion`: Recalcula totalAhorros desde `window.DB.socios`, totalCartera desde `window.DB.creditos`

Esto viola el principio fundamental: **las reglas financieras no deben implementarse en el frontend** (Regla de Negocio §12.1).

Además, el código de fecha contiene una cadena de fallbacks frágil:
```javascript
a.fecha_pago || a.fechaPago || a.fecha || a.created_at || a.createdAt
```
Esto indica que los datos llegan con nombres de campo inconsistentes desde el backend.

### 4.6 Duplicación de carga de datos (app.js + dashboard.html)

**Archivo:** `js/app.js:241-308` y `pages/dashboard.html:138-145`

`app.js` precarga **7 endpoints** en cada página (config, socios, aportes, creditos, movimientos, notificaciones, solidaridad). Luego `dashboard.html` carga **6 endpoints adicionales** (dashboard.resumen, socios, creditos, aportes, solidaridad.saldo, movimientos).

**Riesgo:** ALTO. Los mismos datos viajan dos veces por la red. `API.socios.listar()` se llama dos veces, `API.aportes.listar()` también. Esto duplica el tráfico, duplica el tiempo de carga, y puede causar inconsistencias si los datos cambian entre una llamada y otra.

### 4.7 Caché ausente

**Riesgo:** MEDIO. No hay caché de ningún tipo para los endpoints del Dashboard. Cada visita o refresco ejecuta consultas completas a la base de datos. En un entorno con múltiples usuarios (tesorero, administrador) consultando simultáneamente, la carga en PostgreSQL puede ser significativa.

### 4.8 Race Conditions

**Riesgo:** BAJO-MEDIO. Las lecturas en `dashboard.js` no usan transacciones ni `SELECT ... FOR UPDATE`. Si un proceso de cierre de período está escribiendo datos mientras el Dashboard lee, los números podrían ser inconsistentes (lectura de datos parcialmente actualizados).

### 4.9 Precisión numérica

**Archivo:** Múltiples ubicaciones.

`Number()` se usa extensivamente para convertir valores `Decimal` de Prisma/PostgreSQL. Los `Decimal(15,2)` de PostgreSQL pueden perder precisión al convertirse a Number de JavaScript (IEEE 754). Para montos financieros, esto puede introducir errores de redondeo en valores que excedan ~9 billones (9e15), o con muchos decimales. Aunque para un fondo de empleados es improbable alcanzar ese límite, el riesgo existe.

---

## 5. Riesgos Funcionales Detectados

### 5.1 Indicador "Total Ahorros" posiblemente incorrecto

**Backend:** `dashboard.js:15` — calcula `totalAhorros` como suma de `socio.ahorroAcumulado`.

**Frontend:** `charts.js:344-348` — `crearGraficoDistribucion` recalcula el mismo total desde `window.DB.socios`.

**Riesgo:** Si `window.DB.socios` no está sincronizado con el backend (por ejemplo, si el usuario navegó desde otra página), el doughnut chart puede mostrar un valor diferente al KPI de "Total Ahorros". Dos fuentes de verdad para el mismo indicador.

### 5.2 Gráfico de tendencia de ahorro engañoso

**Archivo:** `js/charts.js:194-332` (`crearGraficoLinea`)

Este gráfico suma los montos de todos los aportes pagados ordenados por fecha y calcula un acumulado mensual. **Esto NO representa el ahorro acumulado real** de los socios por varias razones:
1. No considera descuentos por desembolsos de créditos
2. No considera abonos a capital de créditos
3. No considera retiros o pagos de solidaridad
4. Acumula simplemente aportes, no el saldo de `ahorroAcumulado` de la tabla `socios`

**Impacto:** Un usuario podría interpretar que "el ahorro del fondo está creciendo" cuando en realidad el ahorro disponible podría estar decreciendo por desembolsos de créditos.

### 5.3 Distribución de fondos conceptualmente incorrecta

**Archivo:** `js/charts.js:338-416` (`crearGraficoDistribucion`)

Suma tres conceptos que **no deberían sumarse**: Ahorros + Cartera + Solidaridad.
- Ahorros = suma del `ahorroAcumulado` de todos los socios (pasivo del fondo)
- Cartera = suma del `saldoCapital` de créditos activos (activo del fondo)
- Solidaridad = saldo de caja de solidaridad (otro fondo)

Visualizarlos juntos como un "pastel" sugiere que forman un todo homogéneo, pero son categorías contablemente distintas que no deberían sumarse en un solo gráfico de distribución.

### 5.4 Alertas con regla de negocio hardcodeada

**Archivo:** `pages/dashboard.html:609`
```javascript
'<div class="alert-body">Llevan más de 30 días sin aporte.</div>'
```
La regla "30 días sin aporte = mora" está hardcodeada en el frontend. Según REGLAS_DE_NEGOCIO.md §8, "Las reglas específicas podrán parametrizarse en futuras versiones". Esta regla debería venir del backend o de la configuración.

### 5.5 Período hardcodeado

**Archivo:** `pages/dashboard.html:267`
```javascript
window.DB?.config?.periodo_actual || "Marzo 2026"
```
El período actual tiene un fallback hardcodeado "Marzo 2026". Si `window.DB.config.periodo_actual` no está definido (falló la carga de configuración), se muestra un período incorrecto.

### 5.6 Año hardcodeado en título del gráfico

**Archivo:** `pages/dashboard.html:38`
```html
<span class="card-title">Aportes vs Créditos — 2026</span>
```
El año 2026 está hardcodeado en el HTML. No se actualizará automáticamente cuando cambie el año.

### 5.7 Manejo de valores nulos en actividad reciente

**Archivo:** `pages/dashboard.html:563`
```javascript
var monto = (isIngreso ? "+" : "-") + DataHelper.formatCOP(Number(m.monto) || 0);
```
Si `m.monto` es `null` o `undefined`, `Number(m.monto)` es `NaN`, pero con `|| 0` se convierte en 0. Esto es correcto para evitar NaN, pero puede ocultar datos faltantes.

### 5.8 Fecha inválida en actividad reciente

**Archivo:** `pages/dashboard.html:546-548`
```javascript
var dateA = new Date(a.fecha || a.created_at || a.createdAt || 0).getTime();
```
Si todas las fechas son `null`/`undefined`, se usa `new Date(0)` que es `1970-01-01`. Esto podría poner actividades sin fecha al inicio del ordenamiento.

### 5.9 Error de red sin manejo de skeletons

Si `cargarDatos()` falla completamente (los 6 endpoints fallan), se muestra un Toast de error, pero los skeletons nunca se ocultan. El usuario ve una página con skeletons congelados.

### 5.10 Redirección inconsistente para rol socio

**Archivo:** `pages/dashboard.html:245-248`
```javascript
if (s && s.rol === "socio") {
  window.location.href = "mi-cuenta.html";
  return;
}
```
Dashboard está configurado como accesible para el rol `"socio"` en `roles.js:39`, pero la página redirige a los socios a `mi-cuenta.html`. Esto es una contradicción entre la configuración de permisos y el comportamiento real.

---

## 6. Código Duplicado o Muerto

### 6.1 Código muerto: `sociosMoraIds`

**Archivo:** `backend/src/routes/dashboard.js:19-23`
```javascript
const sociosMoraIds = new Set(
  aportes.filter(a => ['mora', 'vencido'].includes(a.estado)).map(a => a.socioId || a.socio_id)
);
```
Esta variable se calcula pero nunca se usa. Solo se usa `sociosMora` (línea 25).

### 6.2 Console.log de depuración en producción

**Archivo:** `backend/src/routes/dashboard.js:29-36`
```javascript
console.log('SOCIOS MORA DASHBOARD:', sociosMora.map(s => ({...})));
```
Además de ser código de depuración en producción, expone datos personales de socios (id, nombre, estado) en los logs del servidor.

### 6.3 Duplicación: `renderKPIs` vs `charts.js` cálculos

**Archivo:** `pages/dashboard.html:491-541` y `js/charts.js:338-416`

El KPI de "Total Ahorros" se muestra desde `r.ahorros.total` (backend), pero el doughnut chart recalcula el mismo valor desde `window.DB.socios`. Dos caminos diferentes para el mismo número.

### 6.4 Duplicación: `crearGraficoBarras` y `crearGraficoBarrasTabbed`

**Archivo:** `js/charts.js:62-187` y `pages/dashboard.html:311-488`

`crearGraficoBarras()` en charts.js tiene la misma lógica que el modo "mensual" de `crearGraficoBarrasTabbed()` en dashboard.html. `crearGraficoBarras()` nunca se llama desde el Dashboard (dashbooard.html usa su propia versión `crearGraficoBarrasTabbed`). Es código muerto desde la perspectiva del Dashboard.

### 6.5 Duplicación de DataHelper y utilidades inline

**Archivo:** `pages/dashboard.html:492-498` define `fmtM()` inline para formatear moneda.
**Archivo:** `js/app.js:61-67` define `DataHelper.formatCOP()`.

Ambas funciones hacen exactamente lo mismo. La función `fmtM()` se redefine en cada llamada a `renderKPIs()`, lo que es ineficiente.

### 6.6 Carga duplicada de datos

Como se mencionó en 4.6:
- `app.js:243-308` carga socios, aportes, creditos, movimientos, solidaridad
- `dashboard.html:138-145` carga los mismos datos nuevamente

---

## 7. Problemas de Arquitectura

### 7.1 Violación de Clean Architecture — Lógica de negocio en presentación

El Dashboard viola el principio fundamental de separación de capas:
- **Capa de presentación** (dashboard.html, charts.js): Contiene lógica de agregación financiera (sumas de aportes, acumulados, distribuciones).
- **Capa de aplicación** (dashboard.js): No existe como tal. La ruta mezcla transporte y lógica.
- **Capa de dominio**: No existe. No hay objetos de negocio para KPIs, métricas o indicadores.
- **Capa de infraestructura**: Prisma se usa directamente desde la ruta.

**Flujo actual (incorrecto):**
```
Navegador → API Route (dashboard.js) → Prisma → PostgreSQL
     ↓ (devuelve datos crudos)
Navegador (charts.js) → Calcula KPIs financieros → Renderiza
```

**Flujo requerido:**
```
Navegador → API Route → Service Layer → Repository → Prisma → PostgreSQL
     ↓ (devuelve KPIs precalculados)
Navegador → Renderiza directamente
```

### 7.2 Ausencia de capa de servicio

**Archivo:** `backend/src/routes/dashboard.js`

A diferencia de otros módulos (socios, creditos, aportes) que tienen `socioService.js`, `creditoService.js`, `aporteService.js`, el Dashboard **no tiene servicio**. Toda la lógica está inline en el route handler.

### 7.3 Acoplamiento con window.DB

**Archivo:** `js/app.js`, `pages/dashboard.html`, `js/charts.js`

`window.DB` es un store global mutable accesible desde cualquier script. Cualquier módulo puede sobrescribir `window.DB.socios`, `window.DB.creditos`, etc. Esto crea:
- Dependencias ocultas entre módulos
- Riesgo de corrupción de datos
- Imposibilidad de testear componentes de forma aislada
- Dificultad para migrar a frameworks reactivos

### 7.4 Mezcla de responsabilidades en app.js

`app.js` sirve como:
- Inicializador global
- Store de datos (window.DB)
- Helper/Util (DataHelper)
- Sidebar controller
- Toast/Modal system
- Precarga de datos para TODOS los módulos

Esto es un **God Object** incipiente que debe descomponerse.

### 7.5 Sin read-model para Dashboard

No existe un modelo de lectura (read-model) optimizado para las consultas del Dashboard. Cada petición hace JOINs complejos sobre tablas transaccionales. En un sistema CQRS, el Dashboard consumiría de un read-model desnormalizado.

### 7.6 Dependencia de CDN externo

**Archivo:** `pages/dashboard.html:124`
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```
Chart.js se carga desde CDN externo. Si el CDN está caído o hay problemas de red, los gráficos no se renderizan. En un entorno financiero, las dependencias deberían estar empaquetadas localmente o servidas desde un mirror controlado.

---

## 8. Evaluación del Modelo de Datos

### 8.1 Consultas del Dashboard vs Esquema Prisma

| Consulta | Modelo | Coherente | Observación |
|----------|--------|-----------|-------------|
| `socios.findMany()` | `Socio` | ✅ | Correcto pero sin filtro |
| `creditos.findMany()` | `Credito` | ✅ | Correcto pero sin filtro |
| `aportes.findMany()` | `Aporte` | ✅ | Correcto pero sin filtro |
| `periodo.findFirst({ where: { activo: true } })` | `Periodo` | ✅ | Correcto |
| `{ estado: 'pagado', periodo: { anio } }` | `Aporte` → `Periodo` | ✅ | Relación correcta |

### 8.2 Campos faltantes o mal utilizados

**Campo `socioId` vs `socio_id` en dashboard.js:22**
```javascript
.map(a => a.socioId || a.socio_id)
```
Prisma usa `socioId` (camelCase). La verificación con `|| a.socio_id` sugiere que en algún momento los datos llegaban con snake_case desde consultas raw SQL. Esto es un code smell que indica posible inconsistencia entre consultas Prisma y SQL directo.

**Modelo `SolidaridadMovimiento`**
El endpoint `GET /solidaridad/saldo` debe consultar esta tabla, pero el dashboard no tiene un respaldo directo. Depende del servicio de solidaridad.

**Modelo `Movimiento`**
Se usa para "Actividad reciente" pero **no tiene campo `socioId`**. Los movimientos son genéricos, no están asociados a un socio específico, lo que limita la capacidad de mostrar actividad por socio.

### 8.3 Índices relevantes

El esquema tiene índices en:
- `socios.estado` — usado por dashboard.js:48 (filtro de socios activos)
- `aportes.socioId`, `aportes.periodoId`, `aportes.estado` — todos relevantes
- `creditos.socioId`, `creditos.estado` — relevantes

Los índices son adecuados para las consultas actuales, pero **no hay índices compuestos** para las agregaciones que hace el Dashboard (ej. `(estado, periodoId)` en aportes).

---

## 9. Compatibilidad con las Reglas Oficiales de Negocio de FONEVI

### 9.1 Regla §12.1 — "Ninguna regla financiera deberá implementarse únicamente en el frontend"

**Estado:** ❌ **VIOLADA GRAVEMENTE**

Los siguientes cálculos financieros se realizan exclusivamente en el frontend:
- Suma de aportes por mes para gráfico de barras (`charts.js:62-187`)
- Cálculo de tendencia acumulada (`charts.js:194-332`)
- Suma de ahorros, cartera y solidaridad para distribución (`charts.js:338-416`)
- No existe ningún endpoint en el backend que devuelva estos datos precalculados

### 9.2 Regla §12.2 — "Las reglas de negocio deberán centralizarse en el backend"

**Estado:** ❌ **VIOLADA**

### 9.3 Regla §6 — "Los parámetros deberán administrarse desde la base de datos"

**Estado:** ❌ **VIOLADA PARCIALMENTE**

- El período actual tiene fallback hardcodeado "Marzo 2026"
- La regla de mora "30 días" está hardcodeada en frontend

### 9.4 Regla §9 — "Las operaciones relevantes deberán registrar información suficiente para reconstruir su ejecución"

**Estado:** ❌ **VIOLADA**

El Dashboard no tiene auditoría. No se registra:
- Quién consultó el Dashboard
- Cuándo se consultó
- Qué métricas se mostraron
- Si hubo errores en la generación de KPIs

### 9.5 Regla §2 — Modalidades de aporte

**Estado:** ⚠️ **NO VERIFICABLE DESDE EL DASHBOARD**

El Dashboard no distingue entre las 5 modalidades de pago. El gráfico de barras trata todos los aportes pagados como iguales, cuando debería poder segmentar por modalidad.

### 9.6 Regla §7 — Cierre mensual

**Estado:** ⚠️ **RIESGO POTENCIAL**

Si el Dashboard se consulta mientras se ejecuta un cierre mensual, los datos podrían ser inconsistentes por falta de aislamiento transaccional en las lecturas.

---

## 10. Evaluación de los KPIs y Métricas

### 10.1 Total Ahorros

| Aspecto | Evaluación |
|---------|------------|
| **Cómo se calcula (backend)** | `socios.reduce((t, s) => t + Number(s.ahorroAcumulado), 0)` |
| **Coincide con datos persistidos** | ✅ Sí, suma directa del campo `ahorro_acumulado` |
| **Depende de datos en memoria** | ❌ No, se calcula en backend |
| **Riesgo** | 🟡 Medio: Precisión de `Number()` para Decimal(15,2) |
| **Recomendación** | Mover a agregación SQL: `SELECT SUM(ahorro_acumulado) FROM socios` |

### 10.2 Socios Activos

| Aspecto | Evaluación |
|---------|------------|
| **Cómo se calcula (backend)** | `socios.filter(s => s.estado === 'activo').length` |
| **Coincide con datos persistidos** | ✅ Sí |
| **Depende de datos en memoria** | ❌ No, se calcula en backend |
| **Riesgo** | 🟢 Bajo |
| **Recomendación** | Usar `prisma.socio.count({ where: { estado: 'activo' } })` |

### 10.3 Créditos Activos

| Aspecto | Evaluación |
|---------|------------|
| **Cómo se calcula (backend)** | `creditos.filter(c => c.estado === 'activo')` |
| **Coincide con datos persistidos** | ✅ Sí |
| **Riesgo** | 🟢 Bajo |
| **Recomendación** | Usar `prisma.credito.count({ where: { estado: 'activo' } })` |

### 10.4 Cartera (saldo de créditos activos)

| Aspecto | Evaluación |
|---------|------------|
| **Cómo se calcula (backend)** | `creditos.filter(c => c.estado !== 'pagado').reduce((t, c) => t + Number(c.saldoCapital), 0)` |
| **¿Incluye créditos en mora?** | ✅ Sí (estado !== 'pagado' incluye 'activo', 'mora', 'vencido') |
| **Riesgo** | 🟢 Bajo |
| **Recomendación** | Mover a agregación SQL |

### 10.5 Socios en Mora

| Aspecto | Evaluación |
|---------|------------|
| **Cómo se calcula (backend)** | `socios.filter(s => String(s.estado).toLowerCase() === 'mora')` |
| **Coincide con datos persistidos** | ✅ Sí, pero solo considera el campo `socio.estado` |
| **¿Considera aportes vencidos?** | ❌ No. Usa `sociosMoraIds` que no se usa. El indicador solo mira socio.estado |
| **Riesgo** | 🟠 Alto: Un socio puede tener aportes vencidos pero estado 'activo' y no aparecería aquí |
| **Recomendación** | Unificar criterio: ¿la mora se define por el estado del socio o por la existencia de aportes vencidos? |

### 10.6 Aportes del Mes — Pagados

| Aspecto | Evaluación |
|---------|------------|
| **Cómo se calcula (backend)** | `aportesPerAct.filter(a => a.estado === 'pagado').length` |
| **Filtrado por período activo** | ✅ Sí |
| **Riesgo** | 🟢 Bajo |

### 10.7 Aportes del Mes — Pendientes

| Aspecto | Evaluación |
|---------|------------|
| **Cómo se calcula (backend)** | `aportesPerAct.filter(a => a.estado === 'pendiente').length` |
| **Filtrado por período activo** | ✅ Sí |
| **Riesgo** | 🟢 Bajo |

### 10.8 Aportes del Mes — En Mora

| Aspecto | Evaluación |
|---------|------------|
| **Cómo se calcula (backend)** | `aportesPerAct.filter(a => ['mora','vencido'].includes(a.estado)).length` |
| **Filtrado por período activo** | ✅ Sí |
| **Riesgo** | 🟡 Medio: Depende de que los aportes se marquen correctamente como 'mora' o 'vencido' |

### 10.9 Total Recaudado

| Aspecto | Evaluación |
|---------|------------|
| **Cómo se calcula (backend)** | Todos los aportes pagados de la historia |
| **¿Filtrado por período?** | ❌ **NO** (ver 4.4) |
| **Riesgo** | 🔴 Crítico: El nombre sugiere que es del mes, pero es histórico |
| **Recomendación** | **URGENTE**: Filtrar por `periodoActivo.id` igual que los contadores |

### 10.10 Gráfico de Barras — Aportes vs Créditos

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`charts.js:62-187` y `dashboard.html:311-488`) |
| **Respaldado por backend** | ❌ No existe endpoint que devuelva aportes/creditos por mes |
| **Riesgo** | 🔴 Crítico: Depende de que `window.pageAportes` esté completo y actualizado |

### 10.11 Gráfico de Línea — Tendencia de ahorro

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`charts.js:194-332`) |
| **¿Representa ahorro real?** | ❌ **NO** (ver 5.2) |
| **Riesgo** | 🟠 Alto: Engañoso, puede llevar a interpretaciones incorrectas |
| **Recomendación** | Renombrar a "Aportes acumulados en el año" o reemplazar por datos reales de `ahorroAcumulado` histórico |

### 10.12 Gráfico de Dona — Distribución de fondos

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`charts.js:338-416`) |
| **Respaldado por backend** | ❌ No existe endpoint |
| **Conceptualmente correcto** | ❌ No (ver 5.3) |
| **Riesgo** | 🟡 Medio: Confusión conceptual |

### 10.13 Actividad Reciente

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`dashboard.html:544-584`) |
| **Respaldado por backend** | ⚠️ Sí, pero depende del endpoint `movimientos.listar()` |
| **Riesgo** | 🟡 Medio: La lógica es solo de presentación (ordenar, formatear), aceptable en frontend |

### 10.14 Estado de Socios (tabla resumen)

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`dashboard.html:586-598`) |
| **Respaldado por backend** | ⚠️ Sí, pero ordena y filtra en frontend |
| **Riesgo** | 🟢 Bajo: Solo muestra top 5 por ahorro acumulado, lógica de presentación aceptable |

---

## 11. Evaluación de la Trazabilidad

### 11.1 Capacidad de reconstrucción

| Pregunta | Respuesta |
|----------|-----------|
| ¿Quién generó la información del Dashboard? | ❌ No se registra. No hay auditoría de consultas al Dashboard |
| ¿Cuándo fue actualizada por última vez? | ❌ No hay timestamp de refresco. Los datos son del momento de carga de la página |
| ¿Qué operaciones la afectan? | ❌ No hay trazabilidad entre operaciones de negocio y cambios en KPIs |
| ¿Existe trazabilidad suficiente para auditoría financiera? | ❌ **No.** Un auditor no podría reconstruir qué datos específicos se mostraron en un momento dado |

### 11.2 Auditoría existente

El middleware `audit.js` está disponible en el backend, pero **ninguna operación del Dashboard lo utiliza**. Las rutas del Dashboard (`dashboard.js`) no llaman a `audit()`.

### 11.3 Recomendación de trazabilidad

Para cumplir con estándares financieros, cada consulta al Dashboard debería registrar:
- `usuario_id`: Quién consultó
- `accion`: "dashboard.consulta" o "dashboard.kpis"
- `tabla`: "dashboard"
- `detalle`: Resumen de KPIs devueltos (para reconstrucción histórica)
- `ip`: Dirección IP del solicitante
- `created_at`: Timestamp de la consulta

---

## 12. Recomendaciones de Mejora

### Inmediatas (Críticas antes de producción)

| # | Recomendación | Archivo(s) | Impacto | Esfuerzo |
|---|---------------|------------|---------|----------|
| **I1** | Mover cálculo de Total Recaudado para filtrar por período activo | `dashboard.js:61` | 🔴 Evita mostrar total histórico como si fuera del mes | 1 hora |
| **I2** | Eliminar `console.log` de depuración con datos de socios | `dashboard.js:29-36` | 🔴 Seguridad: exposición de datos personales | 5 min |
| **I3** | Eliminar `sociosMoraIds` (código muerto) | `dashboard.js:19-23` | 🟡 Limpieza | 5 min |
| **I4** | Unificar criterio de mora: definir si usa `socio.estado` o aportes vencidos | `dashboard.js:25-27` | 🔴 Consistencia del KPI de mora | 4 horas |
| **I5** | Reemplazar año hardcodeado "2026" con valor dinámico | `dashboard.html:38,267` | 🟡 Precisión de datos | 30 min |
| **I6** | Agregar endpoint backend para datos de gráfico de barras (aportes vs créditos por mes) | `dashboard.js` (nuevo) | 🔴 Eliminar cálculo financiero del frontend | 8 horas |
| **I7** | Reemplazar el gráfico de tendencia de ahorro por uno que use datos reales de `ahorroAcumulado` o renombrarlo | `charts.js:194-332` | 🟠 Evitar interpretación engañosa | 4 horas |
| **I8** | Agregar timestamp de última actualización en el Dashboard | `dashboard.html` | 🟠 Transparencia para el usuario | 1 hora |

### Mediano Plazo (1-2 sprints)

| # | Recomendación | Impacto | Esfuerzo |
|---|---------------|---------|----------|
| **M1** | Crear `dashboardService.js` con lógica de negocio del Dashboard | 🔴 Separación de capas | 8 horas |
| **M2** | Reemplazar `findMany()` completo con agregaciones SQL (SUM, COUNT, GROUP BY) | 🔴 Rendimiento y escalabilidad | 4 horas |
| **M3** | Agregar caché (Redis o in-memory con TTL) para endpoints del Dashboard | 🟠 Rendimiento | 8 horas |
| **M4** | Eliminar carga duplicada: que `dashboard.html` use solo el endpoint de resumen, no recargue todos los módulos | 🟠 Rendimiento y consistencia | 4 horas |
| **M5** | Agregar auditoría a las consultas del Dashboard | 🟠 Trazabilidad | 2 horas |
| **M6** | Reemplazar CDN de Chart.js por paquete local o bundle | 🟡 Disponibilidad offline | 2 horas |
| **M7** | Eliminar `fmtM()` inline y usar `DataHelper.formatCOP()` consistemente | 🟡 Calidad de código | 1 hora |
| **M8** | Agregar endpoint para distribución de fondos desde backend | 🟠 Consistencia frontend-backend | 4 horas |

### Largo Plazo (3+ sprints)

| # | Recomendación | Impacto | Esfuerzo |
|---|---------------|---------|----------|
| **L1** | Implementar read-model / proyección para Dashboard (CQRS) | 🔴 Escalabilidad y consistencia | 40 horas |
| **L2** | Implementar WebSockets o Server-Sent Events para actualización en tiempo real | 🟠 UX | 24 horas |
| **L3** | Migrar window.DB a un store reactivo (Zustand, Pinia, o estado compartido) | 🟠 Mantenibilidad | 16 horas |
| **L4** | Descomponer `app.js` en módulos separados (DataHelper, Toast, Modal, Sidebar) | 🟡 Calidad de código | 8 horas |
| **L5** | Implementar Dashboard configurable por rol (qué KPIs ve cada usuario) | 🟡 Personalización | 16 horas |
| **L6** | Agregar tests automatizados para endpoints del Dashboard | 🟡 Calidad | 8 horas |

---

## 13. Observaciones para Futura Migración

### Clean Architecture
- **Preparación actual:** 🟠 Baja. El Dashboard no tiene servicio, repositorio, ni caso de uso.
- **Acción requerida:** Crear `dashboardService.js` y luego extraer casos de uso como `ObtenerResumenDashboard`, `ObtenerGraficoAnual`.
- **Prioridad:** Alta. Sin esta separación, el Dashboard seguirá siendo frágil.

### Domain-Driven Design (DDD)
- **Preparación actual:** 🔴 Mínima. No hay entidades de dominio para KPIs, no hay value objects para montos financieros.
- **Acción requerida:** Identificar `DashboardKPIs`, `Metrica`, `Indicador` como objetos de dominio con validaciones de negocio.
- **Nota:** El `Number()` para valores monetarios debe reemplazarse por un Value Object `Monto` que maneje precisión y operaciones financieras.

### SaaS Multi-Tenant
- **Preparación actual:** 🔴 No preparado. El Dashboard no tiene concepto de tenant.
- **Acción requerida:** Agregar `tenantId` a las consultas del Dashboard y filtrar por organización.
- **Impacto en Dashboard:** Todos los endpoints y queries deberán recibir el tenant del contexto de autenticación.

### Event Sourcing
- **Preparación actual:** 🔴 No preparado.
- **Observación:** El Dashboard se beneficiaría de Event Sourcing para reconstruir KPIs históricos. Cada aporte, crédito, pago sería un evento del cual derivar métricas.

### CQRS (Command Query Responsibility Segregation)
- **Preparación actual:** 🟡 Potencial. El Dashboard es naturalmente un "Query" que no debería compartir modelo con los "Commands" (operaciones de negocio).
- **Acción recomendada:** Separar las lecturas del Dashboard en un read-model independiente.
- **Beneficio:** Las consultas del Dashboard no competirían con las operaciones transaccionales.

### Panel SuperAdmin
- **Preparación actual:** 🟡 El Dashboard ya tiene indicadores útiles para un SuperAdmin.
- **Acción requerida:** Agregar métricas adicionales como: estado de la base de datos, tamaño de tablas, últimas copias de seguridad, actividad de usuarios.

### Backups
- **Preparación actual:** ❌ El Dashboard no muestra información sobre backups.
- **Acción requerida:** Agregar un widget de "Estado de backups" que muestre: fecha del último backup, tamaño, estado de verificación.

### Escalabilidad
- **Preparación actual:** 🔴 Mala. Las consultas actuales cargan datos completos en memoria.
- **Acción requerida:** Migrar a agregaciones SQL + paginación + caché.
- **Cuello de botella identificado:** `findMany()` en `socios`, `creditos`, `aportes` sin WHERE ni SELECT específico.

---

## 14. Conclusión Final

### ¿Está listo para producción?

**NO.** El módulo Dashboard de FONEVI **no está listo para un entorno financiero de producción** por las siguientes razones:

### Principales riesgos

1. **🔴 Cálculos financieros en frontend**: Las métricas clave del Dashboard se calculan en el navegador del usuario, violando las reglas de negocio oficiales (§12.1, §12.2). Si un usuario tiene datos desactualizados en `window.DB` (por fallos parciales de carga, por ejemplo), verá información incorrecta sin saberlo.

2. **🔴 Total recaudado incorrecto**: El indicador `total_recaudado` suma todos los aportes pagados de la historia, no solo del período actual, lo que muestra una cifra engañosamente alta.

3. **🔴 Sin trazabilidad**: No hay registro de quién consultó el Dashboard ni qué datos se mostraron. Un auditor financiero no podría reconstruir la información presentada en un momento dado.

4. **🟠 Gráfico de tendencia engañoso**: La "Tendencia de ahorro acumulado" muestra en realidad aportes acumulados, no el ahorro real de los socios.

5. **🟠 Doble carga de datos**: Cada visita al Dashboard dispara ~13 peticiones HTTP (6 de dashboard.html + 7 de app.js), duplicando tráfico y tiempo de carga.

6. **🟠 Sin caché ni optimización**: Las consultas cargan tablas completas en memoria sin filtros, agregaciones ni paginación.

### Nivel de confiabilidad

| Aspecto | Nivel |
|---------|-------|
| Precisión de KPIs numéricos (socios, créditos) | 🟡 Confiable con reservas |
| Precisión de KPIs financieros (ahorros, cartera) | 🟡 Confiable con reservas (precisión Number) |
| Gráficos (barras, línea, dona) | 🔴 No confiable (cálculo en frontend) |
| Total recaudado | 🔴 Incorrecto (no filtra por período) |
| Actividad reciente | 🟢 Confiable (solo presentación) |
| Alertas del sistema | 🟡 Confiable con reservas (reglas hardcodeadas) |

### Recomendación final del auditor

1. **No desplegar en producción** sin antes implementar las correcciones **Inmediatas (I1 a I8)**.
2. **Antes del primer corte financiero real**, implementar al menos las correcciones **Mediano Plazo (M1 a M4)** que aseguran que los KPIs se calculan en el backend con agregaciones SQL.
3. **Establecer un roadmap** de 2-3 meses para la migración completa a una arquitectura con servicios backend, caché y eliminación de cálculos financieros en frontend.
4. **No confiar en el gráfico de tendencia de ahorro** ni en el gráfico de distribución de fondos para decisiones financieras reales.

### Veredicto

> **🔴 NO APTO PARA PRODUCCIÓN.** El Dashboard de FONEVI es actualmente una **interfaz de monitoreo visual con limitaciones críticas**. Para ser considerado un sistema financiero confiable, debe refactorizarse para que todos los cálculos de KPIs y métricas financieras se ejecuten en el backend, con consultas SQL optimizadas, auditoría de acceso y datos verificables en todo momento.

---

*Documento generado el 17 de junio de 2026 — Auditoría integral del Módulo Dashboard / Panel Principal de FONEVI.*
