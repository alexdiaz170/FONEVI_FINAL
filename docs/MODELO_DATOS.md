# MODELO_DATOS.md

# Modelo de Datos de FONEVI

## Objetivo

Este documento describe las principales entidades del sistema FONEVI, sus responsabilidades, relaciones y propósito funcional.

No pretende reemplazar el esquema SQL, sino servir como guía funcional y arquitectónica para el desarrollo y mantenimiento del sistema.

---

# Principales entidades

## 1. socios

Representa a cada afiliado del Fondo de Empleados.

### Información principal

* Identificador único.
* Código de socio.
* Nombre completo.
* Documento de identidad.
* Correo electrónico.
* Teléfono.
* Cargo.
* Sede.
* Fecha de ingreso.
* Estado del socio.
* Ahorro acumulado.
* Aporte mensual.

### Relaciones

* Un socio puede tener muchos aportes.
* Un socio puede tener varios créditos a lo largo de su historia.
* Un socio puede registrar múltiples pagos de crédito.
* Un socio puede consultar su estado de cuenta y métricas financieras.

---

## 2. periodos

Representa los períodos oficiales de recaudo del fondo.

Ejemplos:

* Enero 2026
* Febrero 2026
* Marzo 2026

### Responsabilidades

* Identificar el período de cada aporte.
* Facilitar cierres mensuales.
* Controlar estados de recaudo.

---

## 3. aportes

Registra todos los pagos realizados por los socios.

Cada registro representa una operación financiera realizada sobre un período específico.

### Campos relevantes

* Socio asociado.
* Período.
* Monto pagado.
* Fecha de pago.
* Estado.
* Método de pago.
* Notas.

### Información financiera asociada

* Valor destinado a solidaridad.
* Valor aplicado al capital del crédito.
* Valor incorporado al ahorro acumulado.

### Tipos de operación previstos

* Pago normal.
* Adelanto de cuotas.
* Abono extraordinario al ahorro.
* Abono extraordinario a capital.
* Refinanciación (cuando sea implementada).

---

## 4. creditos

Representa los créditos otorgados a los socios.

### Información principal

* Monto aprobado.
* Fecha de desembolso.
* Tasa de interés.
* Número de cuotas.
* Cuotas pagadas.
* Saldo de capital.
* Estado.
* Propósito.

### Estados posibles

* Activo.
* En mora.
* Pagado.
* Refinanciado (futuro).

---

## 5. pagos_credito

Almacena el detalle de amortización de cada crédito.

Cada registro representa una cuota o movimiento del plan de pagos.

### Puede incluir

* Número de cuota.
* Capital.
* Intereses.
* Seguro.
* Fecha prevista.
* Fecha efectiva de pago.
* Estado.

Esta tabla constituye la referencia oficial para aplicar adelantos y amortizaciones.

---

## 6. solidaridad_movimientos

Controla el movimiento del Fondo de Solidaridad.

### Tipos de movimiento

* Ingreso.
* Egreso.

### Ejemplos

* Recaudo por aportes.
* Auxilios otorgados.
* Ajustes administrativos.

---

## 7. configuracion

Contiene parámetros globales administrables desde el Panel SuperAdmin.

Ejemplos:

* Valor del aporte de solidaridad.
* Tasa de interés.
* Tasa de mora.
* Porcentaje del seguro.
* Multiplicador máximo de crédito.
* Configuración del período activo.

Ningún parámetro financiero configurable debería permanecer codificado directamente en la aplicación.

---

## 8. usuarios

Gestiona el acceso al sistema.

### Roles previstos

* SuperAdmin.
* Tesorero.
* Administrador.
* Socio.

Los permisos deberán administrarse mediante roles y no mediante lógica específica en las interfaces.

---

## 9. auditoria

Registra eventos relevantes del sistema.

Ejemplos:

* Cambios de configuración.
* Creación o modificación de créditos.
* Registro de aportes.
* Eliminación lógica de información.
* Restauraciones y respaldos.

---

# Relaciones principales

```text
Socio
 ├── Aportes
 ├── Créditos
 │      └── Pagos de crédito
 └── Estado financiero

Período
 └── Aportes

Configuración
 └── Parámetros globales

Usuarios
 └── Operación del sistema

Solidaridad
 └── Movimientos

Auditoría
 └── Registro de eventos críticos
```

---

# Principios de persistencia

* Los identificadores deben ser únicos y estables.
* Las operaciones financieras no deben eliminarse físicamente; se debe privilegiar la conservación del historial y la trazabilidad.
* Las modificaciones críticas deben quedar registradas en auditoría.
* Las reglas financieras deben implementarse en la lógica de negocio y apoyarse en los datos almacenados, evitando duplicar información innecesariamente.

---

# Evolución prevista

El modelo está preparado para incorporar nuevas entidades o ampliar las existentes con funcionalidades como:

* Refinanciaciones.
* Reestructuraciones de crédito.
* Productos financieros adicionales.
* Integraciones externas.
* Parametrización avanzada desde el Panel SuperAdmin.
