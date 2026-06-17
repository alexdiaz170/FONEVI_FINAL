# Auditoría — Módulo de Autenticación y Usuarios

Fecha: 2026-06-16

## 1. Resumen ejecutivo

Esta auditoría analiza exclusivamente el módulo de Autenticación y Usuarios de FONEVI (frontend + backend). El sistema utiliza autenticación basada en JWT, hashing de contraseñas con bcrypt, un endpoint de login que devuelve token y payload de usuario, y middlewares `requireAuth` / `requireRole` en backend. La aplicación incluye controles de UI basados en rol en el frontend.

Puntos fuertes detectados:
- Uso de JWT y `jsonwebtoken` para autorización stateless.
- Hashing de contraseñas con `bcryptjs` y parámetro `BCRYPT_ROUNDS` configurable.
- Middleware de auditoría y logging de eventos (`audit`).
- Rate-limiting aplicado al endpoint de login.

Riesgos y problemas críticos:
- Secretos y `.env` con `JWT_SECRET` y `DATABASE_URL` visibles en el repositorio (`backend/.env`) — riesgo mayor de exposición en producción.
- Token JWT y objeto `usuario` completos almacenados en `sessionStorage` (frontend) — riesgo XSS y exposición de datos sensibles.
- `CORS_ORIGIN` configurado como `*` en `.env` — amplio riesgo de CSRF y cross-origin abuses si combinan con almacenamiento en `local/sessionStorage`.
- No existe mecanismo de revocación de tokens (no refresh tokens, no jti blacklist).
- Ausencia de flujo de recuperación/autenticación robusta (no se detecta mecanismo de "forgot password" con tokens seguros).

Conclusión: la implementación es funcional y pragmática para un monolito, pero requiere correcciones de seguridad inmediatas y mejoras de diseño para escalar de forma segura (rotación/revocación de tokens, almacenamiento seguro de tokens, evitar secretos en repo, endurecer CORS/CSP, mayor separación de responsabilidades en servicios).

## 2. Inventario de archivos analizados

- Frontend
  - `js/auth.js`
  - `js/api.js`
  - `js/app.js`
  - `js/layout.js`
  - `js/roles.js`
  - `index.html` (login UI)

- Backend
  - `backend/src/routes/auth.js`
  - `backend/src/controllers/authController.js`
  - `backend/src/middleware/auth.js`
  - `backend/src/services/usuarioService.js`
  - `backend/src/services/socioService.js`
  - `backend/src/middleware/audit.js`
  - `backend/src/db/index.js` (conexión pg)
  - `backend/.env` and `backend/.env.example`

## 3. Clasificación por archivo

- `js/auth.js` — Refactorizar
  - Guarda el objeto de usuario completo en `sessionStorage`. Debería almacenar solo el token o usarse cookie httpOnly.

- `js/api.js` — Refactorizar (conservar núcleo)
  - Cliente HTTP robusto; centraliza token/session en `sessionStorage`. Mantener pero cambiar almacenamiento seguro y centralizar manejo de 401/refresh.

- `js/app.js`, `js/layout.js` — Refactorizar
  - Varios handlers de logout y manipulación de sessionStorage dispersos (duplicación). Consolidar.

- `js/roles.js` — Conservar / Refactorizar
  - Implementa RBAC en UI. Mantener, pero obtener la definición oficial de roles desde backend para evitar desincronía.

- `backend/src/middleware/auth.js` — Conservar
  - Correcto middleware JWT; falta considerar `aud`, `iss`, `jti` y verificación de token revocado.

- `backend/src/controllers/authController.js` — Refactorizar
  - Login robusto y compatible con usuarios y socios; devuelve token + payload. Evitar devolver datos sensibles en payload si no es necesario y considerar emitir `jti`.

- `backend/src/services/usuarioService.js` — Conservar
  - CRUD usuarios razonable; algunos queries combinan `usuarios` y `socios` (acoplamiento que merece revisión).

- `backend/src/services/socioService.js` — Conservar / Refactorizar
  - Tiene lógica adicional (generación de contraseña inicial, manejo de `password` en socios). Requiere aclarar separación entre usuarios y socios y evitar duplicidad de almacenamiento de credenciales.

- `backend/src/middleware/audit.js` — Conservar
  - Buena práctica: registro de acciones criticas.

- `backend/src/db/index.js` — Refactorizar (seguridad)
  - Parche SSL/sslMode y lectura de env deben reforzarse; no forzar `rejectUnauthorized: false` en producción.

- `backend/.env` — Archivar / Eliminar del repo
  - Contiene secretos reales; debe eliminarse del control de versiones y moverse a secret manager.

## 4. Riesgos técnicos detectados

1) Exposición de secretos
- `backend/.env` contiene `DATABASE_URL` y `JWT_SECRET`. Si este archivo está en VCS o backups, compromiso grave.

2) Almacenamiento inseguro de tokens
- Token y objeto usuario almacenados en `sessionStorage` (`js/api.js` y `js/auth.js`) — riesgo XSS. Además, frontend depende de esos datos para RBAC (posible manipulación client-side).

3) CORS y CSRF
- `CORS_ORIGIN="*"` combinado con tokens en `sessionStorage` aumenta superficie de ataque. Sin cookies httpOnly, CSRF tiene menor impacto, pero CORS amplio sigue siendo un riesgo.

4) Token lifecycle y revocación
- No hay refresh tokens, ni rotación, ni lista de revocados. Si se compromete un JWT, no hay forma limpia de invalidarlo sin rotar el `JWT_SECRET` (disruptivo).

5) Privilegios y confianza en JWT
- El backend confía en el `rol` y otros claims incluidos en el JWT sin revalidar en base de datos; cambios de rol no se reflejarán hasta expiración del token.

6) Recuperación de cuenta y gestión de contraseñas
- No se detecta flujo de "forgot password" con tokens limitados y verificación por correo. `changePassword` requiere sesión activa.

7) Políticas de contraseña
- Longitud mínima de 6 caracteres es débil para entorno financiero; falta validación de complejidad y medidas de anti-credential stuffing (breached password checks).

8) Passwords en dos tablas
- Tanto `usuarios` como `socios` almacenan `password`; potencial duplicidad y riesgo de inconsistencias de políticas y sincronización.

9) Logging y privacidad
- `authController.login` devuelve `usuario` en respuesta; frontend la persiste. Evitar retornar hash o campos sensibles (aunque no parece hacerlo hoy).

10) Rate limiting y brute force
- Existe rate limit para login (10 intentos por IP en 15 minutos) — positivo, pero no hay control por cuenta (user lockout) ni tracking por usuario.

## 5. Código duplicado o muerto identificado

- Logout y limpieza de sesión: funciones y llamadas dispersas en `js/app.js`, `js/layout.js`, `js/auth.js` — duplicación funcional.
- Roles y permisos: definiciones en `js/roles.js` (frontend) y comprobaciones en backend (`requireRole`) — duplicidad que puede causar desalineación.
- Almacenamiento de session: `API.setSession` y `Auth.login` ambos guardan usuario en sessionStorage — redundancia.
- Implicaciones: sincronizar el origen de la verdad (backend) y hacer que frontend consuma dicha fuente en vez de duplicar reglas.

## 6. Problemas de arquitectura

1) Acoplamiento usuario/socio
- Hay dos conceptos de identidad: `usuarios` (sistema) y `socios` (miembros). Ambos pueden tener credenciales y contraseñas. Esto complica autenticación, permisos y cambios de estado. Se recomienda clarificar el bounded context de identidad.

2) Autenticación entrópica (payload en JWT)
- El JWT incluye múltiples claims (id, nombre, email, rol, socioId, avatar). El backend asigna `req.usuario` desde payload sin reconciliación, lo que facilita inconsistencias cuando los datos cambian.

3) Lógica de negocio en controllers
- `authController` mezcla orquestación, DB direct calls y audit logging. Falta separación clara entre casos de uso (servicios) y controladores.

4) Falta de soporte para OAuth2/OpenID Connect
- La plataforma no tiene integración con proveedores externos (SSO) ni un modelo de identidad federada, lo que sería recomendable para instituciones grandes o multi-tenant.

## 7. Recomendaciones de mejora

Seguridad inmediata (hacer antes de producción):
- Eliminar `backend/.env` del repositorio y mover `JWT_SECRET`, `DATABASE_URL`, `SSH_PRIVATE_KEY`, etc. a un gestor de secretos; rotar `JWT_SECRET` inmediatamente.
- Cambiar almacenamiento de token en frontend: usar cookie `HttpOnly`, `Secure`, `SameSite=Lax` para el access token (o, preferible, usar short-lived access token + refresh token en httpOnly cookie con rotation).
- Reducir TTL del JWT a valor corto (p. ej. 15m) y usar refresh tokens con rotación segura y revocación.
- Implementar `jti` (JWT ID) y tabla de revocación / whitelist para poder invalidar tokens si es necesario.

Mejoras de diseño y arquitectura:
- Centralizar la validación de identidad en un módulo `auth` con interfaces: `IUserRepository`, `ITokenProvider`, `IAuthService` (preparar para Clean Architecture).
- Evitar incluir en el JWT claims que cambian frecuentemente (rol, estado); en su lugar, incluir `jti` y `sub` (user id) y consultar DB para operaciones sensibles o usar short-lived tokens.
- Unificar conceptos `usuario` vs `socio` o definir contrato claro entre ambos; evitar doble almacenamiento de credenciales.

Operacionales y UX:
- Implementar flujo seguro de "forgot password" con token de un solo uso, expiración corta y auditoría.
- Reforzar política de contraseñas (min 10+ chars, checks contra listas de contraseñas comprometidas) y ofrecer MFA (TOTP o SMS con precauciones).

RBAC y frontend:
- Mantener la fuente de la verdad de roles en el backend y exponer endpoint `/api/roles` o `/auth/perfil` que el frontend consuma al iniciar sesión para construir la UI (no mantener roles hardcoded en frontend).

## 8. Observaciones para una futura migración a una arquitectura profesional

- Clean Architecture
  - Separar `auth` en capas: Web (controllers/routes) → UseCases (login, changePassword, revokeToken) → Domain (User aggregate, Credentials value object) → Infrastructure (DB, TokenProvider). Esto facilita tests y sustituir implementaciones (p. ej. DB por LDAP). Evitar queries SQL dispersos en controllers.

- Domain-Driven Design (DDD)
  - Modelar `Identity` como agregado; `Usuario` y `Socio` deben ser bounded contexts bien definidos. Definir invariantes (estado activo, accesoActivo) en dominio.

- Monolito Modular
  - Crear un módulo `modules/auth` o `modules/identity` que contenga routes, services y repositorios. Permite escalar a microservicios si se decide separar identidad.

- Panel SuperAdmin
  - Implementar gestión de roles, revocación de tokens, rotación de claves y audit trail desde Panel SuperAdmin.

- Configuración dinámica desde BD
  - Exponer políticas (TTL tokens, BCRYPT_ROUNDS, lockout thresholds) desde `configuracion` en BD; consumir en `AuthService` en tiempo de ejecución.

- Multi-tenancy (Database-per-tenant)
  - Requerirá diseño de provisioning de identidades por tenant (user namespaces, shared identity vs tenant-specific). Recomendado introducir tenant_id en `usuarios` y en claims de JWT, y una estrategia para routing de conexiones DB por tenant.

## 9. Algo que añadiría al informe
Panel SuperAdmin
Debe poder administrar:

Usuarios.
Roles.
Permisos.
Bloqueo/desbloqueo.
Restablecimiento de contraseña.
Auditoría de accesos.  

## Auditoría de inicio de sesión

Registrar siempre:

Fecha y hora.
Usuario.
Dirección IP.
Navegador o dispositivo (cuando sea posible).
Resultado (éxito o fallo).



## 11. Conclusión final

El módulo de Autenticación y Usuarios de FONEVI está implementado de forma funcional para un monolito tradicional: login, cambio de contraseña, middleware JWT y RBAC existen y funcionan. No obstante, hay debilidades significativas de seguridad operacional (secrets en repo, almacenamiento en sessionStorage, CORS amplio, ausencia de revocación de tokens) y de diseño (duplicidad `usuario`/`socio`, acoplamientos y mezcla de responsabilidades). 

Prioridad inmediata: retirar secretos del repo, asegurar almacenamiento de tokens, reducir TTL y añadir mecanismo de revocación. A medio plazo, reorganizar el módulo hacia una arquitectura basada en Clean Architecture / Monolito Modular y modelar identidad con principios DDD para facilitar migración a SSO/OIDC y multi-tenant.

---
Auditoría realizada por revisión de código y configuración en el workspace FONEVI.
