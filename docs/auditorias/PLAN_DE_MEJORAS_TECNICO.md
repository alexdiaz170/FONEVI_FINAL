# Plan de Mejoras Técnico - Proyecto FONEVI

Este documento consolida la evaluación de arquitectura y el plan de acción propuesto para mitigar las brechas identificadas en los atributos de calidad del proyecto FONEVI.

---

## 📊 Matriz de Madurez de Atributos de Calidad

| Atributo de Calidad                         | Calificación (1-1000) | Nivel de Madurez | Foco Principal / Observación                                                                                      |
| :------------------------------------------ | :-------------------: | :--------------: | :---------------------------------------------------------------------------------------------------------------- |
| **Availability (Disponibilidad)**           |        **650**        |      Medio       | Acoplamiento frontend-backend, caché local y SPoF en Base de Datos.                                               |
| **Reliability (Confiabilidad)**             |        **780**        |    Alto-Medio    | Transacciones de base de datos bien estructuradas, manejo de errores robusto. Falta de colas de reintento.        |
| **Testability (Testabilidad)**              |        **520**        |    Medio-Bajo    | Estructura para tests configurada en CI/CD, pero cobertura de pruebas de negocio muy baja.                        |
| **Scalability (Escalabilidad)**             |        **550**        |      Medio       | Monorepo limpio. Procesamiento in-memory síncrono para reportes y falta de caché distribuida.                     |
| **Security (Seguridad)**                    |        **810**        |    Alto-Medio    | Excelentes políticas de headers, rate-limiting, JWT y roles (RBAC). Falta validación perimetral y MFA.            |
| **Agility (Agilidad)**                      |        **880**        |       Alto       | Turborepo, Vite, formateo automático en pre-commit e integración CI continua.                                     |
| **Fault Tolerance (Tolerancia a Fallos)**   |        **580**        |    Medio-Bajo    | Transacciones SQL y control global de errores. Falta de apagado gradual e integración robusta con APIs externas.  |
| **Elasticity (Elasticidad)**                |        **480**        |    Medio-Bajo    | Dockerizado para despliegues como Railway. Acoplado por estado en memoria y logs locales.                         |
| **Reversibility (Reversibilidad)**          |        **740**        |    Medio-Alto    | Migraciones controladas por Prisma y opción de backup. Copia de seguridad manual y sin storage externo.           |
| **Performance (Rendimiento)**               |        **700**        |    Medio-Alto    | Frontend reactivo óptimo y consultas indexadas. Bloqueo de event loop por tareas síncronas pesadas en el backend. |
| **Deployability (Desplegabilidad)**         |        **860**        |       Alto       | Despliegue automático en Railway configurado, empaquetado integrado del frontend en la API.                       |
| **Learnability (Facilidad de Aprendizaje)** |        **910**        |    Excelente     | Excepcional documentación técnica en `/docs/`, DDD predecible y uso de TypeScript estricto.                       |
| **Maintainability (Mantenibilidad)**        |        **820**        |       Alto       | Código limpio bajo DDD/Clean Architecture con inyección de dependencias. Cobertura de test limitada.              |
| **Updateability (Actualizabilidad)**        |        **840**        |       Alto       | Stack de dependencias muy moderno (React 19, Tailwind v4, Vite 8, Vitest 3).                                      |

---

## 🔍 Análisis Detallado por Atributo

### 1. Availability (Disponibilidad) - **650 / 1000**

- **Aspectos Cubiertos:**
  - Se dispone de un endpoint `/health` que permite monitorear el estado de salud de la API.
  - El sistema está configurado para la plataforma Railway (mediante `railway.json`), garantizando auto-reinicio básico ante caídas fatales.
- **Brechas e Identificación de Mejoras:**
  - **Acoplamiento de Distribución:** El backend sirve el frontend de React de forma estática en producción. Si el backend experimenta una caída o se satura el event loop, los usuarios pierden acceso por completo incluso a la interfaz visual.
  - **Caché con Estado en Memoria:** Si se despliegan múltiples instancias de la API (detrás de un balanceador de carga), cada una tendrá su propia memoria caché local (`SimpleCache`). Esto genera inconsistencia de datos ("split-brain cache") en el panel principal.

### 2. Reliability (Confiabilidad) - **780 / 1000**

- **Aspectos Cubiertos:**
  - Integridad referencial fuerte gracias al uso de PostgreSQL y un esquema bien definido en Prisma.
  - Uso correcto de transacciones de base de datos (`prisma.$transaction`) en flujos sensibles de escritura como `EjecutarCierrePeriodoUseCase`, `PagarCuotaUseCase`, y `RegistrarAporteUseCase`.
  - Middleware robusto para captura de errores (`errorHandler.ts`) que mapea excepciones de dominio (`DomainError`) y aplicación (`AppError`), evitando caídas imprevistas del hilo de Node.js.
- **Brechas e Identificación de Mejoras:**
  - **Ausencia de colas y reintentos:** Procesos integrados con servicios externos (como el envío de plantillas de WhatsApp a través del cliente Meta API) se realizan de manera síncrona en el request. Si falla la red de Meta, la operación puede fallar y no tiene un mecanismo de persistencia/reintento automático (outbox pattern o colas de tareas).

### 3. Testability (Testabilidad) - **520 / 1000**

- **Aspectos Cubiertos:**
  - Se cuenta con un entorno de pruebas unitarias e integración configurado bajo `vitest` y ejecutado en los pipelines de GitHub Actions (`ci.yml`).
  - Hay pruebas implementadas para modelos de dominio de entidades (`socio.test.ts`, `usuario.test.ts`) y casos de uso principales (`login-use-case.test.ts`).
- **Brechas e Identificación de Mejoras:**
  - **Baja Cobertura General:** A pesar de tener la estructura, la mayoría de los casos de uso complejos de negocio (cálculo de dividendos, simulador de mora y cierre de períodos) y controladores de la API carecen de pruebas automatizadas.
  - El frontend no cuenta con pruebas unitarias para componentes ni pruebas E2E (con Playwright o Cypress) para validar flujos críticos de la interfaz.

### 4. Scalability (Escalabilidad) - **550 / 1000**

- **Aspectos Cubiertos:**
  - La estructura del monorepo mediante Turbo permite escalar el equipo de desarrollo y aislar responsabilidades (paquete de negocio, cliente externo, lógica compartida).
  - Los índices de base de datos clave (como en `socio_id`, `credito_id`, `periodo_id`, y `estado`) están definidos en el esquema de base de datos para optimizar consultas de lectura.
- **Brechas e Identificación de Mejoras:**
  - **Generación de Reportes en Hilo Principal:** Los reportes en PDF y Excel se generan en memoria usando `pdfkit` y `xlsx` directamente en el controlador. Al ser Node.js monohilo, si varios usuarios solicitan reportes pesados concurrentemente, el servidor bloqueará el event loop, afectando a todos los demás usuarios.
  - **Operaciones de Lectura de Backup Masivas:** El endpoint de backups (`generarBackup`) descarga todo el contenido de la base de datos de una sola vez a memoria (`findMany()`). Si la base de datos crece a miles de registros, esto provocará fallos por falta de memoria (OOM).

### 5. Security (Seguridad) - **810 / 1000**

- **Aspectos Cubiertos:**
  - Configuración activa de `helmet` para inyectar cabeceras HTTP de seguridad fundamentales.
  - Limitador de tasa (`express-rate-limit`) configurado a un máximo de 300 peticiones por ventana de 15 minutos.
  - Control de acceso y sesiones basado en tokens de acceso JWT de corta duración y tokens de refresco persistidos.
  - Control de acceso basado en roles (RBAC) mediante middleware (`authorize('admin', 'superadmin')`).
  - Registro de auditoría a nivel de base de datos (`Auditoria`) para trazar cambios y acciones críticas de usuarios.
- **Brechas e Identificación de Mejoras:**
  - **Falta de Validación de Entrada Centralizada:** Los controladores realizan validación inline con Zod (`safeParse(req.body)`). Sería óptimo mover esto a un middleware de validación genérico a nivel de ruta para separar responsabilidades.
  - **Encriptación de Hilo Principal:** El uso de `bcryptjs` en JS puro (sin bindings nativos de C++) ralentiza el encriptado y bloquea la CPU durante el inicio de sesión.
  - No hay soporte para autenticación de dos factores (MFA) para accesos de administración o exportaciones críticas.

### 6. Agility (Agilidad) - **880 / 1000**

- **Aspectos Cubiertos:**
  - Configuración moderna con Turborepo, minimizando tiempos de build incrementales.
  - Frontend con Vite y recarga rápida HMR para una excelente experiencia de desarrollo.
  - Flujo de calidad automatizado en commits locales mediante git hooks con `husky` y `lint-staged`.
- **Brechas e Identificación de Mejoras:**
  - No se dispone de un script semilla (`db:seed`) robusto o mock data amplio para recrear rápidamente un ambiente de desarrollo sandbox con datos lógicos e históricos simulados de socios y créditos.

### 7. Fault Tolerance (Tolerancia a Fallos) - **580 / 1000**

- **Aspectos Cubiertos:**
  - Aislamiento de fallas críticas a nivel de petición mediante el `errorHandler` global que evita que el proceso Express colapse.
  - Transacciones de base de datos atómicas a través del ORM.
- **Brechas e Identificación de Mejoras:**
  - **Falta de Apagado Gradual (Graceful Shutdown):** El servidor en `index.ts` no escucha señales del sistema operativo (`SIGTERM`, `SIGINT`). Si el contenedor es reiniciado o actualizado, se cierran las conexiones abruptamente, lo que puede interrumpir transacciones de base de datos activas o peticiones en curso.
  - **Sin Circuit Breakers:** Si las conexiones a servicios externos (WhatsApp Meta API o similares) fallan repetidamente o se vuelven lentas, no hay un patrón de cortocircuito (`Circuit Breaker`) para desactivar el envío temporalmente y responder rápido con un error controlado sin saturar los recursos de red del servidor.

### 8. Elasticity (Elasticidad) - **480 / 1000**

- **Aspectos Cubiertos:**
  - Arquitectura containerizada mediante Docker que facilita su escalamiento rápido en plataformas SaaS y entornos en la nube.
  - Estado de sesión desacoplado de la API (uso de JWTs sin sesiones locales almacenadas).
- **Brechas e Identificación de Mejoras:**
  - **Dependencias de Estado Local:** El uso de caché en memoria no sincronizada y almacenamiento de logs en el disco local (`logs/error.log`) impide el escalamiento horizontal real de contenedores, ya que los logs se fragmentan y la caché no es coherente entre réplicas.
  - No existen políticas de auto-escalado definidas ni archivos de configuración de infraestructura declarativa (IaC/Terraform/Kubernetes charts).

### 9. Reversibility (Reversibilidad) - **740 / 1000**

- **Aspectos Cubiertos:**
  - Control y reversión lógica del código mediante Git.
  - Migraciones estructuradas de base de datos e historial de cambios mediante Prisma Migrations (`prisma/migrations`).
  - Extracción manual de copias de seguridad de tablas de base de datos formateadas en JSON para portabilidad total.
- **Brechas e Identificación de Mejoras:**
  - **Backups no automatizados:** No existe una tarea programada automática (cron job) para enviar volcados de base de datos a un almacenamiento seguro descentralizado (como AWS S3, Azure Blob Storage). Si ocurre una falla de disco y no se extrajo un backup manual, la información se perderá.
  - Prisma no soporta migraciones reversibles de manera automática (migraciones "down"). Revertir un cambio de esquema requiere scripts manuales o recuperación desde la última copia de seguridad.

### 10. Performance (Rendimiento) - **700 / 1000**

- **Aspectos Cubiertos:**
  - Frontend ligero empaquetado y optimizado por Vite. Uso eficiente de Tailwind v4.
  - Caching básico de respuestas a nivel de servidor y cabeceras HTTP de caché configuradas para el frontend.
  - Índices de base de datos para operaciones frecuentes.
- **Brechas e Identificación de Mejoras:**
  - Bloqueo potencial del event loop por cálculo de contraseñas (`bcryptjs`) y exportación masiva síncrona en formatos PDF/Excel en el hilo principal.
  - Consultas generales a tablas grandes (ej. aportes e historial de auditoría) sin paginación configurada en varios endpoints.

### 11. Deployability (Desplegabilidad) - **860 / 1000**

- **Aspectos Cubiertos:**
  - Configuración lista para despliegue automatizado continuo con Railway.
  - El script de postbuild automatiza la copia de la build del frontend en el directorio público del backend, permitiendo desplegar un solo contenedor web.
- **Brechas e Identificación de Mejoras:**
  - La base de datos requiere la ejecución manual o por scripts de inicio de `prisma db push` o `prisma migrate deploy`, lo cual no está orquestado de forma aislada en tareas de pre-despliegue del pipeline, incrementando el riesgo de discrepancias de esquema en producción.

### 12. Learnability (Facilidad de Aprendizaje) - **910 / 1000**

- **Aspectos Cubiertos:**
  - La documentación técnica disponible en la carpeta `/docs/` es **excelente y muy detallada** (con especificaciones de reglas de negocio, modelos de datos, flujos de cierre, créditos y seguridad).
  - Arquitectura limpia bajo patrones predecibles (DDD) y tipado estricto con TypeScript.
- **Brechas e Identificación de Mejoras:**
  - No hay documentación interactiva de APIs (como OpenAPI/Swagger) que permita a los desarrolladores probar los endpoints fácilmente sin explorar las rutas y controladores.

### 13. Maintainability (Mantenibilidad) - **820 / 1000**

- **Aspectos Cubiertos:**
  - Separación rigurosa de capas de dominio, aplicación e infraestructura. Inyección de repositorios en controladores.
  - Zod para validación y tipado de payloads de entrada/salida compartida.
- **Brechas e Identificación de Mejoras:**
  - El factor de riesgo principal es la cobertura de tests automatizados. Si se requiere realizar una refactorización de gran escala sobre el cálculo de mora o amortización, es muy probable introducir regresiones debido a la falta de suites de pruebas robustas que cubran todas las reglas financieras.

### 14. Updateability (Actualizabilidad) - **840 / 1000**

- **Aspectos Cubiertos:**
  - Versiones modernas del stack tecnológico (Node JS >= 18, React 19, Tailwind CSS v4, Vite 8, Vitest 3).
- **Brechas e Identificación de Mejoras:**
  - Ausencia de herramientas automatizadas de auditoría y actualizaciones de seguridad en dependencias (como Github Dependabot, Snyk o similares) configuradas en el repositorio.

---

## 🛠️ Plan de Mejoras Recomendado (Backlog Técnico)

1. **[Seguridad y Confiabilidad] Middleware de Validación de Esquemas:** Extraer las validaciones inline de Zod de los controladores a un middleware genérico que capture y rechace peticiones inválidas antes de entrar a los controladores.
2. **[Tolerancia a Fallos] Graceful Shutdown:** Añadir escuchas a `SIGTERM` y `SIGINT` en `index.ts` para permitir el cierre suave de conexiones HTTP y pools de base de datos.
3. **[Rendimiento y Escalabilidad] Procesamiento Asíncrono para Reportes:** Implementar generación de reportes y envíos de WhatsApp en segundo plano mediante colas de tareas ligeras.
4. **[Escalabilidad y Elasticidad] Caché y Sesiones Centralizadas:** Reemplazar el `SimpleCache` en memoria local por una caché compartida (como Redis o base de datos) para permitir escalabilidad horizontal y balanceo de carga sin pérdida de consistencia.
5. **[Reversibilidad] Automatización de Backups:** Programar una tarea automatizada (cron job) para volcar la base de datos y subir los backups a un almacenamiento de objetos externo y seguro.
6. **[Testabilidad] Aumento de Cobertura:** Escribir pruebas unitarias robustas para las lógicas financieras críticas (`EjecutarCierrePeriodoUseCase`, simulaciones de créditos e interés, mora y dividendos).
7. **[Learnability] Documentación Swagger:** Integrar OpenAPI/Swagger para la auto-generación de documentación interactiva de la API.
