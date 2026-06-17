# CHANGELOG.md

# Historial Oficial de Cambios – FONEVI

Este documento registra los cambios relevantes realizados en el proyecto FONEVI.

Su objetivo es proporcionar una referencia clara de la evolución funcional, técnica y arquitectónica del sistema.

---

# Formato

Cada entrada deberá incluir, cuando sea posible:

* Fecha.
* Versión.
* Tipo de cambio.
* Descripción.
* Impacto.

Tipos sugeridos:

* **Added** → Nueva funcionalidad.
* **Changed** → Cambio de comportamiento.
* **Fixed** → Corrección de errores.
* **Removed** → Eliminación de funcionalidades.
* **Security** → Mejoras de seguridad.
* **Docs** → Cambios en documentación.
* **Refactor** → Refactorizaciones sin cambios funcionales.

---

# Versión 1.0.0 (En desarrollo)

## Added

* Implementación del módulo de autenticación.
* Gestión de socios.
* Gestión de aportes.
* Gestión de créditos.
* Panel administrativo.
* Portal de consulta para socios.
* Indicadores financieros.
* Carné digital.
* Generación de estados de cuenta.
* Generación de paz y salvo.

## Changed

* Definición oficial del flujo de distribución de aportes para socios con crédito.
* Inclusión de modalidades diferenciadas de pago:

  * Pago normal.
  * Adelanto de cuotas.
  * Abono extraordinario al ahorro acumulado.
  * Abono extraordinario a capital de crédito.

## Docs

Se inició la documentación estructural del proyecto con los siguientes documentos:

* README.
* ARQUITECTURA_FONEVI.
* DECISIONES_DE_ARQUITECTURA.
* ROLES_Y_PERMISOS.
* CONFIGURACION.
* FLUJO_APORTES.
* FLUJO_CREDITOS.
* FLUJO_CIERRE_PERIODO.
* BACKUPS.
* SEGURIDAD.
* ROADMAP.
* CHANGELOG.

## Planned

Se planificó para futuras versiones:

* Panel SuperAdmin para administración de parámetros financieros.
* Configuración dinámica almacenada en base de datos.
* Asistente de Cierre Mensual guiado.
* Simulación previa del cierre mensual.
* Integración del cierre con verificación de respaldos.
* Estrategia avanzada de recuperación ante desastres.
* Refactorización del modelo de aportes mediante una estructura de detalle (`aporte_detalle` o equivalente).
* Refinanciación de créditos.
* Posible incorporación de autenticación de dos factores para usuarios privilegiados.

---

# Política de mantenimiento

Este archivo deberá actualizarse únicamente cuando existan cambios relevantes que afecten:

* Funcionalidad.
* Arquitectura.
* Seguridad.
* Modelo de datos.
* Procesos de negocio.
* Documentación oficial.

Los cambios menores de estilo o mantenimiento rutinario no requieren una nueva entrada.

---

# Objetivo

Mantener una trazabilidad clara de la evolución del sistema para facilitar auditorías, mantenimiento, soporte y futuras mejoras.
