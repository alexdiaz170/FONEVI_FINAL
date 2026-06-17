# Plan de Acción — Transformación de FONEVI a Arquitectura Limpia y Sostenible

> **Arquitecto:** Senior (20+ años en sistemas financieros)  
> **Estrategia:** Strangler Fig — reemplazar piezas gradualmente sin detener el sistema  
> **Horizonte:** 12 meses  
> **Socios actuales:** ~70 · **Proyección:** 500+ en 3 años, 2000+ en 5 años  

---

## Índice

1. [Arquitectura Objetivo](#1-arquitectura-objetivo)
2. [Hoja de Ruta por Fases](#2-hoja-de-ruta-por-fases)
3. [Fase 0 — Cimientos (Semanas 1-4)](#3-fase-0--cimientos-semanas-1-4)
4. [Fase 1 — Migración del Backend (Semanas 5-16)](#4-fase-1--migración-del-backend-semanas-5-16)
5. [Fase 2 — Frontend Moderno (Semanas 17-32)](#5-fase-2--frontend-moderno-semanas-17-32)
6. [Fase 3 — Consolidación y Escalado (Semanas 33-48)](#6-fase-3--consolidación-y-escalado-semanas-33-48)
7. [Recomendaciones Técnicas Específicas](#7-recomendaciones-técnicas-específicas)
8. [Riesgos y Mitigaciones](#8-riesgos-y-mitigaciones)

---

## 1. Arquitectura Objetivo

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│  React + TypeScript + Vite + TanStack Query             │
│  Estado: Zustand · UI: Tailwind + Radix UI              │
│  Testing: Vitest + Playwright                           │
├─────────────────────────────────────────────────────────┤
│                      API GATEWAY                        │
│  Express + OpenAPI · Zod validación                     │
│  Rate limiting · Helmet · CORS · Morgan + Winston       │
├─────────────────────────────────────────────────────────┤
│              CAPA DE APLICACIÓN (Use Cases)              │
│  CrearSocioUseCase, ProcesarAporteUseCase,              │
│  SolicitarCreditoUseCase, CalcularInteresesUseCase...   │
├─────────────────────────────────────────────────────────┤
│               CAPA DE DOMINIO (Core)                    │
│  Entities: Socio, Aporte, Credito, Movimiento           │
│  Value Objects: Email, Telefono, Monto, TasaInteres     │
│  Domain Services: CalculadorIntereses, GeneradorCodigo  │
│  Repository Interfaces: ISocioRepo, IAporteRepo...      │
├─────────────────────────────────────────────────────────┤
│           CAPA DE INFRAESTRUCTURA                       │
│  Persistencia: Prisma (único ORM) · PostgreSQL          │
│  Externo: WhatsApp API client, PDF generator            │
│  Caché: Redis (dashboard, listados frecuentes)          │
├─────────────────────────────────────────────────────────┤
│                INFRAESTRUCTURA COMPARTIDA                │
│  Docker · GitHub Actions · Health checks                │
│  Logging: Winston · Monitoreo: Sentry/Basic             │
└─────────────────────────────────────────────────────────┘
```

### Stack Tecnológico Definitivo

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Frontend | React 18 + TypeScript + Vite | Ecosistema maduro, tipado, testable |
| Estado | Zustand + TanStack Query | Simple y reactivo, elimina `window.DB` |
| UI | Tailwind CSS + Radix UI | Rápido de prototipar, accesible |
| Backend | Node.js + Express + TypeScript | Ya usan Node, evita reescritura total |
| ORM | Prisma (único) | Ya lo tienen, abandonar pg pool directo |
| Validación | Zod | Schemas compartibles frontend/backend |
| Caché | Redis | Dashboard, listados, sesiones |
| Testing | Vitest + Playwright | Rápido, moderno, E2E |
| CI/CD | GitHub Actions + Docker | Estándar industria |
| Monorepo | Turborepo | Un solo repo, múltiples paquetes |

---

## 2. Hoja de Ruta por Fases

| Fase | Duración | Semanas | Entrega |
|------|----------|---------|---------|
| **0 — Cimientos** | 1 mes | 1-4 | Monorepo, CI/CD, infraestructura base, primer módulo (Auth) |
| **1 — Backend Limpio** | 3 meses | 5-16 | Todos los módulos backend refactorizados con Clean Architecture |
| **2 — Frontend Moderno** | 4 meses | 17-32 | Migración completa a React, eliminación de `window.DB` |
| **3 — Escalado** | 4 meses | 33-48 | Multi-tenancy, rendimiento, monitoreo, documentación |

**Durante todo el proceso:** El sistema antiguo sigue funcionando. Cada sprint migra un módulo completo y lo pone en producción.

---

## 3. Fase 0 — Cimientos (Semanas 1-4)

### Sprint 0.1: Monorepo y Tooling (Semana 1)

| Día | Tarea | Archivos involucrados | Criterio de éxito |
|-----|-------|----------------------|-------------------|
| 1 | Crear estructura Turborepo: `packages/backend`, `packages/frontend`, `packages/shared` | Nuevo repo | `npm run build` compila ambos paquetes |
| 2 | Configurar TypeScript en backend y shared | `tsconfig.json`, `packages/shared/tsconfig.json` | `tsc --noEmit` sin errores |
| 3 | Configurar ESLint + Prettier + Husky + lint-staged | `.eslintrc.cjs`, `.prettierrc`, `.husky/` | Un commit con error de lint se rechaza |
| 4 | Configurar Vitest en backend | `vitest.config.ts` | Primer test (`1+1=2`) pasa |
| 5 | Configurar GitHub Actions: lint → test → build | `.github/workflows/ci.yml` | Push a main dispara pipeline verde |

### Sprint 0.2: Infraestructura Backend (Semana 2)

| Día | Tarea | Archivos involucrados | Criterio de éxito |
|-----|-------|----------------------|-------------------|
| 1 | Dockerizar backend y frontend por separado | `Dockerfile.backend`, `Dockerfile.frontend`, `docker-compose.yml` | `docker compose up` levanta todo |
| 2 | Agregar Winston (logging estructurado) | `packages/backend/src/infrastructure/logging/logger.ts` | Logs con timestamp, nivel, correlación ID |
| 3 | Agregar Morgan para HTTP logging | `packages/backend/src/api/middleware/httpLogging.ts` | Cada request se loguea con método, URL, status, duración |
| 4 | Agregar Helmet + CORS configurado + rate limiting | `packages/backend/src/api/middleware/security.ts` | `curl -I` muestra headers de seguridad |
| 5 | Agregar Health check endpoint | `packages/backend/src/api/routes/health.ts` | `GET /health` devuelve `{ status: "ok", db: true }` |

### Sprint 0.3: Arquitectura Base Backend (Semana 3)

| Día | Tarea | Archivos involucrados | Criterio de éxito |
|-----|-------|----------------------|-------------------|
| 1 | Crear estructura de carpetas Clean Architecture | `packages/backend/src/{domain,application,infrastructure,api,config}` | Estructura definida |
| 2 | Migrar `prisma` a `packages/shared` y compartir schema | `packages/shared/prisma/schema.prisma` | Backend y scripts seed usan el mismo schema |
| 3 | Implementar `BaseRepository` con Prisma | `packages/backend/src/infrastructure/persistence/BaseRepository.ts` | CRUD genérico funcional |
| 4 | Implementar sistema de errores (ValueObject.Error, DomainError, AppError) | `packages/backend/src/domain/errors.ts`, `packages/backend/src/application/errors.ts` | Errores tipados con código y mensaje |
| 5 | Estandarizar respuesta API con helper | `packages/backend/src/api/response.ts` | `apiResponse.success(data)`, `apiResponse.error(err)` en toda respuesta |

### Sprint 0.4: Primer Módulo — Auth (Semana 4)

| Día | Tarea | Archivos involucrados | Criterio de éxito |
|-----|-------|----------------------|-------------------|
| 1 | Crear entidad `Usuario` con Value Objects (`Email`, `Password`) | `packages/backend/src/domain/entities/Usuario.ts`, `packages/shared/src/value-objects/Email.ts` | Entidad con validación de email |
| 2 | Crear `IUsuarioRepository` interface | `packages/backend/src/domain/repositories/IUsuarioRepository.ts` | Interfaz con métodos definidos |
| 3 | Crear `PrismaUsuarioRepository` | `packages/backend/src/infrastructure/persistence/PrismaUsuarioRepository.ts` | Implementación concreta |
| 4 | Crear Use Cases: `LoginUseCase`, `RegistrarUsuarioUseCase` | `packages/backend/src/application/use-cases/auth/` | Casos de uso con tests |
| 5 | Crear AuthController + AuthRoutes con validación Zod | `packages/backend/src/api/controllers/authController.ts`, `packages/backend/src/api/routes/auth.ts` | `POST /auth/login` funciona con validación |
| 6 | Agregar refresh token + rotación | `packages/backend/src/domain/entities/RefreshToken.ts` | Token expira, refresh token lo renueva |
| 7 | **HITO: Auth funciona con Clean Architecture + tests** | — | Login, registro, refresh token — todo testeado |

---

## 4. Fase 1 — Migración del Backend (Semanas 5-16)

Cada sprint de esta fase sigue el mismo patrón:
1. Definir entidad + value objects → 2. Interfaz repositorio → 3. Prisma repositorio → 4. Use cases → 5. Controller + Routes + Zod → 6. Tests → 7. Reemplazar ruta antigua en `app.js`

### Sprint 1.1: Módulo Socios (Semana 5-6)

| Tarea | Esfuerzo | Archivos clave |
|-------|----------|---------------|
| Entidad `Socio` con VO: `Email`, `Telefono`, `TipoDocumento`, `EstadoSocio` | 1 día | `domain/entities/Socio.ts` |
| `ISocioRepository` + `PrismaSocioRepository` | 2 días | `domain/repositories/`, `infrastructure/persistence/` |
| Use Cases: `CrearSocioUseCase`, `ActualizarSocioUseCase`, `ObtenerSocioUseCase`, `ListarSociosUseCase`, `EliminarSocioUseCase` | 3 días | `application/use-cases/socios/` |
| Domain Service: `GeneradorCodigoSocio` + `GeneradorPasswordInicial` | 1 día | `domain/services/GeneradorCodigoSocio.ts` |
| Controller + Routes + Zod validation | 2 días | `api/controllers/socioController.ts`, `api/routes/socios.ts` |
| Tests unitarios (use cases) + tests de integración (repo) | 2 días | `tests/unit/use-cases/socios/`, `tests/integration/repositories/` |
| **Reemplazar ruta antigua en app.js** | 1 día | `backend/src/app.js` → redirigir a nueva ruta |
| Soft-delete en `Socio` (campo `deletedAt`) | 1 día | Schema Prisma + `EliminarSocioUseCase` usa `update({deletedAt: now()})` |

**Problemas específicos que resuelve:**
- ❌ `socioController.perfil()` con código duplicado de validación de estado → **VO `EstadoSocio` con métodos `puedeSolicitarCredito()`**
- ❌ `ahorro_acumulado` como campo calculado no persistido correctamente → **derivado de aportes vía query**
- ❌ Eliminación física → **soft-delete con `deletedAt`**

### Sprint 1.2: Módulo Aportes (Semana 7-8)

| Tarea | Esfuerzo | Archivos clave |
|-------|----------|---------------|
| Entidad `Aporte` + `Periodo` con VO: `Monto`, `EstadoAporte` | 1 día | `domain/entities/Aporte.ts`, `domain/entities/Periodo.ts` |
| `IAporteRepository` + `IPeriodoRepository` + Prisma impl | 2 días | `domain/repositories/` |
| Use Cases: `RegistrarAporteUseCase`, `ActualizarEstadoAporteUseCase`, `ListarAportesUseCase` | 3 días | `application/use-cases/aportes/` |
| Controller + Routes + Zod | 2 días | `api/controllers/aporteController.ts` |
| Tests | 2 días | `tests/` |
| Reemplazar ruta antigua | 1 día | `app.js` |

**Resuelve:**
- ❌ Doble acceso a datos (Prisma + pg pool) → **solo Prisma**
- ❌ `referencia` enviada pero ignorada → **mapeada en entidad**
- ❌ Sin transacción en cambios de estado → **`prisma.$transaction()`**

### Sprint 1.3: Módulo Créditos (Semana 9-10)

| Tarea | Esfuerzo | Archivos clave |
|-------|----------|---------------|
| Entidad `Credito` + `PagoCuota` (nuevo modelo) con VO: `TasaInteres`, `Cuotas`, `Saldo` | 2 días | `domain/entities/Credito.ts`, `domain/entities/PagoCuota.ts` |
| Domain Service: `CalculadorCuota` (francés), `CalculadorInteresesMora` | 2 días | `domain/services/calculosCredito.ts` |
| `ICreditoRepository` + `IPagoCuotaRepository` + Prisma | 2 días | `domain/repositories/` |
| Use Cases: `SolicitarCreditoUseCase`, `AprobarCreditoUseCase`, `PagarCuotaUseCase`, `ListarCreditosUseCase` | 3 días | `application/use-cases/creditos/` |
| Controller + Routes + Zod | 2 días | `api/controllers/creditoController.ts` |
| Tests | 2 días | `tests/` |
| **HITO: Endpoint `POST /creditos/solicitar`** — conecta con el simulador de Mi Cuenta | 1 día | Reemplaza Toast falso |

**Nuevo modelo `PagoCuota` en Prisma:**

```prisma
model PagoCuota {
  id        String   @id @default(uuid())
  creditoId String   @map("credito_id")
  numeroCuota Int   @map("numero_cuota")
  monto     Decimal  @db.Decimal(15,2)
  montoCapital Decimal @map("monto_capital") @db.Decimal(15,2)
  montoInteres Decimal @map("monto_interes") @db.Decimal(15,2)
  fechaPago DateTime @map("fecha_pago")
  createdAt DateTime @default(now()) @map("created_at")
  credito   Credito  @relation(fields: [creditoId], references: [id])

  @@index([creditoId])
  @@map("pago_cuotas")
}
```

**Resuelve:**
- ❌ `cuotas_pagadas` como contador sin historial → **tabla `PagoCuota`**
- ❌ Simulador de crédito falso → **endpoint real**

### Sprint 1.4: Módulo Dashboard + Movimientos (Semana 11-12)

| Tarea | Esfuerzo | Archivos clave |
|-------|----------|---------------|
| Use Case: `ObtenerResumenDashboardUseCase` — una sola query con todos los KPIs | 2 días | `application/use-cases/dashboard/` |
| Controller + Route `GET /dashboard/resumen` | 1 día | `api/controllers/dashboardController.ts` |
| **Mover los 13 KPIs al backend** (hoy se calculan en frontend) | 3 días | DashboardService |
| Entidad `Movimiento` (contabilidad) con clasificación contable | 1 día | `domain/entities/Movimiento.ts` |
| Domain Service: `CalculadorBalanceGeneral` — corrige error de duplicación de `totalAhorros` | 1 día | `domain/services/contabilidad.ts` |
| Use Cases movimientos: `RegistrarMovimientoUseCase`, `ObtenerBalanceUseCase` | 2 días | `application/use-cases/movimientos/` |
| Tests | 2 días | `tests/` |

**Resuelve:**
- ❌ Dashboard con 13 peticiones → **1 sola query con `Promise.all` o query optimizada**
- ❌ Balance General duplica `totalAhorros` → **corregido en `CalculadorBalanceGeneral`**
- ❌ Reservas hardcodeadas $2,500,000 → **desde configuración en BD**
- ❌ Sin caché → **Redis para dashboard (TTL: 5 minutos)**

### Sprint 1.5: Módulos Secundarios (Semana 13-14)

| Módulo | Tareas |
|--------|--------|
| **WhatsApp** | `WhatsAppService` (fuera del router), webhook Meta, cola con rate limiting, reintentos con backoff, template management desde BD |
| **Notificaciones** | Completar backend (POST), conectar frontend a API real, eliminar manipulación directa de `window.DB.notificaciones` |
| **Solidaridad** | Entidad `SolidaridadMovimiento`, use cases, controller |

### Sprint 1.6: Módulos Finales Backend (Semana 15-16)

| Módulo | Tareas |
|--------|--------|
| **Mora** | `MoraService` con cálculos desde el servidor, `AcuerdoPago` model, endpoint `GET /mora`, historial de cambios de estado |
| **Dividendos** | Modelo `Dividendo` + `DividendoSocio`, use cases, controller. Fin del `window.DB.dividendos` |
| **Configuración** | Use cases para gestionar config desde API |
| **Auditoría** | Middleware de auditoría global (wrapper automático para endpoints CRUD) |

---

## 5. Fase 2 — Frontend Moderno (Semanas 17-32)

### Sprint 2.0: Setup Frontend (Semana 17)

| Día | Tarea | Criterio de éxito |
|-----|-------|-------------------|
| 1 | Crear `packages/frontend` con React + Vite + TypeScript | `npm run dev` abre app React en localhost |
| 2 | Configurar Tailwind CSS + Radix UI + tema FONEVI | Paleta navy/gold aplicada |
| 3 | Configurar TanStack Query + Zustand | Store vacío, queryClient configurado |
| 4 | Configurar React Router v6 con lazy loading | Rutas definidas |
| 5 | Configurar Vitest + React Testing Library + Playwright | `npm test` funciona |
| 6 | Crear layout base (Sidebar + Topbar + Content) con roles dinámicos | Layout se adapta al rol del usuario |
| 7 | **HITO: Frontend vacío pero funcional con navegación** | Se puede navegar entre secciones (contenido placeholder) |

### Sprint 2.1: Auth + Login (Semana 18)

| Tarea | Esfuerzo |
|-------|----------|
| Página Login con validación Zod en frontend | 2 días |
| Auth context con JWT + refresh token automático | 2 días |
| ProtectedRoute componente por rol | 1 día |
| Reemplazar `index.html` + `auth.js` | 1 día |
| Tests E2E con Playwright (login feliz + login fallido) | 1 día |

### Sprint 2.2: Socios en React (Semana 19-20)

| Tarea | Esfuerzo |
|-------|----------|
| Página Lista de Socios con TanStack Query + paginación | 3 días |
| Página Crear Socio con formulario Zod | 2 días |
| Página Editar Socio | 2 días |
| Página Perfil Socio (antes `perfil.html`) | 3 días |
| **Eliminar `perfil.html` y redirigir a React** | 1 día |
| Tests (componentes + flujo) | 2 días |

### Sprint 2.3: Aportes en React (Semana 21-22)

| Tarea | Esfuerzo |
|-------|----------|
| Página Lista de Aportes con filtros (estado, período, socio) | 3 días |
| Página Registrar Aporte | 2 días |
| Modal cambio de estado con confirmación | 1 día |
| **Eliminar `aportes.html`** | 1 día |
| Tests | 2 días |

### Sprint 2.4: Créditos en React (Semana 23-24)

| Tarea | Esfuerzo |
|-------|----------|
| Página Lista de Créditos | 2 días |
| Página Crear Crédito (formulario wizard) | 3 días |
| Página Detalle Crédito con tabla de amortización real | 3 días |
| **Simulador de crédito conectado a `POST /creditos/solicitar`** | 2 días |
| **Eliminar `creditos.html`** | 1 día |
| Tests | 2 días |

### Sprint 2.5: Mi Cuenta en React (Semana 25-26)

| Tarea | Esfuerzo |
|-------|----------|
| Página Mi Cuenta (antes `mi-cuenta.html`) con datos desde API | 3 días |
| Hero con saldo, estado, antigüedad | 1 día |
| Tarjeta de crédito activo con progreso | 1 día |
| Historial de aportes con timeline | 2 días |
| Simulador de crédito integrado (sin Toast falso) | 2 días |
| **Eliminar `mi-cuenta.html`** | 1 día |
| Tests | 2 días |

### Sprint 2.6: Dashboard en React (Semana 27-28)

| Tarea | Esfuerzo |
|-------|----------|
| Dashboard con datos desde `GET /dashboard/resumen` | 3 días |
| Gráficos con Chart.js en React (donut, tendencia, barras) | 3 días |
| Alertas de mora, créditos vencidos, notificaciones | 2 días |
| **Eliminar `dashboard.html`** | 1 día |
| Tests | 2 días |

### Sprint 2.7: Módulos Restantes en React (Semana 29-30)

| Página | Reemplaza a |
|--------|------------|
| Panel de Mora | `panel-mora.html` |
| WhatsApp | `whatsapp-panel.html` |
| Notificaciones | (dropdown global en layout) |
| Panel de Configuración | (nuevo, antes no había UI) |
| Reportes | `reportes.html` |
| Dividendos | `dividendos.html` |

### Sprint 2.8: Eliminación de `window.DB` (Semana 31-32)

| Tarea | Esfuerzo |
|-------|----------|
| Verificar que ninguna página legacy usa `window.DB` | 1 día |
| Eliminar `js/app.js` — precarga y polling | 1 día |
| Eliminar `window.DB` y `window.DataHelper` | 1 día |
| Migrar roles a React context | 2 días |
| Search global con TanStack Query | 2 días |
| **HITO: `window.DB` eliminado del código base** | — |
| Pruebas E2E completas de toda la app | 3 días |

---

## 6. Fase 3 — Consolidación y Escalado (Semanas 33-48)

### Sprint 3.1: Multi-tenancy (Semana 33-36)

| Tarea | Esfuerzo |
|-------|----------|
| Diseñar estrategia de aislamiento (columna `tenantId` vs BD separadas) | 1 semana |
| Recomendación: **columna `tenantId`** para 500-2000 socios (más simple, un solo pool de conexiones) | — |
| Agregar `tenantId` a todos los modelos Prisma | 1 semana |
| Middleware de resolución de tenant (subdominio o header) | 1 semana |
| Migrar datos existentes al tenant por defecto | 3 días |
| Tests de aislamiento multi-tenant | 3 días |

### Sprint 3.2: Rendimiento (Semana 37-40)

| Tarea | Esfuerzo |
|-------|----------|
| Redis para caché de dashboard (TTL 5 min), listados (TTL 1 min) | 1 semana |
| Paginación en todos los listados | 1 semana |
| Compresión HTTP (compression middleware) | 1 día |
| Lazy loading en rutas de React | 2 días |
| Code splitting por página | 2 días |
| Auditoría de queries N+1 en Prisma | 3 días |
| Pruebas de carga con k6 (simular 200 socios concurrentes) | 1 semana |

### Sprint 3.3: Monitoreo y Operaciones (Semana 41-44)

| Tarea | Esfuerzo |
|-------|----------|
| Sentry o similar para errores en producción | 3 días |
| Métricas de negocio (socios activos, aportes del mes, mora) expuestas como endpoint | 2 días |
| Dashboard de monitoreo interno (uptime, errores, lentitud) | 1 semana |
| Alertas automáticas: porcentaje de mora > X%, errores 5xx > umbral | 1 semana |
| Backup automático de BD + pruebas de restauración | 3 días |
| Runbook de operaciones (cómo deployar, cómo restaurar, cómo escalar) | 1 semana |

### Sprint 3.4: Documentación y Finalización (Semana 45-48)

| Tarea | Esfuerzo |
|-------|----------|
| OpenAPI/Swagger completo de todos los endpoints | 2 semanas |
| README con instrucciones de desarrollo, deploy, operación | 3 días |
| Manual de usuario para administradores y socios | 1 semana |
| Post-mortem de la migración (qué funcionó, qué no) | 2 días |
| **HITO: FONEVI 2.0 listo para producción** | — |

---

## 7. Recomendaciones Técnicas Específicas

### 7.1 Gestión del Código Legacy Durante la Migración

```
/
├── packages/
│   ├── backend/          ← NUEVO (TypeScript, Clean Architecture)
│   │   └── src/
│   │       ├── domain/
│   │       ├── application/
│   │       ├── infrastructure/
│   │       ├── api/
│   │       └── config/
│   ├── frontend/         ← NUEVO (React + Vite + TypeScript)
│   │   └── src/
│   │       ├── components/
│   │       ├── pages/
│   │       ├── hooks/
│   │       └── stores/
│   ├── shared/           ← COMPARTIDO (schemas Zod, tipos TypeScript)
│   │   └── src/
│       ├── value-objects/
│       └── schemas/
├── backend/              ← LEGADO (se elimina progresivamente)
├── pages/                ← LEGADO (se elimina progresivamente)
├── js/                   ← LEGADO (se elimina progresivamente)
└── css/                  ← LEGADO (se elimina progresivamente)
```

**Regla:** El código legacy se elimina **inmediatamente** después de que el nuevo módulo pasa todas las pruebas E2E en producción.

### 7.2 Value Objects Esenciales

```typescript
// packages/shared/src/value-objects/Monto.ts
class Monto {
  private constructor(private readonly valor: number) {
    if (valor < 0) throw new DomainError('El monto no puede ser negativo');
    if (!Number.isFinite(valor)) throw new DomainError('Monto inválido');
  }
  static create(valor: number): Monto { return new Monto(valor); }
  get value(): number { return this.valor; }
  sumar(otro: Monto): Monto { return new Monto(this.valor + otro.valor); }
  multiplicar(por: number): Monto { return new Monto(this.valor * por); }
  esMayorQue(otro: Monto): boolean { return this.valor > otro.valor; }
}

// packages/shared/src/value-objects/Email.ts
class Email {
  private static readonly REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private constructor(readonly value: string) {
    if (!Email.REGEX.test(value)) throw new DomainError('Email inválido');
  }
  static create(value: string): Email { return new Email(value.toLowerCase().trim()); }
}
```

### 7.3 Flujo de Use Case Típico

```typescript
// packages/backend/src/application/use-cases/socios/CrearSocioUseCase.ts
class CrearSocioUseCase {
  constructor(
    private readonly socioRepo: ISocioRepository,
    private readonly generadorCodigo: GeneradorCodigoSocio,
    private readonly generadorPassword: GeneradorPasswordInicial,
    private readonly emailService?: IEmailService,
  ) {}

  async execute(dto: CrearSocioDTO): Promise<Socio> {
    // 1. Validar negocio
    const email = Email.create(dto.email);
    const documento = Documento.create(dto.tipoDocumento, dto.numeroDocumento);

    const existente = await this.socioRepo.findByDocumento(documento);
    if (existente) throw new DomainError('Ya existe un socio con este documento');

    // 2. Crear entidad
    const codigo = await this.generadorCodigo.generar();
    const password = this.generadorPassword.generar(documento);

    const socio = Socio.create({
      codigo,
      nombre: dto.nombre,
      documento,
      email,
      telefono: dto.telefono ? Telefono.create(dto.telefono) : undefined,
      fechaIngreso: new Date(),
      aporteMensual: Monto.create(dto.aporteMensual),
      estado: EstadoSocio.ACTIVO,
    });

    // 3. Persistir
    const creado = await this.socioRepo.save(socio, password);

    // 4. Efectos secundarios
    // await this.emailService?.enviarBienvenida(creado.email, creado.nombre);

    return creado;
  }
}
```

### 7.4 Esquema de Validación Compartido (Zod)

```typescript
// packages/shared/src/schemas/socio.ts
const crearSocioSchema = z.object({
  nombre: z.string().min(3).max(200),
  tipoDocumento: z.enum(['CC', 'CE', 'NIT']),
  numeroDocumento: z.string().min(5).max(20),
  email: z.string().email(),
  telefono: z.string().regex(/^\d{7,10}$/).optional(),
  aporteMensual: z.number().positive(),
});

type CrearSocioDTO = z.infer<typeof crearSocioSchema>;
```

### 7.5 Prisma Schema Final (Eliminando pg pool)

```prisma
// packages/shared/prisma/schema.prisma — fragmento
model Socio {
  id              String    @id @default(uuid())
  tenantId        String    @map("tenant_id")
  codigoSocio     String    @unique @map("codigo_socio")
  nombre          String
  tipoDocumento   String    @map("tipo_documento")
  numeroDocumento String    @map("numero_documento")
  email           String    @unique
  telefono        String?
  fechaIngreso    DateTime  @map("fecha_ingreso")
  aporteMensual   Decimal   @map("aporte_mensual") @db.Decimal(15,2)
  estado          String    @default("activo")
  deletedAt       DateTime? @map("deleted_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  // Auth
  passwordHash    String?   @map("password_hash")
  ultimoLogin     DateTime? @map("ultimo_login")
  // Preferencias
  preferencias    Json?     // color_avatar, tema, notificaciones
  // Relaciones
  aportes         Aporte[]
  creditos        Credito[]
  acuerdos        AcuerdoPago[]
  solicitudes     SolicitudCredito[]

  @@index([tenantId, estado])
  @@index([tenantId, numeroDocumento])
  @@map("socios")
}
```

---

## 8. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| **El sistema legacy deja de funcionar durante la migración** | Baja | Crítico | Strangler Fig: el antiguo sigue funcionando hasta que el nuevo pase todas las pruebas |
| **Pérdida de datos en migración** | Media | Crítico | Scripts de migración con rollback, pruebas en staging con copia exacta de datos |
| **El equipo no se adapta a TypeScript/Clean Architecture** | Alta | Alto | Pair programming inicial, code reviews obligatorios, documentación de patrones |
| **Subestimación del esfuerzo frontend** | Alta | Alto | React con componentes atómicos (Radix UI), empezar por las páginas más críticas (Login, Socios) |
| **Los socios se resisten al cambio de UI** | Media | Medio | Migración gradual: el nuevo frontend coexiste con el viejo, se activa por rol |
| **Deuda técnica de las auditorías no se prioriza** | Alta | Alto | Las correcciones de las auditorías (Mentiras del sistema, Balance General) son requisito obligatorio del Sprint 0 |
| **Crecimiento repentino de socios (>500)** | Baja | Alto | Multi-tenancy planificado desde el inicio (Fase 3). Redis y paginación desde Fase 1. |

---

## Resumen Ejecutivo del Plan

```
FASE 0 — CIMIENTOS (4 semanas)
├── Monorepo + TypeScript + CI/CD
├── Docker + Winston + Helmet + CORS + Rate limiting
├── Clean Architecture base + Zod + errores tipados
└── ✅ Auth refactorizado con tests

FASE 1 — BACKEND LIMPIO (12 semanas)
├── Sem 5-6:   Socios (soft-delete, VO, tests)
├── Sem 7-8:   Aportes (transacciones, periodo)
├── Sem 9-10:  Créditos (PagoCuota, simulador real)
├── Sem 11-12: Dashboard (1 query) + Movimientos (balance corregido)
├── Sem 13-14: WhatsApp real + Notificaciones + Solidaridad
└── Sem 15-16: Mora backend + Dividendos + Config + Auditoría global

FASE 2 — FRONTEND REACT (16 semanas)
├── Sem 17:    Setup React + Tailwind + Router
├── Sem 18:    Login + Auth context + ProtectedRoute
├── Sem 19-20: Socios (lista, crear, editar, perfil)
├── Sem 21-22: Aportes
├── Sem 23-24: Créditos + Simulador real
├── Sem 25-26: Mi Cuenta
├── Sem 27-28: Dashboard
├── Sem 29-30: Resto (Mora, WhatsApp, Config, Reportes, Dividendos)
└── Sem 31-32: Eliminar window.DB + pruebas E2E finales

FASE 3 — ESCALADO (16 semanas / opcional año 2)
├── Multi-tenancy
├── Redis + rendimiento
├── Monitoreo + alertas
└── Documentación + OpenAPI
```

**Total: 32 semanas (~8 meses) para un sistema listo para producción con Clean Architecture, o 48 semanas (~12 meses) incluyendo multi-tenancy y escalado.**

¿Quieres que profundice en algún sprint específico? ¿O prefieres que empecemos a implementar el Sprint 0.1 desde ya?
