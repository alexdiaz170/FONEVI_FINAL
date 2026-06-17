PLAN_MAESTRO_REMEDIACION_FONEVI.md 
## Estado del documento - Versión: 0.1 (Parcial) 
- Fecha: 2026-06-16 - Estado: En construcción 
- Objetivo:
Consolidar los hallazgos de las auditorías técnicas realizadas sobre FONEVI y establecer un plan de remediación priorizado para alcanzar una plataforma segura, consistente, auditable y preparada para producción. --- 
## 1. Objetivos estratégicos 
El proceso de remediación busca que FONEVI cumpla los siguientes principios: 
- Integridad financiera y contable. 
- Consistencia transaccional. 
- Trazabilidad completa de operaciones. 
- Eliminación de lógica hardcodeada. 
- Parametrización centralizada. 
- Arquitectura modular y mantenible. 
- Compatibilidad con operación multi-entidad (futuro SaaS). 
- Preparación para auditorías financieras y regulatorias. --- 
# 2. Resumen de auditorías realizadas Hasta la fecha se han auditado los siguientes módulos: 
- Aportes 
- Autenticación y Usuarios 
- Configuración General 
- Créditos 
- Configuración del Sistema 
- Períodos y Cierre Mensual 
- Reportes - Socios 
- Solidaridad Pendientes de auditoría (si existen en futuras fases) deberán incorporarse a este documento. --- 
# 3. Priorización global 
🔴 Prioridad P0 — Crítico (bloquea producción) 
## 3.1 Eliminar valores hardcodeados Se detectaron parámetros financieros codificados directamente en el backend: 
- aporte de solidaridad 
- seguro de crédito 
- porcentajes financieros 
- reglas de distribución 
Todos deben obtenerse desde la configuración oficial del sistema. --- 
## 3.2 Implementar cierre mensual transaccional Actualmente el cierre se ejecuta desde el frontend mediante múltiples llamadas independientes. 
Debe migrarse a: 
- un único endpoint backend; 
- ejecución atómica; 
- rollback automático; 
- generación de auditoría; 
- soporte para simulación (dry-run); 
- respaldo previo obligatorio. 
--- 
## 3.3 Bloqueo de períodos cerrados Debe impedirse modificar: 
- aportes; 
- créditos; 
- solidaridad; 
- movimientos; 
cuando el período se encuentre cerrado, salvo autorización administrativa especial. 
--- 
## 3.4 Corregir vulnerabilidades del módulo de Solidaridad Se identificó: 
- falta de validación de roles; 
- posibilidad de registrar egresos sin autorización; 
- ausencia de validación de saldo; 
- pérdida de sincronización con aportes. 
--- 
## 3.5 Validación obligatoria en backend Las reglas de negocio no pueden depender únicamente del frontend. 
El backend debe validar: 
- límites de crédito; 
- tasas; - montos; 
- antigüedad; 
- saldo disponible; 
- parámetros financieros; 
- estados permitidos. 
--- 
## 3.6 Centralizar el período activo Eliminar inconsistencias entre: 
- `configuracion.periodo_actual` 
- tabla `periodos` Debe existir una única fuente oficial de verdad. 
--- 
## 3.7 Corregir errores funcionales críticos Incluye bugs detectados durante auditoría, como errores de ejecución en controladores y consultas inconsistentes. --- 
# 4. Prioridad P1 
— Alta 
## 4.1 Crear `aporte_detalle` Registrar de forma desagregada cada componente del aporte: 
- ahorro; 
- capital crédito; 
- interés; 
- seguro; 
- solidaridad; 
- otros conceptos futuros. 
Beneficios: 
- auditoría completa; 
- conciliación; 
- reportes financieros precisos.
--- 
## 4.2 Crear `credito_movimiento` 
Implementar un ledger completo del crédito para registrar: 
- desembolsos; 
- pagos; 
- intereses; 
- seguros; 
- refinanciaciones; 
- ajustes; 
- reversos. 
--- 
## 4.3 Implementar `cierre_periodo` 
Nueva entidad para registrar: 
- usuario responsable; 
- fecha de cierre; 
- período; 
- totales; 
- observaciones; 
- respaldo asociado; 
- reporte generado. 
--- 
## 4.4 Implementar `configuracion_historial` 
Guardar: 
- valor anterior; 
- valor nuevo; 
- usuario; 
- fecha; 
- dirección IP (si aplica). 
--- 
## 4.5 Eliminar duplicidad de lógica 
Centralizar reglas compartidas que actualmente aparecen replicadas entre: 
- frontend; 
- backend; 
- simuladores; 
- reportes. 
--- 
# 5. Prioridad P2 
— Media 
## 5.1 Refactorizar Reportes 
- mover cálculos críticos al backend; 
- generar reportes oficiales desde servidor; 
- garantizar consistencia con la base de datos. 
--- 
## 5.2 Mejorar Dashboard 
- indicadores centralizados; 
- consultas optimizadas; 
- eliminación de cálculos redundantes. 
--- 
## 5.3 Normalizar relaciones Especialmente en: 
- solidaridad; 
- beneficiarios; 
- referencias cruzadas; 
- integridad referencial. 
--- 
## 5.4 Mejorar simuladores 
Alinear simulaciones con la lógica real del backend para evitar discrepancias. 
--- 
# 6. Prioridad P3 
— Baja 
- mejoras visuales; 
- optimización de experiencia de usuario; 
- exportaciones avanzadas; 
- nuevos gráficos; 
- indicadores adicionales. 
--- 
# 7. Mejoras estructurales recomendadas 
## Arquitectura Migrar progresivamente hacia una arquitectura modular con separación clara entre: 
- Rutas 
- Controladores 
- Servicios 
- Repositorios 
- Dominio 
- Persistencia 
--- 
## Modelo de datos Evaluar incorporación de: 
- `aporte_detalle` 
- `credito_movimiento` 
- `cierre_periodo` 
- `configuracion_historial` 
- mejoras en `periodos` 
- mejoras en `solidaridad_movimientos` 
--- 
## Auditoría Toda operación crítica debe quedar registrada: 
- quién; 
- cuándo; 
- qué cambió; 
- valores anteriores; 
- valores nuevos; 
- contexto de ejecución. 
--- 
## Transacciones Las operaciones financieras deben ejecutarse mediante transacciones atómicas, especialmente: 
- pagos; 
- desembolsos; 
- cierres; 
- anulaciones; 
- refinanciaciones. 
--- 
# 8. Principios obligatorios para futuras implementaciones 
1. No introducir valores hardcodeados. 
2. Toda regla financiera debe ser parametrizable. 
3. Toda modificación debe ser auditable. 
4. Toda operación crítica debe ser transaccional. 
5. Los reportes deben derivarse de datos oficiales persistidos. 
6. El frontend nunca debe ser la única barrera de validación. 
7. Mantener compatibilidad con una futura operación multi-entidad. 
--- 
# 9. Estado actual ## Preparación para producción Resultado: ❌ NO APTO PARA PRODUCCIÓN. 

Las auditorías realizadas evidencian que existen riesgos funcionales, financieros y de seguridad que deben resolverse antes de una puesta en marcha. 
--- 
# 10. Estrategia de ejecución recomendada 
1. Resolver todos los puntos P0. 
2. Implementar el nuevo modelo financiero (`aporte_detalle`, `credito_movimiento`, `cierre_periodo`). 
3. Refactorizar reportes y dashboard. 
4. Fortalecer auditoría y trazabilidad. 
5. Realizar pruebas integrales y de regresión. 
6. Autorizar despliegue únicamente tras validar consistencia funcional y financiera. 
::: Este documento puede convertirse en la guía central del proyecto. A medida que completemos nuevas auditorías o implementemos correcciones, iremos actualizando este plan para mantener una visión única del estado técnico de FONEVI.