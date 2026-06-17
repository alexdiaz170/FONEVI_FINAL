# Auditoría Integral — Módulo de Movimientos / Contabilidad / Caja
## Sistema FONEVI — Fondo de Empleados Docentes

---

**Fecha de auditoría:** 17 de junio de 2026
**Auditor:** Arquitecto de Software Senior / Auditor Técnico / Especialista en Contabilidad Financiera
**Versión del sistema:** FONEVI FINAL
**Alcance:** Módulo de Movimientos Contables (ingresos, egresos, libro diario, balance, categorías, exportación)
**Clasificación:** 🔴 **CRÍTICO — No apto para producción en estado actual**

---

## 1. Resumen Ejecutivo

### Estado general del módulo
El módulo de Movimientos/Contabilidad es funcional para el registro básico y visualización de transacciones, pero presenta **deficiencias graves en integridad financiera, trazabilidad y arquitectura contable**. Todos los cálculos de KPIs, balances, agregaciones por categoría y gráficos se realizan en el frontend a partir de datos crudos, y el Balance General contiene **errores conceptuales de contabilidad**.

### Nivel de madurez
🟠 **Alpha** — Operativo para registro individual de transacciones, pero no confiable para reportes financieros auditables.

### Fortalezas
1. **CRUD completo**: Crear, listar, actualizar y eliminar movimientos funcionales.
2. **Auditoría en backend**: Las operaciones CRUD quedan registradas en la tabla `auditoria` mediante el middleware `audit()`.
3. **SQL parametrizado**: El servicio usa consultas parametrizadas, previniendo inyección SQL.
4. **Control de acceso por rol**: Solo `administrador` puede eliminar; `administrador`/`tesorero` pueden crear/editar.
5. **UX de formulario completa**: Selector de tipo ingreso/egreso, categorías dinámicas, fecha, descripción y referencia.
6. **Exportación a Excel funcional**: Genera libro diario + resumen mensual desde el frontend.

### Debilidades
1. **🔴 Error contable en el Balance General**: `totalAhorros` aparece simultáneamente como Activo ("Ahorro de socios") y como Patrimonio ("Aportes acumulados socios"), duplicando el mismo concepto en ambos lados del balance.
2. **🔴 Reservas constituidas hardcodeadas**: `2500000` fijo en el código, sin consultar datos reales.
3. **🔴 `referencia` enviada desde frontend pero el backend la ignora**: El campo `referencia` se captura en el formulario y se envía al backend, pero el servicio `movimientoService.js` no lo incluye en `INSERT` ni en `SELECT`.
4. **🔴 Todos los cálculos agregados en frontend**: KPIs, gráficos, balance, categorías — 100% del cálculo financiero ocurre en el navegador.
5. **🟠 Filtro de período hardcodeado**: `m.fecha.includes("2026-03")` — literalmente revisa una cadena de texto para filtrar marzo de 2026.
6. **🟠 Eliminación física (DELETE)**: Los movimientos se borran físicamente de la base de datos, sin soft-delete ni respaldo.
7. **🟠 Sin paginación**: La tabla del libro diario carga todos los movimientos sin paginación.
8. **🟠 Sin conciliación financiera**: No existe validación de que los movimientos registrados correspondan a operaciones reales de aportes, créditos o solidaridad.
9. **🟡 Sin carga diferida ni skeletons**: La página de contabilidad no tiene indicadores de carga.

### Riesgos principales

| Riesgo | Nivel | Impacto |
|--------|-------|---------|
| Balance General con error conceptual (doble contabilización de ahorros) | 🔴 Crítico | Reportes financieros engañosos |
| Cálculos financieros 100% en frontend | 🔴 Crítico | Datos inconsistentes si window.DB está desactualizado |
| `referencia` perdida en backend | 🟠 Alto | Pérdida de trazabilidad de movimientos |
| Reservas hardcodeadas en balance | 🟠 Alto | Balance incorrecto si las reservas reales son diferentes |
| Eliminación física sin control | 🟠 Alto | Pérdida de historial contable |
| Filtro de período hardcodeado a "2026-03" | 🟠 Alto | KPIs del mes incorrectos fuera de marzo 2026 |

### Conclusión ejecutiva
El módulo de Movimientos/Contabilidad **no está listo para producción**. Es adecuado como **herramienta de registro operativo** pero no puede usarse para generar estados financieros auditables. El Balance General contiene errores conceptuales de contabilidad que podrían llevar a interpretaciones financieras incorrectas. Se requiere una reescritura del backend con endpoints de agregación, corrección del balance, sincronización del campo `referencia`, y soft-delete antes de considerar uso en producción.

---

## 2. Inventario de Archivos Analizados

### Backend — Rutas, Controladores, Servicios

| # | Archivo | Rol |
|---|---------|-----|
| 1 | `backend/src/routes/movimientos.js` | Definición de rutas REST: GET, GET/:id, POST, PUT, DELETE |
| 2 | `backend/src/controllers/movimientoController.js` | Controlador con validación básica y llamadas a audit() |
| 3 | `backend/src/services/movimientoService.js` | Servicio CRUD con SQL parametrizado directo (sin Prisma) |
| 4 | `backend/src/middleware/auth.js` | Middleware `requireAuth` y `requireRole` para control de acceso |
| 5 | `backend/src/middleware/audit.js` | Middleware de auditoría operacional |
| 6 | `backend/src/app.js` | Registro de ruta `/api/movimientos` (línea 114) |
| 7 | `backend/src/db/index.js` | Pool de PostgreSQL con soporte de transacciones |
| 8 | `backend/src/lib/prisma.js` | Singleton Prisma (NO usado por movimientoService) |

### Frontend — Página Principal

| # | Archivo | Rol |
|---|---------|-----|
| 9 | `pages/contabilidad.html` | Página completa: KPIs, libro diario, gráficos, categorías, balance, modal creación, exportación |

### Frontend — Módulos Compartidos

| # | Archivo | Rol |
|---|---------|-----|
| 10 | `js/api.js` | Cliente HTTP: `movimientos.listar()`, `movimientos.crear()`, `movimientos.eliminar()` |
| 11 | `js/app.js` | `window.DB`, `DataHelper`, precarga global de datos |
| 12 | `js/export.js` | Módulo de exportación (NO usado por contabilidad — tiene lógica inline) |
| 13 | `js/charts.js` | Contiene `crearGraficoFlujoCaja()` (NO usado por contabilidad — gráficos inline) |

### Frontend — Infraestructura

| # | Archivo | Rol |
|---|---------|-----|
| 14 | `js/roles.js` | RBAC: contabilidad accesible por administrador y tesorero |
| 15 | `js/auth.js` | Autenticación y sesión JWT |
| 16 | `js/config.js` | URL base del backend |
| 17 | `css/main.css` | Estilos base (reutilizados) |
| 18 | `css/dashboard.css` | Estilos de KPIs y cards (reutilizados) |

### Modelo de Datos

| # | Archivo | Rol |
|---|---------|-----|
| 19 | `backend/prisma/schema.prisma` | Modelo `Movimiento` (líneas 127-139) |
| 20 | `backend/prisma/migration_indexes.sql` | Índices para movimientos (tipo, fecha) |

---

## 3. Clasificación por Archivo

### Conservar (con mejoras)

| Archivo | Motivo |
|---------|--------|
| `backend/src/middleware/auth.js` | `requireRole` funciona correctamente para control de acceso granular |
| `backend/src/middleware/audit.js` | Registro de auditoría operacional presente (aunque mejorable) |
| `backend/src/db/index.js` | Pool PostgreSQL con soporte de transacciones. Correcto. |
| `js/roles.js` | RBAC para contabilidad bien definido |
| `css/main.css`, `css/dashboard.css` | Estilos modulares, sin lógica de negocio |

### Refactorizar

| Archivo | Motivo |
|---------|--------|
| `backend/src/services/movimientoService.js` | **CRÍTICO**: Agregar campo `referencia` en SELECT/INSERT, migrar a Prisma, agregar paginación, filtros por fecha, soft-delete |
| `backend/src/controllers/movimientoController.js` | **ALTO**: Agregar validación de monto positivo, fecha no futura, integridad referencial |
| `backend/src/routes/movimientos.js` | **MEDIO**: Agregar ruta `GET /balance` y `GET /resumen-periodo` para cálculos server-side |
| `pages/contabilidad.html` | **CRÍTICO**: Mover cálculos de KPIs, balance y categorías a backend; corregir error conceptual del balance; reemplazar filtro hardcodeado |
| `js/api.js` | **MEDIO**: Agregar método `update` (existe en backend PUT pero no en cliente) |
| `js/app.js` | **MEDIO**: Desacoplar `DataHelper.getTotalAhorros/getTotalCartera` del balance |
| `backend/prisma/schema.prisma` | **ALTO**: Agregar campo `referencia` al modelo `Movimiento` |

### Archivar

| Archivo | Motivo |
|---------|--------|
| `js/export.js` | **Código muerto**: `Exporter.getFilteredData()` no es usado por ninguna página. La contabilidad tiene su propia función `exportarExcel()` inline. |
| `js/charts.js:crearGraficoFlujoCaja` | No es usado. Contabilidad tiene inline `renderGrafico()` con sus propios charts. |

### Eliminar / Reemplazar

| Archivo | Motivo |
|---------|--------|
| N/A | No se recomienda eliminar; todo el código existente puede refactorizarse. |

---

## 4. Riesgos Técnicos Detectados

### 4.1 Backend usa SQL directo (no Prisma)

**Archivo:** `backend/src/services/movimientoService.js`

El servicio de movimientos usa consultas SQL directas con `db.query()` en lugar de Prisma, a diferencia del resto del proyecto (socios, aportes, creditos usan Prisma).

**Riesgo:** 🟡 Medio. Inconsistencia arquitectónica. Si se aplican migraciones de Prisma que cambien el esquema de `movimientos`, las consultas SQL directas podrían quedar desincronizadas. El mapeo manual de columnas (`created_at as "createdAt"`) es frágil.

### 4.2 Campo `referencia` ignorado por backend

**Archivo:** `backend/src/services/movimientoService.js:7-8` (SELECT), `:37-42` (INSERT)

```javascript
// SELECT — no incluye referencia
SELECT id, tipo, categoria, descripcion, monto, fecha, created_at as "createdAt"
FROM movimientos

// INSERT — no incluye referencia
INSERT INTO movimientos (id, tipo, categoria, descripcion, monto, fecha, created_at)
VALUES ($1, $2, $3, $4, $5, $6, NOW())
```

**Frontend envía:** `pages/contabilidad.html:719` — `referencia: document.getElementById("nm-ref").value.trim() || null`

**Riesgo:** 🟠 Alto. El campo `referencia` es enviado por el cliente pero silenciosamente ignorado por el servidor. El usuario cree que está asociando el movimiento a una entidad (socio, crédito) pero esa asociación nunca se persiste. La trazabilidad se pierde.

Nota adicional: El modelo Prisma `Movimiento` **tampoco** incluye el campo `referencia`. Si existe en la tabla real de PostgreSQL, hay un **schema drift** entre Prisma y la base de datos.

### 4.3 Eliminación física sin soft-delete

**Archivo:** `backend/src/services/movimientoService.js:62`
```javascript
async delete(id) {
  const res = await db.query('DELETE FROM movimientos WHERE id = $1 RETURNING id', [id]);
  return res.rowCount > 0;
}
```

**Riesgo:** 🟠 Alto. Los movimientos se eliminan físicamente sin posibilidad de recuperación. En un sistema financiero, las transacciones deben preservarse para auditoría. Un movimiento eliminado puede romper la conciliación de un período.

### 4.4 Sin paginación en listado

**Archivo:** `backend/src/services/movimientoService.js:22`

```javascript
const res = await db.query(sql, params);
return res.rows;
```

No hay `LIMIT`, `OFFSET` ni paginación. Con cientos o miles de movimientos, la respuesta puede ser muy grande y lenta.

### 4.5 Sin filtros por fecha

**Archivo:** `backend/src/services/movimientoService.js:5`

```javascript
async listAll({ tipo, categoria } = {}) {
```

Soporta filtros por `tipo` y `categoria`, pero **no por fecha** ni por rango de fechas. El frontend se ve forzado a filtrar en el cliente.

### 4.6 Validación insuficiente en creación

**Archivo:** `backend/src/controllers/movimientoController.js:29-31`

```javascript
if (!tipo || !categoria || !monto || !descripcion) {
  return res.status(400).json({ ... });
}
```

No se valida:
- Que `monto` sea un número positivo mayor a 0
- Que `tipo` sea exactamente `"ingreso"` o `"egreso"`
- Que `fecha` no sea futura

### 4.7 Sin transacciones en operaciones críticas

**Archivo:** `backend/src/services/movimientoService.js`

La operación `create` no usa transacciones. Si bien una sola sentencia INSERT no lo requiere, en el futuro podrían necesitarse operaciones atómicas (ej. crear movimiento + actualizar saldo contable).

### 4.8 Todos los cálculos agregados en frontend

**Archivo:** `pages/contabilidad.html:413-436` (KPIs), `:494-600` (gráficos), `:605-642` (categorías), `:647-689` (balance)

**Riesgo:** 🔴 Crítico. Cada uno de estos bloques realiza sumas, filtros y agregaciones directamente sobre `window.pageMovimientos` en el navegador:

```javascript
var ing = mov.filter(m => m.tipo==="ingreso").reduce((t,m) => t+m.monto, 0);
var egr = mov.filter(m => m.tipo==="egreso").reduce((t,m) => t+m.monto, 0);
```

No existe un solo endpoint en el backend que devuelva estos totales precalculados. Cualquier discrepancia entre los datos en `window.pageMovimientos` y la base de datos produce reportes incorrectos.

### 4.9 Duplicación de lógica de gráficos

**Archivo:** `js/charts.js:594-711` (`crearGraficoFlujoCaja`) vs `pages/contabilidad.html:494-600` (`renderGrafico`)

Ambas funciones hacen esencialmente lo mismo: gráfico de barras ingresos vs egresos por mes. Pero `crearGraficoFlujoCaja` usa un enfoque diferente (incluye línea de neto) y no es llamado desde contabilidad.

**Riesgo:** 🟡 Medio. Código duplicado que aumenta la superficie de mantenimiento.

---

## 5. Riesgos Funcionales Detectados

### 5.1 🔴 ERROR CONTABLE: Balance General duplica "Ahorro de socios"

**Archivo:** `pages/contabilidad.html:647-689`

```javascript
// Activos (líneas 664-668)
balRow("Ahorro de socios",    DataHelper.formatCOP(totalAhorros))
balRow("Cartera de créditos", DataHelper.formatCOP(totalCartera))
balRow("Fondo solidaridad",   DataHelper.formatCOP(solidaridad))

// Patrimonio (líneas 670-678)
balRow("Aportes acumulados socios", DataHelper.formatCOP(totalAhorros))  // ← MISMO totalAhorros
balRow("Reservas constituidas",     DataHelper.formatCOP(2500000))       // ← Hardcodeado
balRow("Resultado del período",     ...)
```

**Problema:** `totalAhorros` (suma de `ahorroAcumulado` de socios) aparece en **ambos lados** del balance:
1. Como Activo: "Ahorro de socios" — dando a entender que el fondo tiene ese efectivo disponible
2. Como Patrimonio: "Aportes acumulados socios" — como si fuera capital social

**En contabilidad cooperativa:**
- Los ahorros de socios son un **pasivo** (el fondo debe ese dinero a los socios), no patrimonio
- Si aparecen como activo, debería ser "Efectivo en caja/bancos", que no necesariamente equivale al total de ahorros
- El patrimonio real incluye: reservas, resultados acumulados, donaciones, etc.

**Impacto:** El balance está **siempre cuadrando artificialmente** porque el mismo número aparece en ambos lados, dando una falsa sensación de consistencia. Un contador real identificaría esto como un error grave.

### 5.2 🔴 Reservas constituidas hardcodeadas

**Archivo:** `pages/contabilidad.html:672`
```javascript
balRow("Reservas constituidas", DataHelper.formatCOP(2500000))
```

**Riesgo:** Alto. El valor `2,500,000` está hardcodeado sin consultar la base de datos ni la configuración. Si las reservas reales cambian, el balance mostrará un valor incorrecto sin que nadie lo note.

### 5.3 🟠 Filtro de período hardcodeado a marzo 2026

**Archivo:** `pages/contabilidad.html:421`
```javascript
var movMes = mov.filter(function(m){ return m.fecha && m.fecha.includes("2026-03"); });
```

**Riesgo:** Alto. El KPI "Ingresos Marzo 2026" siempre filtra por marzo de 2026 usando una comparación de strings. Después de marzo de 2026, este indicador siempre mostrará $0. Además, usa comparación textual (`includes("2026-03")`) que es frágil: cualquier cadena que contenga "2026-03" coincidirá.

### 5.4 🟠 KPI "Ingresos del mes" usa período configurable inconsistente

**Archivo:** `pages/contabilidad.html:419-421`
```javascript
var mesActual = window.DB?.config?.periodo_actual || "Marzo 2026";
var movMes = mov.filter(function(m){ return m.fecha && m.fecha.includes("2026-03"); });
```

La etiqueta del KPI se obtiene de `window.DB.config.periodo_actual`, pero el filtro real está hardcodeado a `"2026-03"`. Si `periodo_actual` cambia a "Julio 2026", la etiqueta dirá "Ingresos Julio 2026" pero los datos mostrados seguirán siendo de marzo.

### 5.5 🟠 Eliminación sin verificación de integridad referencial

**Archivo:** `pages/contabilidad.html:759-779` y `movimientoService.js:61-64`

Se permite eliminar cualquier movimiento sin verificar:
- Si está asociado a un período cerrado
- Si forma parte de una conciliación
- Si es un movimiento de solidaridad que debería permanecer

Un administrador puede eliminar accidentalmente un movimiento que debería preservarse.

### 5.6 🟠 `window.pageMovimientos` como fuente de verdad

**Archivo:** `pages/contabilidad.html:351`

```javascript
window.pageMovimientos = movs?.datos || movs || [];
```

Todos los cálculos dependen de que este arreglo esté completo y actualizado. Si:
- La carga de datos falla parcialmente
- Otro usuario registra un movimiento mientras alguien ve el Dashboard
- Hay datos paginados incompletos

...los reportes serán incorrectos sin advertencia.

### 5.7 🟡 Monto puede ser negativo en formulario

**Archivo:** `pages/contabilidad.html:261-262`
```html
<input type="number" class="form-control" id="nm-monto" placeholder="0" min="1" step="1000"/>
```

El atributo `min="1"` es HTML del lado cliente, fácilmente evitable. No hay validación en backend de que `monto > 0`. Un usuario podría registrar un monto negativo, lo que podría causar KPIs y balances inconsistentes.

### 5.8 🟡 Fecha sin validación de futuro

No hay control de que la fecha del movimiento no sea futura. Se podrían registrar movimientos con fecha de mañana o del próximo mes.

### 5.9 🟡 Sin diferenciación de 5 modalidades de pago

**Archivo:** `pages/contabilidad.html:328-333`

```javascript
var CATEGORIAS = {
  ingreso: ["Aportes","Intereses créditos","Recuperación cartera",
            "Fondo solidaridad","Multas y moras","Otros ingresos"],
  egreso:  ["Desembolso crédito","Ayuda solidaridad","Gastos administrativos",
            "Dividendos pagados","Gastos financieros","Otros egresos"],
};
```

Las categorías están hardcodeadas en el frontend. No hay sincronización con las categorías reales usadas por otros módulos (aportes, créditos, solidaridad). Esto puede llevar a duplicación o inconsistencia en los reportes.

### 5.10 🟡 Exportación Excel sin respaldo en backend

**Archivo:** `pages/contabilidad.html:784-831`

```javascript
function exportarExcel() {
  // ... genera Excel desde window.pageMovimientos ...
  XLSX.writeFile(wb, "FONEVI_Contabilidad_" + ...);
}
```

La exportación se genera completamente en el navegador. Un usuario podría exportar datos desactualizados si `window.pageMovimientos` no está sincronizado. No hay un endpoint `/api/movimientos/exportar` que garantice datos frescos.

---

## 6. Código Duplicado o Muerto

### 6.1 `js/export.js` — Código muerto

**Archivo:** `js/export.js`
```javascript
const Exporter = {
  getFilteredData(tableId) { ... }
};
console.log("Export module loaded.");
```

Esta función **nunca es llamada** desde ninguna página. La contabilidad tiene su propia función `exportarExcel()` inline. El módulo `export.js` se carga en algunas páginas pero su única función no se usa.

### 6.2 `js/charts.js:crearGraficoFlujoCaja` — Código muerto desde contabilidad

**Archivo:** `js/charts.js:594-711`

La contabilidad define su propio `renderGrafico()` inline con Chart.js, ignorando `crearGraficoFlujoCaja` que existe en charts.js. Hay duplicación de lógica: ambas funciones crean un gráfico de barras ingresos vs egresos por mes, pero con implementaciones diferentes.

### 6.3 Duplicación de cálculos de totales en contabilidad

**Archivo:** `pages/contabilidad.html` (múltiples ubicaciones)

Los totales de ingresos y egresos se calculan al menos **4 veces** durante una sesión típica:
1. `renderKPIs()` — línea 415-416
2. `renderLibro()` — líneas 481-482 (solo para el pie de tabla de la vista actual)
3. `renderGrafico()` — línea 496-502
4. `renderCategorias()` — líneas 607-608 (separado para ingresos y egresos)
5. `renderBalance()` — líneas 653-654
6. `exportarExcel()` — líneas 788-789

Cada uno itera sobre `window.pageMovimientos` y recalcula los mismos totales. Para `n` movimientos y 6 funciones, hay `6 × n` iteraciones.

### 6.4 Función `fmtM` vs `DataHelper.formatCOP`

Similar al Dashboard, contabilidad usa `DataHelper.formatCOP()` pero no define `fmtM()` adicional.

### 6.5 CDNs duplicados

Chart.js se carga desde CDN tanto en `dashboard.html` como en `contabilidad.html` (y posiblemente otras páginas), cada vez que el usuario navega entre ellas se descarga de nuevo.

---

## 7. Problemas de Arquitectura

### 7.1 Violación de Clean Architecture — Cálculos financieros en frontend

El módulo de Contabilidad viola el principio fundamental de separación de capas en **todos** sus componentes:

| Componente | Cálculo realizado en frontend | Debería estar en |
|------------|------------------------------|-----------------|
| KPIs | Suma de ingresos/egresos, neto, filtro por período | Backend: `GET /api/movimientos/resumen` |
| Gráfico mensual | Agregación por mes, totales | Backend: `GET /api/movimientos/por-mes` |
| Categorías | Suma por categoría, porcentajes | Backend: `GET /api/movimientos/por-categoria` |
| Balance | Activos, pasivos, patrimonio, resultado | Backend: `GET /api/movimientos/balance` |
| Exportación Excel | Generación completa del archivo | Backend: `GET /api/movimientos/exportar?formato=xlsx` |

### 7.2 Mezcla de tecnologías de acceso a datos

El proyecto usa **dos mecanismos de acceso a datos** para la misma base de datos:
- **Prisma**: usado por socios, aportes, creditos
- **pg Pool directo**: usado por movimientos, auditoría

Esto duplica la configuración de conexión, la gestión de esquemas y el mapeo de tipos.

### 7.3 Ausencia de capa de agregación financiera

No existe un servicio backend que exponga endpoints para:
- Balance general
- Estado de resultados
- Flujo de caja
- Resumen por período

Toda esta lógica está en el frontend, haciendo imposible:
- Reutilización entre módulos
- Auditoría de cálculos financieros
- Consistencia entre Dashboard, Reportes y Contabilidad

### 7.4 Acoplamiento window.DB para contabilidad

**Archivo:** `pages/contabilidad.html:357-363`

```javascript
window.DB.movimientos = window.pageMovimientos;
window.DB.socios = window.pageSocios;
window.DB.creditos = window.pageCreditos;
window.DB.solidaridad.saldo_actual = window.pageSolidaridadSaldo;
```

La página sobreescribe `window.DB` con datos que pueden estar desactualizados o ser incompletos, afectando a otros módulos que dependan de estos datos globales.

### 7.5 Sin conciliación financiera

**Riesgo:** Alto. No existe ningún mecanismo que verifique que los movimientos registrados correspondan a operaciones reales. Por ejemplo:
- Un "Desembolso crédito" en egresos debería tener un crédito correspondiente en la tabla `creditos`
- Un "Aporte" en ingresos debería tener registros en `aportes`
- Un "Fondo solidaridad" en ingresos/egresos debería tener movimientos en `solidaridad_movimientos`

Actualmente, cualquier usuario con permisos puede registrar movimientos contables que no se correspondan con operaciones reales del fondo, rompiendo la trazabilidad.

### 7.6 Dependencia de CDNs externos para chart y excel

**Archivo:** `pages/contabilidad.html:311-312`

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
```

Dos dependencias externas de CDN para funcionalidades críticas (visualización y exportación). En un entorno financiero, esto debería ser un bundle local.

---

## 8. Evaluación del Modelo de Datos

### 8.1 Modelo Prisma actual

```prisma
model Movimiento {
  id          String   @id @default(uuid())
  tipo        String
  categoria   String
  descripcion String
  monto       Decimal  @db.Decimal(15, 2)
  fecha       DateTime
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([tipo])
  @@index([fecha])
  @@map("movimientos")
}
```

### 8.2 Campos faltantes

| Campo | ¿En Prisma? | ¿En frontend? | ¿En backend? | Estado |
|-------|-------------|---------------|--------------|--------|
| `id` | ✅ Sí | ✅ Sí | ✅ Sí | Correcto |
| `tipo` | ✅ Sí | ✅ Sí | ✅ Sí | Correcto |
| `categoria` | ✅ Sí | ✅ Sí | ✅ Sí | Correcto |
| `descripcion` | ✅ Sí | ✅ Sí | ✅ Sí | Correcto |
| `monto` | ✅ Sí | ✅ Sí | ✅ Sí | Correcto |
| `fecha` | ✅ Sí | ✅ Sí | ✅ Sí | Correcto |
| `createdAt` | ✅ Sí | ❌ No usado | ✅ Sí | Correcto |
| `referencia` | ❌ **No** | ✅ Sí (formulario) | ❌ **No** (ignorado) | 🔴 **Schema drift** |
| `updatedAt` | ❌ No | ❌ No | ❌ No | 🟡 Añadir para auditoría |
| `usuarioId` | ❌ No | ❌ No | ❌ No | 🟠 Añadir para trazabilidad |

### 8.3 Índices existentes

```sql
CREATE INDEX IF NOT EXISTS "movimientos_tipo_idx" ON "public"."movimientos"("tipo");
CREATE INDEX IF NOT EXISTS "movimientos_fecha_idx" ON "public"."movimientos"("fecha");
```

Los índices son correctos para las consultas actuales. Sin embargo, no hay índices compuestos como `(tipo, categoria)` o `(tipo, fecha)` que beneficiarían las agregaciones del frontend.

### 8.4 Discrepancias entre SQL y Prisma

El servicio `movimientoService.js` usa SQL directo y mapea manualmente:
```javascript
created_at as "createdAt"
```

Mientras que Prisma mapea automáticamente usando `@map("created_at")`. Esta doble capa de mapeo aumenta la posibilidad de errores si se modifica el esquema.

---

## 9. Compatibilidad con las Reglas Oficiales de Negocio de FONEVI

### 9.1 Regla §12.1 — "Ninguna regla financiera deberá implementarse únicamente en el frontend"

**Estado:** ❌ **VIOLADA GRAVEMENTE**

Todos los cálculos financieros del módulo de Contabilidad se realizan en el frontend:
- KPIs (ingresos, egresos, neto)
- Balance General completo
- Categorías y porcentajes
- Exportación Excel

### 9.2 Regla §12.2 — "Las reglas de negocio deberán centralizarse en el backend"

**Estado:** ❌ **VIOLADA**

### 9.3 Regla §6 — "La configuración variable no debe codificarse directamente en el software"

**Estado:** ❌ **VIOLADA**

- `2500000` hardcodeado como "Reservas constituidas"
- Categorías de ingreso/egreso hardcodeadas en frontend
- Año "2026-03" hardcodeado para filtro de período

### 9.4 Regla §9 — "Toda operación crítica deberá ser trazable"

**Estado:** ⚠️ **PARCIALMENTE CUMPLIDA**

Las operaciones CRUD (crear, actualizar, eliminar) sí registran auditoría mediante `audit()`. Sin embargo:
- No se registra quién consulta el balance o los KPIs
- No se registra la exportación de datos
- Los movimientos eliminados físicamente pierden su rastro

### 9.5 Regla §2 — Modalidades de pago

**Estado:** ❌ **NO IMPLEMENTADA**

El módulo de contabilidad no distingue entre las 5 modalidades de pago. Un "Aporte" registrado como ingreso contable no se relaciona con el módulo de aportes.

### 9.6 Regla §7 — Cierre mensual

**Estado:** ⚠️ **RIESGO POTENCIAL**

No hay protección para evitar modificar movimientos de períodos cerrados. Un administrador podría eliminar o modificar movimientos de meses anteriores después del cierre.

---

## 10. Evaluación de los KPIs y Métricas

### 10.1 Total Ingresos

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`contabilidad.html:415`) |
| **Fórmula** | `mov.filter(m => m.tipo==="ingreso").reduce((t,m) => t+m.monto, 0)` |
| **Depende de backend** | ❌ No — suma todos los movimientos cargados en frontend |
| **¿Incluye todos los períodos?** | ✅ Sí, incluye todos los movimientos cargados |
| **Riesgo** | 🟠 Alto: Si los datos no están completos, el total es incorrecto |

### 10.2 Total Egresos

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`contabilidad.html:416`) |
| **Fórmula** | `mov.filter(m => m.tipo==="egreso").reduce((t,m) => t+m.monto, 0)` |
| **Riesgo** | 🟠 Alto: Mismo riesgo que Total Ingresos |

### 10.3 Resultado Neto

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`contabilidad.html:417`) |
| **Fórmula** | `ing - egr` |
| **Riesgo** | 🟠 Alto: Depende de la precisión de los dos KPIs anteriores |

### 10.4 Ingresos del Mes (KPI dorado)

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`contabilidad.html:421`) |
| **Fórmula** | `mov.filter(m => m.fecha.includes("2026-03"))` |
| **Filtro correcto** | ❌ **No** — Hardcodeado a marzo 2026 |
| **Riesgo** | 🔴 Crítico: El nombre del KPI se actualiza desde config, pero el filtro siempre busca "2026-03" |

### 10.5 Balance — Activos

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`contabilidad.html:647-668`) |
| **Componentes** | `totalAhorros` + `totalCartera` + `solidaridad` |
| **Conceptualmente correcto** | ❌ **No** (ver 5.1) |
| **Riesgo** | 🔴 Crítico: Error contable conceptual |

### 10.6 Balance — Patrimonio

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`contabilidad.html:670-678`) |
| **Componentes** | `totalAhorros` + `2500000` + `utilidad` |
| **Correcto** | ❌ No: `totalAhorros` duplicado del activo, `2500000` hardcodeado |
| **Riesgo** | 🔴 Crítico |

### 10.7 Gráfico Ingresos vs Egresos

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`contabilidad.html:494-544`) |
| **Agregación** | Por mes desde `window.pageMovimientos` |
| **Riesgo** | 🟠 Alto: Depende de datos completos y actualizados en frontend |

### 10.8 Resumen Mensual (tabla)

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`contabilidad.html:582-599`) |
| **Columna Acumulado** | `acum += neto` — acumula mes a mes |
| **Correcto** | 🟡 Con reservas: El acumulado es secuencial por orden de keys, no por fecha |
| **Riesgo** | 🟡 Medio: Si los meses no están ordenados alfabéticamente, el acumulado es incorrecto |

### 10.9 Categorías (Ingresos y Egresos)

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`contabilidad.html:605-642`) |
| **Agregación** | Suma por categoría, calcula porcentajes |
| **Riesgo** | 🟡 Medio: Categorías hardcodeadas, pueden no coincidir con la realidad |

### 10.10 Exportación Excel

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se genera** | Frontend (`contabilidad.html:784-831`) |
| **Usa librería** | XLSX desde CDN |
| **¿Respaldo backend?** | ❌ No |
| **Riesgo** | 🟡 Medio: Exportación depende de datos en memoria |

---

## 11. Evaluación de la Trazabilidad

### 11.1 Capacidad de reconstrucción

| Pregunta | Respuesta |
|----------|-----------|
| ¿Quién registró cada movimiento? | 🟡 Parcial — La auditoría registra `usuario_id` en creación, actualización y eliminación |
| ¿Cuándo se registró? | ✅ Sí — `created_at` en movimientos y en auditoría |
| ¿Qué valor tenía antes de una modificación? | ❌ No — `update` no guarda el valor anterior |
| ¿Qué movimientos se eliminaron? | 🟡 Parcial — Queda registro en auditoría, pero el movimiento original se pierde |
| ¿Quién consultó el balance? | ❌ No — No hay auditoría de lecturas |
| ¿Quién exportó datos? | ❌ No — No hay auditoría de exportaciones |
| ¿Se puede reconstruir el estado financiero de un período cerrado? | ❌ No — Si se modificaron o eliminaron movimientos después del cierre, es imposible |

### 11.2 Auditoría operacional

El controlador `movimientoController.js` llama a `audit()` correctamente en:
- `create()` — `REGISTRAR_MOVIMIENTO`
- `update()` — `ACTUALIZAR_MOVIMIENTO`
- `delete()` — `ELIMINAR_MOVIMIENTO`

**Carencias:**
- No se auditan las lecturas (consultas de balance, KPIs)
- No se registra el `detalle` completo de cada movimiento, solo el `monto`
- Si un movimiento se actualiza, no se guarda el estado anterior (delta)

---

## 12. Recomendaciones de Mejora

### Inmediatas (Críticas antes de producción)

| # | Recomendación | Archivo(s) | Impacto | Esfuerzo |
|---|---------------|------------|---------|----------|
| **I1** | Corregir Balance General: separar activos reales (caja, cartera) de pasivos (ahorros socios) y patrimonio (reservas, resultados) | `contabilidad.html:647-689` | 🔴 Error contable | 4 horas |
| **I2** | Reemplazar valor hardcodeado de reservas `2500000` con consulta a `configuracion` o eliminarlo | `contabilidad.html:672` | 🔴 Dato incorrecto | 1 hora |
| **I3** | Agregar campo `referencia` al modelo Prisma `Movimiento`, al SELECT y al INSERT del servicio | `schema.prisma`, `movimientoService.js` | 🔴 Datos perdidos | 2 horas |
| **I4** | Corregir filtro de período en KPI: usar el período real desde `window.DB.config.periodo_actual` parseando mes y año | `contabilidad.html:421` | 🔴 KPI incorrecto | 2 horas |
| **I5** | Agregar validación en backend: monto > 0, tipo in ('ingreso','egreso'), fecha no futura | `movimientoController.js:29-31` | 🟠 Integridad | 2 horas |

### Mediano Plazo (1-2 sprints)

| # | Recomendación | Impacto | Esfuerzo |
|---|---------------|---------|----------|
| **M1** | Crear endpoint `GET /api/movimientos/resumen` que devuelva KPIs precalculados (total ingresos, egresos, neto) | 🔴 Eliminar cálculos frontend | 4 horas |
| **M2** | Crear endpoint `GET /api/movimientos/balance` que devuelva activos, pasivos y patrimonio desde el backend | 🔴 Balance confiable | 6 horas |
| **M3** | Crear endpoint `GET /api/movimientos/por-mes?anio=2026` para datos del gráfico mensual | 🟠 Agregaciones server-side | 4 horas |
| **M4** | Migrar `movimientoService.js` de SQL directo a Prisma para consistencia arquitectónica | 🟡 Mantenibilidad | 4 horas |
| **M5** | Agregar soft-delete: campo `deleted_at` en Movimiento, ocultar en listados pero preservar en BD | 🟠 Trazabilidad financiera | 3 horas |
| **M6** | Agregar paginación (`limit`, `offset`) al endpoint `GET /api/movimientos` | 🟠 Rendimiento | 2 horas |
| **M7** | Agregar filtro por rango de fechas al endpoint `GET /api/movimientos` | 🟠 Flexibilidad | 1 hora |
| **M8** | Agregar auditoría de consultas de balance y exportaciones | 🟡 Transparencia | 2 horas |
| **M9** | Reemplazar CDNs de Chart.js y XLSX con bundles locales | 🟡 Disponibilidad offline | 2 horas |

### Largo Plazo (3+ sprints)

| # | Recomendación | Impacto | Esfuerzo |
|---|---------------|---------|----------|
| **L1** | Implementar `GET /api/movimientos/exportar?formato=xlsx` en backend para exportación server-side | 🟠 Consistencia | 8 horas |
| **L2** | Crear sistema de conciliación: verificar que movimientos contables correspondan a operaciones reales en otros módulos | 🔴 Integridad financiera | 24 horas |
| **L3** | Bloquear modificación/eliminación de movimientos en períodos cerrados | 🟠 Integridad de cierres | 8 horas |
| **L4** | Agregar campo `usuarioId` al modelo Movimiento para trazabilidad nativa | 🟡 Trazabilidad | 2 horas |
| **L5** | Implementar plan de cuentas contable estandarizado (PUC) con cuentas de débito/crédito | 🔴 Base contable sólida | 40 horas |
| **L6** | Migrar categorías hardcodeadas a tabla `categorias_movimientos` en base de datos | 🟡 Configurabilidad | 4 horas |
| **L7** | Agregar tab `Partida doble` con asientos contables (débito/crédito) para contabilidad por partida doble | 🔴 Contabilidad real | 40 horas |
| **L8** | Agregar reporte de Libro Diario con filtros exportable a PDF desde backend | 🟡 Cumplimiento legal | 8 horas |

---

## 13. Observaciones para Futura Migración

### Clean Architecture
- **Preparación actual:** 🟠 Media-baja. El controlador y servicio existen, pero el servicio usa SQL directo y toda la lógica de agregación está en frontend.
- **Acción requerida:** Mover agregaciones a `movimientoService.js`, crear casos de uso para balance y resumen.

### Domain-Driven Design (DDD)
- **Preparación actual:** 🔴 Mínima. No hay entidades de dominio como `AsientoContable`, `PartidaDoble`, `CuentaContable`.
- **Acción requerida:** Identificar `Movimiento` como un `EventoContable` y modelar sus invariantes (balance, período, tipo).

### SaaS Multi-Tenant
- **Preparación actual:** 🔴 No preparado. El módulo no tiene concepto de tenant.
- **Impacto:** Todas las consultas deberán filtrar por `tenantId`.

### Event Sourcing
- **Preparación actual:** 🟡 Potencial alto. Los movimientos contables son naturalmente eventos. Cada `Movimiento` es un hecho consumado que no debería modificarse.
- **Acción recomendada:** Implementar append-only log para movimientos, donde las "modificaciones" sean nuevos movimientos de reversión/ajuste.

### CQRS
- **Preparación actual:** 🟡 Potencial. Las lecturas del Balance deberían usar un read-model separado de las escrituras de movimientos diarios.
- **Beneficio:** El balance siempre sería consistente sin competir con el registro de movimientos.

### Backups y Periodos Cerrados
- **Acción recomendada:** Implementar bloqueo de movimientos en períodos cuyo cierre haya sido ejecutado. Ningún sistema contable permite modificar transacciones de un período cerrado.

### Plan de Cuentas (PUC)
- **Estado actual:** No existe. Las categorías son solo etiquetas textuales sin estructura contable.
- **Migración futura:** Reemplazar `categoria` (string libre) por `cuentaId` (clave foránea a tabla `plan_cuentas`).
- **Beneficio:** Reportes contables estandarizados, compatibilidad con normas NIIF.

---

## 14. Conclusión Final

### ¿Está listo para producción?

**NO.** El módulo de Movimientos/Contabilidad de FONEVI **no está listo para un entorno financiero de producción** por las siguientes razones:

### Principales riesgos

1. **🔴 Error contable en Balance**: `totalAhorros` aparece duplicado como activo y patrimonio, dando un falso balance cuadre.

2. **🔴 Reservas hardcodeadas**: El valor fijo `2,500,000` en "Reservas constituidas" es incorrecto si no corresponde a la realidad.

3. **🔴 Cálculos financieros 100% en frontend**: KPIs, balance, categorías y gráficos se calculan en el navegador del usuario sin respaldo de backend.

4. **🔴 `referencia` perdida**: El campo que asocia movimientos a entidades del fondo se envía desde el formulario pero nunca se almacena.

5. **🟠 Filtro de período hardcodeado `"2026-03"`**: El KPI de ingresos del mes siempre mostrará marzo de 2026.

6. **🟠 Eliminación física sin restricciones**: Cualquier movimiento puede borrarse permanentemente, incluso si pertenece a un período anterior.

7. **🟠 Sin conciliación**: No hay verificación de que los movimientos contables correspondan a operaciones reales.

### Nivel de confiabilidad

| Aspecto | Nivel |
|---------|-------|
| Registro individual de movimientos | 🟢 Confiable |
| Libro diario (listado) | 🟢 Confiable |
| KPIs (totales ingresos/egresos) | 🔴 No confiable (cálculo frontend) |
| Balance General | 🔴 Incorrecto (error conceptual + hardcode) |
| Gráficos y categorías | 🔴 No confiable (cálculo frontend) |
| Exportación Excel | 🟡 Confiable con reservas (datos de memoria) |
| Trazabilidad de cambios CRUD | 🟡 Confiable con reservas (no guarda valores anteriores) |
| Integridad de períodos cerrados | 🔴 No existe protección |

### Recomendación final del auditor

1. **No desplegar en producción** sin aplicar las correcciones **Inmediatas (I1 a I5)**, especialmente la corrección del Balance General y la recuperación del campo `referencia`.
2. **Antes del primer cierre contable**, implementar los endpoints de agregación backend (M1, M2, M3) y migrar cálculos del frontend al servidor.
3. **Establecer soft-delete y protección de períodos cerrados** antes de considerar el módulo como "estable".
4. **Contratar revisión de un contador público** para validar la estructura del Balance General y el plan de cuentas propuesto.
5. **No usar el Balance General actual** para ninguna decisión financiera real.

### Veredicto

> **🔴 NO APTO PARA PRODUCCIÓN.** El módulo de Movimientos/Contabilidad de FONEVI requiere correcciones críticas antes de su uso en producción. El Balance General contiene errores conceptuales de contabilidad, los cálculos financieros no están respaldados por el backend, y la trazabilidad es insuficiente. Se recomienda priorizar la corrección del balance, la migración de cálculos al backend, y la implementación de soft-delete antes de cualquier despliegue en entorno real.

---

*Documento generado el 17 de junio de 2026 — Auditoría integral del Módulo de Movimientos / Contabilidad / Caja de FONEVI.*
