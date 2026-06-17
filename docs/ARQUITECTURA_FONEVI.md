# ARQUITECTURA_FONEVI.md

# Arquitectura General del Sistema FONEVI

## Objetivo

Definir la estructura técnica y organizacional del sistema FONEVI para garantizar escalabilidad, mantenibilidad, seguridad y facilidad de evolución a largo plazo.

---

# Principios arquitectónicos

FONEVI se basa en los siguientes principios:

* Separación de responsabilidades.
* Bajo acoplamiento entre módulos.
* Alta cohesión funcional.
* Configuración dinámica desde base de datos.
* Reutilización de componentes.
* Auditoría de operaciones críticas.
* Escalabilidad horizontal y funcional.
* Documentación continua.

---

# Arquitectura por capas

```text
Cliente Web (HTML + CSS + JavaScript)
                │
                ▼
        API REST (Express.js)
                │
                ▼
      Controladores (Controllers)
                │
                ▼
   Servicios de Negocio (Services)
                │
                ▼
 Repositorios de Datos (Repositories)
                │
                ▼
      PostgreSQL / Supabase
```

Cada capa tiene responsabilidades claramente definidas y no debe asumir funciones propias de otra capa.

---

# Organización recomendada del proyecto

```text
backend/
│
├── controllers/
├── services/
│   ├── aportes/
│   ├── creditos/
│   ├── pagos/
│   ├── solidaridad/
│   ├── configuracion/
│   └── auditoria/
│
├── repositories/
├── routes/
├── middleware/
├── models/
├── utils/
└── config/

frontend/
│
├── pages/
├── js/
├── css/
├── assets/
└── components/

docs/
├── README.md
├── ARQUITECTURA_FONEVI.md
├── REGLAS_NEGOCIO.md
├── MODELO_DATOS.md
├── CONFIGURACION.md
├── BACKUPS.md
├── SEGURIDAD.md
├── ROLES_Y_PERMISOS.md
├── FLUJO_APORTES.md
├── FLUJO_CREDITOS.md
├── FLUJO_CIERRE_PERIODO.md
├── DECISIONES_DE_ARQUITECTURA.md
├── ROADMAP.md
└── CHANGELOG.md
```

---

# Servicios especializados

La lógica financiera no debe concentrarse en una única función.

Se recomienda dividirla en servicios independientes:

## Aportes

* Registro de aportes.
* Validación de períodos.
* Aplicación de reglas de negocio.

## Pagos

* Pago normal.
* Adelanto de cuotas.
* Abono extraordinario al ahorro.
* Abono extraordinario a capital de crédito.
* Refinanciación (futuro).

## Créditos

* Generación de créditos.
* Cálculo de amortización.
* Cálculo de intereses.
* Cálculo de seguros.
* Gestión de mora.

## Solidaridad

* Registro de ingresos.
* Registro de egresos.
* Control del fondo.

## Configuración

* Lectura de parámetros globales.
* Actualización desde Panel SuperAdmin.

## Auditoría

* Registro de operaciones críticas.
* Historial de cambios.
* Trazabilidad administrativa.

---

# Panel SuperAdmin

Toda configuración modificable debe administrarse desde la interfaz y almacenarse en la base de datos.

Ejemplos:

* Valor del aporte de solidaridad.
* Tasas de interés.
* Tasas de mora.
* Porcentaje del seguro.
* Multiplicador máximo de crédito.
* Configuración de períodos.
* Parámetros para nuevas vigencias.

No se deben utilizar valores financieros codificados directamente en el sistema cuando puedan parametrizarse.

---

# Cierre mensual

El sistema ejecutará procesos de cierre por período mensual.

Entre ellos:

* Verificación de aportes pendientes.
* Identificación de socios en mora.
* Actualización de indicadores.
* Consolidación de movimientos.
* Preparación del siguiente período.

---

# Estrategia de respaldo

Se recomienda implementar:

* Backups automáticos programados.
* Backups manuales desde SuperAdmin.
* Restauración controlada.
* Registro en auditoría de cada respaldo o restauración.

---

# Roles del sistema

## SuperAdmin

Configuración global, auditoría, respaldos, administración de usuarios y parámetros financieros.

## Tesorero

Operación financiera diaria, pagos, créditos y reportes.

## Administrador

Gestión operativa y administrativa.

## Socio

Consulta exclusiva de su propia información.

---

# Evolución prevista

La arquitectura está preparada para incorporar futuras funcionalidades como:

* Refinanciación de créditos.
* Reestructuración de obligaciones.
* Prepago total.
* Nuevos productos financieros.
* Integraciones externas.
* Automatización de procesos periódicos.

---

# Regla fundamental

Toda nueva funcionalidad deberá implementarse respetando la separación por capas y evitando incorporar lógica financiera directamente en controladores, vistas o componentes del frontend.
