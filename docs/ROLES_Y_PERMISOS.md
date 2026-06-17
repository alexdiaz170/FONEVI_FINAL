# ROLES_Y_PERMISOS.md

# Roles y Permisos Oficiales de FONEVI

## Objetivo

Definir los niveles de acceso del sistema FONEVI garantizando el principio de mínimo privilegio: cada usuario solo podrá acceder a las funciones necesarias para desempeñar su labor.

---

# 1. SuperAdmin

## Descripción

Es el máximo nivel de administración del sistema.

Tiene acceso completo a todas las funcionalidades y es el único autorizado para modificar configuraciones globales del fondo.

## Permisos

### Configuración

* Administrar parámetros financieros.
* Modificar tasas.
* Modificar valores de solidaridad.
* Modificar seguros.
* Configurar multiplicadores de crédito.
* Configurar períodos.

### Administración

* Crear usuarios.
* Modificar usuarios.
* Desactivar usuarios.
* Gestionar roles.

### Base de datos

* Ejecutar procesos de respaldo.
* Restaurar respaldos autorizados.
* Consultar auditoría.

### Operación

* Acceso completo a todos los módulos.

---

# 2. Tesorero

## Descripción

Responsable de la operación financiera diaria del Fondo.

## Permisos

### Socios

* Consultar.
* Crear.
* Editar información administrativa.

### Aportes

* Registrar pagos.
* Registrar pagos parciales.
* Registrar adelantos.
* Registrar abonos extraordinarios.
* Registrar abonos a capital.

### Créditos

* Aprobar créditos.
* Registrar desembolsos.
* Consultar cartera.
* Consultar amortizaciones.
* Aplicar pagos.

### Reportes

* Estado de cuenta.
* Paz y salvo.
* Indicadores financieros.
* Recaudo.
* Cartera.

### Restricciones

No puede modificar configuraciones globales del sistema.

---

# 3. Administrador

## Descripción

Responsable de labores administrativas y de soporte operativo.

## Permisos

### Socios

* Consultar.
* Registrar.
* Actualizar información general.

### Consultas

* Ver indicadores.
* Ver reportes permitidos.
* Consultar información histórica.

### Restricciones

No puede:

* Aprobar créditos.
* Registrar operaciones financieras.
* Modificar parámetros del sistema.
* Ejecutar respaldos.
* Cambiar configuraciones globales.

---

# 4. Socio

## Descripción

Usuario final del sistema.

Solo puede acceder a su propia información.

## Permisos

### Consulta personal

* Perfil.
* Estado de cuenta.
* Paz y salvo.
* Carné digital.
* Ahorro acumulado.
* Historial de aportes.
* Estado de créditos.
* Plan de pagos.

### Restricciones

No puede visualizar información de otros socios ni realizar modificaciones administrativas.

---

# Principio de mínimo privilegio

Todos los roles deberán operar bajo el principio de mínimo privilegio.

Si una funcionalidad no está expresamente autorizada para un rol, deberá considerarse denegada.

---

# Matriz resumida de permisos

| Funcionalidad                    | SuperAdmin | Tesorero | Administrador | Socio       |
| -------------------------------- | ---------- | -------- | ------------- | ----------- |
| Consultar socios                 | ✅          | ✅        | ✅             | Solo propio |
| Crear socios                     | ✅          | ✅        | ✅             | ❌           |
| Editar socios                    | ✅          | ✅        | ✅             | ❌           |
| Registrar aportes                | ✅          | ✅        | ❌             | ❌           |
| Registrar pagos parciales        | ✅          | ✅        | ❌             | ❌           |
| Registrar adelantos              | ✅          | ✅        | ❌             | ❌           |
| Registrar abonos extraordinarios | ✅          | ✅        | ❌             | ❌           |
| Gestionar créditos               | ✅          | ✅        | ❌             | ❌           |
| Aprobar créditos                 | ✅          | ✅        | ❌             | ❌           |
| Configuración financiera         | ✅          | ❌        | ❌             | ❌           |
| Gestión de usuarios              | ✅          | ❌        | ❌             | ❌           |
| Ejecutar backups                 | ✅          | ❌        | ❌             | ❌           |
| Restaurar backups                | ✅          | ❌        | ❌             | ❌           |
| Consultar auditoría              | ✅          | ✅        | ❌             | ❌           |
| Ver estado de cuenta             | ✅          | ✅        | ✅             | Solo propio |
| Ver paz y salvo                  | ✅          | ✅        | ✅             | Solo propio |
| Ver carné digital                | ✅          | ✅        | ✅             | Solo propio |

---

# Consideraciones futuras

El modelo de permisos podrá ampliarse para incorporar roles especializados o permisos granulares por acción, siempre respetando este documento como referencia oficial.

Toda modificación deberá quedar registrada en la documentación y en el sistema de auditoría.
