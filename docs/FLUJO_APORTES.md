# FLUJO_APORTES.md

# Flujo Oficial de Procesamiento de Aportes – FONEVI

## Objetivo

Definir el comportamiento que debe seguir el sistema al registrar cualquier tipo de aporte realizado por un socio.

Las reglas descritas aquí son la referencia oficial para la implementación de la lógica financiera.

---

# 1. Inicio del proceso

El proceso comienza cuando el tesorero registra un pago desde el módulo de aportes.

Información mínima requerida:

* Socio.
* Valor pagado.
* Período (cuando aplique).
* Fecha.
* Método de pago.
* Tipo de operación.

---

# 2. Tipos de operación

El sistema debe permitir seleccionar una de las siguientes modalidades:

1. Pago normal.
2. Adelantar cuotas.
3. Abono extraordinario al ahorro acumulado.
4. Abono extraordinario a capital de crédito.
5. Refinanciación de crédito (funcionalidad futura).

---

# 3. Pago normal

## Socio sin crédito

El monto pagado se distribuye en:

1. Aporte de solidaridad.
2. Ahorro acumulado.

No existen componentes de interés, seguro o capital.

---

## Socio con crédito

El monto pagado se distribuye en el siguiente orden:

1. Solidaridad.
2. Intereses.
3. Seguro.
4. Capital del crédito.
5. Ahorro acumulado.

Este orden es obligatorio.

---

# 4. Pago parcial

Cuando el monto entregado no alcanza para cubrir completamente la obligación del período:

El sistema aplicará el dinero en el siguiente orden:

1. Solidaridad.
2. Intereses.
3. Seguro.

Si aún queda un excedente insuficiente para cubrir completamente el capital correspondiente:

* No se realiza un abono parcial al capital.
* El valor restante se registra como incremento del ahorro acumulado del socio.

---

# 5. Adelanto de cuotas

El socio podrá pagar uno o varios períodos futuros.

El sistema deberá:

* Identificar los períodos siguientes.
* Marcarlos como pagados.
* Aplicar la amortización conforme al plan oficial de pagos.
* Liquidar los conceptos correspondientes a cada cuota adelantada.

No se debe asumir que todas las cuotas tienen el mismo valor de capital.

Cada cuota deberá obtenerse de la tabla de amortización correspondiente.

---

# 6. Abono extraordinario al ahorro acumulado

Su objetivo es incrementar el ahorro del socio.

Características:

* No adelanta períodos.
* No modifica cuotas futuras.
* No altera el calendario de aportes.
* Incrementa directamente el ahorro acumulado.
* Puede aumentar la capacidad de endeudamiento del socio.

---

# 7. Abono extraordinario a capital de crédito

Permite reducir directamente el saldo del crédito.

Características:

* Disminuye el capital pendiente.
* Reduce los intereses futuros al existir un menor saldo base.
* No adelanta períodos.
* No modifica el ahorro acumulado.
* No elimina la obligación de continuar realizando aportes mensuales.

---

# 8. Refinanciación (futuro)

La refinanciación generará un nuevo plan de pagos manteniendo la trazabilidad del crédito original.

No deberá eliminar información histórica.

---

# 9. Actualización del ahorro acumulado

Siempre que una operación incremente el ahorro del socio, el sistema deberá actualizar el saldo acumulado correspondiente.

Esto aplica especialmente para:

* Pago normal de socios sin crédito.
* Pago normal cuando exista componente destinado al ahorro.
* Abonos extraordinarios al ahorro.
* Excedentes provenientes de pagos parciales según las reglas oficiales.

---

# 10. Actualización del crédito

Cuando una operación afecte el crédito:

* Debe recalcularse el saldo pendiente.
* Deben actualizarse los indicadores correspondientes.
* Si el saldo llega a cero, el crédito deberá cambiar a estado "Pagado".

---

# 11. Registro en auditoría

Toda operación deberá conservar trazabilidad suficiente para identificar:

* Usuario que registró la operación.
* Fecha y hora.
* Socio afectado.
* Tipo de operación.
* Valor total.
* Distribución aplicada.
* Observaciones registradas.

---

# 12. Registro de movimientos

El sistema deberá generar los movimientos necesarios para mantener consistencia entre:

* Historial de aportes.
* Fondo de solidaridad.
* Créditos.
* Ahorro acumulado.
* Reportes financieros.

---

# 13. Resultado esperado

Al finalizar el proceso, el sistema deberá reflejar correctamente:

* Estado del aporte.
* Estado del período.
* Estado del crédito (si aplica).
* Saldo actualizado del ahorro acumulado.
* Saldo actualizado del crédito.
* Movimientos asociados.
* Información disponible para consultas, reportes y auditoría.

---

# Principio rector

La lógica de distribución de aportes debe implementarse de forma centralizada en servicios de negocio reutilizables. Ninguna vista o componente del frontend deberá contener reglas financieras propias.
