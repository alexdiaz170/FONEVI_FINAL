# Auditoría — Módulo de Configuración General

Fecha: 2026-06-16

## 1. Resumen ejecutivo

Este informe documenta la auditoría del módulo de configuración general de FONEVI (frontend + backend + base de datos). Se verificaron organización de carpetas, archivos de configuración, variables de entorno, dependencias, scripts, despliegue, configuración de base de datos y autenticación. El núcleo de configuración existe (tabla `configuracion` y endpoints `/api/configuracion`) pero hay duplicidad de servidores, prácticas inseguras en el frontend (persistencia de sesión y logs), dependencias no justificadas y configuraciones TLS/CORS potencialmente inseguras.

Recomendación inmediata: mitigar riesgos de seguridad (no almacenar datos sensibles en sessionStorage, forzar TLS para Postgres, asegurar `JWT_SECRET` en gestor de secretos), consolidar entrypoints de servidor y migrar el consumo de configuración del frontend para depender únicamente de `/api/configuracion`.

## 2. Inventario de archivos analizados

- `js/config.js`
- `js/auth.js`
- `js/api.js`
- `pages/configuracion.html` (y páginas que consumen `DB.config`)
- `backend/src/routes/configuracion.js`
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.js`
- `backend/src/lib/prisma.js`
- `backend/src/db/index.js`
- `backend/src/app.js`
- `backend/server.js`
- `backend/start.js`
- `backend/package.json`
- `package.json` (raíz)
- `.gitignore`
- `DEPLOYMENT.md`
- `backend/scratch/*` (scripts auxiliares)

## 3. Clasificación y justificación por archivo

- `js/config.js`
  - Estado: Refactorizar.
  - Justificación: Contiene heurísticas ad-hoc para detección de entorno, `DEBUG_MODE` y `OFFLINE_MODE`. Debe convertirse en un proveedor simple que consulte `/api/configuracion` o acepte inyección runtime desde hosting.

- `js/auth.js`
  - Estado: Refactorizar.
  - Justificación: Guarda el objeto de usuario completo en `sessionStorage` (`fonevi_session`) — riesgo de exposición por XSS. Cambiar a almacenar únicamente el token (o cookie httpOnly).

- `js/api.js`
  - Estado: Conservar / Refactorizar.
  - Justificación: Es el cliente API; asegurar que use la URL centralizada del proveedor de configuración.

- `pages/configuracion.html` y pages que usan `DB.config`
  - Estado: Refactorizar.
  - Justificación: Persisten `DB.config` en localStorage y dependen de caché local; riesgo de desincronización y datos de negocio en cliente.

- `backend/src/routes/configuracion.js`
  - Estado: Conservar (mejorar).
  - Justificación: Implementación correcta de GET/PUT con auditoría. Mejorar validación del `valor` entrante y tipado.

- `backend/prisma/schema.prisma`
  - Estado: Conservar.
  - Justificación: Modelo `Configuracion` simple y adecuado. Evaluar si agregar `tipo` o `meta` para evitar heurística de parseo.

- `backend/prisma/seed.js`
  - Estado: Conservar.
  - Justificación: Útil para despliegues y valores por defecto.

- `backend/src/lib/prisma.js`
  - Estado: Conservar.
  - Justificación: Correcto singleton de Prisma.

- `backend/src/db/index.js`
  - Estado: Refactorizar.
  - Justificación: Fuerza `ssl.rejectUnauthorized: false` por defecto — inseguro en producción; manipula `DATABASE_URL` de forma frágil.

- `backend/src/app.js`
  - Estado: Conservar (pulir configuración).
  - Justificación: Buena base (helmet, cors, rate-limit) pero requiere endurecer CORS y CSP para producción.

- `backend/server.js`
  - Estado: Archivar / Consolidar.
  - Justificación: Duplicidad con `src/app.js` y lógica dev (proxy). Mantener como script de desarrollo o documentar y archivar.

- `backend/start.js`
  - Estado: Archivar.
  - Justificación: Mock/simple server que puede confundir despliegues; conservar solo para pruebas locales documentadas.

- `backend/package.json`
  - Estado: Refactorizar.
  - Justificación: Contiene dependencias de producción y dev; mover paquetes de dev (proxy) según uso y revisar `zod` (no se detectó uso).

- `package.json` (raíz)
  - Estado: Refactorizar.
  - Justificación: Quasi vacío mientras existe `package-lock.json` grande — inconsistencia entre manifestos que puede causar confusión en CI.

- `.gitignore`
  - Estado: Conservar.
  - Justificación: Correcto bloqueo de sesiones y secretos; verificar que no existan secretos en el repo.

- `DEPLOYMENT.md`
  - Estado: Conservar (actualizar).
  - Justificación: Buen contenido operativo; consolidar ejemplos y evitar duplicaciones.

- `backend/scratch/*`
  - Estado: Archivar.
  - Justificación: Scripts ad hoc para creación de tablas; usar migraciones de Prisma en producción.

## 4. Riesgos técnicos detectados

- Persistencia de datos de sesión en `sessionStorage` — fuga de datos sensibles y riesgo XSS. (`js/auth.js`)
- `rejectUnauthorized: false` en conexión Postgres — exposicion MITM y conexiones no verificadas. (`backend/src/db/index.js`)
- CORS por defecto permisivo cuando `CORS_ORIGIN` está vacío — posibilidad de solicitudes cross-origin no deseadas. (`backend/src/app.js`)
- Mensajes de debug y flags `DEBUG_MODE` en frontend activos — fuga de información en producción. (`js/config.js`)
- Dependencias sin uso detectado (`zod`) y dependencia de proxy en producción (`http-proxy-middleware`).
- Duplicidad de entrypoints de servidor (`server.js`, `start.js`, `src/app.js`) — riesgo de despliegues inconsistentes.

## 5. Código duplicado o muerto identificado

- `backend/server.js` y `backend/start.js` duplican responsabilidades de servir frontend y health endpoints. Recomendar consolidación.
- Persistencia y sincronización local de `DB.config` replicada en múltiples páginas (`pages/*.html`) y en `js/config.js` — código duplicado para lectura/uso de configuración.
- Dependencia `zod` no referenciada en código (posible código muerto). Verificar y eliminar si no usada.

## 6. Problemas de arquitectura

- Mezcla de responsabilidades: lógica de configuración reside parcialmente en cliente (DB.config) y servidor (tabla `configuracion`), provocando desincronización.
- Falta de una capa de validación tipada para configuraciones; backend usa heurística (`isNaN`) para parseo de valores.
- Ausencia de módulo claro para `configuracion` (controller, service, repository) — dificulta pruebas y mantenimiento.
- Estrategia de empaquetado/monorepo no definida (root `package.json` inconsistente), lo que complica CI y dependencias.

## 7. Recomendaciones de mejora

1. Seguridad inmediata
   - No persistir datos de usuario en `sessionStorage`; almacenar sólo JWT o usar cookie `HttpOnly`/`Secure`.
   - Forzar `rejectUnauthorized: true` para Postgres y parametrizar SSL por env (ej. `PGSSLMODE` y opcional CA).
   - Guardar `JWT_SECRET` y otros secretos en gestor de secretos (GitHub Secrets, Vault).

2. Consolidación y limpieza
   - Unificar servidor: usar `backend/src/app.js` como única entrada; archivar `server.js`/`start.js` o convertir en scripts dev.
   - Eliminar dependencias no usadas (`zod`) y mover `http-proxy-middleware` a devDependencies.
   - Armonizar `package.json` y `package-lock.json` (decidir monorepo o separación clara).

3. Configuración dinámica y operación
   - Migrar el frontend para cargar configuración exclusivamente desde `/api/configuracion` al arranque y exponerla como singleton inmutable en JS.
   - Añadir validación tipada de valores de configuración en backend (definir `tipo` o esquema por clave).
   - Implementar ETag / Last-Modified y cache-control en `/api/configuracion`.

4. Arquitectura y calidad
   - Encapsular `configuracion` como módulo (controller → service → repository) siguiendo Monolito Modular.
   - Aplicar Clean Architecture: extraer casos de uso y lógica de dominio fuera de controllers.
   - Modelar parámetros financieros como Value Objects con invariantes (DDD).

## 8. Plan de acción priorizado (Backlog por sprints)

Sprint 1 (1–2 semanas, seguridad urgente)
- Migración de secretos a gestor: rotación de `JWT_SECRET` y actualización de `DEPLOYMENT.md`.
- Cambios en frontend auth: almacenar solo token (pruebas y QA). (`js/auth.js`)
- Forzar TLS/SSL en `backend/src/db/index.js` y pruebas en staging.

Sprint 2 (2 semanas, endurecimiento y consolidación)
- Restringir CORS y CSP en `backend/src/app.js` para producción.
- Consolidar entrypoint: eliminar/archivar `backend/start.js` y `backend/server.js`.
- Mover `http-proxy-middleware` a devDependencies.

Sprint 3 (2–3 semanas, refactor funcional)
- Migrar frontend para consumir `/api/configuracion` y eliminar `DB.config` persistente.
- Refactorizar `backend/src/routes/configuracion.js` en módulo `modules/configuracion` (service + repo).
- Añadir validación en PUT `/api/configuracion/:clave` y pruebas unitarias.

Sprint 4 (2–3 semanas, mejora operativa)
- Añadir caching/ETag en `/api/configuracion` y control de cache en frontend.
- Automatizar migraciones Prisma en CI/CD y documentar rollback.

Sprint 5 (roadmap)
- Implementar Panel SuperAdmin con RBAC completo y auditoría extendida.
- Refactor mayor hacia Monolito Modular y Clean Architecture, introducir value objects DDD.

## 9. Observaciones para migración hacia patrones arquitectónicos

- Clean Architecture
  - Separar controllers (HTTP) de casos de uso (servicios) y de repositorios (Prisma/pg). `configuracion` es un candidato ideal para comenzar. Beneficio: pruebas aisladas y dependencia invertida.

- Domain-Driven Design (DDD)
  - Identificar `Configuracion` como objeto de valor/entidad según la clave; modelar invariantes (tasas >= 0, multiplicadores enteros positivos). Mover reglas financieras al dominio y exponer API estable.

- Monolito Modular
  - Crear módulos independientes por contexto (aportes, creditos, configuracion, usuarios). Cada módulo contiene rutas, servicios y repositorios; facilita despliegue y mantenimiento.

- Configuración dinámica desde base de datos
  - Ya existe la tabla `configuracion` y endpoint; completar migración eliminando caché local y añadiendo validación/metadata por clave. Considerar agregar columnas: `tipo`, `descripcion`, `scope` y `auditable`.

- Panel SuperAdmin
  - Panel UI + endpoints seguros para editar configuraciones. Requisitos: `requireRole('administrador')`, validación, audit trail, versionado de cambios y rollback de cambios críticos.

## 10. Decisión oficial: Multi-tenancy
FONEVI se diseñará para:

Una base de datos independiente por fondo.
Aislamiento físico entre clientes.

## Decisión oficial: Configuración dinámica

Parámetros como:

- Valor del seguro.
- Valor de solidaridad.
- Tasas.
- Multiplicador.
- Período.
- Configuración institucional.

Se administrarán exclusivamente desde el Panel SuperAdmin.

## Decisión oficial: Reglas financieras

Toda la lógica relacionada con:

- Aportes.
- Créditos.
- Mora.
- Refinanciación.
- Cierre mensual.

Vivirá en el backend y nunca en el frontend.

## Conclusión final

El módulo de configuración de FONEVI está funcionalmente presente y bien encaminado (tabla y endpoints). Sin embargo, existen riesgos de seguridad y problemas de arquitectura que requieren intervención inmediata y un plan de refactor ordenado. La ruta de menor fricción es: 1) arreglar riesgos críticos (secrets, TLS, sessionStorage), 2) consolidar entrypoints y dependencias, 3) migrar el frontend para depender únicamente de `/api/configuracion`, y 4) evolucionar hacia Monolito Modular + Clean Architecture + DDD para robustecer reglas financieras y facilitar gobernanza desde un Panel SuperAdmin.

Si deseas, puedo generar ahora:

- La lista de tickets por sprint con descripción técnica y estimaciones en horas/puntos.
- Un parche (PR) inicial que implementa los cambios de seguridad críticos (no incluye cambios en lógica de negocio del dominio sin tu confirmación).

---
Auditoría generada por revisión de archivos y documentación del repositorio FONEVI.
