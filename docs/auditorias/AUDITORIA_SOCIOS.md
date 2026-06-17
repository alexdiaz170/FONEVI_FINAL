# Auditoría — Módulo de Socios

Fecha: 2026-06-16

1. Resumen ejecutivo.

El módulo de Socios de FONEVI proporciona las funciones básicas necesarias: listado, consulta, creación, edición, eliminación y estado de cuenta integrado con aportes y créditos. En términos positivos, la base de datos (Prisma schema) modela relaciones entre `Socio`, `Aporte`, `Credito` y `Periodo`; existen servicios backend específicos (`socioService`, `aporteService`, `creditoService`) y controladores/routers bien separados. Hay auditoría disponible (`auditoria`) y lógica de negocio aplicada en servicios (p. ej. cálculo de aportes y actualización de `ahorro_acumulado`).

Sin embargo, el módulo presenta problemas críticos y riesgo operacional que requieren atención antes de considerar producción sensible a datos financieros: inconsistencias entre identificadores (uso de `documento` como `id` en mapeos frontend), manejo inseguro de eliminación (borrado físico de `socios`), duplicidad de credenciales (`Usuario` vs `Socio`), ausencia de generación automática de `id` en `Socio` (el `id` es requerido en creación), falta de soft-delete/histórico, algunos bugs en controladores (p. ej. `perfil` usa `socio` sin obtenerlo), y acoplamientos frontend-backend que dificultan migraciones a DDD/Clean Architecture. El módulo es funcional pero técnico/arquitecturalmente inmaduro para sistemas financieros estrictos.

2. Inventario de archivos analizados.

- backend/prisma/schema.prisma
- backend/src/controllers/socioController.js
- backend/src/services/socioService.js
- backend/src/services/aporteService.js
- backend/src/services/creditoService.js
- backend/src/routes/socios.js
- backend/src/lib/mappings.js
- backend/src/middleware/audit.js (referencias desde controller)
- pages/socios.html
- js/app.js
- js/carne.js

3. Clasificación por archivo:

- Conservar
  - `backend/prisma/schema.prisma` — Modelo relacional claro entre `Socio`, `Aporte`, `Credito`, `Periodo`, `Auditoria`. Mantener como fuente de verdad, aplicar mejoras incrementales (enum, soft-delete). 
  - `backend/src/services/aporteService.js` — Implementa lógica transaccional, reparto de pago entre solidaridad/credito/ahorro y actualización de `ahorro_acumulado`. Mantener; refactorizar solo para extraer casos complejos a use-cases (si se sigue Clean Architecture).
  - `backend/src/services/creditoService.js` — Gestión de créditos con operaciones transaccionales (pago, cálculo de cuota). Conservar, endurecer validaciones y estados.

- Refactorizar
  - `backend/src/services/socioService.js` — Buen conjunto de consultas y operaciones, pero requiere:
    - Generar `id` (UUID) por defecto cuando no se provee.
    - Reemplazar DELETE físico por soft-delete (campo `deleted_at` o `activo`), o al menos exponer método `deactivate`.
    - Evitar almacenar `password` en `socios` si existe `Usuario` como identidad separada; o definir claramente la diferencia.
    - Centralizar generación de `codigo_socio` en un repositorio/lock para evitar colisiones.
  - `backend/src/controllers/socioController.js` — Contiene bug en `perfil` (no carga `socio`) y validaciones ligeras; refactorizar para delegar validaciones al service y mejorar manejo de errores/códigos.
  - `backend/src/lib/mappings.js` — `mapSocio` mapea `id` a `documento` (documento usado como id en frontend). Esto genera ambigüedad y acoplamiento; cambiar a exponer `id` (UUID) y `documento` por separado en API; si se mantiene compatibilidad con frontend, proporcionar ambos pero con `id` real como `id`.
  - `pages/socios.html` y `js/app.js` — UI y utilidades están acopladas a expectativas del API (mapeo por `documento`), generación de `id` cliente y manejo de DB en memoria (`window.DB`) que dificultan pruebas y reemplazos. Refactorizar UI para usar `id` canónico y endpoints REST.

- Archivar
  - Ningún archivo requiere archivado inmediato, pero utilidades o endpoints obsoletos deben documentarse antes de archivarse.

- Eliminar
  - No recomendar eliminar archivos; evitar `DELETE` en base de datos por la política de conservación de historial. Evitar eliminación física de socios en `socioService.delete`.

4. Riesgos técnicos detectados.

- Identificadores inconsistentes: `mapSocio` devuelve `id: s.documento || s.id`. El frontend asume `documento` como identificador; esto rompe la invariancia de entidades (documento puede cambiar). Riesgo de colisión y problemas de referenciación en integraciones.
- Eliminación física de `socios`: `socioService.delete` ejecuta `DELETE FROM socios`. Si existen `aportes` o `creditos` referenciando el socio, esto generará errores por FK o dejará inconsistencias si FK no aplica ON DELETE. También contradice la regla de mantener historial.
- Falta de soft-delete y de campo `deleted_at`/`activo` con trazabilidad: histórico de operaciones se pierde con eliminación física.
- Duplicidad de credenciales/identidad: tanto `Usuario` como `Socio` contienen campos de autenticación (`password`, `acceso_activo`). Riesgo de confusión de sesión, sincronización y ataques por inconsistencias entre tablas.
- Controlador `perfil` roto: usa variable `socio` sin cargarla; provoca 500/errores o comportamiento inconsistente para perfiles de socio.
- `Socio.id` sin default en Prisma: el modelo exige `id` en creación desde código; si los clientes generan `id`, puede haber problemas (formatos inconsistentes) o carga fallida desde UI; se recomienda `@default(uuid())` para `Socio.id`.
- Campos de estado como strings libres (p. ej. `estado`): no hay enum en schema, lo que facilita valores inconsistentes; dificulta queries y optimizaciones.
- Ahorro acumulado calculado y mantenido en columna: actualizaciones incrementales en `aporteService` usan lógica compleja y updates directos; riesgo de des-sincronización por operaciones manuales o errores.
- Mapeos y transformaciones duplicadas: backend produce filas y `mapSocio` re-mapea a formato consumido por frontend, pero existen diferencias semánticas (fechas, nombres de campos) que aumentan fragilidad.

5. Riesgos funcionales detectados.

- Pérdida de historial: eliminación física rompe la regla de que la información histórica nunca debe perderse.
- Incoherencia identidad/seguridad: doble almacenamiento de credenciales impide políticas centralizadas de contraseñas, bloqueo y auditoría.
- Problemas de fuentes de la verdad: frontend mantiene `window.DB` con datos cargados al inicio; cambios concurrentes por otros procesos (migraciones, imports) no se reflejarán hasta recarga.
- Validaciones insuficientes en creación/actualización: `socioController.create` exige `id` y `codigo` desde la petición; esto expone la API a inputs inválidos o a clientes que no generan `id` correctamente.
- Riesgo de bloqueo en concurrencia en `generarCodigoSocio`: el query que calcula max sufijo podría generar códigos duplicados bajo concurrencia alta sin bloqueo o secuencia.

6. Código duplicado o muerto identificado.

- Duplicidad de credenciales: `Usuario.password` y `Socio.password` duplican funcionalidad.
- Mappeo de `id` por `documento` aparece repetido en `mapSocio` y `mapCredito` — duplicidad lógica que puede llevar a inconsistencias si se decide cambiar la identidad primaria.
- Código muerto / bug: en `socioController.perfil` la variable `socio` nunca se asigna antes de usarla; probablemente quedó código eliminado o incompleto (dead path / bug).
- Posible código duplicado en UI: generación de forms y validaciones similares distribuidas entre `pages/socios.html` y `js/app.js` (sin componente centralizado).

7. Problemas de arquitectura.

- Falta de separación de capas clara (UseCases/Domain/Infrastructure): servicios contienen SQL y lógica de negocio, controladores orquestan parcialmente; migrar a Clean Architecture facilitaría testing y migración a microservicios si requerido.
- Bounded context de identidad impreciso: `Usuario` vs `Socio` solapan responsabilidades; aplicar DDD para definir `Identity` vs `Member` y sus invariantes.
- Acoplamiento frontend-backend: frontend asume formatos y campos concretos (ej. `id=documento`, nombres de columnas) lo que dificulta evolucionar API sin romper clientes.
- Monolito con dependencias implícitas: operaciones transaccionales mezclan gobernanza de aportes y créditos dentro de servicios distintos, complicando la responsabilidad transaccional (p. ej. `aporteService.create` modifica `creditos` y `socios` en la misma transacción — esto es correcto funcionalmente, pero la responsabilidad debe documentarse).

8. Evaluación del modelo de datos del socio.

- Esquema Prisma (extracto relevante): `Socio` contiene `id`, `codigo`, `codigo_socio`, `documento` (unique), `nombre`, `email`, `telefono`, `fechaIngreso`, `aporteMensual`, `ahorroAcumulado`, `estado`, `cargo`, `sede`, `password?`, `accesoActivo`, `ultimoLogin` y relaciones `aportes[]`, `creditos[]`.

- Fortalezas:
  - Relaciones explícitas entre `Socio`, `Aporte` y `Credito` permiten consultas y joins eficientes.
  - Indexes en `estado`, `socioId` y `periodoId` facilitan búsquedas comunes.

- Debilidades / recomendaciones:
  - `id` sin default (`@default(uuid())`) obliga al cliente a generar ids; favorecer generación server-side para coherencia.
  - Falta columna `deletedAt` o `activo` para soft-delete y conservar historial.
  - `estado` como String en lugar de `enum` conduce a valores sueltos; convertir a enum sería más seguro.
  - `codigo_socio` nullable: se genera si no provisto, pero lógica de generación debe estar atomizada para evitar duplicados en concurrencia.
  - `ahorroAcumulado` mantenido como columna: es útil para consultas rápidas pero requiere garantías transaccionales (ya implementadas parcialmente). Mantener columna y añadir tests/consistencia periódica (reconciliación) es recomendable.

9. Compatibilidad con las reglas de negocio de FONEVI.

- El socio puede existir sin tener créditos: COMPATIBLE — `creditos` es relación 0..n; no hay constraint que impida creación de socio sin créditos.
- El socio puede tener múltiples aportes: COMPATIBLE — relación `Aporte[]` existe y `aportes` soportan múltiples entradas.
- El socio puede solicitar créditos: COMPATIBLE — `creditoService.create` permite crear créditos asociados a `socioId`.
- El ahorro acumulado forma parte de su capacidad crediticia: PARCIAL — `ahorro_acumulado` existe y aparece en `estadoCuenta` y `perfil`, y `aporteService` mantiene su valor; sin embargo, no existe lógica central que combine `ahorro_acumulado` con reglas de capacidad crediticia (p. ej. multiplicadores, límites). Implementar una función de `capacidad_crediticia(socio)` en dominio es recomendable.
- Existen aportes normales, adelanto de cuotas, abonos extraordinarios a ahorro y abonos extraordinarios a capital de crédito: COMPATIBLE — la estructura de `Aporte` tiene campos `pago_solidaridad`, `pago_credito`, `monto`, `metodo`, `notas`; la lógica en `aporteService.create` reparte monto entre solidaridad, pago crédito y ahorro. Sin embargo, no existe un campo explicito `tipo_aporte` enumerado; tipos quedan implícitos por valores de `pago_credito` y `pago_solidaridad`.
- El socio podrá acceder en el futuro a un Portal del Socio: PARCIAL — existe `perfil` endpoint y frontend `pages/socios.html`; autentificación y permisos existen. Para portal público seguro, se deben aislar APIs y garantizar tokens con `socioId` y scopes, además del `perfil` controller bugfix.
- Debe existir trazabilidad completa de todas las operaciones realizadas sobre el socio: PARCIAL — tabla `auditoria` existe y controladores llaman `audit` en create/update/delete de socio; sin embargo, no hay cobertura completa en todos los servicios (ej. `aporteService` y `creditoService` no llaman consistentemente a `audit`). Revisión para aumentar cobertura de auditoría es necesaria.
- La información histórica nunca debe perderse por eliminaciones físicas: NO CUMPLE — `socioService.delete` hace DELETE físico. Riesgo alto; cambiar por soft-delete obligatorio.
- Se prefiere desactivación lógica antes que eliminación permanente: NO CUMPLE — ver punto anterior.

10. Recomendaciones de mejora.

- Inmediatas (no disruptivas al negocio):
  - Corregir bug en `socioController.perfil`: cargar `socio` con `await socioService.findByIdOrCodigo(socioId)` antes de validar estado.
  - Cambiar `socioService.delete` para que realice `UPDATE socios SET estado = 'retirado'` o usar columna `deleted_at` y no `DELETE` físico.
  - Añadir `@default(uuid())` en `Socio.id` en Prisma o generar UUID server-side si hay dependencias que ya esperan ids generados por clientes.
  - Evitar exponer `id` como `documento` en `mapSocio`; retornar ambos campos y normalizar frontend para usar `id` como referencia primaria.
  - Agregar auditoría (llamadas a `audit`) en operaciones críticas de `aporteService` y `creditoService` (creación/actualización/delete/pagos).

- Medio plazo (arquitectura y consistencia):
  - Introducir soft-delete (`deleted_at`) y conservar todos los registros históricos; adaptar queries para excluir registros borrados logicamente.
  - Convertir `estado` a `enum` (en Prisma y DB) para evitar valores libres.
  - Definir contractualmente la diferencia entre `Usuario` y `Socio`: si un `Usuario` es la cuenta de acceso y `Socio` es el miembro financiero, documentarlo y mover autenticación a `Usuario` (recommended) o justificar porqué `Socio` también guarda password.
  - Centralizar generación de `codigo_socio` usando una secuencia en BD o una tabla de control para evitar colisiones en concurrencia.
  - Mantener `ahorro_acumulado` como columna por rendimiento, pero añadir trabajos periódicos de reconciliación y pruebas automatizadas que validen consistencia entre `aportes` y `ahorro_acumulado`.

- Larga duración (migración a prácticas profesionales):
  - Reorganizar módulo en carpetas por capa: `domain/`, `usecases/`, `infrastructure/repositories/`, `controllers/routes` para facilitar Clean Architecture.
  - Definir `Identity` bounded context y separar `Usuario` (auth) de `Socio` (perfil financiero) mediante DDD. Implementar Anti-Corruption Layer si existen integraciones externas.
  - Implementar un `AuditService` cross-cutting que capture eventos desde todos los servicios y garantice integridad y retención (inmutable) de registros.

11. Observaciones para una futura migración a una arquitectura profesional (Clean Architecture, DDD y Monolito Modular).

- Clean Architecture
  - Introducir capas: Controllers/Routes (entry points) → UseCases (aplicación) → Domain (entidades `Socio`, `Aporte`, `Credito`) → Repositories/DB (Prisma). Los servicios actuales pueden mapearse a UseCases y Repositories.
  - Mover lógica transaccional (p. ej. reparto de pago en `aporteService.create`) a un caso de uso `ProcesarAporte` que coordine repositorios y notificaciones, con tests unitarios aislados.

- Domain-Driven Design (DDD)
  - Modelar `Socio` como agregado con invariantes (documento unique, estado permisible, capacidad crediticia). Crear objeto valor `Ahorro` o `SaldoAhorro` si se necesitan reglas complejas.
  - Definir eventos de dominio (`AporteRegistrado`, `CreditoPagado`, `SocioRetirado`) y usar event sourcing o al menos store de eventos para trazabilidad si se requiere auditoría de alto nivel.

- Monolito Modular
  - Extraer `identity`/`auth`, `socios`, `aportes`, `creditos` como módulos internos con interfaces bien definidas; definir contracts entre módulos.
  - Mantener la base de datos monolítica con esquemas por módulo o prefijos, facilitando futura separación por microservicio sin refactor pesado.

13. Un cambio importante que quiero introducir

El informe sugiere que un socio podría tener contraseña propia. Yo eliminaría esa idea.

En el diseño futuro:
La autenticación pertenece exclusivamente a Usuario.
Socio no debería almacenar credenciales.

Así evitamos duplicidades y problemas de sincronización.

14. Soft delete
Lo implementaría así:

Socio
------
id
activo
fecha_retiro
motivo_retiro
...
Nunca perderemos información histórica.

15. Ahorro_acumulado

Estoy de acuerdo con mantenerlo como un valor persistido por rendimiento, pero añadiría un proceso periódico de conciliación para verificar que coincide con la suma de los movimientos registrados.

16. Tipo_aporte
Aquí detectó algo muy importante.

tipo_aporte
------------
NORMAL
ADELANTO_CUOTAS
ABONO_AHORRO
ABONO_CAPITAL
Esto facilitará reportes, auditorías y reglas de negocio.

ahorro_movimientos
------------------
id
socio_id
tipo
valor
descripcion
aporte_id
fecha
usuario_id
Esto permitiría reconstruir el ahorro acumulado y mejorar la trazabilidad.

17. Conclusión final.

El módulo de Socios está funcional y cubre las operaciones requeridas por FONEVI, incluyendo integración con aportes y créditos. Aun así, su estado actual no cumple plenamente con las reglas de negocio relacionadas con conservación histórica y separación de identidad, y contiene errores y decisiones de diseño que representan riesgos en un contexto financiero regulado. Priorizar corrección de eliminación física, consistencia de identificadores, resolución del bug en `perfil`, y clarificación de la relación `Usuario` vs `Socio`. A medio plazo aplicar soft-delete, enums de estado, reconciliación automática de saldos y evolucionar hacia Clean Architecture/DDD para garantizar trazabilidad, escalabilidad y seguridad.
