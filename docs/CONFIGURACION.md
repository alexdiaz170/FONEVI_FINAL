# CONFIGURACION.md

# Configuración General de FONEVI

## Objetivo

Definir los parámetros globales del sistema que deben ser administrables desde el Panel SuperAdmin y persistirse en la base de datos.

La filosofía de FONEVI es que las reglas operativas susceptibles de cambiar con el tiempo no deben requerir modificaciones al código fuente.

---

# Principios generales

* Los parámetros deben almacenarse en la base de datos.
* Los cambios deben surtir efecto sin recompilar la aplicación.
* Toda modificación debe quedar registrada en auditoría.
* Solo el rol **SuperAdmin** podrá modificar estos valores.

---

# Parámetros financieros

## Aporte de solidaridad

Valor fijo correspondiente al aporte destinado al Fondo de Solidaridad.

Ejemplo:

* `$5.000`

---

## Aporte mínimo

Valor mínimo permitido para registrar un aporte.

---

## Tasa de interés para créditos

Porcentaje aplicado al cálculo de intereses de los créditos.

Puede definirse como:

* Mensual.
* Anual.
* Efectiva.

La modalidad utilizada debe quedar claramente documentada.

---

## Tasa de mora

Porcentaje aplicado cuando corresponda el cálculo de intereses moratorios.

---

## Seguro del crédito

Configuración utilizada para calcular el valor del seguro asociado a cada crédito.

Puede expresarse como:

* Valor fijo.
* Porcentaje del saldo.
* Fórmula parametrizable.

---

## Multiplicador máximo de crédito

Número de veces que el ahorro acumulado puede utilizarse como base para determinar el monto máximo de crédito.

Ejemplo:

* `3 × ahorro acumulado`

---

# Parámetros operativos

## Período activo

Define el período oficial de trabajo del sistema.

Ejemplo:

* Enero 2026.
* Febrero 2026.

---

## Tipo de cierre

Actualmente:

* Mensual.

---

## Detección automática de mora

Permite activar o desactivar el proceso automático que identifica obligaciones vencidas.

---

# Parámetros institucionales

* Nombre oficial del fondo.
* NIT.
* Representante legal.
* Información de contacto.
* Logo institucional.
* Datos utilizados en certificados y reportes.

---

# Panel SuperAdmin

Desde este módulo deberán poder administrarse todos los parámetros anteriores mediante una interfaz amigable.

Las modificaciones deberán:

* Validarse antes de guardarse.
* Persistirse inmediatamente.
* Registrar usuario, fecha y valor anterior en auditoría.

---

# Parámetros futuros previstos

La arquitectura debe permitir incorporar nuevos parámetros sin modificar la lógica general del sistema.

Ejemplos:

* Nuevas líneas de crédito.
* Nuevos seguros.
* Nuevas tasas.
* Límites regulatorios.
* Políticas especiales.
* Configuración de beneficios.

---

# Regla fundamental

Ningún valor financiero que pueda variar con el tiempo debe quedar codificado directamente en el software cuando exista la posibilidad razonable de administrarlo mediante configuración.
