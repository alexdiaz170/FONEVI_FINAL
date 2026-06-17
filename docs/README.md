# FONEVI – Sistema Integral para Fondo de Empleados

## Descripción

FONEVI es una plataforma integral para la administración de un Fondo de Empleados, diseñada para gestionar socios, aportes, créditos, pagos, cartera, indicadores financieros y procesos administrativos de manera segura, escalable y auditable.

El proyecto está concebido como una solución de uso real para producción, con una arquitectura preparada para crecer durante muchos años sin depender de modificaciones constantes en el código fuente para realizar cambios operativos.

---

# Objetivos del proyecto

* Administrar de forma centralizada la información de los socios.
* Gestionar aportes mensuales y extraordinarios.
* Controlar créditos, amortizaciones y pagos.
* Automatizar reglas financieras definidas por el fondo.
* Proporcionar información clara para tesorería, administración y socios.
* Mantener trazabilidad completa mediante auditoría y documentación.
* Permitir parametrización desde interfaces administrativas sin modificar código.

---

# Tecnologías principales

## Backend

* Node.js
* Express.js
* PostgreSQL
* UUID para identificación de registros
* API REST

## Frontend

* HTML5
* CSS3
* JavaScript (Vanilla)
* Visual Studio Code como entorno principal de desarrollo

## Base de datos

* PostgreSQL
* Compatible con despliegues locales y servicios administrados como Supabase

---

# Principios de diseño

FONEVI sigue los siguientes principios:

* Separación clara entre presentación, lógica de negocio y acceso a datos.
* Modularidad y reutilización de componentes.
* Configuración parametrizable desde la aplicación.
* Auditoría de operaciones críticas.
* Escalabilidad para nuevas funcionalidades.
* Documentación continua del código y de las reglas de negocio.
* Minimización de lógica financiera embebida directamente en la interfaz.

---

# Funcionalidades principales

## Gestión de socios

* Registro de socios.
* Actualización de información personal.
* Consulta de historial.
* Estado financiero individual.
* Perfil personal del socio.

## Gestión de aportes

* Registro de aportes normales.
* Registro de pagos parciales.
* Adelanto de cuotas.
* Abonos extraordinarios al ahorro.
* Abonos extraordinarios a capital de crédito.
* Historial completo de aportes.

## Gestión de créditos

* Solicitud y aprobación.
* Plan de amortización.
* Cálculo de intereses.
* Cálculo de seguros.
* Seguimiento de saldo.
* Estado de cartera.
* Preparación para futuras refinanciaciones.

## Gestión financiera

* Fondo de solidaridad.
* Estado de cuenta.
* Paz y salvo.
* Indicadores financieros.
* Reportes administrativos.

## Administración

* Gestión de usuarios.
* Gestión de períodos.
* Configuración de parámetros financieros.
* Auditoría.
* Copias de seguridad.
* Panel SuperAdmin.

---

# Arquitectura general

El sistema está organizado por capas:

1. Presentación (Frontend).
2. API REST.
3. Servicios de negocio.
4. Repositorios de acceso a datos.
5. Base de datos PostgreSQL.

La lógica financiera debe residir en servicios especializados y no directamente en las vistas o controladores.

---

# Tipos de pago soportados

Actualmente se contemplan cuatro modalidades de pago:

1. Pago normal.
2. Adelanto de cuotas.
3. Abono extraordinario al ahorro acumulado.
4. Abono extraordinario a capital de crédito.
5. Refinanciación de un crédito 

Cada modalidad posee reglas específicas documentadas en `REGLAS_NEGOCIO.md`.

---

# Configuración dinámica

Los siguientes parámetros deben administrarse desde el Panel SuperAdmin y almacenarse en la base de datos:

* Valor del aporte de solidaridad.
* Valor mínimo de aporte.
* Tasas de interés.
* Tasas de mora.
* Parámetros de seguro.
* Multiplicadores para créditos.
* Configuración de períodos.
* Parámetros financieros futuros.

No deben existir valores críticos codificados directamente en el sistema cuando puedan parametrizarse.

---

# Cierre de períodos

El sistema contempla cierres mensuales.

Durante el cierre mensual podrán ejecutarse procesos automáticos como:

* Identificación de socios en mora.
* Actualización de estados.
* Consolidación de información financiera.
* Preparación del siguiente período operativo.

---

# Seguridad

FONEVI implementará controles de acceso basados en roles, incluyendo:

* SuperAdmin.
* Tesorero.
* Administrador.
* Socio.

Cada rol contará únicamente con los permisos necesarios para sus funciones.

---

# Estrategia de respaldo

El sistema está diseñado para incorporar mecanismos robustos de respaldo y recuperación de información, incluyendo:

* Copias automáticas.
* Copias manuales desde el Panel SuperAdmin.
* Auditoría de operaciones críticas.
* Procedimientos documentados de restauración.

---

# Documentación del proyecto

La documentación oficial se encuentra en el directorio `/docs` e incluye, entre otros:

* Arquitectura.
* Reglas de negocio.
* Modelo de datos.
* Configuración.
* Seguridad.
* Backups.
* Flujos operativos.
* Historial de cambios.
* Decisiones de arquitectura.

---

# Estado del proyecto

FONEVI se encuentra en desarrollo activo con enfoque en calidad, mantenibilidad y preparación para un entorno de producción real.

Las funcionalidades se implementan priorizando estabilidad, documentación y escalabilidad antes que velocidad de desarrollo.
