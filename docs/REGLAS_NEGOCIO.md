# REGLAS_NEGOCIO.md

# Reglas de Negocio Oficiales de FONEVI

## Propósito

Este documento define las reglas funcionales y financieras oficiales del sistema FONEVI.

Todas las implementaciones del software deben respetar estas reglas. En caso de discrepancia entre el código y este documento, prevalecerá lo establecido aquí.

---

# 1. Aportes mensuales

Cada socio tiene una obligación mensual de realizar su aporte correspondiente al período vigente.

El aporte mensual puede componerse de diferentes conceptos dependiendo de si el socio posee o no un crédito activo.

---

# 2. Composición del pago mensual

## 2.1 Socio sin crédito

El aporte mensual está compuesto por:

1. Aporte de solidaridad.
2. Aporte al ahorro acumulado.

No existen componentes de interés, seguro o capital de crédito.

---

## 2.2 Socio con crédito activo

El pago mensual se distribuye en el siguiente orden:

1. Solidaridad.
2. Intereses del crédito.
3. Seguro del crédito.
4. Capital del crédito.
5. Ahorro acumulado.

Este orden es obligatorio para todos los cálculos realizados por el sistema.

---

# 3. Pago parcial

Cuando el valor pagado por el socio es inferior al requerido para cubrir completamente el período:

El dinero disponible se aplicará en el siguiente orden:

1. Solidaridad.
2. Intereses.
3. Seguro.

Si después de cubrir estos conceptos queda algún excedente que no alcanza para cubrir completamente el capital correspondiente del crédito:

* No se realiza un abono parcial al capital.
* El excedente restante se registra como incremento del ahorro acumulado del socio.

---

# 4. Tipos de pago soportados

Actualmente el sistema contempla cinco modalidades.

## 4.1 Pago normal

Corresponde al pago ordinario del período vigente.

La distribución se realiza conforme a las reglas generales establecidas.

---

## 4.2 Adelanto de cuotas

El socio puede pagar uno o varios períodos futuros por adelantado.

Características:

* Se adelantan períodos completos.
* Se actualiza el estado de dichos períodos como pagados.
* El capital del crédito se aplica conforme al plan de amortización correspondiente a cada período adelantado.
* El seguro y los intereses se liquidan según la tabla aplicable para cada cuota adelantada.

---

## 4.3 Abono extraordinario al ahorro acumulado

Permite incrementar directamente el ahorro del socio sin adelantar períodos.

Objetivos:

* Incrementar la capacidad crediticia.
* Fortalecer el patrimonio del socio.
* No modificar el calendario de aportes futuros.

Este tipo de operación:

* No adelanta cuotas.
* No modifica períodos.
* No afecta intereses.
* No afecta seguros.
* No afecta capital de créditos existentes.

---

## 4.4 Abono extraordinario a capital de crédito

Permite realizar pagos adicionales destinados exclusivamente a disminuir el saldo del crédito.

Características:

* Reduce directamente el capital pendiente.
* Disminuye los intereses futuros al reducir el saldo base.
* No adelanta períodos de aportes.
* No modifica el ahorro acumulado.
* No elimina la obligación de continuar aportando mensualmente.

---

## 4.5 Refinanciación de crédito

Funcionalidad prevista para futuras versiones.

Permitirá generar un nuevo plan de pagos conservando la trazabilidad histórica del crédito original.

---

# 5. Incremento de capacidad crediticia

Cuando un socio desea acceder a un crédito superior al permitido por su ahorro actual, podrá realizar un abono extraordinario al ahorro acumulado.

Este abono:

* Incrementa el ahorro.
* Incrementa la capacidad de endeudamiento.
* No adelanta cuotas futuras.
* No exime al socio de continuar realizando sus aportes mensuales.

---

# 6. Mora

El sistema realizará verificaciones periódicas para identificar obligaciones no cumplidas.

Un socio podrá pasar a estado de mora cuando existan períodos vencidos sin pago conforme a las políticas vigentes del fondo.

---

# 7. Cierre mensual

El sistema operará mediante cierres mensuales.

Durante cada cierre podrán ejecutarse procesos automáticos como:

* Verificación de pagos pendientes.
* Identificación de mora.
* Actualización de indicadores.
* Consolidación de movimientos.
* Preparación del siguiente período.

---

# 8. Parámetros configurables

Los siguientes valores no deben estar codificados directamente y deberán administrarse desde el Panel SuperAdmin:

* Valor del aporte de solidaridad.
* Valor mínimo de aporte.
* Tasas de interés.
* Tasas de mora.
* Parámetros de seguro.
* Multiplicador máximo para créditos.
* Configuración de períodos.
* Parámetros financieros futuros.

---

# 9. Trazabilidad

Todas las operaciones financieras relevantes deberán quedar registradas para efectos de auditoría.

Esto incluye, entre otras:

* Registro de aportes.
* Adelantos.
* Abonos extraordinarios.
* Créditos.
* Refinanciaciones.
* Cambios administrativos.
* Modificaciones de configuración.

---

# 10. Principio general

Las reglas financieras aquí documentadas representan el comportamiento oficial esperado por el Fondo de Empleados y constituyen la referencia funcional para todo el desarrollo futuro del sistema.
