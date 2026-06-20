# REGLAS_DE_NEGOCIO.md

# Reglas Oficiales de Negocio – FONEVI

## Objetivo

Este documento reúne las reglas funcionales que gobiernan el comportamiento del sistema FONEVI.

Constituye la referencia oficial para el desarrollo, mantenimiento, pruebas y auditoría del software.

---

# 1. Socios

## 1.1 Registro

Todo socio deberá contar con una identificación única dentro del sistema.

## 1.2 Estado

Un socio podrá encontrarse, entre otros, en estados como:

- Activo.
- Inactivo.
- Suspendido.

## 1.3 Acceso

Cada socio únicamente podrá consultar su propia información.

---

# 2. Aportes

## 2.1 Modalidades permitidas

El sistema soporta las siguientes modalidades:

1. Pago normal.
2. Adelanto de cuotas.
3. Abono extraordinario al ahorro acumulado.
4. Abono extraordinario a capital de crédito.
5. Refinanciación de crédito (funcionalidad futura).

---

## 2.2 Pago normal

### Socio sin crédito

Distribución:

1. Solidaridad.
2. Ahorro acumulado.

### Socio con crédito

Distribución obligatoria:

1. Solidaridad.
2. Intereses.
3. Seguro.
4. Capital del crédito.
5. Ahorro acumulado.

---

## 2.3 Pago parcial

Cuando el monto recibido no cubra completamente la obligación del período:

Se aplicará en el siguiente orden:

1. Solidaridad.
2. Intereses.
3. Seguro.

Si existe un excedente insuficiente para cubrir completamente el capital correspondiente:

- No se abonará parcialmente al capital.
- El excedente incrementará el ahorro acumulado del socio.

---

## 2.4 Adelanto de cuotas

Los adelantos deberán calcularse utilizando la tabla oficial de amortización.

No debe asumirse que el capital correspondiente a cada cuota es constante.

---

## 2.5 Abono extraordinario al ahorro acumulado

Características:

- Incrementa el ahorro acumulado.
- No adelanta períodos.
- No modifica el calendario normal de aportes.
- Puede aumentar la capacidad crediticia del socio.

---

## 2.6 Abono extraordinario a capital

Características:

- Reduce exclusivamente el saldo del crédito.
- Disminuye los intereses futuros.
- No adelanta períodos.
- No incrementa el ahorro acumulado.
- No elimina la obligación de continuar realizando aportes mensuales.

---

# 3. Créditos

## 3.1 Capacidad máxima

El monto máximo disponible dependerá del ahorro acumulado y del multiplicador configurado.

## 3.2 Tabla de amortización

Todo crédito deberá contar con una tabla de amortización que defina para cada período:

- **Capital**.
- **Intereses** (calculado como `saldo × tasaMensual`).
- **Seguro** (calculado como `saldo × 0.5 / 1000`).
- **Cuota fija total**: `Cuota = Capital + Interés + Seguro`.

El método de cálculo es **amortización francesa con tasa combinada**:

```
r_combinada = (tasaMensual / 100) + tasaSeguro
Cuota fija = REDONDEO(Monto × r_combinada × (1 + r_combinada)^n / ((1 + r_combinada)^n - 1))
```

Donde `tasaSeguro = 0.5 / 1000 = 0.0005` y `tasaMensual` está expresada en porcentaje (ej: 1% = 1).

**Redondeo:** Todos los valores de la tabla de amortización se redondean a enteros (sin decimales).

**Distribución interna por período:**

```
Interés = REDONDEO(Saldo × tasaMensual / 100)
Seguro  = REDONDEO(Saldo × 0.5 / 1000)
Capital = Cuota fija - Interés - Seguro
Saldo   = Saldo anterior - Capital
```

En la última cuota, el capital se ajusta para llevar el saldo a cero exacto.

La cuota total (capital + interés + seguro) es **completamente fija** durante toda la vigencia del crédito. Lo que varía mes a mes es la distribución interna: el interés y el seguro disminuyen porque el saldo baja, mientras que el abono a capital aumenta.

Esta tabla será la referencia oficial para cálculos posteriores.

## 3.3 Pago de cuota (PagarCuotaUseCase)

El pago de una cuota individual también utiliza la cuota fija combinada (capital + interés + seguro) calculada al momento de originación del crédito. El seguro se descuenta del total antes de aplicar al capital.

## 3.4 Cancelación

Cuando el saldo llegue a cero, el crédito cambiará automáticamente al estado **Pagado**.

## 3.4 Refinanciación

La refinanciación conservará el historial del crédito original y generará un nuevo esquema de pagos.

---

# 4. Solidaridad

El aporte de solidaridad:

- Se configura desde el Panel SuperAdmin.
- Se recauda según las reglas vigentes.
- Debe registrarse como movimiento independiente para efectos contables y de auditoría.

---

# 5. Ahorro acumulado

El ahorro acumulado podrá incrementarse mediante:

- Pagos normales.
- Abonos extraordinarios al ahorro.
- Excedentes provenientes de pagos parciales conforme a estas reglas.

El ahorro acumulado es uno de los factores utilizados para determinar la capacidad crediticia del socio.

---

# 6. Configuración

Los siguientes parámetros deberán administrarse desde la base de datos y el Panel SuperAdmin:

- Tasas de interés.
- Tasas de mora.
- Valor del seguro.
- Valor de solidaridad.
- Multiplicador de crédito.
- Período activo.
- Demás parámetros institucionales.

---

# 7. Cierre mensual

El sistema opera por períodos mensuales.

El cierre:

- Debe ejecutarse mediante una acción explícita de un usuario autorizado.
- Debe validar previamente la consistencia de la información.
- Debe actualizar los estados correspondientes.
- Debe preparar el siguiente período operativo.

---

# 8. Mora

El sistema podrá clasificar aportes o créditos en mora conforme a las políticas vigentes del Fondo.

Las reglas específicas podrán parametrizarse en futuras versiones.

---

# 9. Auditoría

Las operaciones relevantes deberán registrar información suficiente para reconstruir su ejecución.

Entre ellas:

- Configuración.
- Créditos.
- Aportes.
- Cierres.
- Respaldos.
- Restauraciones.
- Acciones administrativas.

---

# 10. Respaldos

El sistema deberá contar con mecanismos que permitan proteger la información mediante respaldos y procedimientos documentados de recuperación.

---

# 11. Evolución del modelo de datos

Se prevé incorporar una estructura de detalle de aportes (`aporte_detalle` o equivalente) que registre explícitamente la distribución de cada aporte en conceptos como:

- Solidaridad.
- Intereses.
- Seguro.
- Capital del crédito.
- Ahorro acumulado.

Esta mejora busca fortalecer la trazabilidad y facilitar auditorías y reportes.

---

# 12. Principios generales

- Ninguna regla financiera deberá implementarse únicamente en el frontend.
- Las reglas de negocio deberán centralizarse en el backend.
- La configuración variable no debe codificarse directamente en el software.
- Toda operación crítica deberá ser trazable.
- La documentación deberá mantenerse sincronizada con la evolución funcional del sistema.

---

# Documento vivo

Este archivo deberá actualizarse cuando se incorporen nuevas reglas o se modifiquen las existentes.

Su contenido constituye la referencia oficial para el comportamiento funcional de FONEVI.
