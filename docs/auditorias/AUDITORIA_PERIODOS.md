# Auditoría — Módulo Períodos y Cierre Mensual

Fecha: 2026-06-16

Autor: Arquitecto Máster / Auditor Técnico (revisión automatizada del códigobase)

Resumen: informe técnico exhaustivo sobre implementación, riesgos y recomendaciones del módulo "Períodos y Cierre Mensual" de FONEVI.

---

**1. Resumen ejecutivo**

- Estado general del módulo:
  - Existe una UX/Asistente de Cierre Mensual implementada en `pages/cierre-periodo.html` que guía la verificación de aportes, cálculo de saldos, generación de PDF y activación del siguiente período. La lógica de negocio principal sobre aportes y movimientos reside en servicios y controladores backend (`aporteService`, `movimientoService`, `aporteController`). El modelo de datos incluye la tabla `periodos`, pero su uso y gestión es parcial y dispersa entre seed/scripts y la configuración (`configuracion.periodo_actual`).

- Fortalezas:
  - Interfaz de usuario completa para un asistente guiado de cierre con pasos claros, generación de PDF y checks previos.
  - Existencia de auditoría (`auditoria`) usada por controladores en operaciones claves (aportes, movimientos, cambios de configuración).
  - Endpoints protegidos por roles para operaciones críticas (actualizar aportes, cambiar configuración, registrar movimientos).

- Debilidades:
  - El cierre es orquestado desde el frontend por múltiples peticiones HTTP separadas (marcar aportes, crear movimiento, actualizar `periodo_actual`) sin una operación atómica en servidor.
  - Modelo `Periodo` en Prisma es mínimo (id, nombre, anio, mes, activo, createdAt) y no registra metadatos de cierre (usuario, fecha, totales, observaciones) ni historial de eventos.
  - No existe endpoint/servicio centralizado `periodoService` ni API para crear/archivar periodos de forma transaccional.
  - Detección de mora se limita a aportes existentes en el período; no detecta socios sin aporte (no integrados) ni genera aportes por defecto.
  - No se garantiza backup previo al cierre ni existe mecanismo de dry-run/auditoría unificada del cierre.

- Riesgos:
  - Estado parcial si una de las múltiples peticiones falla (cierres incompletos), con posible inconsistencia contable.
  - Pérdida de trazabilidad fina (no hay `cierre_periodo` ni `periodo_historial`).
  - Cálculos y conciliaciones con riesgo por uso mixto de `Number` y `Decimal` sin estrategia coherente en memoria.

- Nivel de madurez: Bajo-Moderado. El flujo existe y funciona para escenarios simples, pero faltan garantías transaccionales, trazabilidad y controles contables para entornos regulatorios.

- Preparado para producción: No. Requiere cambios críticos antes de operar en producción financiera (vea recomendaciones inmediatas).

---

**2. Inventario de archivos analizados**

- backend/prisma/schema.prisma
- backend/scratch/create-tables-refined.js
- backend/prisma/seed.js
- backend/prisma/migration_indexes.sql
- backend/src/services/aporteService.js
- backend/src/controllers/aporteController.js
- backend/src/routes/aportes.js
- backend/src/services/movimientoService.js
- backend/src/controllers/movimientoController.js
- backend/src/routes/solidaridad.js
- backend/src/routes/configuracion.js
- backend/src/lib/mappings.js
- backend/src/middleware/audit.js
- backend/src/routes/dashboard.js
- backend/test/* (aportes.test.js, concurrency.test.js, fixtures.js) — evidencias de uso de `periodos`
- pages/cierre-periodo.html
- pages/aportes.html
- pages/panel-mora.html
- pages/configuracion.html
- js/api.js
- js/app.js
- js/search.js
- docs/FLUJO_CIERRE_PERIODO.md (documentación del flujo)
- backend/scratch/create-tables.js

Observación: no se encontró un `backend/src/services/periodoService.js` ni rutas REST explícitas para CRUD de `periodos` — la gestión se realiza parcialmente vía scripts/seed y vía `configuracion.periodo_actual`.

---

**3. Clasificación por archivo**

- Conservar
  - `backend/prisma/schema.prisma`: conservar como fuente de verdad; sirve de base para extender el modelo `Periodo` y agregar entidades de cierre/ledger.
  - `pages/cierre-periodo.html`: conservar la UX del asistente (valiosa), pero refactorizar la orquestación hacia el backend.

- Refactorizar
  - `backend/src/services/aporteService.js`: refactorizar para separar responsabilidades (aplicar pago, generar movimiento de crédito/solidaridad y actualizar ahorro) y exponer funciones idempotentes usadas en cierre.
  - `backend/src/controllers/aporteController.js` / `routes/aportes.js`: añadir endpoints atómicos y validaciones que respeten bloqueo de período cerrado (p. ej. rechazar cambios en período archivado salvo operación especial).
  - `backend/src/services/movimientoService.js` y `movimientoController.js`: consolidar creación de asientos relativos al cierre y exponer API para el cierre transaccional.
  - `backend/src/lib/mappings.js`: mejorar mapeos para incluir información de `periodoId`, `periodo_nombre` y metadatos del cierre cuando existan.
  - `pages/aportes.html` y `pages/panel-mora.html`: evitar cálculos críticos solo en cliente; delegar validaciones y generación de reportes al servidor.

- Archivar
  - `backend/scratch/*` (scripts de creación) pueden archivarse en carpeta `scripts/` o `db/migrations/` formales si se migrará a Prisma Migrations.

- Eliminar
  - No se recomienda eliminar archivos de códigobase; en todo caso, eliminar llamadas o código duplicado tras refactorización.

Motivo técnico: priorizar la introducción de una API de cierre atómica y un modelo de datos para cierre/periodo histórico; refactorizar servicios para idempotencia y pruebas.

---

**4. Riesgos técnicos detectados**

- Concurrencia y bloqueos
  - El cierre se ejecuta por múltiples llamadas HTTP desde el cliente (loop que actualiza el estado de aportes). No existe una operación atómica en el servidor que gestione bloqueo y rollback si algo falla.
  - Riesgo de race conditions: otros procesos con permisos pueden modificar aportes o créditos mientras corre el cierre.

- Transacciones
  - No hay transacción que englobe: marcar aportes como vencidos, registrar movimientos contables, y activar el siguiente período. Esto puede dejar la base en estado parcial.

- Cierres duplicados
  - No existe marcación formal de que un período fue cerrado (no hay `periodo.cerrado_at` o `cierre_periodo`), por lo que re-ejecuciones o confirmaciones duplicadas pueden repetirse sin protección.

- Inconsistencias y cálculos
  - Cálculo de intereses y saldos en el cliente (por ejemplo en `cierre-periodo.html`) usa `Math.round` y `Number`, lo que puede generar diferencias con la precisión de DB (`Decimal(15,2)`).

- Deuda técnica
  - Lógica de negocio distribuida entre frontend y backend; falta de capa de use-cases o domain services para cierres.

- Rendimiento
  - Si la tabla `aportes` crece, la estrategia de actualizar aportes uno-a-uno desde el cliente será ineficiente y lenta. No hay procesamiento por lotes en servidor ni paginación en cierre.

- Seguridad
  - Aunque rutas están protegidas por roles, la orquestación en cliente aumenta la superficie de error; no existe un endpoint central que exija confirmación del usuario y ejecute el cierre en backend con control de permisos más estricto.

---

**5. Riesgos funcionales detectados**

- Cierres incorrectos
  - Si falla la llamada intermedia (por ejemplo crear movimiento contable) después de marcar aportes como `vencido`, el período quedará parcialmente cerrado sin resumen contable coherente.

- Apertura duplicada de períodos
  - La activación del siguiente período se hace con `API.config.actualizar('periodo_actual', siguiente)`. No se crea necesariamente el registro en `periodos`. Si no existe, futuras operaciones que requieren `periodos.id` fallarán.

- Mora mal calculada
  - La detección de mora en UI considera solo los aportes que existen para el período. Socios sin registro de aporte no son detectados como 'sin aporte' y por tanto no se marcan en mora automáticamente.
  - Cálculo de días y de intereses por mora se realiza en cliente y no validados en servidor.

- Cierres reversibles
  - No existe un mecanismo formal de reversión del cierre (undo) con seguridad; la operación puede ser parcialmente revertida manualmente por administradores con alto riesgo de errores.

- Aportes aplicados en períodos equivocados
  - Frontend permite crear aportes usando `periodo` por nombre y el controlador resuelve a `periodos.id`; si `periodo_actual` fue actualizado pero no existe fila en `periodos`, creaciones posteriores fallarán.

- Pagos fuera de período
  - No hay restricciones a nivel servidor que impidan registrar o actualizar aportes en períodos marcados como archivados o cerrados.

- Pérdida de información
  - Ausencia de ledger de movimientos por período (`aporte_detalle`, `cierre_periodo`) limita reconstrucción histórica para cierres y auditoría contable.

- Generación incorrecta de estados financieros
  - Resúmenes (PDF) los genera el cliente a partir de datos locales (`DB`); si los datos en cliente no concuerdan con la BD, el PDF puede ser inconsistente.

---

**6. Código duplicado o muerto identificado**

- Lógica repetida
  - Conversión y parseo de `periodo` (string "Mes Año") implementada en múltiples lugares (`cierre-periodo.html`, `panel-mora.html`, `aportes.html`) — duplicidad de `calcularSiguientePeriodo`, `mesAFecha`.
  - Filtrado de aportes por período repetido en frontend en varias páginas.

- Funciones con riesgo de no uso
  - No se detectaron funciones muertas críticas en backend, pero hay código de DataSync removido y console.log dispersos que parecen remanentes.

- Procesos redundantes
  - La generación del PDF y los cálculos del cierre se hacen íntegramente en cliente, replicando cálculos que idealmente deberían existir en servidor.

---

**7. Problemas de arquitectura**

- Separación de responsabilidades
  - Business logic mezclada: servicios realizan SQL y reglas de negocio; controladores orquestan y frontend también aplica reglas. Falta capa de `use-cases` o `domain services`.

- Clean Architecture
  - No se siguen estrictamente principios de Clean Architecture ni DDD: los repositorios y transporte están acoplados en servicios y controladores.

- Monolito Modular
  - No existe un módulo `periodos` claramente definido (servicio, controller, routes, tests). El comportamiento de períodos está disperso (config, seed, scripts, frontend). Esto dificulta evolucionar el módulo como una pieza independiente del monolito.

- Oportunidades DDD
  - `Periodo` debería ser un agregado con invariantes (saldo >=0, cierre atómico) y eventos (PeriodoCerrado, PeríodoAbierto). Las operaciones críticas (cerrar período) deberían emitirse como comandos y registrarse en un `periodo_event` o `periodo_historial`.

- Acoplamientos entre módulos
  - `aportes`, `creditos`, `solidaridad`, `movimientos` y `configuracion` están fuertemente acoplados mediante consultas y lógica impuesta desde frontend.

---

**8. Evaluación del modelo de datos de Períodos (Prisma)**

Periodo (actual):
- `id` Int autoincremental
- `nombre` String unique (ej. "Marzo 2026")
- `anio` Int
- `mes` Int
- `activo` Boolean
- `createdAt`

Fortalezas:
- Sencillo y suficiente para mapear aportes a un período.
- Índice por `nombre` (unique) evita duplicados directos por nombre.

Debilidades (críticas):
- No contiene campos de cierre: `cerrado_por` (`usuario_id`), `cerrado_en` (`closed_at`), `totales_ingresos`, `totales_gastos`, `observaciones`.
- No existe tabla `cierre_periodo` o `periodo_event` para registrar la transacción de cierre con totales y movimientos asociados.
- No hay flag de `read_only` o `bloqueado` que impida cambios sobre aportes de un período cerrado.
- No hay `periodo_historial` o `periodo_version` para conservar snapshots contables al cierre.

Conclusión: el esquema actual no soporta correctamente apertura, cierre, bloqueo y trazabilidad histórica requerida por procesos contables.

---

**9. Compatibilidad con las reglas oficiales de negocio de FONEVI**

### Apertura mensual
- Creación del nuevo período: Parcial — la UI calcula el siguiente periodo y actualiza `config.periodo_actual`, pero **no** inserta automáticamente un registro en `periodos`. Por tanto, no garantiza que el nuevo período exista en la tabla y sea referenciable.
- Validaciones y evitar duplicados: `periodos.nombre` es unique, pero no existe API centralizada para crear/validar periodos.

### Cierre mensual
- Ejecución única: No. No existe protección que impida re-ejecutar el cierre; la operación no es atómica y puede producir efectos parciales.
- Bloqueo de modificaciones posteriores: No hay bloqueo en BD; usuarios con roles pueden seguir modificando aportes en períodos cerrados.
- Consistencia financiera: Parcial; se generan movimientos contables, pero falta garantía transaccional que relacione marcación de aportes, asientos y activación del siguiente período.

### Mora automática
- Detecta socios con aportes en estado `pendiente` y los marca `vencido` durante el cierre. Sin embargo:
  - No detecta socios que NO registraron aporte en el período (falta generación de aportes por defecto), por tanto no marca como morosos a todos los obligados.
  - Cálculos (días, intereses) se ejecutan en cliente y no validados en servidor.

### Reportes
- La información disponible permite generar reportes básicos (PDF) desde cliente, pero la ausencia de una copia inmutable del cierre con totales y movimientos por período dificulta reportes contables históricos y auditoría.

### Reapertura de períodos
- No existe un flujo seguro para reapertura; al no haber registros centralizados del cierre ni transacción atómica, la reapertura es una operación manual y arriesgada.

### Auditoría
- Auditoría de acciones individuales existe (`auditoria`), y controladores la invocan para cambios (aportes, movimientos, configuración). No obstante, el cierre completo no se registra como una única entrada auditada con detalle y totals; la reconstrucción requiere correlacionar múltiples registros.

### Conservación histórica
- Parcial: no se pierde inmediatamente la información (aportes, movimientos siguen en BD), pero no se conserva un snapshot contable del período cerrado que garantice inmutabilidad de los estados financieros.

---

**10. Evaluación del proceso de cierre mensual**

Flujo observado (cliente ejecuta):
1) Lista aportes del período y verifica pendientes/mora (Paso 1).
2) Calcula saldos e intereses localmente (Paso 2) y muestra resumen.
3) Genera PDF en cliente (Paso 3).
4) Al confirmar (Paso 4):
   - Marca aportes `pendiente` como `vencido` (llamadas PUT `/aportes/:id/estado`).
   - Crea un movimiento contable `/movimientos` con `tipo: ingreso, categoria: Aportes`.
   - Actualiza `configuracion.periodo_actual` con siguiente periodo.

Verificación previa: hay chequeos visuales en cliente, pero no validaciones servidor-side profundizadas (integridad, conciliación previa).

Detección de inconsistencias: limitada al cliente; servidor no ejecuta validaciones transaccionales que bloqueen el cierre si existen inconsistencias contables.

Actualización de estados: la actualización de `aportes` y creación de `movimientos` ocurren como transacciones individuales por cada petición (no agrupadas).

Marcación automática de mora: se realiza marcando `pendiente` → `vencido` para aportes existentes; no se generan registros para socios sin aportes.

Generación de resumen: PDF lo genera el cliente con los datos locales; no existe endpoint que genere un cierre oficial en servidor y devuelva un PDF firmado o un registro inmutable.

Posibilidad de reversión: no existe una API de reversión; la reversión sería manual (re-hacer PUT en aportes, eliminar movimiento, restaurar `periodo_actual`) y no segura.

Manejo de errores: el proceso captura errores en cliente y muestra mensajes, pero no hay compensación automática ni rollback en servidor.

Problemas detectados:
- Falta de atomicidad y transaccionalidad en el cierre.
- Falta de validación y bloqueo de edición sobre períodos cerrados.
- Ausencia de snapshot/histórico del cierre.

---

**11. Evaluación de la trazabilidad operativa**

- ¿Quién abrió/ cerró y cuándo?:
  - Cambios en `configuracion` son auditados (registro `CAMBIAR_CONFIG`) y contienen `usuario_id` vía `audit` (controlador de configuración invoca `audit`). Esto permite saber cuándo `periodo_actual` fue cambiado y por quién.
  - Sin embargo, no existe una entidad `cierre_periodo` que consolide esa información con totales, listados de aportes afectados y movimientos contables; por tanto la reconstrucción exige correlacionar múltiples registros de `auditoria`, `movimientos` y cambios de estado en `aportes`.

- ¿Qué cambios produjo?:
  - Se actualizan estados de `aportes`, se registra un `movimiento` y se actualiza configuración. Estas operaciones quedan en tablas; sí es posible rastrearlas, pero la ausencia de una unidad lógica (registro de cierre) dificulta correlación y pruebas forenses.

- ¿Qué socios quedaron en mora / aportes pendientes?:
  - Eso puede reconstruirse consultando `aportes` con `estado IN ('mora','vencido')` y agrupando por socio. Pero no se guarda explícitamente que esos estados se originaron por un cierre en particular.

- Recomendaciones de estructuras faltantes (recomendadas explícitamente):
  - `cierre_periodo` (tabla): `id`, `periodo_id`, `cerrado_por`, `cerrado_en`, `totales_ingresos`, `totales_intereses`, `totales_ahorro`, `observaciones`, `pdf_path`, `backup_ref`.
  - `periodo_event` o `periodo_historial`: eventos inmutables por acción (aportes marcados, ajustes, reversiones) con referencia al `cierre_periodo.id`.
  - `mora_historica` / `credito_movimiento` / `aporte_detalle`: ledger granular para reconstruir fechas y cálculos.

---

**12. Recomendaciones de mejora**

### Inmediatas (críticas antes de producción)
- Implementar un endpoint backend transaccional `POST /periodos/:id/cerrar` (o `POST /periodos/close`) que: 1) acepte `dryRun=true|false`; 2) realice todas las operaciones en una transacción (marcar aportes, crear movimientos, generar snapshot, crear registro `cierre_periodo` y actualizar `periodo_actual`); 3) registre en `auditoria` un único evento resumen del cierre; 4) permita `dry-run` que devuelva el resumen sin mutar BD.
- Antes de ejecutar cierre definitivo, automatizar creación/ verificación de backup (ejecutar script DB dump o snapshot) y registrar referencia en `cierre_periodo.backup_ref`.
- Extender modelo `Periodo` con campos: `cerrado_en` (timestamp), `cerrado_por` (usuario_id), `bloqueado` (boolean), `observaciones` y `totales` (opcional). Crear `cierre_periodo` tabla para snapshots.
- Restringir mutaciones en `aportes`/`creditos` para períodos `bloqueado`: validar en servicio/DB que no se permitan cambios salvo operaciones administrativas con justificativo y registro en `auditoria`.

### Mediano plazo
- Persistir cronograma de cuotas y ledger de movimientos (`aporte_detalle`, `credito_movimiento`) para trazabilidad contable e integración con cierre.
- Centralizar cálculos financieros en backend usando librería Decimal (Big.js o decimal.js) para evitar discrepancias por redondeo entre cliente y servidor.
- Mover la orquestación de cierre al servidor; hacer que el frontend invoque single endpoint `POST /periodos/close` con `confirm:true` y el backend haga la operación completa y atómica.
- Crear tests de integración/contrato para cierre (con casos de fallo intermedio) y para dry-run.

### Largo plazo
- Rearquitectura hacia Clean Architecture / DDD: definir `Periodo` como agregado, `CierrePeriodo` como caso de uso, `Aporte` y `Movimiento` como entidades con repositorios.
- Event sourcing / event log: considerar persistir eventos de dominio para auditoría inmutable y reconstrucción de estados.
- Introducir panel SuperAdmin para ejecutar backups, forzar cierres, revisar dry-runs y auditorías con firmas digitales.

---

**13. Observaciones para futura migración**

- Clean Architecture: crear capas claras — Controllers (HTTP) → UseCases (CerrarPeriodo, SimularCierre) → Domain (Periodo, Aporte, Movimiento) → Repositories (Prisma/pg). Esto facilita pruebas y separación de responsabilidades.
- Domain-Driven Design: modelar invariantes del agregado `Periodo` (solo 1 abierto, cierre atómico, totales inmutables tras cierre) y exponer comandos (`CerrarPeriodo`, `ReabrirPeriodo`) con policies y eventos.
- Monolito Modular: crear módulo `periodos` con su API, tests y documentación; minimizar dependencias cruzadas directas entre `aportes`, `creditos` y `configuracion`.
- SaaS Multi-Tenant: en migración, añadir `tenant_id` a tablas críticas (`periodos`, `aportes`, `creditos`, `movimientos`) y planear particionado/índices por tenant.
- Base de datos por tenant: diseñar migración y estrategia de backup/restore por tenant; incluir `cierre_periodo.backup_ref` apuntando al artefacto de backup.

Integración con herramientas de plataforma:
- Backups automáticos: integrar con job que haga dump antes del cierre; almacenar referencia en `cierre_periodo` y/o en sistema de backup externo (S3).
- Panel SuperAdmin: para dry-run centralizado, disparo de backups y auditoría global.
- Configuración dinámica: usar `configuracion` para toggles (`dry_run_required`, `force_backup_before_close`).
- Auditoría financiera: estandarizar `audit` y relacionar cada entrada a `cierre_periodo_id` cuando aplique.
- Reportes: generar PDF desde backend (server-side rendering) y guardar copia vinculada a `cierre_periodo`.

---

**14. Conclusión final**

- ¿Preparado para producción?: No. El módulo tiene buenas intenciones (asistente de cierre, roles y auditoría por operación) pero adolece de garantías críticas: atomicidad del cierre, backups previos, trazabilidad inmutable y detección completa de mora (socios sin aporte). Esto representa riesgos contables y operativos importantes.

- Riesgos críticos:
  - Cierre parcial por fallos intermedios (no rollback en servidor).
  - Pérdida/ambigüedad de información del cierre (no existe `cierre_periodo`).
  - Mora no detectada para socios sin aportes.

- Mejoras obligatorias antes de producción:
  1) Endpoint de cierre atómico en servidor con `dry-run` y backup obligatorio.
  2) Ampliar modelo `Periodo` y crear `cierre_periodo` y ledger (`credito_movimiento`/`aporte_detalle`).
  3) Prohibir modificaciones no autorizadas a datos de períodos cerrados y documentar políticas de reapertura.

- Nivel de confiabilidad: Moderado-bajo para entornos no regulados; insuficiente para ambientes financieros regulados hasta implementar las recomendaciones.

Si lo desea, puedo ahora:
- Generar un resumen ejecutivo corto (1 página) para la Mesa Directiva; o
- Proponer el diseño del endpoint `POST /periodos/close` (contrato HTTP, transacciones DB, eventos, pruebas unitarias y esquema de `cierre_periodo`) para que el equipo de desarrollo lo implemente.
