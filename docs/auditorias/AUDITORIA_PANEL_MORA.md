# Auditoría de Módulo — Panel de Mora

> **Módulo:** Panel de Mora / Gestión de Cobro  
> **Fecha:** 2026-06-17  
> **Rol:** Arquitecto de Software Senior / Auditor Técnico  
> **Clasificación:** 🔴 **No apto para producción**

---

## 1. Resumen Ejecutivo

El Panel de Mora es **100% frontend**: no existe ningún endpoint backend específico para este módulo. Todos los cálculos financieros (días en mora, intereses, totales, KPIs) se ejecutan en el navegador a partir de `window.DB.aportes`. Los acuerdos de pago se almacenan exclusivamente en memoria volátil (`var acuerdos = []`) y se pierden al recargar la página o navegar a otra vista. El módulo no tiene capa de servicio, no persiste sus datos, y depende enteramente de la integridad del store global `window.DB` y del reloj del cliente. Es, funcionalmente, **una hoja de cálculo en el navegador disfrazada de panel de gestión**.

---

## 2. Inventario de Componentes

### 2.1 Backend

| Componente | Archivo | Estado |
|-----------|---------|--------|
| Ruta específica | ❌ No existe | 🔴 No hay `routes/mora.js` |
| Controlador | ❌ No existe | 🔴 No hay `controllers/moraController.js` |
| Servicio | ❌ No existe | 🔴 No hay `services/moraService.js` |
| Modelo Prisma específico | ❌ No existe | 🔴 No hay modelo de acuerdos |
| Middleware auth/roles | ❌ No aplica | 🔴 No hay endpoints que proteger |

### 2.2 Backend — Dependencias Externas (Usadas desde el frontend)

| Endpoint API | Propósito en Panel Mora | Auditado en |
|-------------|------------------------|-------------|
| `PUT /api/aportes/:id/estado` | Cambiar estado de mora/vencido a pagado/pendiente | Aportes |
| `POST /api/whatsapp/individual` | Enviar alerta WhatsApp individual | WhatsApp |
| `POST /api/whatsapp/alertas-mora` | Enviar alertas masivas | WhatsApp |

### 2.3 Frontend

| Componente | Archivo | Estado |
|-----------|---------|--------|
| Panel HTML+JS | `pages/panel-mora.html` | ✅ 786 líneas, completo |
| API client | `js/api.js` (aportes.actualizarEstado, whatsapp.*) | ✅ |
| Roles | `js/roles.js:25` — `"panel-mora": ["administrador","tesorero"]` | ✅ Definido |
| Navegación | `js/roles.js:61,98` — icono ⚠️ | ✅ |
| Búsqueda | `js/search.js` | ❌ No indexado |

### 2.4 Dependencias de Datos (Todo desde `window.DB`)

| Dato | Origen | Riesgo |
|------|--------|--------|
| `DB.aportes` | Precargado por `app.js` vía API | Puede estar desactualizado |
| `DB.config.tasa_mora_diaria` | Precargado por `app.js` | Aceptable si se refresca |
| `DB.socios` | Precargado por `app.js` | Puede estar desactualizado |
| Reloj del cliente (`new Date()`) | Navegador | Manipulable por el usuario |

---

## 3. Clasificación del Módulo

| Dimensión | Clasificación | Detalle |
|-----------|--------------|---------|
| Arquitectura backend | 🔴 **Inexistente** | No hay backend para este módulo |
| Persistencia de datos | 🔴 **Solo frontal en memoria** | Acuerdos se pierden al recargar |
| Cálculos financieros | 🔴 **100% en frontend** | Intereses, días mora, totales |
| UI/UX | ✅ **Completa y funcional** | Cards, filtros, KPIs, modales |
| Roles y permisos | 🟠 **Error en verificación** | Ver `Roles.proteger("aportes")` en vez de `"panel-mora"` |
| Exportación | ✅ **Excel con XLSX** | Correcto |
| Integración WhatsApp | ✅ **Llamadas a API** | Usa endpoints existentes |

---

## 4. Riesgos Técnicos

### RT-01: Cien por Ciento Frontend — Sin Servidor (Crítico)
- **Dónde:** No existe ningún archivo en `backend/src/routes/`, `controllers/` ni `services/` para mora.
- **Impacto:**
  - Los cálculos financieros dependen del navegador: cualquier discrepancia entre `window.DB` y la BD real produce resultados incorrectos
  - Sin trazabilidad de acciones de cobro
  - Sin validación centralizada de reglas de negocio
  - Sin capacidad de generar reportes desde el servidor

### RT-02: Acuerdos de Pago en Memoria Volátil (Crítico)
- **Dónde:** `panel-mora.html:293` — `var acuerdos = []`
- **Impacto:**
  - Cualquier acuerdo registrado se pierde al recargar la página o navegar a otra sección
  - No hay historial de acuerdos
  - Un administrador puede registrar un acuerdo, recargar sin querer, y perder toda la información
  - No hay notificación al socio ni registro de compromiso

### RT-03: Cálculos Financieros en el Cliente (Crítico)
- **Dónde:** `panel-mora.html:340-353` — `calcularDiasMora()`, `calcularInteresTotal()`
- **Impacto:**
  - `calcularDiasMora()` usa `new Date()` del navegador: un usuario puede cambiar el reloj del sistema para alterar los días de mora
  - La fecha límite de pago se asume como día 5 del mes (hardcodeado `mesAFecha()`)
  - El interés se calcula como `monto * (tasa/100) * dias` sin capitalización ni validación
  - Los totales mostrados pueden diferir de los reales en BD

### RT-04: Actualización de Estado sin Transacciones (Alto)
- **Dónde:** `panel-mora.html:705-724` — `cambiarEstadoMora()` itera aportes uno por uno
- **Impacto:**
  - Si un socio tiene 5 aportes en mora y la llamada 3 falla, 2 aportes quedan actualizados y 3 no
  - No hay rollback ni compensación
  - El estado queda inconsistente

### RT-05: Error en Verificación de Roles (Alto)
- **Dónde:** `panel-mora.html:301` — `Roles.proteger("aportes")`
- **Impacto:**
  - La página verifica el permiso `"aportes"` en lugar de `"panel-mora"`
  - Si en el futuro se restringe el acceso a `"panel-mora"` de forma diferente a `"aportes"`, la protección será incorrecta
  - Es una copia del sistema de permisos de `aportes.html`, pero la página es distinta

### RT-06: Días de Mora Según Período Textual (Medio)
- **Dónde:** `panel-mora.html:332-338` — `mesAFecha()` parsea texto como "Marzo 2026"
- **Impacto:**
  - Asume que el período es texto en formato "Mes AAAA" (específico español)
  - Asume fecha límite de pago = día 5 del mes
  - Si el formato de período cambia, el cálculo se rompe
  - No considera fines de semana ni días hábiles

### RT-07: Sin Paginación ni Virtual Scrolling (Medio)
- **Dónde:** `panel-mora.html:492-494` — renderiza todas las cards de golpe
- **Impacto:** Con 100+ socios en mora, el DOM crece desmedidamente. No hay carga perezosa ni paginación.

### RT-08: Dependencia de CDN para Exportación (Bajo)
- **Dónde:** `panel-mora.html:277` — carga `xlsx.full.min.js` desde CDN de jsdelivr
- **Impacto:** Si el CDN está caído o el usuario no tiene internet, la exportación Excel falla silenciosamente.

---

## 5. Riesgos Funcionales

### RF-01: Intereses de Mora No Persistentes (Crítico)
- **Dónde:** Todo el módulo
- **Impacto:** El interés de mora se calcula en vivo en el frontend. No se registra en BD. Si se consulta en otro momento, dará un valor diferente. No hay un "corte" de intereses. No hay registro contable de ingresos por mora.

### RF-02: Acuerdo de Pago Sin Efecto Legal (Alto)
- **Dónde:** `panel-mora.html:603-643`
- **Impacto:** El acuerdo:
  - No se almacena en BD
  - No genera comprobante ni constancia
  - El socio no recibe confirmación oficial
  - No hay registro de quién lo aprobó
  - No hay seguimiento de cumplimiento

### RF-03: Sin Historial de Mora por Socio (Alto)
- **Dónde:** En ninguna parte del sistema
- **Impacto:** No se puede consultar el historial de mora de un socio (cuándo entró en mora, cuándo salió, cuántas veces ha estado en mora).

### RF-04: Tasa de Mora Fija (Medio)
- **Dónde:** `backend/prisma/seed.js:37` — `tasa_mora_diaria: 0.1`
- **Impacto:** La tasa de mora es la misma para todos los periodos y todos los socios. No hay posibilidad de aplicar tasas diferenciadas por tipo de crédito o periodo.

---

## 6. Código Duplicado

| Patrón Duplicado | Archivos | Líneas |
|-----------------|----------|--------|
| Filtro `["mora","vencido"].includes(a.estado)` | `panel-mora.html` — repetido ~10 veces | ~1 c/u |
| Llamada a `calcularDiasMora()` + `calcularInteresTotal()` | `panel-mora.html` — repetido en renderKPIs, renderSidebar, buildMoraCard, abrirAcuerdo, abrirWA, exportarMora | ~3 c/u |
| Lógica de interés idéntica en `movimientos.html` | `pages/movimientos.html` — no en panel-mora, pero la misma fórmula existe en dashboard.html | — |

---

## 7. Evaluación de Arquitectura

### 7.1 Capas: 🔴 Inexistente

El módulo **no tiene backend**. Es una página HTML con JavaScript que opera sobre un store global. Comparación con módulos que sí tienen backend:

```
Módulos correctos (socios, aportes):  routes/ → controllers/ → services/ → db → respuesta → window.DB
Panel de Mora:                        window.DB → lógica frontend → render DOM
```

### 7.2 Persistencia: 🔴 Solo Memoria

| Dato | Almacenamiento | Persistencia |
|------|---------------|-------------|
| Aportes en mora | `window.DB.aportes` (copia local) | Volátil — se actualiza vía polling |
| Acuerdos de pago | `var acuerdos[]` (memoria JS) | **Se pierde al recargar** |
| Intereses calculados | No se almacenan | Se recalcan en cada render |
| Historial de mora | No existe | No existe |

### 7.3 Seguridad: 🟠 Parcial

- ✅ Roles definidos en `roles.js` (panel-mora: admin/tesorero)
- ❌ Verificación incorrecta (`Roles.proteger("aportes")` en vez de `"panel-mora"`)
- ❌ No hay registro de auditoría: quién marcó como pagado, quién registró acuerdo
- ❌ No hay control de cambios: cualquier admin puede modificar el estado de cualquier socio

---

## 8. Modelo de Datos

### 8.1 Modelos Prisma Relacionados

| Modelo | Campos usados | Problema |
|--------|--------------|----------|
| `Aporte` | `estado` (mora/vencido), `monto`, `periodoId`, `socioId`, `fechaPago` | ✅ Suficiente para listar mora |
| `Socio` | `nombre`, `telefono`, `cargo`, `sede` | ✅ |
| `Periodo` | `nombre` (para calcular fecha límite) | ✅ |
| `Configuracion` | `tasa_mora_diaria` | ✅ |

### 8.2 Modelos Faltantes

| Modelo necesario | Uso |
|-----------------|-----|
| `AcuerdoPago` | Persistir acuerdos de pago (socio_id, monto, fecha, fecha_limite, observaciones, creado_por, estado, created_at) |
| `MoraHistorial` | Registrar cambios de estado de aporte (aporte_id, estado_anterior, estado_nuevo, usuario_id, created_at) |
| `InteresMora` | Registrar liquidación de intereses (aporte_id, dias, tasa, monto_interes, periodo) |

---

## 9. Reglas de Negocio

### 9.1 Ubicación Actual

| Regla | Ubicación | Estado |
|-------|-----------|--------|
| Un aporte está en mora si su estado es "mora" o "vencido" | Frontend (`panel-mora.html:341`) | ✅ |
| Días de mora = hoy - día 5 del periodo | Frontend (`panel-mora.html:332-346`) | 🟠 Hardcodeado día 5 |
| Interés = monto * (0.1/100) * días | Frontend (`panel-mora.html:348-353`) | 🟠 En frontend |
| Nivel de mora: crítica >30d, alta 15-30d, baja <15d | Frontend (`panel-mora.html:355-359`) | 🟠 En frontend |
| Tasa de mora diaria = 0.1% | `seed.js:37` + `app.js:17` | ✅ Desde config |

### 9.2 Problemas

1. **Todas las reglas en frontend**: Cualquier regla de negocio relacionada con mora se puede eludir o manipular
2. **Sin límite de interés acumulado**: No hay tope (ej. interés no puede superar capital)
3. **Sin regla de capitalización**: Interés simple, no compuesto — puede ser correcto pero no está documentado
4. **Día 5 hardcodeado**: Asume que la fecha límite de pago es siempre el día 5 de cada mes

---

## 10. KPIs del Módulo

| KPI | Valor | Estado |
|-----|-------|--------|
| Backend específico | 0 endpoints | 🔴 |
| Persistencia de acuerdos | 0% | 🔴 |
| Cálculos en servidor | 0% | 🔴 |
| Cobertura de auditoría | 0% | 🔴 |
| Cálculo de intereses verificable | ❌ (solo frontend) | 🔴 |
| Verificación de roles correcta | ❌ (usa "aportes") | 🔴 |

---

## 11. Trazabilidad

| Aspecto | Estado |
|---------|--------|
| Registro de cambios de estado | ❌ Solo vía middleware audit de `PUT /aportes/:id/estado` (si existe) |
| Registro de acuerdos | ❌ No existe |
| Quién marcó como pagado | ❌ No se registra |
| Cuándo se registró un acuerdo | ❌ No se registra |
| Historial de mora por socio | ❌ No existe |

---

## 12. Recomendaciones

### Inmediatas (Prioridad Crítica)

| # | Recomendación | Esfuerzo | Impacto |
|---|--------------|----------|---------|
| R1 | **Agregar backend para mora:** Crear `routes/mora.js`, `controllers/moraController.js`, `services/moraService.js` con endpoints: `GET /api/mora` (listar morosos con cálculos), `GET /api/mora/resumen` (KPIs desde servidor), `GET /api/mora/:socioId` (detalle por socio) | 3-5 días | RT-01 |
| R2 | **Persistir acuerdos de pago:** Crear modelo `AcuerdoPago` en Prisma y endpoints CRUD. Migrar `guardarAcuerdo()` a llamada API | 2-3 días | RT-02 |
| R3 | **Mover cálculos de interés al backend:** Los endpoints de mora deben devolver días e intereses calculados desde el servidor con `now()` de PostgreSQL | 2 días | RT-03 |
| R4 | **Corregir verificación de roles:** Cambiar `Roles.proteger("aportes")` a `Roles.proteger("panel-mora")` en `panel-mora.html:301` | 5 min | RT-05 |
| R5 | **Agregar transacciones en cambio de estado:** Usar `PUT /api/aportes/:id/estado` con verificación y log, no llamado secuencial desde frontend | 1 día | RT-04 |

### Corto Plazo (30 días)

| # | Recomendación | Esfuerzo | Impacto |
|---|--------------|----------|---------|
| R6 | **Crear modelo `MoraHistorial`:** Registrar cada cambio de estado de aporte con fecha, usuario, estado anterior/nuevo | 1 día | RF-03, Trazabilidad |
| R7 | **Agregar paginación en listado de morosos:** Cargar 20 cards, botón "Cargar más" o scroll infinito | 1 día | RT-07 |
| R8 | **Mover fecha límite de período a modelo `Periodo`:** Agregar campo `fechaLimitePago` en lugar de hardcodear día 5 | 1 día | RT-06 |
| R9 | **Generar comprobante de acuerdo de pago:** PDF descargable al registrar acuerdo | 2-3 días | RF-02 |
| R10 | **Agregar endpoint de resumen de mora:** KPI como `GET /api/mora/resumen` para que el dashboard también consuma datos reales | 1 día | Centralización |

### Mejoras Adicionales

| # | Recomendación | Esfuerzo | Impacto |
|---|--------------|----------|---------|
| R11 | **Agregar campo `dias_gracia` en config:** Días hábiles de gracia antes de aplicar mora | 1 día | Flexibilidad |
| R12 | **Notificar automáticamente al socio al registrar acuerdo:** Usar `whatsappService.send()` (auditoría WhatsApp: R5) | 1 día | UX |
| R13 | **Agregar bloqueo de créditos si hay mora activa:** No permitir nuevos créditos si el socio tiene mora > 30 días | 2 días | Regla de negocio |

---

## 13. Plan de Migración

### Fase 0: Backend Mínimo (Semana 1)

```
Día 1:
  ├── R4: Corregir Roles.proteger() → "panel-mora"
  ├── R5: Verificar que PUT /aportes/:id/estado use transacción
  └── Crear modelo AcuerdoPago + migración Prisma

Día 2:
  ├── R1: Crear GET /api/mora (listar morosos con intereses desde servidor)
  └── R1: Crear GET /api/mora/resumen (KPIs desde servidor)

Día 3:
  ├── R2: Crear POST /api/mora/acuerdos (persistir acuerdo)
  ├── R2: Crear GET /api/mora/acuerdos (listar acuerdos)
  └── R2: Conectar frontend guardarAcuerdo() a API

Día 4:
  ├── R3: Mover calcularDiasMora() y calcularInteresTotal() al backend
  └── Refactor renderMorosos() para consumir datos del servidor

Día 5:
  ├── R6: Crear MoraHistorial + integración en cambio de estado
  └── Pruebas de integración
```

### Fase 1: Maduración (Semana 2-3)

```
Semana 2:
  ├── R7: Paginación en listado de morosos
  ├── R8: fechaLimitePago en modelo Periodo
  └── R10: Dashboard consume GET /api/mora/resumen

Semana 3:
  ├── R9: Comprobante PDF de acuerdo
  ├── R12: Notificación WhatsApp al crear acuerdo
  └── R13: Bloqueo de créditos por mora activa
```

---

## 14. Conclusión

**Clasificación final: 🔴 No apto para producción**

El Panel de Mora representa el caso más extremo de lógica financiera en el frontend en todo FONEVI. Es, en esencia, **una hoja de cálculo en el navegador**: no tiene backend, no persiste acuerdos, calcula intereses con el reloj del cliente, y almacena datos críticos de cobranza en memoria volátil.

Los acuerdos de pago —que tienen implicaciones legales y financieras— se pierden al recargar la página. Los intereses de mora no se registran contablemente. No existe trazabilidad de las acciones de cobro.

**Fortalezas del módulo:**
- UI completa y bien diseñada (cards, filtros por nivel de mora, KPIs, exportación Excel)
- Buena integración con WhatsApp (envío individual y masivo)
- Navegación y roles correctamente configurados en el sistema de menús

**Debilidades críticas:**
- 0% de la lógica de negocio está en el servidor
- Los acuerdos de pago no existen realmente (se pierden al recargar)
- Intereses de mora no auditables ni verificables
- El cambio masivo de estados no es transaccional
- La verificación de roles está incorrecta (copia de `aportes.html`)

**Veredicto:** El Panel de Mora necesita una reescritura significativa del backend (~1 semana) para ser funcional. Hasta entonces, **no debe utilizarse para toma de decisiones financieras reales**. Los acuerdos de pago registrados en esta interfaz no tienen validez y se perderán. Es prioritario mover todos los cálculos al servidor y persistir los acuerdos antes de considerar este módulo como parte del sistema productivo.

## Auditoría de Panel de Mora guardada en docs/auditorias/AUDITORIA_PANEL_MORA.md. 
## Clasificación: 🔴 No apto para producción.
### Hallazgos principales:
- 0% backend 
— No existe un solo endpoint para mora; todo es frontend puro
### Acuerdos de pago en memoria volátil — var acuerdos = [] se pierde al recargar la página (RT-02 crítico)

### Intereses calculados con el reloj del cliente — new Date() manipulable por el usuario (RT-03 crítico)

### Sin modelo de datos — No hay AcuerdoPago, MoraHistorial ni InteresMora en Prisma

### Error en verificación de roles — Usa Roles.proteger("aportes") en vez de "panel-mora" (RT-05)

### Cambio de estado sin transacciones — Itera aportes uno por uno vía API

Esencialmente una hoja de cálculo en el navegador. Requiere ~1 semana para crear backend mínimo.