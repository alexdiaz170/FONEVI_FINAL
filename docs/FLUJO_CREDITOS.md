# FLUJO_CREDITOS.md

# Flujo Oficial de Gestión de Créditos – FONEVI

## Objetivo

Definir el ciclo de vida completo de los créditos otorgados por FONEVI, incluyendo su creación, desembolso, amortización, pagos, abonos extraordinarios y futuras refinanciaciones.

Este documento constituye la referencia funcional oficial para la implementación del módulo de créditos.

---

# 1. Solicitud de crédito

Un socio podrá solicitar un crédito siempre que cumpla las políticas definidas por el Fondo.

La solicitud deberá registrar como mínimo:

* Socio solicitante.
* Fecha de solicitud.
* Valor solicitado.
* Propósito del crédito.
* Plazo solicitado.
* Observaciones.

La aprobación del crédito dependerá de las reglas internas del Fondo y de las validaciones implementadas por el sistema.

---

# 2. Validación de capacidad crediticia

Antes de aprobar un crédito, el sistema deberá calcular la capacidad máxima del socio.

Como regla general:

Capacidad máxima = Ahorro acumulado × Multiplicador configurado.

El multiplicador será administrado desde el Panel SuperAdmin.

Si el monto solicitado supera la capacidad disponible, la solicitud deberá ser rechazada o ajustada según las políticas del Fondo.

---

# 3. Desembolso

Una vez aprobado:

* Se registra el crédito.
* Se genera el saldo inicial.
* Se calcula el plan de amortización.
* Se establece el número de cuotas.
* Se registra la tasa correspondiente.
* Se define el estado inicial como **Activo**.

---

# 4. Plan de amortización

Cada crédito deberá generar una tabla de amortización que contenga, para cada cuota:

* Número de cuota.
* Fecha estimada.
* Capital.
* Intereses.
* Seguro.
* Valor total.
* Estado.

Esta tabla constituye la referencia oficial para calcular pagos y adelantos.

---

# 5. Pago mensual ordinario

Cuando el socio realiza el pago correspondiente al período y posee un crédito activo, la distribución se efectúa en este orden:

1. Solidaridad.
2. Intereses.
3. Seguro.
4. Capital del crédito.
5. Ahorro acumulado.

---

# 6. Abono extraordinario a capital

El socio podrá realizar pagos adicionales destinados exclusivamente a disminuir el saldo pendiente del crédito.

Características:

* Reduce directamente el capital.
* Disminuye los intereses futuros al existir un menor saldo base.
* No adelanta períodos de aportes.
* No modifica el ahorro acumulado.
* No elimina la obligación de seguir realizando aportes mensuales.

---

# 7. Adelanto de cuotas

El socio podrá cancelar una o varias cuotas futuras.

El sistema deberá:

* Consultar la tabla oficial de amortización.
* Aplicar el capital correspondiente a cada cuota adelantada.
* Liquidar los intereses y seguros propios de dichas cuotas.
* Marcar las cuotas como pagadas.

No debe asumirse que el componente de capital es constante entre cuotas.

---

# 8. Pago parcial

Cuando el pago recibido no cubra completamente la obligación del período:

Se aplicará en el siguiente orden:

1. Solidaridad.
2. Intereses.
3. Seguro.

Si queda un excedente insuficiente para cubrir completamente el capital correspondiente:

* No se realizará un abono parcial al capital.
* El excedente restante incrementará el ahorro acumulado del socio.

---

# 9. Cálculo de intereses

Los intereses deberán calcularse utilizando los parámetros configurados por el Fondo.

El cálculo siempre deberá realizarse sobre el saldo vigente del crédito.

Cuando el capital disminuya por pagos extraordinarios, los intereses futuros deberán reducirse en consecuencia.

---

# 10. Seguro

El seguro asociado al crédito se liquidará conforme a la parametrización vigente.

Su cálculo podrá depender de:

* Valor fijo.
* Porcentaje del saldo.
* Fórmula configurable.

El valor deberá ser administrable desde el Panel SuperAdmin.

---

# 11. Estado del crédito

Los créditos podrán encontrarse, entre otros, en los siguientes estados:

* Activo.
* En mora.
* Pagado.
* Refinanciado (futuro).

El cambio de estado deberá realizarse automáticamente cuando corresponda.

---

# 12. Cancelación total

Cuando el saldo de capital llegue a cero:

* El crédito deberá marcarse como **Pagado**.
* Se conservará todo el historial asociado.
* No deberá eliminarse información financiera.

---

# 13. Mora

El sistema podrá identificar créditos con obligaciones vencidas y cambiar su estado a **En mora** según las políticas definidas por el Fondo.

Los parámetros relacionados con intereses moratorios deberán obtenerse desde la configuración del sistema.

---

# 14. Refinanciación (funcionalidad futura)

La refinanciación permitirá generar un nuevo esquema de pagos conservando el historial del crédito original.

Principios:

* No eliminar registros históricos.
* Mantener trazabilidad.
* Registrar claramente el vínculo entre el crédito original y el refinanciado.

---

# 15. Auditoría

Toda operación relevante sobre créditos deberá registrarse en el sistema de auditoría.

Ejemplos:

* Creación.
* Aprobación.
* Desembolso.
* Pago.
* Abono extraordinario.
* Refinanciación.
* Cancelación.
* Cambios administrativos.

---

# 16. Integridad financiera

Las operaciones sobre créditos deberán mantener consistencia con:

* Historial de aportes.
* Tabla de amortización.
* Estado financiero del socio.
* Reportes institucionales.
* Auditoría.

---

# Principio rector

Toda lógica relacionada con créditos deberá implementarse en servicios especializados del backend y basarse en la tabla oficial de amortización y en los parámetros configurables del sistema, evitando cálculos duplicados o reglas financieras embebidas en el frontend.
