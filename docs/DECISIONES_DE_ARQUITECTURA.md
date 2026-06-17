# DECISIONES_DE_ARQUITECTURA.md

# Registro Oficial de Decisiones de Arquitectura – FONEVI

## Propósito

Este documento registra las decisiones técnicas y funcionales relevantes tomadas durante el desarrollo de FONEVI.

Su objetivo es preservar el contexto y la justificación de cada decisión para facilitar el mantenimiento, la evolución del sistema y la incorporación de nuevos desarrolladores.

---

# DA-001 – El sistema está diseñado para producción real

## Decisión

FONEVI se desarrolla como una plataforma destinada a operar en un entorno productivo real y no como un prototipo o proyecto académico.

## Justificación

Las decisiones técnicas priorizan estabilidad, mantenibilidad, trazabilidad y escalabilidad por encima de la rapidez de implementación.

---

# DA-002 – Arquitectura por capas

## Decisión

El sistema se organiza en capas diferenciadas:

* Presentación.
* API REST.
* Controladores.
* Servicios de negocio.
* Repositorios.
* Base de datos.

## Justificación

Reduce el acoplamiento y facilita pruebas, mantenimiento y evolución.

---

# DA-003 – Configuración dinámica

## Decisión

Los parámetros financieros configurables no deben estar codificados directamente en el software.

## Ejemplos

* Valor del aporte de solidaridad.
* Tasas de interés.
* Tasas de mora.
* Porcentaje del seguro.
* Multiplicador máximo de crédito.
* Parámetros de períodos.

## Justificación

Permite que el SuperAdmin modifique reglas operativas sin desplegar una nueva versión.

---

# DA-004 – Panel SuperAdmin

## Decisión

Se implementará un Panel SuperAdmin con privilegios exclusivos para administrar configuraciones globales y procesos críticos.

## Responsabilidades previstas

* Configuración financiera.
* Gestión de períodos.
* Gestión de usuarios.
* Respaldos.
* Auditoría.
* Parámetros generales.

---

# DA-005 – Cierre de períodos mensual

## Decisión

El sistema operará con cierres mensuales.

## Justificación

Permite identificar oportunamente aportes pendientes, generar estados de mora y consolidar la información financiera de cada período.

---

# DA-006 – Cinco modalidades de pago

## Decisión

El sistema soporta las siguientes operaciones:

1. Pago normal.
2. Adelanto de cuotas.
3. Abono extraordinario al ahorro acumulado.
4. Abono extraordinario a capital de crédito.
5. Refinanciación de crédito (planificada).

## Justificación

Cada modalidad responde a necesidades operativas reales del Fondo de Empleados.

---

# DA-007 – Abonos extraordinarios al ahorro

## Decisión

Los aportes extraordinarios destinados a incrementar la capacidad crediticia no adelantan períodos.

## Justificación

Su finalidad es aumentar el ahorro del socio y, por tanto, su capacidad de endeudamiento, manteniendo intacto el calendario normal de aportes.

---

# DA-008 – Abonos extraordinarios a capital

## Decisión

Los abonos extraordinarios a capital reducen exclusivamente el saldo del crédito.

## Justificación

Disminuyen los intereses futuros sin modificar los períodos de aportes ni eliminar la obligación de seguir aportando mensualmente.

---

# DA-009 – Orden oficial de aplicación de pagos

## Decisión

Cuando un pago involucra obligaciones de crédito, la distribución se realiza en este orden:

1. Solidaridad.
2. Intereses.
3. Seguro.
4. Capital del crédito.
5. Ahorro acumulado.

## Justificación

Refleja la operación definida por el Fondo y constituye la regla oficial para el procesamiento financiero.

---

# DA-010 – Pago parcial

## Decisión

Si un pago no alcanza para cubrir completamente el capital correspondiente del crédito después de aplicar solidaridad, intereses y seguro, el excedente restante se incorpora al ahorro acumulado del socio.

## Justificación

Se evita registrar amortizaciones parciales de capital fuera de las reglas establecidas por el fondo.

---

# DA-011 – Preparación para refinanciaciones

## Decisión

La arquitectura debe permitir incorporar refinanciaciones sin rediseñar el sistema.

## Justificación

La refinanciación es una funcionalidad prevista para futuras versiones y debe poder integrarse preservando el historial del crédito original.

---

# DA-012 – Auditoría obligatoria

## Decisión

Las operaciones críticas deberán quedar registradas en un mecanismo de auditoría.

## Alcance

* Cambios de configuración.
* Operaciones financieras.
* Créditos.
* Respaldos.
* Restauraciones.
* Acciones administrativas relevantes.

---

# DA-013 – Estrategia de respaldos

## Decisión

El sistema contará con mecanismos de respaldo automáticos y manuales, así como procedimientos documentados de recuperación.

## Justificación

La información financiera debe protegerse frente a pérdidas accidentales o fallos operativos.

---

# DA-014 – Documentación como parte del producto

## Decisión

La documentación técnica y funcional forma parte integral del proyecto y debe mantenerse actualizada junto con el código.

## Incluye

* README.
* Arquitectura.
* Reglas de negocio.
* Modelo de datos.
* Configuración.
* Seguridad.
* Backups.
* Flujos operativos.
* Historial de cambios.
* Este registro de decisiones.

---

# Regla de mantenimiento

Toda nueva decisión arquitectónica o funcional relevante deberá añadirse a este documento indicando:

* Identificador.
* Descripción.
* Justificación.
* Impacto esperado.

Este registro constituye la referencia oficial para la evolución futura de FONEVI.
