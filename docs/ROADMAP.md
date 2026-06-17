# ROADMAP.md

# Hoja de Ruta Oficial – FONEVI

## Objetivo

Definir las fases de evolución del sistema FONEVI, estableciendo prioridades de desarrollo para garantizar una implementación sólida, mantenible y orientada a producción.

---

# Estado actual del proyecto

## Base tecnológica

* Backend con API REST.
* Base de datos PostgreSQL.
* Frontend web.
* Sistema de autenticación y roles.
* Gestión de socios.
* Gestión de aportes.
* Gestión de créditos.
* Indicadores financieros.
* Panel administrativo.
* Portal para socios.

---

# Fase 1 – Consolidación funcional (Alta prioridad)

## Arquitectura

* Refactorizar lógica de negocio para reducir acoplamiento.
* Centralizar reglas financieras en servicios especializados.
* Completar documentación técnica y funcional.

## Aportes

* Implementar completamente los tipos de pago:

  * Pago normal.
  * Adelanto de cuotas.
  * Abono extraordinario al ahorro acumulado.
  * Abono extraordinario a capital de crédito.

## Créditos

* Ajustar el procesamiento conforme a la tabla oficial de amortización.
* Consolidar reglas de intereses y seguros.

## Panel SuperAdmin

* Gestión de parámetros financieros.
* Configuración institucional.
* Gestión de usuarios y roles.

---

# Fase 2 – Robustecimiento operativo

## Cierre mensual

Implementar un Asistente de Cierre con:

* Validaciones previas.
* Checklist operativo.
* Simulación del cierre.
* Resumen financiero.
* Confirmación explícita.
* Integración con respaldos.

## Auditoría

* Registro de operaciones críticas.
* Consulta histórica.
* Seguimiento de cambios.

## Respaldos

* Generación manual.
* Programación automática.
* Verificación de integridad.
* Restauración controlada.

---

# Fase 3 – Optimización del modelo financiero

## Detalle de aportes

Crear una estructura (`aporte_detalle` o equivalente) que registre la distribución de cada aporte en conceptos individuales, tales como:

* Solidaridad.
* Intereses.
* Seguro.
* Capital del crédito.
* Ahorro acumulado.

## Beneficios

* Mejor trazabilidad.
* Reportes más precisos.
* Auditorías simplificadas.
* Flexibilidad para nuevas reglas.

## Refinanciación de créditos

Incorporar soporte para:

* Reestructuración.
* Generación de nuevos planes.
* Conservación del historial.
* Relación entre crédito original y refinanciado.

---

# Fase 4 – Seguridad y administración avanzada

## Seguridad

* Autenticación reforzada.
* Registro de accesos.
* Protección de operaciones críticas.

## Posibles mejoras

* Autenticación de dos factores (2FA) para SuperAdmin y Tesorero.
* Historial ampliado de sesiones.
* Alertas de actividad inusual.

---

# Fase 5 – Inteligencia y automatización

## Reportes avanzados

* Indicadores históricos.
* Tendencias financieras.
* Comparativos entre períodos.

## Automatización

* Notificaciones.
* Recordatorios.
* Alertas de mora.
* Procesos programados.

---

# Fase 6 – Escalabilidad

## Mejoras estructurales

* Optimización de rendimiento.
* Escalabilidad horizontal.
* Caché de consultas frecuentes.
* APIs preparadas para integraciones.

## Integraciones futuras

* Pasarelas de pago.
* Sistemas contables.
* Servicios de mensajería.
* Firma electrónica.
* Aplicaciones móviles.

---

# Prioridades permanentes

Durante toda la evolución del proyecto deberán mantenerse como objetivos principales:

1. Integridad de la información financiera.
2. Trazabilidad completa de las operaciones.
3. Seguridad de los datos.
4. Facilidad de mantenimiento.
5. Configuración mediante Panel SuperAdmin.
6. Documentación actualizada.
7. Compatibilidad con futuras ampliaciones.

---

# Visión

FONEVI busca consolidarse como una plataforma profesional de administración para fondos de empleados, preparada para operar durante muchos años con altos estándares de calidad, seguridad, auditabilidad y capacidad de evolución.
