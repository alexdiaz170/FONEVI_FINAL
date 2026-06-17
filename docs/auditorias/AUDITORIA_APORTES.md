# Auditoría — Módulo de Aportes

Fecha: 2026-06-16

1. Resumen ejecutivo.

El módulo de Aportes implementa las operaciones CRUD y el flujo de reparto de un pago entre solidaridad, crédito y ahorro. Las piezas clave están presentes: modelo relacional (`Aporte` en Prisma), servicio transaccional (`aporteService.create` y `update`), controlador REST (`aporteController`) y UI de registro/visualización (`pages/aportes.html`, `js/app.js`).

No obstante, el análisis revela múltiples incumplimientos de reglas de negocio críticas, inconsistencias lógicas y problemas de trazabilidad que hacen que el módulo NO sea confiable para un entorno financiero sensible sin correcciones. Los problemas más graves son:

- Lógica de distribución en `aporteService.create` que puede aplicar parcial o totalmente al capital del crédito incluso cuando la regla de negocio exige que, en pagos parciales, el restante NO se aplique al capital sino que vaya a ahorro.
- Falta de registro detallado de la distribución por aporte (no existe `aporte_detalle`): no quedan trazas de cuánto se destinó a interés, seguro, capital y ahorro por cada aporte.
- Inconsistencias en cómo se actualiza `ahorro_acumulado` (cálculo en `create` vs. actualizaciones en `update`/`delete`) — riesgo de des-sincronización y pérdidas contables.
- Ausencia de manejo explícito de los tipos de operación que el frontend ofrece (`tipoPago`), por lo que la semántica de "adelanto de cuotas", "abono a ahorro" o "abono a capital" no es respetada en backend.

En resumen: funcionalidad básica presente y transacciones usadas correctamente en partes, pero la capa financiera (distribución, trazabilidad, reversibilidad y cumplimiento de reglas) requiere revisión urgente.

2. Inventario de archivos analizados.

- backend/prisma/schema.prisma (modelo `Aporte`)
- backend/src/services/aporteService.js
- backend/src/controllers/aporteController.js
- backend/src/routes/aportes.js
- backend/src/services/creditoService.js
- backend/src/services/socioService.js
- backend/src/lib/mappings.js
- pages/aportes.html
- js/app.js
- backend/src/middleware/audit.js (uso desde controladores)

3. Clasificación por archivo:

- Conservar
  - `backend/prisma/schema.prisma` — el modelo básico existe y refleja relaciones necesarias; mantener pero extender (ver recomendaciones).
  - `backend/src/services/creditoService.js` — operaciones de crédito y cálculo de cuota útiles; conservar la lógica de pagos atómica.

- Refactorizar
  - `backend/src/services/aporteService.js` — contiene lógica transaccional y reparto; requiere cambios funcionales profundos para cumplir reglas de negocio, añadir trazabilidad y corregir bugs en actualización/eliminación de `ahorro_acumulado`.
  - `backend/src/controllers/aporteController.js` — validar y propagar `tipoPago` y manejar errores/validaciones más estrictas; no delega toda la validación a service.
  - `pages/aportes.html` / `js/app.js` — UI avanzada que ofrece tipos de operación; necesita sincronizarse con capacidades reales del backend y exponer resumenes basados en datos retornados por el servidor.
  - `backend/src/lib/mappings.js` — mapping de aportes debe incluir los nuevos campos de detalle cuando se agreguen (p. ej. `pago_interes`, `pago_seguro`, `detalle`).

- Archivar
  - Ningún archivo requiere archivado inmediato; conservar historial.

- Eliminar
  - No se recomienda eliminar archivos; en particular evitar `DELETE` físico en DB (no eliminar registros financieros).

4. Riesgos técnicos detectados.

- Violación de reglas de negocio en la distribución de pagos (ver sección 10): el código actual aplica remanente al capital en pagos parciales.
- Falta de `aporte_detalle` o ledger que documente descomposición del monto — imposibilita reconciliación y auditoría granular.
- Inconsistencias en actualizaciones de `ahorro_acumulado`:
  - `aporteService.create` recalcula `ahorro_acumulado` con una suma que usa `a.monto - pago_solidaridad - pago_credito` solo para aportes con estado `pagado`.
  - `aporteService.update` y `delete` actualizan `ahorro_acumulado` sumando o restando el `monto` entero en ciertos caminos, lo que puede producir desajustes y doble contabilización.
- Backend ignora `tipoPago` enviado por frontend (`abono_ahorro`, `abono_capital_credito`, `adelantar_cuotas`) — riesgo funcional y de UX.
- Uso de valores hardcoded (pagoSolidaridad = 5000) en lugar de configuración centralizada — pérdida de flexibilidad.
- Ausencia de registro explícito de interés y seguro por aporte (no hay columnas `pago_interes`, `pago_seguro`) y por tanto no se auditan ni contabilizan separadamente.
- Posibles problemas de rounding y precisión (uso de Decimal en Prisma mitigado, pero operaciones en JS y conversiones implican riesgos si no se controlan con Decimal libs consistentemente).

5. Riesgos funcionales detectados.

- No cumplimiento de "Pago parcial" — dinero restante puede aplicarse al capital, contrario a las reglas oficiales.
- "Adelanto de cuotas" no respeta tabla de amortización ni actualiza `cuotas_pagadas`/amortización; el aporte reduce `saldo_capital` pero no actualiza cuotas en `creditos` mediante la lógica de amortización.
- "Abono extraordinario a ahorro" y "Abono extraordinario al capital" no están implementados en backend (frontend envía `tipoPago` pero backend no lo usa), por lo que resultado depende del comportamiento por defecto del reparto.
- Pérdida de trazabilidad: interés y seguro no quedan registrados por aporte.
- Reversibilidad limitada: no existe una estructura clara de compensación o reversión con detalle de lo que se modificó en `creditos` y `socios`.

6. Código duplicado o muerto identificado.

- Duplicidad/incoherencia del cálculo de `ahorro_acumulado`: el cálculo en `create` (re-sum) y los updates/deletes (operaciones incrementales) no siguen la misma fórmula; este desajuste es una forma de duplicidad funcional peligrosamente inconsistente.
- Algunos fragments de UI repiten lógica de deducciones/estadísticas que deberían derivarse desde el servidor (ej. KPIs, acumulados) — duplicación entre cliente y servidor.
- No se detectó código muerto evidente en `aporteService` pero sí paths incompletos (delete/update que manipulan `ahorro_acumulado` de forma inconsistente), posiblemente restos de intentos de parches.

7. Problemas de arquitectura.

- Lógica financiera crítica embebida en servicios JS/SQL: mezcla de reglas de negocio complejas, cálculos y acceso directo a la base de datos en `aporteService` en vez de pasar por una capa de dominio / use-cases.
- Falta de un modelo de dominio (`Aporte` como agregado con invariantes) y ausencia de eventos/domain actions que garanticen trazabilidad.
- Ausencia de una tabla de detalle/ledger separada para contabilizar cada distribución parcial por aporte — dificulta auditoría y reporting contable.
- El frontend asume comportamientos y muestra previsiones de distribución (`na-resumen`) que no están garantizados por el backend, creando una discrepancia funcional.

8. Evaluación del modelo de datos de aportes.

- Prisma `Aporte` (extracto):
  - `id`, `socioId`, `periodoId`, `monto`, `fechaPago`, `estado`, `metodo`, `notas`, `pago_solidaridad`, `pago_credito`, `pago_solidaridad` y `pago_credito` (decimales), timestamps.
  - Relaciones: `periodo` y `socio`.

- Observaciones sobre el modelo:
  - Falta de campos críticos: `pago_interes`, `pago_seguro`, `detalle` (JSON) o relación `aporte_detalle[]`.
  - No hay `tipo_aporte`/`operacion` en schema (el frontend envía `tipoPago` pero no persiste en DB).
  - No existe `deleted_at` ni `auditable` fields específicos para un ledger de reversión.
  - El modelo actual permite conocer solo `pago_solidaridad` y `pago_credito` por aporte, insuficiente para cumplir trazabilidad y conciliación contable.

9. Compatibilidad con las reglas oficiales de negocio de FONEVI.

- Pago normal
  - Implementado parcialmente: existe reparto secuencial (solidaridad → interés → seguro → capital → ahorro) en `aporteService.create` cuando hay crédito activo.
  - Sin embargo, la implementación aplica cualquier remanente al capital aunque las reglas requieren una aplicación ordenada y condiciones adicionales (ver Pago parcial). Además falta registro explícito de intereses/seguros en la tabla `aportes`.

- Pago parcial
  - NO COMPATIBLE: la regla exige que si el dinero no alcanza, el resto NO se aplique parcialmente al capital sino que vaya a ahorro. El código aplica `pagoCred = restante` (tras pagar interés y seguro) y por tanto puede reducir capital parcialmente.

- Adelanto de cuotas
  - NO IMPLEMENTADO correctamente: `aporteService.create` actualiza `saldo_capital` pero no respeta tabla de amortización ni actualiza `cuotas_pagadas` o registra cuotas adelantadas; `creditoService.payInstallment` existe pero no es invocado desde el flujo de aporte para adelantar cuotas.

- Abono extraordinario al ahorro
  - Parcialmente compatible: si no hay crédito, restante se asigna a `ahorro` (en memoria/variable). Pero no existe ruta clara que trate expresamente `tipoPago=abono_ahorro` y no hay trazabilidad del tipo en DB.

- Abono extraordinario al capital
  - NO completamente soportado: no existe un handler explícito de `tipoPago=abono_capital_credito` que registre distribución detallada y mantenga amortización/tabla de cuotas.

- Reglas generales
  - Riesgo de pérdida de dinero por errores de distribución o doble contabilización debido a inconsistencias en el cálculo del ahorro y operaciones de delete/update.
  - Auditoría parcial: controlador llama a `audit` en crear/actualizar/eliminar aporte, pero no hay registro granular de cada ajuste en `creditos` y `socios` ni detalles de distribución por aporte.

10. Evaluación de la distribución de pagos.

- Flujo actual (resumen de `aporteService.create`):
  - fijo: `pagoSolid = 5000` (hardcoded)
  - restante = monto - pagoSolid
  - si existe crédito activo (primer crédito no pagado):
    - interes = saldo * (tasaMensual / 100)
    - seguro = saldo * 0.005
    - pagoInteres = min(restante, interes)
    - restante -= pagoInteres
    - pagoSeguro = min(restante, seguro)
    - restante -= pagoSeguro
    - pagoCred = restante
    - actualizar `creditos.saldo_capital = saldo - pagoCred` y `estado = 'pagado'` si saldo <= 0
  - si no existe crédito: ahorro = restante
  - registrar movimiento en `solidaridad_movimientos` por `pagoSolid`
  - recalcular `socios.ahorro_acumulado` con una SUM(...) sobre aportes con estado 'pagado' usando la fórmula `a.monto - pago_solidaridad - pago_credito`

- Evaluación:
  - El orden parcial (solidaridad → interés → seguro → capital → ahorro) está codificado, pero la regla explícita "Pago parcial: no aplicar remanente al capital" no se respeta.
  - No hay control para impedir aplicación parcial al capital cuando dinero insuficiente para cubrir cuota/obligación completa.
  - No hay registro individual de `pagoInteres` y `pagoSeguro` por aporte, lo que impide conciliación de ingresos financieros vs. amortización.
  - La asignación de `pagoSolid` está hardcoded y no se basa en configuración central, lo que dificulta cambios de política.

11. Evaluación de la trazabilidad financiera.

- Lo que sí se registra:
  - `aportes` con `pago_solidaridad` y `pago_credito`.
  - `solidaridad_movimientos` para el valor de solidaridad (beneficiario y monto).
  - Auditoría a nivel controlador para crear/actualizar/eliminar aportes.

- Lo que falta para trazabilidad completa:
  - Registro de `pago_interes` y `pago_seguro` por aporte.
  - Registro de detalles por aporte (por ejemplo, tabla `aporte_detalle` con filas: {aporte_id, cuenta, monto, tipo, referencia_credito}).
  - Historía inmutable de ajustes realizados por `update`/`delete` (audit trail detallado con antes/después de saldos y quién ejecutó la operación).
  - Registro de cómo un aporte impactó cuotas/tabla de amortización en un crédito (por ejemplo, filas que indiquen qué cuotas fueron pagadas/adelantadas).

12. Recomendaciones de mejora.

- Inmediatas (corrección de incumplimientos y bugs):
  - Corregir la regla de "Pago parcial": después de pagar solidaridad, interés y seguro, SI el monto no alcanza para cubrir la cuota completa (o la obligación definida por la tabla de amortización para el periodo), NO aplicar remanente al capital; en su lugar mover remanente a `ahorro_acumulado`.
  - Registrar explícitamente `pago_interes` y `pago_seguro` en la tabla `aportes` o mejor aún crear `aporte_detalle` para almacenar la descomposición completa.
  - Alinear `aporteService.update` y `aporteService.delete` con el cálculo que `create` usa para `ahorro_acumulado` (evitar restar o sumar el `monto` entero cuando la columna `ahorro_acumulado` fue calculada con otra fórmula).
  - Hacer configurable `pagoSolidaridad` desde `configuracion` en DB y evitar hardcoded `5000`.
  - Habilitar que `tipoPago` enviado desde frontend sea interpretado por backend y desencadene el flujo correcto (pago normal, abono ahorro, abono capital, adelanto cuotas).

- Mediano plazo (arquitectura y trazabilidad):
  - Añadir tabla `aporte_detalle` (o `aportes_detalle`) con campos: `id`, `aporte_id`, `tipo` (solidaridad, interes, seguro, capital, ahorro), `monto`, `credito_id?`, `created_at`. Registrar una fila por cada componente del reparto.
  - Implementar case de uso `ProcesarAporte` que coordine `AporteRepository`, `CreditoRepository` y `SocioRepository`, y emita eventos de dominio (`AporteProcesado`, `CreditoActualizado`).
  - Para "adelanto de cuotas", invocar un flow que utilice la tabla de amortización o `creditoService` para aplicar pagos a cuotas futuras y actualizar `cuotas_pagadas` correctamente.
  - Añadir reconciliación periódica que valide `ahorro_acumulado` vs. sumas de aportes y marque/alerta discrepancias.

- Largo plazo (contabilidad, auditoría y escalabilidad):
  - Separar capa contable: un ledger inmutable y un servicio que transforme operaciones en asientos contables.
  - Considerar evento financiero inmutable (event sourcing) para máxima trazabilidad y reconstrucción de saldos.
  - Diseñar API y modelo para multi-tenant (tenant_id en `socios`, `aportes`, `creditos` y particionamiento/filtrado por tenant).

13. Observaciones para migración futura hacia Clean Architecture, DDD y Monolito Modular.

- Clean Architecture
  - Crear interfaces `IAporteRepository`, `ICreditoRepository`, `ISocioRepository`. Extraer lógica de `aporteService` a casos de uso `RegistrarAporte`, `AnularAporte`, `ReconciliarAhorro`.
  - Mantener la puerta de entrada (controllers/routes) delgada; toda la lógica financiera se ejecuta en `usecases` y domain services.

- Domain-Driven Design (DDD)
  - Modelar `Socio` y `Credito` como agregados; `Aporte` puede ser un agregado o un evento dentro del agregado `Socio` con invariantes claros.
  - Definir eventos de dominio (`AporteRegistrado`, `PagoAplicado`, `AporteAnulado`) y persistir tanto en tablas de estado como en un store de eventos si la trazabilidad lo requiere.

- Monolito Modular
  - Organizar en módulos: `identity`, `socios`, `aportes`, `creditos`, `contabilidad` y `configuracion`. Cada módulo expone APIs internas claras.
  - Mantener la misma base de datos pero con boundaries y contratos, facilitando extracción a microservicios si se requiere.

14. Conclusión final.

El módulo de Aportes contiene la base para gestionar pagos y su relación con créditos y ahorro, incluyendo lógica transaccional. Sin embargo, incumple reglas de negocio críticas (especialmente la regla de Pago Parcial), carece de trazabilidad suficiente (no registra interés/seguro por aporte), contiene inconsistencias que pueden producir doble contabilización y tiene baja capacidad de reversión segura.

Antes de confiar este módulo para operaciones financieras de alto valor o para exportes contables, es imprescindible corregir la distribución de pagos según reglas oficiales, añadir un ledger/detalle por aporte, resolver inconsistencias en la actualización de `ahorro_acumulado` y sincronizar frontend/backend en la semántica de `tipoPago`.
