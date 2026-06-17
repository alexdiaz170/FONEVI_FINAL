# PLAN_MAESTRO_REMEDIACION_FONEVI.md

**Versión:** 1.0 (Documento Vivo)
**Fecha:** 2026-06-16
**Estado:** En construcción – basado en auditorías técnicas realizadas hasta la fecha.

---

# 1. Objetivo

Este documento consolida los principales hallazgos detectados durante las auditorías técnicas del sistema FONEVI y establece una hoja de ruta priorizada para llevar la plataforma a un estado apto para producción, garantizando:

* Integridad financiera.
* Consistencia de datos.
* Seguridad operacional.
* Trazabilidad completa.
* Mantenibilidad del código.
* Escalabilidad futura.

Este documento deberá actualizarse conforme se completen nuevas auditorías y se implementen las acciones correctivas.

---

# 2. Auditorías incorporadas

Actualmente este plan incorpora hallazgos provenientes de los siguientes módulos:

* Créditos
* Configuración General
* Configuración del Sistema
* Períodos y Cierre Mensual
* Reportes
* Solidaridad

Pendientes de incorporar:

* Aportes
* Autenticación y Usuarios
* Socios
* Dashboard
* WhatsApp / Notificaciones
* Otros módulos futuros

---

# 3. Principios rectores de la remediación

Todas las correcciones deberán respetar los siguientes principios:

1. Toda regla financiera debe ejecutarse exclusivamente en el backend.
2. Ningún cálculo crítico debe depender del frontend.
3. Toda operación financiera debe ser transaccional.
4. Toda modificación relevante debe quedar auditada.
5. No deben existir valores hardcodeados para parámetros de negocio.
6. Toda configuración debe provenir de una única fuente de verdad.
7. Los módulos deben desacoplarse mediante servicios especializados.
8. Debe privilegiarse la trazabilidad histórica sobre la simplicidad.

---

# 4. Hallazgos críticos (Prioridad P0)

## 4.1 Eliminar valores hardcodeados

### Problema

Existen parámetros financieros definidos directamente en el código fuente, incluyendo:

* Valor del aporte a solidaridad.
* Seguro de crédito.
* Diversas tasas y porcentajes.

### Riesgo

Las simulaciones pueden diferir de las transacciones reales, generando inconsistencias contables.

### Acción

Todos los parámetros financieros deberán obtenerse dinámicamente desde la configuración almacenada en la base de datos.

---

## 4.2 Implementar cierre mensual atómico

### Problema

El cierre mensual se ejecuta desde el frontend mediante múltiples llamadas independientes.

### Riesgo

Una interrupción puede dejar el sistema parcialmente cerrado.

### Acción

Crear un endpoint único de backend que:

* Ejecute el cierre completo.
* Utilice una transacción SQL.
* Permita simulación (dry-run).
* Genere auditoría.
* Verifique respaldo previo.
* Active el siguiente período únicamente al finalizar correctamente.

---

## 4.3 Bloqueo de períodos cerrados

### Problema

Los períodos cerrados pueden seguir modificándose.

### Riesgo

Alteración del histórico financiero.

### Acción

Implementar bloqueo lógico mediante campos como:

* cerrado_en
* cerrado_por
* bloqueado

y validar en backend toda modificación.

---

## 4.4 Seguridad del módulo Solidaridad

### Problema

Las rutas permiten registrar movimientos sin controles suficientes.

### Riesgo

Posibles retiros no autorizados del fondo.

### Acción

Restringir operaciones críticas a perfiles autorizados y validar saldo antes de aprobar egresos.

---

## 4.5 Validación de configuraciones

### Problema

Los parámetros pueden almacenarse con cualquier tipo de dato.

### Riesgo

Configuraciones inválidas afectan el comportamiento financiero.

### Acción

Agregar validaciones estrictas de tipo y rango antes de persistir cambios.

---

# 5. Hallazgos de alta prioridad (P1)

## 5.1 Crear entidad de cierre mensual

Crear una tabla `cierre_periodo` que almacene:

* período
* usuario que cerró
* fecha
* totales
* observaciones
* referencia al backup
* referencia al PDF generado

---

## 5.2 Implementar historial de configuraciones

Crear una entidad `configuracion_historial` para conservar:

* valor anterior
* valor nuevo
* usuario
* fecha
* IP
* motivo

---

## 5.3 Incorporar ledger financiero

Implementar tablas especializadas como:

* `aporte_detalle`
* `credito_movimiento`

para conservar el desglose exacto de cada operación.

---

## 5.4 Corregir consistencia entre módulos

Unificar el manejo del período activo para evitar discrepancias entre:

* tabla `periodos`
* configuración global
* dashboards
* reportes
* notificaciones

---

## 5.5 Eliminar lógica financiera del frontend

Los cálculos de:

* mora
* intereses
* cierres
* simulaciones oficiales

deben ejecutarse en backend.

---

# 6. Hallazgos de prioridad media (P2)

## 6.1 Centralizar Configuración

Crear un `ConfiguracionService` utilizado por todos los módulos.

---

## 6.2 Mejorar Reportes

Generar reportes oficiales desde backend utilizando información consolidada e inmutable.

---

## 6.3 Fortalecer Auditoría

Registrar eventos específicos para:

* cierres
* reaperturas
* cambios masivos
* modificaciones financieras
* aprobaciones especiales

---

## 6.4 Persistir desglose financiero

Guardar explícitamente:

* interés cobrado
* seguro
* solidaridad
* amortización
* ahorro

sin depender únicamente del cálculo posterior.

---

# 7. Hallazgos de baja prioridad (P3)

* Optimización de consultas SQL.
* Reducción de duplicación de lógica.
* Eliminación de funciones redundantes.
* Refactorización hacia servicios especializados.
* Mejora de exportaciones Excel/PDF.

---

# 8. Roadmap recomendado

## Fase 1 – Estabilización crítica

* Eliminar hardcodeados.
* Implementar validaciones backend.
* Corregir vulnerabilidades de autorización.
* Bloquear modificación de períodos cerrados.

## Fase 2 – Integridad financiera

* Crear `aporte_detalle`.
* Crear `credito_movimiento`.
* Implementar `cierre_periodo`.
* Incorporar transacciones completas.

## Fase 3 – Auditoría y trazabilidad

* Historial de configuración.
* Auditoría especializada.
* Ledger financiero.
* Versionado de parámetros.

## Fase 4 – Evolución arquitectónica

* Servicios desacoplados.
* Clean Architecture.
* DDD para agregados financieros.
* Preparación para multi-tenant.

---

# 9. Cambios estructurales recomendados

## Nuevas tablas

* aporte_detalle
* credito_movimiento
* cierre_periodo
* configuracion_historial

## Nuevos servicios

* ConfiguracionService
* PeriodoService
* CierrePeriodoService
* SolidaridadService
* ReporteService

---

# 10. Estado objetivo del sistema

Al finalizar este plan, FONEVI deberá cumplir con los siguientes criterios:

* Todas las operaciones financieras son transaccionales.
* Todos los parámetros son configurables y dinámicos.
* Existe trazabilidad completa de los movimientos.
* Los cierres mensuales son reproducibles y auditables.
* No existen inconsistencias entre simulación y ejecución.
* Los reportes representan fielmente el estado financiero.
* El sistema está preparado para crecimiento y futuras capacidades multi-tenant.

---

# 11. Conclusión

Las auditorías realizadas evidencian una base funcional sólida, pero con varias áreas críticas que deben corregirse antes de un despliegue en producción.

La prioridad inmediata debe centrarse en garantizar la consistencia financiera, eliminar reglas de negocio hardcodeadas, fortalecer la seguridad y consolidar un proceso de cierre mensual completamente transaccional.

Este documento constituye la hoja de ruta oficial para la remediación técnica de FONEVI y deberá actualizarse conforme se incorporen nuevas auditorías y se completen las acciones correctivas.
