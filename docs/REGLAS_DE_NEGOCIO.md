# REGLAS DE NEGOCIO — FONEVI

## Objetivo

Este documento define las reglas funcionales y financieras oficiales del sistema FONEVI. Constituye la referencia única para desarrollo, mantenimiento, pruebas y auditoría.

**Toda implementación debe respetar estas reglas. En caso de discrepancia entre el código y este documento, prevalece lo aquí establecido.**

---

# 1. APORTES

## 1.1 Modalidades permitidas

El sistema soporta 4 modalidades operativas:

| #   | Modalidad         | Descripción                                                     |
| --- | ----------------- | --------------------------------------------------------------- |
| 1   | `cuota_normal`    | Pago ordinario del período vigente                              |
| 2   | `adelanto_cuotas` | Adelanto de aportes mensuales futuros (solo sin crédito activo) |
| 3   | `abono_ahorro`    | Abono extraordinario al ahorro acumulado                        |
| 4   | `abono_credito`   | Abono extraordinario a capital de crédito                       |

## 1.2 Cuota Normal (`cuota_normal`)

### Socio sin crédito activo

Distribución obligatoria (en orden):

1. **Solidaridad** — se descuenta el valor configurado (`valor_solidaridad`).
2. **Ahorro acumulado** — todo el excedente.

### Socio con crédito activo

Distribución obligatoria (en orden estricto):

1. **Solidaridad** — se descuenta el valor configurado.
2. **Intereses del crédito** — `Math.round(saldoCapital × tasaMensual / 100)`.
3. **Seguro del crédito** — `Math.round(saldoCapital × tasaSeguro)` donde `tasaSeguro = porcentaje_seguro / 1000`.
4. **Capital del crédito** — `cuotaFija - interes - seguro` (nunca negativo; si no alcanza, el excedente va a ahorro).
5. **Ahorro acumulado** — todo el remanente (incluyendo excedentes sobre la cuota programada).

### Pago parcial

Si el monto no alcanza para cubrir la cuota completa:

1. Solidaridad primero.
2. Intereses (limitado al restante).
3. Seguro (limitado al restante).
4. Si el remanente no cubre el capital programado → **no se abona parcialmente al capital**, el excedente va a ahorro.

## 1.3 Adelanto de Cuotas (`adelanto_cuotas`)

**Definición:** Un socio que NO tiene crédito activo desea adelantar uno o varios meses de aportes futuros.

**Reglas:**

- Solo aplica para socios **sin crédito activo**.
- Se calculan períodos completos: cada período = `valor_solidaridad + valor_ahorro_mensual`.
- `numPeriodos = Math.floor(montoTotal / costoPorPeriodo)`.
- **Solidaridad:** `numPeriodos × valor_solidaridad`.
- **Ahorro:** el remanente (`montoTotal - solidaridadTotal`).
- No hay intereses, seguro ni capital.
- Ejemplo: Socio adelanta Julio, Agosto, Septiembre. Monto = $390.000. $15.000 va a solidaridad, $375.000 a ahorro acumulado.

## 1.4 Abono Extraordinario al Ahorro (`abono_ahorro`)

**Definición:** Un socio incrementa su ahorro acumulado para aumentar su capacidad crediticia, sin adelantar períodos ni afectar créditos.

**Reglas:**

- **No descuenta solidaridad** (el socio ya pagó o pagará su cuota del mes por separado).
- **No afecta créditos** — no paga intereses, seguro ni capital.
- **100% del monto** va al ahorro acumulado.
- No adelanta períodos.
- No modifica el calendario de aportes futuros.
- Ejemplo: Socio tiene $1M de ahorro, quiere crédito de $10M (multiplicador 4x → necesita $2.5M). Hace abono de $1.5M → ahorro = $2.5M → capacidad = $10M.

## 1.5 Abono Extraordinario a Capital (`abono_credito`)

**Definición:** Pago adicional destinado exclusivamente a reducir el saldo del crédito.

**Reglas:**

- **No descuenta solidaridad.**
- **100% del monto** se aplica al capital del crédito.
- Reduce el saldo y por tanto los intereses futuros.
- No adelanta períodos de aportes.
- No incrementa el ahorro acumulado.
- No elimina la obligación de continuar con los aportes mensuales.

---

# 2. CRÉDITOS

## 2.1 Solicitud

- El socio debe estar en estado `activo` y `puedeSolicitarCredito()` debe retornar `true`.
- **Múltiples créditos:** Un socio puede tener más de un crédito activo o pendiente simultáneamente. La capacidad crediticia se calcula sobre el saldo disponible:
  ```
  capacidadBase = ahorroAcumulado × multiplicadorMaximoCredito
  deudaActiva = suma de saldoCapital de todos los créditos activos/pendientes del socio
  maximoDisponible = max(0, capacidadBase - deudaActiva)
  ```
- Límite: `monto <= maximoDisponible`.
- El crédito se crea en estado `pendiente`.

## 2.2 Aprobación

- Solo créditos en estado `pendiente` pueden ser aprobados.
- Transición: `pendiente → activo`.
- Se registra quién aprueba.

## 2.3 Tabla de Amortización

**Método:** Amortización francesa con tasa combinada.

```
r_combinada = (tasaMensual / 100) + tasaSeguro
factor = (r × (1+r)^n) / ((1+r)^n - 1)
Cuota fija = REDONDEO(Monto × factor)
```

Donde:

- `tasaSeguro = porcentaje_seguro / 1000`
- `tasaMensual` expresada en porcentaje (ej: 1% = 1)

**Distribución interna por período:**

```
Interés = REDONDEO(Saldo × tasaMensual / 100)
Seguro  = REDONDEO(Saldo × tasaSeguro)
Capital = Cuota fija - Interés - Seguro (mínimo 0)
Saldo   = Saldo anterior - Capital
```

**Redondeo:** Todos los valores se redondean a **enteros** (sin decimales).

**Última cuota:** El capital se ajusta para llevar el saldo a cero exacto.

**Regla fija:** La cuota fija (capital + interés + seguro) es constante durante toda la vigencia del crédito. Lo que varía es la distribución interna.

## 2.4 Estados del crédito

| Estado      | Descripción                               |
| ----------- | ----------------------------------------- |
| `pendiente` | Solicitado, pendiente de aprobación       |
| `activo`    | Aprobado y desembolsado, en curso         |
| `pagado`    | Saldo liquidado completamente             |
| `cancelado` | Anulado administrativamente (soft-delete) |

## 2.5 Pago de cuota

El pago de una cuota sigue la cuota fija combinada calculada al originar el crédito.

## 2.6 Cancelación

Cuando `saldoCapital <= 0`, el crédito pasa automáticamente a estado `pagado`.

---

# 3. MORA

## 3.1 Definición

Un socio entra en estado **mora** cuando:

- No realiza su **aporte mensual** (valor mínimo configurable, ej: $130.000) en el período vigente.
- No paga su **cuota de crédito** en la fecha correspondiente.

## 3.2 Efectos de la mora

- El socio pasa a estado `mora`.
- En cada nuevo aporte, el sistema intenta poner al socio al día.
- **No se generan intereses de mora adicionales.** La penalidad es la restricción de acceso a nuevos créditos mientras esté en mora.
- Cuando el socio se pone al día (no hay más aportes ni créditos en estado mora/vencido), su estado regresa a `activo`.

## 3.3 Notas

- La mora se determina por el estado de los **aportes** (estados `mora`, `vencido`) y el estado del **crédito**.
- No hay cálculo automático de intereses moratorios en la versión actual.

---

# 4. SOLIDARIDAD

- Valor configurable desde el panel de administración (`valor_solidaridad`).
- Se descuenta de cada aporte mensual (`cuota_normal` y `adelanto_cuotas`).
- **No se descuenta** en `abono_ahorro` ni `abono_credito`.
- Se registra como movimiento independiente para contabilidad y auditoría.

---

# 5. AHORRO ACUMULADO

El ahorro acumulado se incrementa mediante:

1. **Aportes normales** — el remanente después de solidaridad y crédito.
2. **Adelanto de cuotas** — monto restante después de solidaridad.
3. **Abono extraordinario al ahorro** — 100% del monto.
4. **Excedentes de pagos parciales** — cuando el monto no alcanza para cubrir el capital completo.

El ahorro acumulado determina la capacidad crediticia:

```
Capacidad máxima = ahorroAcumulado × multiplicadorMaximoCredito
```

---

# 6. REDONDEO

**Regla única:** Todos los valores financieros calculados por el sistema se redondean a **enteros** (sin decimales) usando `Math.round()`.

Esto aplica a:

- Cálculo de cuota fija.
- Intereses.
- Seguro.
- Capital.
- Saldos.
- Intereses de mora (si se implementan en el futuro).

Los montos se almacenan con precisión `DECIMAL(15,2)` en la base de datos, pero los valores ingresados y calculados son enteros.

---

# 7. CONFIGURACIÓN

Parámetros administrables desde el panel (no hardcodeados):

| Clave                          | Descripción                           | Default   |
| ------------------------------ | ------------------------------------- | --------- |
| `valor_solidaridad`            | Aporte mensual de solidaridad         | 5.000     |
| `porcentaje_seguro`            | Tasa de seguro (dividir /1000)        | 0.5       |
| `multiplicador_maximo_credito` | Multiplicador de capacidad crediticia | 4         |
| `valor_ahorro_mensual`         | Ahorro mensual base                   | 125.000   |
| `valor_minimo_aporte`          | Monto mínimo de aporte                | 125.000   |
| `tasa_interes_mensual`         | Tasa de interés mensual (%)           | 1         |
| `tasa_mora_mensual`            | Tasa de mora mensual (reservada)      | 0         |
| `reservas`                     | Fondo de reservas                     | 2.500.000 |

---

# 8. PRINCIPIOS GENERALES

1. Ninguna regla financiera se implementa únicamente en el frontend.
2. Las reglas de negocio se centralizan en el backend (capa de dominio).
3. La configuración variable no se hardcodea.
4. Toda operación crítica es trazable (auditoría).
5. No se eliminan físicamente registros financieros — se privilegia la conservación del historial (soft-delete).
6. La documentación se mantiene sincronizada con la evolución del sistema.

---

# 9. DOCUMENTO VIVO

Este archivo debe actualizarse cuando se incorporen nuevas reglas o se modifiquen las existentes. Su contenido es la referencia oficial para el comportamiento funcional de FONEVI.
