# Auditoría de Arquitectura — FONEVI

> **Auditoría:** Transversal — Arquitectura, Estructura, Diseño y Preparación para Producción  
> **Fecha:** 2026-06-17  
> **Rol:** Arquitecto de Software Senior / Auditor Técnico  
> **Clasificación:** 🔴 **No apto para producción**

---

## 1. Resumen Ejecutivo

FONEVI carece de una arquitectura definida y consistente. El proyecto mezcla dos ORMs (Prisma + pg pool directo), combina estilos arquitectónicos (MVC parcial en unos módulos, script directo en otros), y delega lógica financiera crítica al frontend. No hay capa de dominio, ni repositorios, ni contratos entre capas. El almacén global `window.DB` del frontend rompe cualquier noción de estado predecible. No existe preparación para multi-tenancy, ni escalabilidad horizontal, ni despliegue continuo. El 54% de los módulos backend carecen de la estructura de 3 capas (ruta → controlador → servicio). El patrón general es **acción-reacción sin abstracción**.

---

## 2. Inventario de Componentes

### 2.1 Backend — Estructura por capas

| Módulo | Ruta | Controlador | Servicio | Capa DB | Auditoría | Observaciones |
|--------|------|-------------|----------|---------|-----------|--------------|
| Auth | `routes/auth.js` | ❌ | ❌ | Prisma | ❌ | Lógica directamente en ruta |
| Usuarios | `routes/usuarios.js` | ❌ | ❌ | Prisma | ❌ | Lógica en ruta |
| Socios | `routes/socios.js` | `controllers/socioController.js` | `services/socioService.js` | pg pool directo | ✅ | 3 capas completas |
| Aportes | `routes/aportes.js` | `controllers/aporteController.js` | `services/aporteService.js` | pg pool directo | ✅ | 3 capas completas |
| Créditos | `routes/creditos.js` | `controllers/creditoController.js` | `services/creditoService.js` | pg pool directo | ✅ | 3 capas completas |
| Movimientos | `routes/movimientos.js` | `controllers/movimientoController.js` | `services/movimientoService.js` | pg pool directo | ✅ | 3 capas completas |
| Dashboard | `routes/dashboard.js` | ❌ | ❌ | Prisma | ❌ | Queries en ruta + frontend |
| Notificaciones | `routes/notificaciones.js` | `controllers/notificacionController.js` | ❌ | Prisma | ❌ | Controller simple, frontend bypass |
| Configuración | `routes/configuracion.js` | ❌ | ❌ | Prisma | ❌ | Lógica en ruta |
| Auditoría | `routes/auditoria.js` | ❌ | ❌ | pg pool directo | ❌ | Lógica en ruta |
| WhatsApp | `routes/whatsapp.js` | ❌ | ❌ | Prisma | ❌ | Solo ruta |
| Solidaridad | `routes/solidaridad.js` | ❌ | ❌ | pg pool directo | ❌ | Solo ruta |
| Dividendos | ❌ | ❌ | ❌ | ❌ | ❌ | No existe backend |

### 2.2 Backend — Middleware Compartido

| Middleware | Archivo | Uso | Observaciones |
|-----------|---------|-----|--------------|
| Autenticación JWT | `middleware/auth.js` | Global en todas las rutas | Correcto |
| Roles | `middleware/auth.js` `requireRole()` | Selectivo por endpoint | Correcto |
| Auditoría | `middleware/audit.js` | Solo en socios, aportes, créditos | No se usa en movimientos, dashboard, auth |
| Manejo de errores | `middleware/errorHandler.js` | Global (Express error middleware) | Correcto, pero no hay logging estructurado |

### 2.3 Backend — Acceso a Datos (Dos Sistemas en Paralelo)

| Sistema | Archivo | Módulos que lo usan |
|---------|---------|---------------------|
| Prisma Client | `lib/prisma.js` (singleton) | auth, usuarios, dashboard, notificaciones, configuración, whatsapp |
| pg pool directo | `db/index.js` (pool PostgreSQL) | socios, aportes, créditos, movimientos, auditoría, solidaridad |

### 2.4 Backend — Mappings

| Archivo | Propósito |
|---------|-----------|
| `lib/mappings.js` | Traduce camelCase (Prisma/Service) a snake_case (Frontend) + transforma IDs (`id: documento`) |

Define 3 funciones: `mapSocio`, `mapAporte`, `mapCredito`.

### 2.5 Frontend — Estructura

| Archivo | Propósito |
|---------|-----------|
| `js/app.js` | Inicialización global, define `window.DB`, carga datos maestros, establece polling |
| `js/api.js` | Cliente HTTP con módulos por entidad (socios, aportes, trabajadores, auth) |
| `js/Chart.*.js` | Gráficos (Chart.js) |
| `js/export*` | Exportación a Excel/PDF |
| HTMLs individuales | Cada página carga su propio JS |

### 2.6 Frontend — Patrón de Datos

```
window.DB = {
  socios: [...],
  aportes: [...],
  creditos: [...],
  movimientos: [...],
  dividendos: [...],
  notificaciones: [...],
  configuracion: {...},
  dashboard: {...},
  ...
}
```

Cada página sobrescribe `window.DB` al cargar. `app.js` precarga datos con polling cada N segundos.

---

## 3. Clasificación de Módulos por Madurez Arquitectónica

| Nivel | Módulos | Cant. |
|-------|---------|-------|
| ✅ **Completa (3 capas)** | Socios, Aportes, Créditos, Movimientos | 4 |
| 🟠 **Parcial** | Notificaciones (ruta+controlador, sin servicio, frontend bypass), Auth, Usuarios, Configuración, Auditoría, WhatsApp, Solidaridad (ruta sola) | 8 |
| 🔴 **Inexistente** | Dividendos | 1 |

**Indicador:** Solo el 31% de los módulos backend (4/13) tienen una estructura de 3 capas completa.

---

## 4. Riesgos Técnicos

### RT-01: Doble Sistema de Acceso a Datos (Crítico)
- **Dónde:** `lib/prisma.js` (singleton Prisma) vs `db/index.js` (pg pool directo)
- **Impacto:** Inconsistencia en convenciones de nombrado (Prisma usa camelCase, SQL devuelve snake_case), dos sistemas de conexión, dos formas de hacer queries. Dificulta migraciones y mantenimiento.
- **Ejemplo:** `socioService.js` usa pg pool directo con SQL crudo → las columnas se aliasan manualmente. `auth` usa Prisma → los campos siguen convención del schema.

### RT-02: `window.DB` como Store Global (Crítico)
- **Dónde:** `js/app.js` línea ~40-80, todos los HTML/JS de páginas
- **Impacto:**
  - Mutación global sin control: cualquier script puede modificar cualquier dato
  - Sin aislamiento entre páginas: datos de una página contaminan otra
  - Exposición total en consola del navegador (seguridad)
  - Sin reactividad: cambios en `window.DB` no actualizan la UI automáticamente
  - Sin control de concurrencia: dos peticiones simultáneas pueden sobrescribirse

### RT-03: Lógica de Negocio en el Frontend (Crítico)
- **Dónde:** `dashboard.html`, `movimientos.html` (cálculos financieros), `reportes.html`
- **Impacto:**
  - Cálculos financieros (`total_recaudado`, balances, indicadores) ejecutados en el navegador
  - Manipulación directa de DOM para actualizar totales
  - Sin integridad transaccional: la suma de aportes en frontend puede diferir del backend
  - Auditabilidad nula: no hay registro centralizado de cálculos financieros

### RT-04: Validación de Datos Insuficiente (Alto)
- **Dónde:** Todos los controladores y rutas
- **Impacto:**
  - No hay esquemas de validación (Joi, Zod, express-validator)
  - Las validaciones existentes son manuales e inconsistentes
  - Tipos de datos no validados en frontera de API
  - SQL injection mitigado por parámetros, pero no hay sanitización de strings

### RT-05: Ausencia de Capa de Caché (Alto)
- **Dónde:** Dashboard (13 peticiones por carga), listados de socios, aportes, créditos
- **Impacto:**
  - Dashboard dispara ~13 consultas SQL en cada carga (ver auditoría dashboard)
  - Sin Redis, memorización, ni cache HTTP
  - Carga innecesaria en PostgreSQL para datos que cambian con baja frecuencia

### RT-06: Sin Estandarización de Respuestas API (Medio)
- **Dónde:**
  - Algunas respuestas usan `{ ok: true, datos: [...] }`
  - Otras usan `{ ok: true, data: [...] }`
  - Errores: a veces `{ ok: false, mensaje: "..." }`, a veces plain string
  - Códigos HTTP inconsistentes (200 vs 201 vs 400 vs 500)
- **Impacto:** El frontend debe manejar múltiples formatos de respuesta. Dificulta la creación de un cliente API genérico.

### RT-07: Eliminación Física sin Soft-Delete (Alto)
- **Dónde:** `socioService.delete()` usa `DELETE FROM socios WHERE id = $1`
- **Impacto:** Pérdida irreversible de datos. Al eliminar un socio se pierden sus referencias históricas. No hay posibilidad de recuperación.

### RT-08: Sin Manejo de Transacciones en Operaciones Multi-Tabla (Medio)
- **Dónde:** `socioService.create()`, `movimientoService.*` (múltiples queries)
- **Impacto:** Si una operación que afecta varias tablas falla a medio camino, los datos quedan inconsistentes. No se usa `BEGIN`/`COMMIT`/`ROLLBACK`.

### RT-09: Dependencia Directa de Frameworks sin Abstracción (Medio)
- **Dónde:** Controladores instancian servicios directamente, servicios usan pg pool directamente
- **Impacto:** Imposible hacer unit testing con mocks. No hay inyección de dependencias. Acoplamiento rígido a Express, pg, Prisma.

---

## 5. Riesgos Funcionales

### RF-01: Inconsistencia Estado Socio (Alto)
- **Dónde:** `socioService.listAll()` calcula estado moral en SQL, `socioController.perfil()` valida en backend, pero el frontend también puede mutar `socio.estado` directamente
- **Impacto:** Un socio puede aparecer "activo" en la lista pero "en mora" en otra vista, dependiendo de dónde se calcule el estado.

### RF-02: Sin Trazabilidad de Cambios de Estado (Alto)
- **Dónde:** No hay registro histórico de cambios de estado (socio: activo → mora → suspendido → retirado)
- **Impacto:** No se puede auditar cuándo ni por qué cambió el estado de un socio.

### RF-03: Cálculos Financieros no Atomicos (Alto)
- **Dónde:** Dashboard, movimientos, reportes
- **Impacto:** Los totales (`total_recaudado`, `saldo_pendiente`, `total_aportado`) se calculan en tiempo real sobre datos variables. Dos reportes generados al mismo tiempo pueden dar resultados distintos.

### RF-04: Sin Historial de Pagos por Cuota (Medio)
- **Dónde:** Modelo `credito` tiene `cuotas_pagadas` como contador, no como historial
- **Impacto:** No se puede determinar qué cuotas específicas fueron pagadas ni cuándo. Solo se sabe el total pagado.

---

## 6. Código Duplicado

| Patrón Duplicado | Archivos | Líneas Aprox. |
|-----------------|----------|---------------|
| SQL queries similares (SELECT con aliasing camelCase) | `socioService.js`, `aporteService.js`, `creditoService.js`, `movimientoService.js` | ~120 |
| Validación manual de campos requeridos | `socioController.js`, `aporteController.js`, `creditoController.js`, `movimientoController.js` | ~40 |
| Llamadas a `audit()` con patrón idéntico | `socioController.js`, `aporteController.js`, `creditoController.js` | ~15 |
| Transformación de datos (mappings) | `mappings.js` (consolidado, pero los servicios devuelven datos en formatos diversos) | ~73 |

**Observación:** Aunque `mappings.js` centraliza la transformación, los servicios no devuelven datos en un formato uniforme (unos usan Prisma, otros SQL crudo), lo que obliga a `mapSocio`, `mapAporte`, `mapCredito` a ser resilientes a múltiples formatos de entrada — duplicación lógica dentro de cada función.

---

## 7. Evaluación de Arquitectura

### 7.1 Clean Architecture (Evaluación: 🔴 No aplicada)

| Principio | Estado | Evidencia |
|-----------|--------|-----------|
| Independencia de frameworks | ❌ | Express, Prisma y pg directo están acoplados en todas las capas |
| Testabilidad | ❌ | No hay inyección de dependencias; los servicios instancian db directamente |
| Independencia de UI | ❌ | `window.DB` acopla frontend y backend; el frontend tiene lógica de negocio |
| Separación en capas | ⚠️ Parcial | 4 módulos tienen 3 capas (ruta → controlador → servicio); el resto mezcla |
| Los casos de uso no dependen de detalles | ❌ | Los servicios conocen la implementación de BD (pg pool, Prisma) |
| Los detalles dependen de los casos de uso | ❌ | No hay inversión de dependencias |

**Brecha crítica:** No existe una capa de dominio independiente. Las entidades de negocio están definidas en el schema de Prisma (capa de infraestructura) y en `mappings.js` (transformación ad-hoc). No hay puertos ni adaptadores.

### 7.2 Domain-Driven Design (Evaluación: 🔴 No aplicado)

| Concepto DDD | Estado | Evidencia |
|-------------|--------|-----------|
| Ubiquitous Language | ⚠️ Parcial | Términos del dominio (socio, aporte, crédito) usados consistentemente en nombres, pero no formalizados |
| Bounded Contexts | ❌ | No hay delimitación de contextos. Todo en una sola base de datos, un solo backend |
| Aggregates | ❌ | No hay raíces de agregado. Las relaciones se manejan mediante consultas SQL |
| Value Objects | ❌ | No hay objetos valor (monto, tasa, período no están tipados) |
| Domain Events | ❌ | No hay eventos de dominio |
| Repositories | ❌ | Los servicios acceden directamente a BD |
| Domain Services | ❌ | La lógica de negocio está en servicios de aplicación (o en frontend) |

### 7.3 Modularidad (Evaluación: 🟠 Inconsistente)

| Aspecto | Evaluación |
|---------|-----------|
| Estructura de directorios | 🟠 Consistente en 4 módulos, ausente en 9 |
| Separación de concerns | ⚠️ Los archivos de ruta contienen lógica de negocio en auth, usuarios, dashboard |
| Cohesión | 🟠 Los servicios mezclan lógica de aplicación con acceso a datos |
| Acoplamiento | 🔴 Frontend y backend acoplados mediante `window.DB` y formato de datos |
| Encapsulamiento | 🔴 `window.DB` expone todo globalmente |

### 7.4 Escalabilidad (Evaluación: 🔴 No escalable)

| Factor | Estado | Detalle |
|--------|--------|---------|
| Caché | ❌ | No hay; dashboard hace ~13 queries por carga |
| Conexiones BD | ⚠️ | pg pool con configuración básica, sin reconnect strategy |
| Stateless | ❌ | `window.DB` mantiene estado en el cliente que debe ser consistente |
| Horizontal scaling | ❌ | Sin sesiones distribuidas, sin caché compartida |
| Rate limiting | ❌ | No implementado |
| Paginación | ⚠️ | Solo algunos endpoints (`estadoCuenta`), otros devuelven datos completos |
| Compresión | ❌ | No hay compresión HTTP |
| CDN | ❌ | Assets estáticos servidos directamente por Express |

### 7.5 Multi-Tenancy (Evaluación: 🔴 No preparado)

| Requisito | Estado |
|-----------|--------|
| Aislamiento de datos por tenant | ❌ |
| Campo `tenant_id` en esquemas | ❌ |
| Middleware de resolución de tenant | ❌ |
| Base de datos por tenant | ❌ |
| Configuración por tenant | ❌ |

### 7.6 Preparación para Producción (Evaluación: 🔴 No apto)

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| Logging estructurado | ❌ | Solo `console.error` en error handler |
| Health checks | ❌ | No hay endpoint `/health` |
| Métricas/Monitoreo | ❌ | No hay |
| Manejo de errores global | ✅ | `errorHandler.js` captura errores, pero solo para Express |
| Validación de entrada | ❌ | Sin esquemas |
| CORS | ❌ | No configurado explícitamente |
| Helmet/seguridad HTTP | ❌ | No implementado |
| Variables de entorno | ⚠️ | Solo para BD, JWT, puerto |
| Migraciones automatizadas | ✅ | Prisma migrate |
| Seed data | ❌ | No hay seed script |
| Tests | ❌ | No se encontraron suites de prueba |
| CI/CD | ❌ | No hay pipelines |
| Documentación API | ❌ | No hay OpenAPI/Swagger |

---

## 8. Modelo de Datos

### 8.1 Modelos Prisma (14 modelos)

| Modelo | Propósito | Estado |
|--------|-----------|--------|
| `Socio` | Datos del socio | ✅ Definido |
| `Aporte` | Aportes sociales y pagos | ✅ Definido |
| `Credito` | Créditos | ✅ Definido |
| `Periodo` | Períodos contables | ✅ Definido |
| `Prestamo` | Préstamos (posiblemente duplicado con Crédito) | 🟠 Verificar |
| `Notificacion` | Notificaciones | ✅ Definido |
| `Configuracion` | Configuración del sistema | ✅ Definido |
| `Usuario` | Usuarios administrativos | ✅ Definido |
| `Auditoria` | Log de auditoría | ✅ Definido |
| `WhatsappMensaje` | Mensajes WhatsApp | ✅ Definido |
| `WhatsappPlantilla` | Plantillas WhatsApp | ✅ Definido |
| `Solidaridad` | Fondo de solidaridad | ✅ Definido |
| `SolidaridadMovimiento` | Movimientos de solidaridad | ✅ Definido |
| `Empresa` | Configuración de empresa | ✅ Definido |

### 8.2 Problemas Identificados en el Modelo

| Problema | Detalle |
|----------|---------|
| Dualidad Prisma + pg pool | El schema Prisma no es la fuente única de verdad; `socioService` usa SQL directo que puede desviarse |
| `ahorro_acumulado` como columna | Es un campo calculado que debería derivarse de los aportes |
| `cuotas_pagadas` como contador | Debería ser una tabla `PagoCuota` para trazabilidad |
| Sin `deleted_at` | Ningún modelo soporta soft-delete |
| Sin `tenant_id` | No hay preparación para multi-tenancy |
| `Prestamo` vs `Credito` | Dos modelos que parecen representar lo mismo |
| Sin `version` o `optimistic_lock` | No hay control de concurrencia optimista |

### 8.3 Índices

Archivo: `prisma/migration_indexes.sql` — contiene índices para búsquedas comunes. Se requiere verificar cobertura completa.

---

## 9. Reglas de Negocio

### 9.1 Ubicación Actual de las Reglas

| Regla de Negocio | Ubicación Actual | Debería Estar |
|-----------------|------------------|---------------|
| Estado del socio (mora/activo) | `socioService.js` SQL CASE + `socioController.perfil()` | Servicio/Dominio |
| Cálculo de totales financieros | Frontend (`dashboard.html`, `movimientos.html`) | Backend (Servicio) |
| Generación de código socio | `socioService.generarCodigoSocio()` | Servicio/Dominio ✅ |
| Generación de contraseña inicial | `socioService.generarPasswordInicial()` | Servicio/Dominio ✅ |
| Validación de duplicados (documento) | `socioController.create()` | Controlador + Servicio |
| Límites de crédito | No implementado explícitamente | Regla de dominio |
| Cálculo de intereses | No revisado | Regla de dominio |
| Períodos contables | En modelo `Periodo` | Servicio/Dominio |
| Reservas ($2,500,000 hardcodeadas) | `movimientos.html` | Configuración/Backend |

### 9.2 Problemas con Reglas de Negocio

1. **Dispersión:** Las reglas están repartidas entre frontend, backend y middleware
2. **Sin formalización:** No hay un lenguaje ubicuo ni documentación de reglas
3. **Hardcodeo de constantes financieras:** `$2,500,000` de reservas hardcodeado en frontend
4. **Sin pruebas:** No hay tests que validen reglas de negocio
5. **Duplicación potencial:** La regla de "estado del socio" se calcula en backend (SQL) pero el frontend también puede asignar estado directamente

---

## 10. KPIs Técnicos

| KPI | Valor | Objetivo | Estado |
|-----|-------|----------|--------|
| Módulos con 3 capas completas | 4/13 (31%) | 100% | 🔴 |
| Líneas de lógica financiera en frontend | ~150 (est.) | 0 | 🔴 |
| Sistemas de acceso a datos | 2 | 1 | 🟠 |
| Endpoints con validación de entrada | ~5% | 100% | 🔴 |
| Endpoints con auditoría | ~50% | 100% | 🟠 |
| Cobertura de pruebas | 0% | >80% | 🔴 |
| Endpoints documentados (OpenAPI) | 0% | 100% | 🔴 |
| Health checks | 0 | 1+ | 🔴 |
| Caché implementada | 0 capas | Al menos 1 | 🔴 |
| Soft-delete implementado | 0 modelos | Todos c/ datos históricos | 🔴 |

---

## 11. Trazabilidad

### 11.1 Estado Actual

| Aspecto | Estado |
|---------|--------|
| Middleware de auditoría | ✅ Implementado en `middleware/audit.js` |
| Uso en controladores | Solo en socios, aportes, créditos |
| Modelo `Auditoria` en Prisma | ✅ Definido |
| Registro de acciones de usuario | Parcial (faltan auth, dashboard, movimientos, notificaciones) |
| Correlation IDs | ❌ |
| Request logging (Morgan/winston) | ❌ |
| Logs estructurados | ❌ |

### 11.2 Problemas

- El middleware `audit.js` no se aplica globalmente (debería ser un wrapper de route o aplicarse en el router principal)
- No hay registro de `req.method`, `req.url`, duración, ni ID de correlación
- Sin diferenciación entre logs de aplicación, auditoría y errores

---

## 12. Recomendaciones

### Inmediatas (Prioridad Crítica)

| # | Recomendación | Esfuerzo | Impacto |
|---|--------------|----------|---------|
| R1 | **Unificar acceso a datos:** Elegir un solo ORM (Prisma) y migrar todos los módulos de pg pool a Prisma. Eliminar `db/index.js` | 2-3 semanas | Elimina RT-01 |
| R2 | **Eliminar `window.DB`:** Implementar un store reactivo (estado suscrito con eventos o un store simple con notificaciones) y eliminar el polling | 2 semanas | Elimina RT-02 |
| R3 | **Mover lógica financiera al backend:** Todos los cálculos de totales, balances e indicadores deben ser endpoints de API | 1-2 semanas | Elimina RT-03 |
| R4 | **Agregar validación con esquemas:** Implementar Zod o Joi en todas las rutas/controladores | 1 semana | Mitiga RT-04 |
| R5 | **Implementar soft-delete:** Agregar `deleted_at` a todos los modelos y cambiar `DELETE` por `UPDATE deleted_at = NOW()` | 3-5 días | Mitiga RT-07 |

### Corto Plazo (30 días)

| # | Recomendación | Esfuerzo | Impacto |
|---|--------------|----------|---------|
| R6 | **Estandarizar formato de respuesta API:** Crear helper `apiResponse.success()`, `apiResponse.error()` y aplicarlo en todos los endpoints | 2-3 días | Elimina RT-06 |
| R7 | **Agregar capa de caché:** Implementar Redis para datos maestros y endpoints de alta demanda (dashboard, listados) | 1-2 semanas | Mitiga RT-05 |
| R8 | **Middleware de transacciones:** Envolver operaciones multi-tabla en transacciones (Prisma `$transaction` o BEGIN/COMMIT) | 1 semana | Mitiga RT-08 |
| R9 | **Completar estructura de 3 capas:** Los 8 módulos con ruta sola deben tener controlador y servicio | 2-3 semanas | Mejora modularidad |
| R10 | **Implementar logging estructurado:** Morgan para HTTP, Winston para aplicación, correlation IDs | 3-5 días | Mejora trazabilidad |

### Mediano Plazo (60-90 días)

| # | Recomendación | Esfuerzo | Impacto |
|---|--------------|----------|---------|
| R11 | **Adoptar inyección de dependencias:** Desacoplar servicios de BD mediante interfaces/repositorios | 3-4 semanas | Clean Architecture |
| R12 | **Definir Bounded Contexts:** Separar módulos financieros (contabilidad, cartera) de sociales (socios, comunicaciones) | 2-3 semanas | DDD |
| R13 | **Agregar health checks:** Endpoint `/health` con estado de BD, caché, dependencias | 1 semana | Producción |
| R14 | **Implementar CI/CD:** GitHub Actions para lint, tests, build, deploy | 2 semanas | Producción |
| R15 | **Documentar API con OpenAPI:** Generar spec desde código o escribir manualmente | 2 semanas | Producción |

### Largo Plazo (90+ días)

| # | Recomendación | Esfuerzo | Impacto |
|---|--------------|----------|---------|
| R16 | **Migrar a Clean Architecture:** Separar dominio, aplicación, infraestructura en carpetas/npm workspaces | 2-3 meses | Arquitectura sostenible |
| R17 | **Agregar multi-tenancy:** Diseñar estrategia de aislamiento (columna `tenant_id` o BD separadas) | 1-2 meses | Escalabilidad |
| R18 | **Migrar frontend a framework moderno (React/Vue):** Eliminar dependencia de jQuery/vanilla JS, estado reactivo | 3-6 meses | Mantenibilidad |
| R19 | **Implementar event sourcing / CQRS** para módulo financiero | 2-3 meses | Trazabilidad financiera |

---

## 13. Plan de Migración — Arquitectura

### Fase 0: Estabilización (Semanas 1-4)

```
Semana 1:
  ├── R5: Soft-delete en todos los modelos
  ├── R6: Estandarizar formato de respuesta API
  └── R10: Logging estructurado (Morgan + Winston)

Semana 2:
  ├── R4: Validación con Zod en todos los endpoints
  └── R9: Completar estructura 3 capas (empezar por auth, usuarios)

Semana 3:
  ├── R1: Migrar pg pool → Prisma (socios, aportes)
  └── R8: Transacciones en operaciones multi-tabla

Semana 4:
  ├── R1: Migrar pg pool → Prisma (créditos, movimientos, auditoría, solidaridad)
  ├── R2: Store reactivo (eliminar window.DB gradualmente)
  └── R3: Mover cálculos financieros al backend
```

### Fase 1: Consolidación (Semanas 5-12)

```
Semanas 5-8:
  ├── R7: Redis caché
  ├── R11: Inyección de dependencias + repositorios
  └── R13: Health checks + métricas

Semanas 9-12:
  ├── R14: CI/CD (GitHub Actions)
  ├── R15: OpenAPI docs
  └── R12: Bounded Contexts (separación financiero / social)
```

### Fase 2: Modernización (Semanas 13+)

```
Semanas 13-24:
  ├── R16: Clean Architecture (migración progresiva)
  └── R18: Evaluar framework frontend (prototipo React/Vue)

Semanas 25-36:
  ├── R17: Multi-tenancy
  └── R19: Event sourcing financiero
```

---

## 14. Conclusión

**Clasificación final: 🔴 No apto para producción**

FONEVI presenta una **crisis arquitectónica silenciosa**. Aunque el sistema funciona y cumple necesidades operativas inmediatas, su estructura interna tiene fragilidades que lo hacen insostenible a mediano plazo:

1. **Dos sistemas de acceso a datos compitiendo** (Prisma vs pg pool) que imponen mantenimiento duplicado y convenciones inconsistentes.

2. **`window.DB` como antipatrón global** que rompe el encapsulamiento, expone datos sensibles e impide cualquier estrategia de estado predecible.

3. **Lógica financiera en la capa de presentación**, lo que constituye un riesgo de integridad y auditabilidad inaceptable para un sistema financiero.

4. **Falta de homogeneidad arquitectónica**: solo el 31% de los módulos siguen un patrón de capas consistente.

5. **Sin preparación para producción**: no hay tests, caché, logging estructurado, health checks, CI/CD, ni documentación.

La deuda técnica acumulada es abordable mediante un plan estructurado de 3 fases (~9-12 meses). Sin embargo, **los riesgos RT-01, RT-02 y RT-03 deben abordarse de inmediato** (primeras 4 semanas) para evitar incidentes de integridad de datos y seguridad. El sistema no debería promoverse a producción sin antes mitigar al menos estos tres riesgos críticos.

**Veredicto:** FONEVI debe detener el desarrollo de nuevas funcionalidades y dedicar un sprint completo (4-6 semanas) a la estabilización arquitectónica antes de considerar cualquier nuevo feature.
