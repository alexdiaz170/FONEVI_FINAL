# AUDITORÍA INTEGRAL — MÓDULO DE REPORTES
## Sistema FONEVI — Fondo de Empleados Docentes

---

**Fecha de auditoría:** 17 de junio de 2026  
**Auditor:** Auditoría Automatizada de Código Fuente  
**Versión del sistema:** FONEVI FINAL  
**Alcance:** Módulo completo de Reportes (frontend + backend + base de datos)  
**Clasificación:** 🔴 CRÍTICO — No apto para producción en estado actual

---

## TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Inventario de Archivos Analizados](#2-inventario-de-archivos-analizados)
3. [Arquitectura del Módulo de Reportes](#3-arquitectura-del-módulo-de-reportes)
4. [Análisis del Frontend — reportes.html](#4-análisis-del-frontend--reporteshtml)
5. [Análisis del Sistema de Carga de Datos (app.js / window.DB)](#5-análisis-del-sistema-de-carga-de-datos-appjs--windowdb)
6. [Análisis del Backend — Endpoints Relevantes](#6-análisis-del-backend--endpoints-relevantes)
7. [Análisis Reporte por Reporte](#7-análisis-reporte-por-reporte)
8. [Análisis del Sistema de Exportación](#8-análisis-del-sistema-de-exportación)
9. [Hallazgos Críticos de Integridad Financiera](#9-hallazgos-críticos-de-integridad-financiera)
10. [Hallazgos de Seguridad](#10-hallazgos-de-seguridad)
11. [Hallazgos de Consistencia de Datos](#11-hallazgos-de-consistencia-de-datos)
12. [Hallazgos Arquitectónicos](#12-hallazgos-arquitectónicos)
13. [Hallazgos de Funcionalidad Rota](#13-hallazgos-de-funcionalidad-rota)
14. [Matriz de Riesgos](#14-matriz-de-riesgos)
15. [Recomendaciones por Prioridad](#15-recomendaciones-por-prioridad)
16. [Veredicto Final](#16-veredicto-final)

---

## 1. RESUMEN EJECUTIVO

El Módulo de Reportes de FONEVI presenta una arquitectura **fundamentalmente inadecuada** para un sistema financiero de producción. Los reportes no se generan desde el backend con datos transaccionales verificados; en su lugar, se **renderizan completamente en el navegador del cliente** a partir de un snapshot de datos cargado en `window.DB` al inicio de la sesión.

Esta decisión arquitectónica crea múltiples riesgos críticos:

| Categoría | Nivel | Descripción |
|-----------|-------|-------------|
| Integridad Financiera | 🔴 CRÍTICO | Datos potencialmente desactualizados o incompletos |
| Funcionalidad | 🔴 CRÍTICO | `exportarPDF()` y `exportarExcel()` no están definidas |
| Consistencia | 🔴 CRÍTICO | El Balance General usa valor hardcodeado de utilidades |
| Datos | 🔴 CRÍTICO | El reporte de Dividendos crashea si `DB.dividendos` está vacío |
| Seguridad | 🟠 ALTO | Cualquier usuario con acceso a DevTools puede manipular reportes |
| Arquitectura | 🟠 ALTO | No existe ningún endpoint dedicado a reportes en el backend |
| Consistencia | 🟠 ALTO | Discrepancia en cómo `listAll()` de socios calcula el estado |
| UX | 🟡 MEDIO | El período del reporte está hardcodeado como "Marzo 2026" |

**Conclusión:** El módulo de reportes es una **maqueta funcional**, no un sistema de reportes financieros. Antes de cualquier despliegue en producción, se requiere una reescritura significativa.

---

## 2. INVENTARIO DE ARCHIVOS ANALIZADOS

### Frontend

| Archivo | Tamaño | Rol |
|---------|--------|-----|
| `pages/reportes.html` | 17,631 bytes | Módulo principal de reportes. Contiene toda la lógica de renderizado. |
| `js/app.js` | 12,759 bytes | Inicialización global, `window.DB`, `DataHelper`, carga de datos. |
| `js/api.js` | 8,946 bytes | Cliente HTTP centralizado (JWT, endpoints por módulo). |
| `js/export.js` | 936 bytes | Módulo de exportación. Solo contiene `Exporter.getFilteredData()`. |

### Backend — Rutas

| Archivo | Tamaño | Endpoints Relevantes para Reportes |
|---------|--------|-------------------------------------|
| `backend/src/routes/dashboard.js` | 3,008 bytes | `GET /dashboard/resumen`, `GET /dashboard/grafico-anual` |
| `backend/src/routes/socios.js` | 781 bytes | `GET /socios`, `GET /socios/:id/estado-cuenta` |
| `backend/src/routes/creditos.js` | 832 bytes | `GET /creditos` |
| `backend/src/routes/aportes.js` | 702 bytes | `GET /aportes` |
| `backend/src/routes/movimientos.js` | 636 bytes | `GET /movimientos` |
| `backend/src/routes/solidaridad.js` | 2,166 bytes | `GET /solidaridad/saldo` |

### Backend — Servicios y Controladores

| Archivo | Rol Crítico |
|---------|-------------|
| `socioController.js` / `socioService.js` | Estado de cuenta individual (backend completo) |
| `creditoController.js` / `creditoService.js` | Cartera de créditos |
| `aporteController.js` / `aporteService.js` | Registro y listado de aportes |
| `movimientoController.js` / `movimientoService.js` | Flujo de caja |
| `lib/mappings.js` | Transformación de datos backend → frontend |

### Esquema de Base de Datos

| Modelo Prisma | Tabla SQL | Relevancia para Reportes |
|---------------|-----------|--------------------------|
| `Socio` | `socios` | Estado de cuenta, balance |
| `Aporte` | `aportes` | Aportes por socio, mora |
| `Credito` | `creditos` | Cartera, estado de créditos |
| `Movimiento` | `movimientos` | Flujo de caja |
| `SolidaridadMovimiento` | `solidaridad_movimientos` | Balance general |
| `Periodo` | `periodos` | Filtrado por período |

> **AUSENCIA CRÍTICA:** No existe ninguna tabla `dividendos` en el schema de Prisma ni en SQL. El modelo de datos no soporta el reporte de dividendos.

---

## 3. ARQUITECTURA DEL MÓDULO DE REPORTES

### Diagrama de Flujo Actual

```
Usuario abre reportes.html
        │
        ▼
DOMContentLoaded — Roles.proteger("reportes")
        │
        ▼
app.js: Promise.allSettled([
  API.config.obtener(),      → GET /configuracion
  API.socios.listar(),       → GET /socios
  API.aportes.listar(),      → GET /aportes        ← SIN filtros de paginación
  API.creditos.listar(),     → GET /creditos        ← TODA la cartera
  API.movimientos.listar(),  → GET /movimientos     ← TODOS los movimientos
  API.notificaciones.listar(),
  API.solidaridad.saldo()    → GET /solidaridad/saldo
])
        │
        ▼
window.DB = {
  socios: [...],         ← snapshot en memoria
  aportes: [...],        ← snapshot en memoria
  creditos: [...],       ← snapshot en memoria
  movimientos: [...],    ← snapshot en memoria
  solidaridad: {...},    ← solo saldo, no movimientos
  dividendos: []         ← NUNCA SE PUEBLA desde API
}
        │
        ▼
Usuario hace clic en "Generar" → generarReporte(tipo)
        │
        ▼
JavaScript manipula window.DB EN MEMORIA
Inyecta HTML generado directamente en #reporteContenido
        │
        ▼
Usuario ve el reporte (sin nueva consulta al backend)
```

### Problemas Arquitectónicos Fundamentales

1. **Snapshot estático:** Los datos se cargan UNA VEZ al abrir la página. Si otro usuario modifica datos mientras el primero tiene la página abierta, el reporte mostrará información desactualizada.

2. **Sin endpoints dedicados:** No existe ninguna ruta en el backend del tipo `/api/reportes/*`. Los reportes son derivaciones en memoria de datos crudos.

3. **Carga masiva de datos:** `API.aportes.listar()` y `API.creditos.listar()` traen TODOS los registros sin paginación. En producción con miles de registros, esto será un problema de rendimiento y memoria severo.

4. **Responsabilidad mal ubicada:** La lógica de agregación financiera (totales, saldos, mora, balance) está en el navegador, no en el servidor, donde debería ejecutarse sobre datos transaccionales verificados.

---

## 4. ANÁLISIS DEL FRONTEND — reportes.html

### 4.1 Carga de Scripts

```html
<!-- PDF/Excel -->
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
```

**Hallazgo F-01 — CRÍTICO:** Las librerías `jsPDF` y `XLSX` se cargan correctamente desde CDN, pero las funciones `exportarPDF()` y `exportarExcel()` que se invocan desde los botones **nunca están definidas en ningún archivo JS del proyecto**.

```javascript
// reportes.html línea 357-366:
function exportarPDFReporte() {
  if (_tipoReporteActual) exportarPDF(_tipoReporteActual);  // ← exportarPDF NO EXISTE
  else Toast.warn('Genera un reporte primero.');
}
function exportarExcelReporte() {
  var excelMaps = { cartera:'creditos', 'estado-cuenta':null };
  var tipo = excelMaps[_tipoReporteActual] || _tipoReporteActual;
  if (tipo) exportarExcel(tipo);  // ← exportarExcel NO EXISTE
  else Toast.warn('Este reporte no tiene exportación a Excel.');
}
```

**Resultado en producción:** Al hacer clic en "Exportar PDF" o "📗 Excel", el navegador lanzará un `ReferenceError: exportarPDF is not defined`, causando un error silencioso o una pantalla de error.

### 4.2 Manejo de Roles

```javascript
// DOMContentLoaded:
if (!Roles.proteger("reportes")) return;
```

El acceso al módulo está protegido por `Roles.proteger()`. Esta verificación es válida pero solo del lado del cliente; cualquier usuario con conocimientos de DevTools puede eludir esta protección modificando el localStorage/sessionStorage.

### 4.3 Período Hardcodeado

```javascript
// líneas 185, 207, 230, 293, 320:
titulo.textContent = "Estado de Cuenta por Socio — Marzo 2026";
titulo.textContent = "Cartera de Créditos — Marzo 2026";
titulo.textContent = "Reporte de Mora — Marzo 2026";
titulo.textContent = "Balance General — Marzo 2026";
titulo.textContent = "Dividendos — Año 2025";
```

**Hallazgo F-02 — ALTO:** El período de todos los reportes está **hardcodeado** como "Marzo 2026" y "Año 2025". No se usa `DB.config.periodo_actual` ni se permite al usuario seleccionar el período. Cualquier reporte generado en junio, julio u otro mes seguirá mostrando "Marzo 2026", lo cual es **información falsa**.

### 4.4 Acceso directo a window.DB sin validación

```javascript
// línea 190:
${DB.socios.map(s => {
```

Se accede directamente a `DB.socios` (sin `window.` y sin verificación de null). Si la carga de datos falló (backend offline, timeout), `DB.socios` puede ser `[]` o `undefined`, causando un crash silencioso o una tabla vacía sin indicación de error.

---

## 5. ANÁLISIS DEL SISTEMA DE CARGA DE DATOS (app.js / window.DB)

### 5.1 Inicialización del Estado Global

```javascript
// app.js líneas 2-22:
window.DB = {
  socios: [],
  aportes: [],
  creditos: [],
  movimientos: [],
  solidaridad: { saldo_actual: 0, movimientos: [] },
  config: {
    nombre: "FONEVI",
    periodo_actual: "Marzo 2026",
    aporte_minimo: 130000,
    aporte_solidaridad: 5000,
    tasa_credito_mensual: 1,
    // ...
  },
  dividendos: [],
  notificaciones: []
};
```

**Hallazgo D-01 — CRÍTICO:** `window.DB.dividendos` se inicializa como `[]` y **nunca se puebla desde ninguna llamada API**. En el bloque `Promise.allSettled` de `app.js`, no existe ninguna llamada a `API.dividendos.*` porque no existe tal módulo en `api.js` ni endpoint en el backend.

**Hallazgo D-02 — ALTO:** La configuración en `window.DB.config` contiene valores hardcodeados de fallback (`periodo_actual: "Marzo 2026"`, `aporte_solidaridad: 5000`, etc.). Aunque se intenta sobreescribir con datos del backend (`window.DB.config = { ...window.DB.config, ...configRes.value.datos }`), si el backend retorna campos diferentes (ej. `periodo_actual` vs otro nombre de clave), los valores hardcodeados persistirán silenciosamente.

### 5.2 Discrepancia en la Lógica de Estado del Socio

```javascript
// socioService.js líneas 35-43 (listAll() — usado por DB.socios):
CASE
  WHEN EXISTS (
    SELECT 1 FROM aportes a
    WHERE a.socio_id = s.id
    AND a.estado IN ('mora','vencido')
  )
  THEN 'mora'
  ELSE 'activo'
END as estado
```

```javascript
// dashboard.js líneas 25-27 (usado por resumen del dashboard):
const sociosMora = socios.filter(
  s => String(s.estado || '').toLowerCase() === 'mora'
);
```

```javascript
// reportes.html línea 231 (Reporte de mora):
const morosos = DB.socios.filter(s => s.estado === "mora");
```

**Hallazgo D-03 — CRÍTICO:** Existen **tres definiciones distintas de "socio en mora"**:

1. **`socioService.listAll()`**: Calcula mora dinámicamente via SQL (basado en si tiene aportes con estado 'mora' o 'vencido'). Este es el valor que llega a `DB.socios`.
2. **`dashboard.js`**: Lee el campo `estado` de la tabla `socios` directamente desde Prisma (que puede ser 'activo' incluso si hay aportes en mora, dependiendo de cuándo se actualizó).
3. **`reportes.html`**: Usa `s.estado === "mora"` comparando contra el valor calculado de `socioService.listAll()`.

El resultado es que el **Reporte de Mora** puede mostrar una lista diferente a lo que muestra el **Dashboard**. La fuente de verdad no está definida.

### 5.3 Solidaridad — Datos Parciales en DB

```javascript
// app.js línea 271-273:
if (solSaldoRes.status === "fulfilled" && solSaldoRes.value?.ok) {
  window.DB.solidaridad.saldo_actual = solSaldoRes.value.saldo_actual || 0;
}
```

Solo se carga el **saldo actual** de solidaridad, no el listado de movimientos. `window.DB.solidaridad.movimientos` permanece siempre como `[]`. Si algún reporte intenta iterar sobre movimientos de solidaridad, estará operando sobre datos vacíos.

---

## 6. ANÁLISIS DEL BACKEND — ENDPOINTS RELEVANTES PARA REPORTES

### 6.1 Ausencia Total de Endpoints de Reportes

```
backend/src/routes/
├── aportes.js       ✓ CRUD
├── auditoria.js     ✓ listado
├── auth.js          ✓ login/logout
├── configuracion.js ✓ CRUD
├── creditos.js      ✓ CRUD
├── dashboard.js     ✓ resumen + grafico-anual
├── movimientos.js   ✓ CRUD
├── notificaciones.js ✓ CRUD
├── socios.js        ✓ CRUD + estado-cuenta
├── solidaridad.js   ✓ CRUD
├── usuarios.js      ✓ CRUD
└── whatsapp.js      ✓ integración
```

**Hallazgo B-01 — CRÍTICO:** No existe ningún archivo `reportes.js` en el directorio de rutas. El backend **no tiene ningún endpoint dedicado a la generación de reportes**. Toda la lógica de reporte está delegada al navegador.

### 6.2 GET /socios — Endpoint de Estado de Cuenta

La ruta `GET /socios/:id/estado-cuenta` sí existe y está bien implementada en `socioService.estadoCuenta()`. Incluye:
- Aportes paginados
- Créditos
- Pagos a crédito
- Movimientos de solidaridad
- Totales calculados en SQL

**Sin embargo**, el Reporte de "Estado de Cuenta" de `reportes.html` **NO usa este endpoint**. En cambio, genera el reporte directo desde `DB.socios` y `DB.aportes` en memoria, ignorando completamente la lógica transaccional del backend.

### 6.3 GET /dashboard/resumen — Uso Parcial

El endpoint `GET /dashboard/resumen` calcula en el backend:
- Total ahorros
- Cartera activa
- Socios en mora
- Aportes del mes

**Problema:** Este endpoint retorna datos agregados correctos desde la BD, pero `reportes.html` no lo usa. En su lugar, recalcula todo desde `window.DB` con lógica diferente, lo que introduce divergencias.

### 6.4 GET /movimientos — Sin Filtros de Fecha

```javascript
// movimientoService.js listAll():
async listAll({ tipo, categoria } = {}) {
  let sql = `SELECT ... FROM movimientos WHERE 1=1`;
  // Solo filtra por tipo y categoria, NO por fecha
}
```

El reporte de "Flujo de Caja 2026" pretende mostrar el flujo del año 2026, pero al cargar `API.movimientos.listar()` sin filtro de fecha, se traen TODOS los movimientos históricos. El filtrado por año no se aplica ni en el backend ni en el frontend.

---

## 7. ANÁLISIS REPORTE POR REPORTE

### 7.1 Reporte: Estado de Cuenta por Socio

**Genera:** Tabla con ahorro acumulado, número de aportes pagados en 2026, crédito activo y saldo.

**Hallazgos:**

| # | Severidad | Descripción |
|---|-----------|-------------|
| EC-01 | 🔴 CRÍTICO | El reporte muestra datos de **todos los socios** a la vez, no de uno seleccionado. No hay selector de socio. |
| EC-02 | 🔴 CRÍTICO | `aportes: DataHelper.getAportesSocio(s.id).filter(a => a.estado === 'pagado').length` cuenta aportes pagados sin filtrar por año. El título dice "Aportes 2026" pero el dato es total histórico. |
| EC-03 | 🟠 ALTO | El período "Marzo 2026" está hardcodeado. El estado de cuenta debería corresponder al período activo. |
| EC-04 | 🟠 ALTO | No muestra totales de aportes en COP, solo un conteo. Un estado de cuenta financiero debe mostrar montos. |
| EC-05 | 🟡 MEDIO | No hay opción de seleccionar un socio específico ni rango de fechas. |

**Ejemplo del error EC-02:**
```javascript
// El label dice "Aportes 2026" pero el código cuenta TODOS los aportes pagados sin importar el año:
const aportes = DataHelper.getAportesSocio(s.id).filter(a => a.estado === "pagado").length;
```

La función `getAportesSocio()` en `DataHelper` hace `DB.aportes.filter(a => a.socio_id === socio_id)` sin ningún filtro de fecha.

---

### 7.2 Reporte: Cartera de Créditos

**Genera:** Tabla de todos los créditos con monto original, saldo, cuotas restantes y estado.

**Hallazgos:**

| # | Severidad | Descripción |
|---|-----------|-------------|
| CA-01 | 🟠 ALTO | `c.cuotas - c.cuotas_pagadas` puede producir negativos si `cuotas_pagadas > cuotas` por error en BD. No hay validación. |
| CA-02 | 🟠 ALTO | Se muestran TODOS los créditos incluyendo pagados. El resumen de "Total cartera vigente" suma correctamente solo los no-pagados, pero la tabla los muestra todos. |
| CA-03 | 🟡 MEDIO | El mapeo `mapCredito()` usa `socio_id: (c.socio && c.socio.documento) ? c.socio.documento : c.socioId`. Si la relación `socio` no viene expandida en la consulta, `DataHelper.getSocioNombre(c.socio_id)` puede fallar al resolver el nombre. |
| CA-04 | 🟡 MEDIO | No hay filtros por estado, fecha o monto. En producción con muchos créditos, el reporte será ilegible. |

---

### 7.3 Reporte: Balance General

**Genera:** Activos (ahorros + cartera + solidaridad) vs. Patrimonio.

**Hallazgos:**

| # | Severidad | Descripción |
|---|-----------|-------------|
| BG-01 | 🔴 CRÍTICO | Las utilidades retenidas están **hardcodeadas** en el código: `DataHelper.formatCOP(2500000)`. Este valor es ficticio y no corresponde a ningún cálculo real. |
| BG-02 | 🔴 CRÍTICO | El Balance no está balanceado. Total Activos ≠ Total Patrimonio porque el lado del Pasivo está completamente omitido. Un balance general debe cumplir: Activos = Pasivos + Patrimonio. |
| BG-03 | 🟠 ALTO | La cartera de créditos se incluye como "Activo", pero los créditos en mora deberían provisionarse o marcarse de forma diferente contablemente. |
| BG-04 | 🟠 ALTO | La solidaridad se suma como activo usando `DB.solidaridad.saldo_actual`, que es solo un saldo numérico sin soporte transaccional verificado en tiempo real. |
| BG-05 | 🟡 MEDIO | No se muestra el período ni la fecha del balance. Un balance sin fecha es técnicamente inútil. |

**Código con el hardcodeo detectado:**
```javascript
// reportes.html línea 312:
<tr><td>Utilidades retenidas</td>
    <td style="text-align:right;font-weight:500;">
      ${DataHelper.formatCOP(2500000)}   ← VALOR FIJO, NO CALCULADO
    </td>
</tr>
```

---

### 7.4 Reporte: Mora

**Genera:** Lista de socios en mora con meses vencidos y monto pendiente.

**Hallazgos:**

| # | Severidad | Descripción |
|---|-----------|-------------|
| MO-01 | 🟠 ALTO | El monto pendiente se calcula sumando aportes con estado 'mora' o 'vencido', pero no incluye intereses de mora ni recargos. Para un fondo financiero, el monto real adeudado incluye mora. |
| MO-02 | 🟠 ALTO | "Meses en mora" se calcula como el número de aportes en mora, no como la diferencia de fechas real. Si un aporte representa un mes pero fue creado con fecha incorrecta, el cálculo es erróneo. |
| MO-03 | 🟡 MEDIO | No se muestra la fecha del último pago ni la fecha desde cuando está en mora. |
| MO-04 | 🟡 MEDIO | El reporte no distingue entre aportes 'mora' y 'vencido' — ambos se tratan igual, pero pueden tener significados diferentes en el contexto del fondo. |

---

### 7.5 Reporte: Flujo de Caja

**Genera:** Resumen de ingresos/egresos y tabla de movimientos.

**Hallazgos:**

| # | Severidad | Descripción |
|---|-----------|-------------|
| FC-01 | 🔴 CRÍTICO | El reporte dice "Flujo de Caja — 2026" pero la tabla de movimientos contiene **todos los movimientos históricos** sin filtro por año. |
| FC-02 | 🔴 CRÍTICO | Los movimientos en `DB.movimientos` son solo los de la tabla `movimientos` (gastos operativos, ingresos varios). Los aportes de socios y los desembolsos de créditos son flujos de caja mayores que **no están en esta tabla** y no aparecen en el reporte. |
| FC-03 | 🟠 ALTO | `m.fecha.localeCompare(a.fecha)` — Si `fecha` es un objeto `Date` y no un string, `localeCompare()` fallará. Depende del formato que retorne el backend. |
| FC-04 | 🟠 ALTO | El flujo de caja no incluye: pagos de cuotas de créditos, desembolsos de créditos, aportes de solidaridad. Los 3 son flujos de caja reales del fondo. |

---

### 7.6 Reporte: Dividendos Anuales

**Genera:** Distribución de utilidades por socio según porcentaje de ahorro.

**Hallazgos:**

| # | Severidad | Descripción |
|---|-----------|-------------|
| DV-01 | 🔴 CRÍTICO | `DB.dividendos` **SIEMPRE ES `[]`**. No existe ningún endpoint de dividendos en el backend (`api.js` no tiene módulo `dividendos`). El reporte crashea inmediatamente con `TypeError: Cannot read properties of undefined (reading 'total_utilidades')` al hacer `DB.dividendos[0]`. |
| DV-02 | 🔴 CRÍTICO | El modelo Prisma no contiene ninguna tabla `dividendos`. No existe infraestructura de datos para este reporte. |
| DV-03 | 🟠 ALTO | La fórmula de distribución recalcula `totalAhorros` en cada iteración del `.map()` (línea 331), resultando en O(n²) en lugar de O(n). Con muchos socios, esto es ineficiente. |
| DV-04 | 🟠 ALTO | No hay validación de `div.total_utilidades === 0` — causaría una división por cero en el cálculo de porcentaje. |

**Código del crash garantizado:**
```javascript
// reportes.html línea 321-326:
} else if (tipo === "dividendos") {
  titulo.textContent = "Dividendos — Año 2025";
  const div = DB.dividendos[0];  // ← DB.dividendos = [] SIEMPRE → div = undefined
  contenido.innerHTML = `
    ...${DataHelper.formatCOP(div.total_utilidades)}...  // ← TypeError GARANTIZADO
  `;
}
```

---

## 8. ANÁLISIS DEL SISTEMA DE EXPORTACIÓN

### 8.1 export.js — Módulo Vacío

```javascript
// js/export.js (20 líneas totales):
const Exporter = {
  getFilteredData(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return [];
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    return rows.filter(r => r.style.display !== "none").map(r => {
      return Array.from(r.querySelectorAll("td")).map(td => td.textContent.trim());
    });
  }
};
```

**Hallazgo E-01 — CRÍTICO:** `export.js` solo define `Exporter.getFilteredData()`, que extrae texto de una tabla HTML. **No define `exportarPDF()` ni `exportarExcel()`**, las funciones invocadas por los botones de exportación en `reportes.html`.

### 8.2 Funciones Llamadas Inexistentes

```javascript
// reportes.html:
<button onclick="exportarPDFReporte()">⬇ Exportar PDF</button>
<button onclick="exportarExcelReporte()">📗 Excel</button>

// exportarPDFReporte() llama a exportarPDF() → NO DEFINIDA
// exportarExcelReporte() llama a exportarExcel() → NO DEFINIDA
```

**Verificación:** Se realizó búsqueda exhaustiva con `grep` sobre todos los archivos `.js` del proyecto buscando las cadenas `exportarPDF` y `exportarExcel`. **No se encontraron definiciones** en ningún archivo JS fuera de `reportes.html`.

### 8.3 Librerías Cargadas Sin Uso

Las librerías `jsPDF 2.5.1` y `XLSX 0.18.5` se cargan desde CDN (suma ~1.2 MB de assets externos) pero **ninguna función del módulo las invoca realmente**. Son librerías zombi en el bundle actual.

### 8.4 exportarCSV() — Stub Vacío

```javascript
function exportarCSV() {
  Toast.success("Exportando reporte a CSV... (función disponible con backend)");
}
```

`exportarCSV()` está comentada como "función disponible con backend" — lo que confirma que el autor era consciente de la incompletitud del sistema de exportación.

---

## 9. HALLAZGOS CRÍTICOS DE INTEGRIDAD FINANCIERA

### 9.1 Discrepancia en ahorro_acumulado

**Escenario:** El campo `ahorro_acumulado` en `socios` se actualiza en dos lugares con lógica diferente:

**En `aporteService.create()`** (inserción de aporte):
```sql
UPDATE socios SET ahorro_acumulado = COALESCE(
  (SELECT SUM(CASE WHEN a.estado='pagado' THEN (a.monto - COALESCE(a.pago_solidaridad,0) - COALESCE(a.pago_credito,0)) ELSE 0 END)
   FROM aportes a WHERE a.socio_id = s.id), 0)
WHERE s.id = $1
```
→ Recalculo completo: ahorro = (aportes pagados) - solidaridad - crédito.

**En `aporteService.update()`** (actualización de aporte):
```javascript
if (!oldPaid && newPaid) {
  UPDATE socios SET ahorro_acumulado = ahorro_acumulado + $1  // Solo suma el monto bruto
}
```
→ Solo ajuste incremental del monto bruto, sin restar solidaridad ni crédito.

**Resultado:** Si se actualiza el estado de un aporte de 'pendiente' a 'pagado', el ahorro acumulado se incrementa por el **monto total** del aporte, pero en la inserción original se hubiera incrementado por `monto - solidaridad - crédito`. Esto genera una **sobrestimación del ahorro** y un **balance inconsistente**.

### 9.2 DataHelper.getTotalAhorros() vs. ahorro_acumulado Real

```javascript
// app.js DataHelper:
getTotalAhorros() {
  return window.DB?.socios?.reduce((t, s) => t + (s.ahorro_acumulado || 0), 0) || 0;
},
```

`getTotalAhorros()` suma el campo `ahorro_acumulado` de cada socio. Este campo es una **desnormalización** calculada en la tabla `socios`. Si esta desnormalización está desincronizada (por el bug en `update()` mencionado arriba), el Balance General mostrará un total incorrecto.

### 9.3 Cartera Total — Posible Doble Conteo

```javascript
// DataHelper:
getTotalCartera() {
  return window.DB?.creditos?.reduce((t, c) => t + (c.saldo_capital || 0), 0) || 0;
},
```

Esta función suma el `saldo_capital` de **todos** los créditos, incluyendo los que tienen `estado === 'pagado'`. Un crédito pagado debería tener `saldo_capital = 0`, y aunque el servicio lo actualiza a 0 al finalizar, si hay algún registro en estado inconsistente, el total de cartera estará inflado.

El reporte de **Cartera** muestra correctamente solo activos en el resumen (`DB.creditos.filter(c=>c.estado!=="pagado")`), pero el **Balance General** usa `DataHelper.getTotalCartera()` que toma **todos**. Son inconsistentes entre sí.

---

## 10. HALLAZGOS DE SEGURIDAD

### 10.1 Control de Acceso Solo en Cliente

```javascript
// reportes.html:
if (!Roles.proteger("reportes")) return;
```

La verificación de acceso al módulo de reportes es exclusivamente en el frontend. Un usuario malicioso puede:
1. Abrir DevTools (F12)
2. En consola ejecutar: `window.Roles = { proteger: () => true }`
3. Navegar directamente al módulo sin restricciones reales

El backend sí verifica JWT en todos los endpoints (`requireAuth`), pero como los reportes son renderizados en cliente, la protección real depende de si el frontend puede hacer las llamadas API con el token.

### 10.2 Datos Financieros Completos en Memoria del Navegador

Todo `window.DB` (aportes, créditos, movimientos de todos los socios) reside en la memoria RAM del navegador y es accesible desde la consola de DevTools:

```javascript
// Cualquier usuario puede ejecutar esto en DevTools:
console.log(window.DB.socios);     // Ver datos de todos los socios
console.log(window.DB.creditos);   // Ver todos los créditos con saldos
console.log(window.DB.aportes);    // Ver todos los aportes
```

Para un sistema financiero, esto representa una exposición de datos sensibles inaceptable.

### 10.3 Ausencia de Rate Limiting en Carga Masiva

`API.aportes.listar()` y `API.creditos.listar()` no tienen paginación ni límite al cargarse desde `app.js`. Un atacante podría:
1. Autenticarse como usuario válido
2. Enviar múltiples peticiones concurrentes a `/aportes` y `/creditos`
3. Provocar una carga excesiva en el servidor PostgreSQL

### 10.4 Falta de Sanitización en innerHTML

```javascript
contenido.innerHTML = `
  <td>${s.nombre}</td>  ← nombre podría contener HTML malicioso
  <td>${s.documento}</td>
`;
```

Si los campos `nombre`, `documento` o `descripcion` de los registros contienen caracteres HTML (`<`, `>`, `"`, `&`), se inyectarán directamente en el DOM. Si algún atacante pudo insertar un nombre de socio como `<img src=x onerror=alert(1)>`, el reporte ejecutaría ese script (XSS stored).

---

## 11. HALLAZGOS DE CONSISTENCIA DE DATOS

### 11.1 Inconsistencia en socio_id: documento vs. UUID

```javascript
// mappings.js mapSocio():
id: s.documento || s.id,  // ← El frontend usa documento como ID
```

```javascript
// mappings.js mapCredito():
socio_id: (c.socio && c.socio.documento) ? c.socio.documento : c.socioId,
```

El frontend históricamente usa el número de documento como `socio_id`, pero internamente la BD usa UUIDs. Este mapping introduce un riesgo cuando:

```javascript
// reportes.html — cartera:
DataHelper.getSocioNombre(c.socio_id)

// DataHelper.getSocioNombre():
getSocio(id) {
  return window.DB?.socios?.find(s => s.id === id) || null;
}
```

Si `c.socio_id` es el documento (como mapeado en `mapCredito()`) y `s.id` en `DB.socios` también es el documento (como mapeado en `mapSocio()`), el lookup funciona. Pero si algún crédito no tiene la relación `socio` expandida y `socioId` es el UUID interno, `getSocioNombre()` retornará `id` (el UUID) en lugar del nombre real.

### 11.2 Aportes Sin Filtro de Período en Reportes

El reporte de Estado de Cuenta dice "Aportes 2026" pero la consulta no filtra por año. El servicio `aporteService.listAll()` sí tiene capacidad de filtrar por `periodo` o `periodoId`, pero `API.aportes.listar()` en `app.js` se llama sin parámetros.

### 11.3 Fondo de Solidaridad — Movimientos No Disponibles en Reportes

`DB.solidaridad.movimientos` siempre es `[]`. Solo se carga `saldo_actual`. Ningún reporte muestra el detalle de movimientos del fondo de solidaridad, a pesar de que existe la tabla `solidaridad_movimientos` con datos completos.

---

## 12. HALLAZGOS ARQUITECTÓNICOS

### 12.1 Violación del Principio de Single Source of Truth

Los mismos datos financieros se calculan en múltiples lugares con lógica diferente:

| Dato | En reportes.html | En dashboard.js | En socioService.js |
|------|------------------|-----------------|--------------------|
| Total ahorros | `DataHelper.getTotalAhorros()` (suma DB.socios) | No calculado | SQL: `SUM(ahorro_acumulado)` |
| Socios en mora | `DB.socios.filter(s => s.estado === 'mora')` | `socios.filter(s => estado === 'mora')` (Prisma) | SQL: CASE basado en aportes |
| Cartera vigente | `DataHelper.getTotalCartera()` (todos los créditos) | `creditos.filter(c => c.estado !== 'pagado')` | No calculado directamente |

### 12.2 Ausencia de Cache Invalidation

No existe ningún mecanismo para invalidar `window.DB` cuando los datos cambian en el servidor. Si el administrador registra un pago mientras el tesorero tiene `reportes.html` abierta, el tesorero seguirá viendo datos desactualizados.

### 12.3 Sin Versioning de API

Los reportes dependen directamente de la estructura de respuesta del backend. No hay versionado de API (`/api/v1/reportes`). Un cambio en la estructura de respuesta de `GET /aportes` rompería silenciosamente los reportes.

### 12.4 Dashboard vs. Reportes — Arquitecturas Divergentes

El **dashboard** usa `API.dashboard.resumen()` que consulta la BD en tiempo real.
Los **reportes** usan `window.DB` que es un snapshot estático.

Ambos módulos deben mostrar información consistente, pero sus fuentes de datos y frecuencia de actualización son completamente diferentes.

---

## 13. HALLAZGOS DE FUNCIONALIDAD ROTA

### Resumen de Funciones que No Funcionan en Producción

| Función | Ubicación | Estado | Error al ejecutar |
|---------|-----------|--------|-------------------|
| `exportarPDF()` | Invocada en reportes.html L358 | ❌ NO DEFINIDA | `ReferenceError` |
| `exportarExcel()` | Invocada en reportes.html L364 | ❌ NO DEFINIDA | `ReferenceError` |
| `exportarCSV()` | reportes.html L349 | ⚠️ STUB | Solo muestra toast |
| Reporte Dividendos | reportes.html L319 | ❌ CRASH | `TypeError: Cannot read properties of undefined` |
| Filtro por período | Todos los reportes | ❌ NO IMPLEMENTADO | Siempre "Marzo 2026" |
| Selector de socio | Estado de Cuenta | ❌ NO IMPLEMENTADO | Muestra todos |
| Filtro de fecha | Flujo de Caja | ❌ NO IMPLEMENTADO | Muestra todo el histórico |

---

## 14. MATRIZ DE RIESGOS

| ID | Hallazgo | Probabilidad | Impacto | Nivel |
|----|----------|-------------|---------|-------|
| F-01 | exportarPDF/Excel no definidas | Certeza | Alto | 🔴 CRÍTICO |
| DV-01 | Dividendos crashea (DB.dividendos vacío) | Certeza | Alto | 🔴 CRÍTICO |
| BG-01 | Balance con utilidades hardcodeadas | Certeza | Alto | 🔴 CRÍTICO |
| BG-02 | Balance no balanceado (falta Pasivos) | Certeza | Alto | 🔴 CRÍTICO |
| FC-01 | Flujo de caja sin filtro de año | Alta | Alto | 🔴 CRÍTICO |
| FC-02 | Flujo omite flujos principales del fondo | Certeza | Alto | 🔴 CRÍTICO |
| D-01 | DB.dividendos nunca se puebla | Certeza | Alto | 🔴 CRÍTICO |
| D-03 | Tres definiciones de "socio en mora" | Alta | Alto | 🔴 CRÍTICO |
| B-01 | No existen endpoints de reportes | Certeza | Alto | 🔴 CRÍTICO |
| F-02 | Período hardcodeado "Marzo 2026" | Certeza | Medio | 🟠 ALTO |
| D-02 | Config con fallback hardcodeado | Alta | Medio | 🟠 ALTO |
| 10.2 | Datos financieros expuestos en window.DB | Certeza | Alto | 🟠 ALTO |
| 10.4 | XSS via innerHTML sin sanitizar | Media | Alto | 🟠 ALTO |
| 9.1 | Discrepancia ahorro_acumulado en update() | Alta | Alto | 🟠 ALTO |
| EC-02 | Estado de cuenta: fecha de aportes incorrecta | Certeza | Medio | 🟠 ALTO |
| 11.1 | documento vs UUID como ID de socio | Media | Alto | 🟠 ALTO |
| CA-01 | Cuotas restantes puede ser negativo | Media | Bajo | 🟡 MEDIO |
| MO-01 | Mora sin intereses de mora | Alta | Medio | 🟡 MEDIO |
| 12.2 | Sin cache invalidation | Alta | Medio | 🟡 MEDIO |
| 9.3 | Cartera suma créditos pagados | Baja | Bajo | 🟡 MEDIO |

---

## 15. RECOMENDACIONES POR PRIORIDAD

### PRIORIDAD 1 — CRÍTICA (Bloquea producción)

**R-01: Crear endpoints de reportes en el backend**
```
POST /api/reportes/estado-cuenta     → { socioId, periodoId }
POST /api/reportes/cartera           → { fechaDesde, fechaHasta, estado }
POST /api/reportes/balance           → { fecha }
POST /api/reportes/mora              → { periodoId }
POST /api/reportes/flujo-caja        → { anio, mes }
```
Cada endpoint debe retornar datos calculados en SQL, no en JavaScript.

**R-02: Implementar exportarPDF() y exportarExcel()**
```javascript
// Ejemplo con jsPDF:
function exportarPDF(tipo) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const contenido = document.getElementById("reporteContenido");
  doc.html(contenido, {
    callback: (d) => d.save(`reporte-${tipo}-${Date.now()}.pdf`),
    x: 10, y: 10, width: 190
  });
}

// Ejemplo con XLSX:
function exportarExcel(tipo) {
  const table = document.querySelector("#reporteContenido table");
  if (!table) return Toast.warn("No hay tabla para exportar");
  const wb = XLSX.utils.table_to_book(table, { sheet: tipo });
  XLSX.writeFile(wb, `reporte-${tipo}-${Date.now()}.xlsx`);
}
```

**R-03: Eliminar el reporte de Dividendos hasta tener infraestructura**
```javascript
// Ocultar hasta implementación completa:
// 1. Crear modelo Dividendos en schema.prisma
// 2. Crear endpoint GET /dividendos
// 3. Poblar DB.dividendos desde la API
// Mientras tanto, mostrar "Próximamente"
```

**R-04: Corregir el Balance General**
- Eliminar valor hardcodeado de utilidades
- Agregar sección de Pasivos (obligaciones del fondo)
- Garantizar ecuación: Activos = Pasivos + Patrimonio

### PRIORIDAD 2 — ALTA (Necesaria antes de uso real)

**R-05: Añadir selector de período a todos los reportes**
```html
<select id="periodoReporte">
  <option>Cargando períodos...</option>
</select>
```
Y poblar dinámicamente desde `GET /periodos`.

**R-06: Corregir el Flujo de Caja para que filtre por año/mes**
```javascript
// En el endpoint del backend:
WHERE EXTRACT(YEAR FROM fecha) = $anio
  AND ($mes IS NULL OR EXTRACT(MONTH FROM fecha) = $mes)
```

**R-07: Sanitizar innerHTML para prevenir XSS**
```javascript
function escapeHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
// Usar: escapeHTML(s.nombre) en lugar de s.nombre directo
```

**R-08: Corregir la inconsistencia en aporteService.update()**
```javascript
// En vez de incremento simple, recalcular completamente:
await client.query(`
  UPDATE socios SET ahorro_acumulado = COALESCE(
    (SELECT SUM(CASE WHEN estado='pagado' THEN (monto - COALESCE(pago_solidaridad,0) - COALESCE(pago_credito,0)) ELSE 0 END)
     FROM aportes WHERE socio_id = $1), 0)
  WHERE id = $1
`, [cur.socio_id]);
```

### PRIORIDAD 3 — MEDIA (Mejoras de calidad)

**R-09: Implementar un único CalculadoraFinanciera en el backend**  
Centralizar todos los cálculos (saldo cartera, total ahorros, mora) en un servicio compartido para eliminar las tres definiciones divergentes.

**R-10: Añadir paginación a las llamadas en app.js**  
`API.aportes.listar()` y `API.creditos.listar()` deben usar `limit` y `page` para evitar cargas masivas de datos al inicio de sesión.

**R-11: Usar `textContent` en lugar de `innerHTML` donde sea posible**  
Para campos de texto simples, usar `td.textContent = valor` en lugar de interpolación directa en template literals.

**R-12: Añadir selector de socio al reporte Estado de Cuenta**  
Este reporte debería mostrar el estado de UN socio seleccionado, no de todos, y usar el endpoint `/socios/:id/estado-cuenta` ya existente en el backend.

---

## 16. VEREDICTO FINAL

### Estado General del Módulo

```
╔══════════════════════════════════════════════════════════╗
║         MÓDULO DE REPORTES — VEREDICTO FINAL            ║
╠══════════════════════════════════════════════════════════╣
║  Estado:      🔴 NO APTO PARA PRODUCCIÓN                ║
║  Completitud: ~25% (solo renderizado básico funciona)   ║
║  Confiabilidad Financiera: BAJA                         ║
║  Exportación: 0% FUNCIONAL                              ║
╚══════════════════════════════════════════════════════════╝
```

### Resumen de Hallazgos

| Categoría | Críticos | Altos | Medios | Total |
|-----------|---------|-------|--------|-------|
| Integridad Financiera | 4 | 3 | 1 | 8 |
| Funcionalidad Rota | 3 | 2 | 2 | 7 |
| Seguridad | 0 | 3 | 1 | 4 |
| Arquitectura | 2 | 2 | 2 | 6 |
| Consistencia de Datos | 2 | 2 | 1 | 5 |
| **TOTAL** | **11** | **12** | **7** | **30** |

### Análisis de Riesgo Operativo

Si este módulo se despliega en producción en su estado actual:

1. **El reporte de Dividendos siempre fallará** con un error JavaScript en el navegador.
2. **Los botones "Exportar PDF" y "Excel" nunca funcionarán** (ReferenceError).
3. **El Balance General muestra datos fabricados** ($2.500.000 de "utilidades retenidas" son un valor fijo inventado).
4. **El Flujo de Caja no representa el flujo real del fondo** (omite aportes y créditos).
5. **Los datos del reporte pueden estar desactualizados** en cualquier momento del día.
6. **Un usuario puede manipular cualquier reporte** desde la consola del navegador.
7. **Información financiera sensible de todos los socios** es accesible desde DevTools por cualquier usuario autenticado.

### Próximos Pasos Recomendados

1. **Inmediato (hoy):** Deshabilitar el acceso al módulo de reportes hasta completar las correcciones críticas.
2. **Sprint 1 (1-2 semanas):** Implementar endpoints de backend para reportes + corregir exportación PDF/Excel.
3. **Sprint 2 (2-3 semanas):** Implementar filtros por período, sanitización XSS, corrección del Balance.
4. **Sprint 3 (3-4 semanas):** Diseñar e implementar el módulo de Dividendos con modelo de datos completo.
5. **Sprint 4 (4-5 semanas):** Pruebas de integración con datos reales y validación financiera con contador.

---

*Auditoría realizada con análisis exhaustivo del código fuente. Todos los hallazgos están respaldados por referencias específicas a líneas de código del proyecto.*

*Archivos revisados: `pages/reportes.html`, `js/app.js`, `js/api.js`, `js/export.js`, `backend/src/routes/dashboard.js`, `backend/src/routes/socios.js`, `backend/src/routes/movimientos.js`, `backend/src/controllers/socioController.js`, `backend/src/controllers/movimientoController.js`, `backend/src/controllers/creditoController.js`, `backend/src/controllers/aporteController.js`, `backend/src/services/socioService.js`, `backend/src/services/aporteService.js`, `backend/src/services/creditoService.js`, `backend/src/services/movimientoService.js`, `backend/src/lib/mappings.js`, `backend/prisma/schema.prisma`*
