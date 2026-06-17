# Auditoría — Módulo de Créditos

Fecha: 2026-06-16

## 1. Resumen ejecutivo

Estado general:

El módulo de Créditos en FONEVI ofrece las funcionalidades mínimas: simulación de crédito, creación/aprobación, listado, pago de cuotas y consultas. Contiene un servicio central (`creditoService`) con cálculos financieros, un controlador REST (`creditoController`) y rutas públicas. Hay intentos de validación (antigüedad mínima del socio) y operaciones transaccionales en cobros/actualizaciones.

Fortalezas:
- Presencia de `creditoService` con cálculo de cuota (`calcularCuota`) y operaciones transaccionales (`payInstallment`).
- Endpoint de simulación (`/simular`) reutiliza la lógica del servicio.
- Uso de tipos Decimal en Prisma para campos monetarios mitiga errores de precisión en almacenamiento.
- Integración con auditoría a nivel controlador (`audit`).

Debilidades y riesgos:
- Falta de modelado explícito de cronograma de cuotas (tabla `cronograma_cuotas` o `credito_detalle`) impide trazabilidad y conciliación exacta de pagos y amortización.
- Mezcla de lógica de negocio y acceso SQL en servicios y controladores (acoplamiento a infraestructura), lo que dificulta pruebas unitarias y migración a Clean Architecture.
- Cálculos financieros parcialmente hechos en JavaScript con `Number` (redondeos inconsistentes) y sin librería Decimal consistente en memoria.
- Inexistencia de registros detallados de movimientos de crédito (no hay `credito_movimiento` o `credito_detalle`), por tanto historia reconstruible limitada.
- Tratamiento insuficiente de refinanciación/restructuración: no hay soporte explícito ni campos para versiones/historial de restructuras.
- Posible eliminación física de créditos (delete) rompe la conservación histórica.

Nivel de madurez y preparación para producción:

Madurez: Moderada. El módulo es funcional para escenarios básicos y pruebas internas, pero no cumple requisitos estrictos de contabilidad ni trazabilidad exigidos por entornos financieros regulados.

Preparado para producción: No, no sin mejoras. Antes de producción se deben reforzar trazabilidad, precisión de cálculos, registros de detalle de pagos y políticas de conservación histórica; además endurecer validaciones y gestionar concurrencia/excepciones en flujos de cobro y refinanciación.

## 2. Inventario de archivos analizados

- backend/prisma/schema.prisma
- backend/src/services/creditoService.js
- backend/src/controllers/creditoController.js
- backend/src/routes/creditos.js
- backend/src/services/aporteService.js
- backend/src/services/socioService.js
- backend/src/lib/mappings.js
- backend/src/middleware/audit.js
- pages/creditos.html
- js/app.js (referencias a API.creditos)
- Otros archivos consultados: backend/src/services/aporteService.js (interacción pagos→crédito), backend/src/controllers/aporteController.js

## 3. Clasificación por archivo

- Conservar
  - `backend/prisma/schema.prisma` — mantener como fuente de verdad del esquema; soporta Decimal y relaciones clave.
  - `backend/src/services/creditoService.js` — conserva cálculos de cuota y operaciones transaccionales básicas; útil como núcleo funcional.

- Refactorizar
  - `backend/src/controllers/creditoController.js` — delegar validaciones y lógica compleja al service/use-cases; revisar logging/console usados en validaciones (evitar console.log en producción).
  - `backend/src/services/aporteService.js` — refactorizar la interacción con créditos: actualmente aporta lógica que aplica pagos a créditos (acoplamiento bidireccional). Extraer la coordinación a un caso de uso centralizado.
  - `backend/src/lib/mappings.js` — enriquecer `mapCredito` para exponer campos de detalle y referenciar cronograma cuando se agregue.
  - `pages/creditos.html` / `js/app.js` — UI que maneja simulador y pagos; debe alinearse con modelos de datos y exponer/consumir cronogramas y movimientos detallados.

- Archivar
  - Ningún archivo necesita archivado inmediato.

- Eliminar
  - No se recomienda eliminar archivos; en particular evitar `DELETE` físico de créditos.

## 4. Riesgos técnicos detectados

- Cálculos y precisión
  - Cálculos en JS usan `Number` y redondeos con `toFixed`/`Number(...)` en algunos puntos; combinar esto con campos Decimal en BD puede producir discrepancias si no se aplica una estrategia uniforme de precisión en memoria.

- Transacciones y concurrencia
  - `payInstallment` usa `FOR UPDATE` para bloquear fila del crédito (buena práctica), pero no hay protección explícita contra condiciones de carrera en otras rutas que puedan modificar el mismo crédito simultáneamente (p. ej. pagos desde aportes, ajustes manuales).

- Deuda técnica y acoplamiento
  - Lógica de amortización no está centralizada ni persistida; esto genera duplicidad (simulador vs realidad) y complica cálculos inversos (reconstrucción de saldo).

- Seguridad
  - Controladores usan `requireRole` en rutas sensibles; sin embargo, validaciones adicionales (por ejemplo, permisos basados en tenant o auditable actor) no están completas.

- Rendimiento
  - Consultas que calculan sumas o reconstructores podrían ser costosas en tablas grandes sin índices adecuados (p. ej. reconstructores de historial si se implementan mediante SELECT SUM sobre movimientos).

## 5. Riesgos funcionales detectados

- Saldos incorrectos
  - Ausencia de cronograma y detalle de movimientos significa que `saldo_capital` puede actualizarse sin guardar cómo se llegó a ese saldo (riegos en conciliación y reprocesos).

- Pagos mal aplicados
  - Flujos externos (por ejemplo `aporteService.create`) también pueden afectar `creditos.saldo_capital`. Sin un contrato/coordination layer, se puede aplicar pago doble o saltar validaciones de cuotas.

- Cuotas inconsistentes
  - No existe persistencia de la tabla de amortización; `cuotas_pagadas` se incrementa, pero no hay registro de cuáles cuotas están cubiertas ni fechas; dificulta detección de mora por cuota.

- Intereses mal liquidados
  - El cálculo de interés en `creditoService.calcularCuota` es el clásico para cuota fija, pero no hay evidencia de que la amortización mensual registre interés separado en cada cuota persistida.

- Créditos imposibles de cerrar o refinanciaciones erróneas
  - La ausencia de historial de restructuración y metadatos sobre versiones del crédito hace que refinanciaciones o reestructuraciones no sean trazables ni reversibles adecuadamente.

## 6. Código duplicado o muerto identificado

- Duplicidad funcional entre simulador (controller) y `calcularCuota` en `creditoService` — duplicidad controlable pero mantenida para conveniencia.
- Algunas comprobaciones (validación de socio/meses mínimos) están en controller con `console.log` y queries ad-hoc; podrían centralizarse.
- No se detectó código claramente muerto en `creditoService`, pero partes de validación y logs parecen parches temporales.

## 7. Problemas de arquitectura

- Falta de separación por capas
  - Controladores y servicios realizan consultas SQL directas (`db.query`) y lógica de negocio; no hay capa de repositorio ni use-cases, lo que dificulta pruebas y evolución.

- Responsabilidades mezcladas
  - `aporteService` y `creditoService` comparten responsabilidades sobre pagos y saldos; debe definirse un orquestador/coordination layer para evitar solapamientos.

- Oportunidades DDD
  - `Credito` debería modelarse como agregado con invariantes (saldo >= 0, cuotasPagadas <= cuotas, estado válido) y eventos de dominio (Desembolso, PagoCuota, AbonoCapital, Reestructuracion).

## 8. Evaluación del modelo de datos de Créditos

- Prisma `Credito` (extracto): campos `id`, `socioId`, `monto`, `tasaMensual`, `cuotas`, `cuotas_pagadas`, `saldo_capital`, `fecha_desembolso`, `estado`, `proposito`, `aprobado_por`, `notas`, timestamps.

Fortalezas:
- Modelado básico cubre monto, tasa, cuotas, saldo y estado; índices en `socioId` y `estado` ayudan consultas.

Debilidades:
- No existen entidades/ tablas para:
  - `cronograma_cuotas` (detalle por cuota: cuota, interes, capital, vencimiento, pagada)
  - `credito_movimiento` o `credito_detalle` (registro granular de pagos/ajustes)
  - `restructuracion` o `refinanciacion` (versiones y metadatos de cambios al contrato)
- `saldo_capital` se mantiene en columna, pero sin ledger histórico o trazabilidad detallada.

## 9. Compatibilidad con las reglas oficiales de negocio de FONEVI

### Solicitud de crédito
- Registro: soportado (`create`).
- Aprobación: parcialmente implícita (controller registra y hace `audit` con acción `APROBAR_CREDITO`).
- Rechazo: no hay flujo explícito de rechazo con motivos almacenados (se puede omitir creación; requiere registro de intentos/rechazos si es necesario).
- Desembolso: `create` acepta `fechaDesembolso` y crea el registro; no se visualiza un asiento contable/registro de desembolso en ledger.

### Cálculo del crédito
- Interés configurable: `tasaMensual` es campo editable; `calcularCuota` usa esa tasa.
- Seguro configurable: no hay campo para tasa de seguro por crédito; se asume seguro en otros módulos (ej. aportes usa 0.005), pero no centralizado.
- Cuotas configurables: soportado (campo `cuotas`).
- Cuota fija: calculada por `calcularCuota`.

### Pago de cuotas
- Pago normal: soportado vía `payInstallment` que aplica lógica de pago y reduce `saldo_capital`.
- Pago parcial: `payInstallment` incrementa `cuotas_pagadas` y ajusta `saldo_capital`; sin embargo no hay chequeo de que un pago parcial de cuota se maneje según reglas de negocio complejas (p.ej. intereses diferidos).
- Pago extraordinario / abono a capital: no hay endpoint específico; puede hacerse vía `pagarCuota` si se invoca con lógica apropiada, pero falta registro de que fue abono extraordinario.
- Adelanto de cuotas: no se detecta flujo automático para adelantar cuotas usando tabla de amortización.

### Cancelación anticipada
- Parcialmente soportado: si `payInstallment` reduce saldo a 0, se marca `pagado`; pero falta flujo específico de liquidación anticipada con cálculo de intereses proporcional y registro detallado.

### Mora
- Identificación de créditos en mora: existe `estado` y se usa en queries; sin embargo, sin cronograma persistido es difícil identificar morosidad por cuota vencida (solo por estado general o por aportes asociados).

### Refinanciación / Reestructuración
- No hay soporte explícito. Se necesita modelar versiones o contratos derivados para trazabilidad.

### Auditoría
- Auditoría a nivel controlador (acciones `APROBAR_CREDITO`, `PAGO_CUOTA`, `ACTUALIZAR_CREDITO`, `ELIMINAR_CREDITO`) existe, pero no suficiente para trazabilidad contable: faltan movimientos por cuota, abono y ajustes.

### Conservación histórica
- Eliminación física de créditos es posible (`delete`), lo que contraviene la conservación histórica; preferir soft-delete y ledger inmutable.

## 10. Evaluación del cálculo financiero

- Interés: `calcularCuota` utiliza fórmula de cuota fija amortizada (annuity). Es adecuada para cuotas constantes.
- Seguro: no hay campo por crédito; seguro aplicado en flujos de aportes (5000 deducidos y 0.005 en aporteService) pero no centralizado.
- Amortización: no hay persistencia de cronograma; `payInstallment` calcula interés sobre `saldo_capital` y determina capital pagado como diferencia con la cuota calculada, luego actualiza `cuotas_pagadas` y `saldo_capital`.
- Saldo y capital: `saldo_capital` actualizado en operaciones; pero sin cronograma ni detalle, las reconciliaciones son complejas.

Inconsistencias detectadas:
- Potencial discrepancia entre simulador (redondeos) y persistencia por uso de `Math.round` en controller vs Decimal en DB.
- Falta de cálculo de intereses prorrateados en pagos extraordinarios o liquidación anticipada.

## 11. Evaluación de la trazabilidad financiera

- Estado actual: posible reconstrucción parcial (registro del crédito, `cuotas_pagadas`, `saldo_capital`), pero no reconstrucción completa por falta de movimientos individuales o cronograma persistido.

- Recomendación de estructura faltante:
  - `credito_movimiento` o `credito_detalle` (aporte/abono/ajuste) con campos: `id`, `credito_id`, `tipo` (desembolso, pago_cuota, abono_capital, interes, seguro, ajuste), `monto`, `fecha`, `referencia_aporte_id?`, `created_by`, `metadata`.
  - `cronograma_cuotas` con fila por cuota: `credito_id`, `numero`, `vencimiento`, `capital`, `interes`, `cuota_total`, `pagado` y `pagado_en`.

## 12. Recomendaciones de mejora

### Inmediatas
- No permitir eliminación física de créditos; usar soft-delete y preservar historial.
- Registrar cada `payInstallment` como movimiento en `credito_movimiento` con detalle de capital e interés aplicado.
- Evitar console.log en controladores; usar logger estructurado y auditoría con actor.
- Asegurar coherencia de precisión: usar librería Decimal en memoria o Big.js para cálculos antes de persistir.

### Mediano plazo
- Crear `cronograma_cuotas` al aprobar/desembolsar el crédito y persistir la tabla de amortización.
- Implementar `credito_movimiento` ledger y migrar `payInstallment`/flows para crear movimientos atómicos en la misma transacción.
- Diseñar flujos explícitos para abonos extraordinarios, adelanto de cuotas, liquidación anticipada y refinanciación, con campos de metadata y versión.

### Largo plazo
- Replantear módulo hacia Clean Architecture: extraer `UseCases` (`RegistrarCredito`, `ProcesarPago`, `RefinanciarCredito`, `LiquidarCredito`) y repositorios.
- Implementar audit trail inmutable (event store o ledger) para reconstrucción y reporting contable.

## 13. Observaciones para futura migración

- Clean Architecture: controlar dependencias desde controllers → usecases → domain → repositories; mover SQL a repositories y lógica financiera al dominio.
- DDD: modelar `Credito` como agregado con invariantes y eventos de dominio; separar `Credito` y `OperacionCredito` (movimientos) como entidades.
- Monolito Modular: crear módulo `creditos` con API interna clara para `aportes` y `socios` (evitar llamadas directas entre servicios).
- Multi-tenant: añadir `tenant_id` a `creditos`, `cronograma_cuotas` y `credito_movimiento` y diseñar particionamiento; adaptar índices y conexiones DB si se usa database-per-tenant.

## Actualización para la documentación del proyecto

Añadiría explícitamente estas decisiones a la documentación arquitectónica y de reglas de negocio:

Mantener una estructura detallada por aporte (aporte_detalle) para registrar la distribución entre solidaridad, intereses, seguros, capital y ahorro.
Incorporar un historial detallado de movimientos de crédito (credito_movimiento) para garantizar trazabilidad completa.
Persistir el cronograma de amortización (cronograma_cuotas) para soportar pagos normales, pagos parciales, adelantos, refinanciaciones y análisis de mora.

## 14. Conclusión final

El módulo de Créditos es funcional y contiene elementos técnicos útiles, pero no está listo para producción en un entorno regulado sin mejoras significativas en trazabilidad, persistencia de cronogramas, precisión de cálculos y separación de responsabilidades. Riesgos críticos: falta de ledger/cronograma, posibilidad de saldos irreconciliables, eliminación física y cálculos inconsistentes entre memoria y BD. Implementar las recomendaciones inmediatas es condición obligatoria antes del uso en producción financiera sensible.
