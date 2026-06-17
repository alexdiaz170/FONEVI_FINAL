# BACKUPS.md

# Estrategia de Respaldos y Recuperación – FONEVI

## Objetivo

Definir la política oficial de generación, almacenamiento, verificación y restauración de respaldos del sistema FONEVI.

La protección de la información financiera constituye una prioridad crítica del proyecto.

---

# Principios generales

* Ningún respaldo debe sobrescribir el único respaldo existente.
* Todo respaldo debe poder restaurarse.
* Los respaldos deben verificarse periódicamente.
* Las operaciones de respaldo y restauración deben quedar registradas en auditoría.
* Solo usuarios autorizados podrán ejecutar estas acciones.

---

# Tipos de respaldo

## 1. Respaldo manual

Generado bajo demanda desde el Panel SuperAdmin.

Uso recomendado:

* Antes de cambios importantes.
* Antes de cierres mensuales.
* Antes de migraciones.
* Antes de actualizaciones del sistema.

---

## 2. Respaldo programado

Proceso automático configurable.

Frecuencia recomendada:

* Diario.
* Semanal.
* Mensual.

La programación deberá ser parametrizable.

---

## 3. Respaldo previo a operaciones críticas

Antes de ejecutar procesos sensibles, el sistema podrá recomendar o generar un respaldo.

Ejemplos:

* Cierre mensual.
* Restauración.
* Migraciones.
* Cambios masivos.

---

# Contenido del respaldo

Como mínimo deberá incluir:

* Base de datos PostgreSQL.
* Configuración del sistema.
* Parámetros financieros.
* Usuarios y roles.
* Información de auditoría.

Opcionalmente podrá incluir:

* Archivos generados.
* Reportes.
* Recursos multimedia.

---

# Almacenamiento

Se recomienda conservar múltiples generaciones de respaldos.

Ejemplo:

* Últimos 7 diarios.
* Últimos 4 semanales.
* Últimos 12 mensuales.

Nunca depender de un único archivo.

---

# Nomenclatura sugerida

```text id="bkname"
fonevi_backup_YYYYMMDD_HHMMSS.backup
```

Ejemplo:

```text id="bkexample"
fonevi_backup_20260615_121530.backup
```

---

# Verificación de integridad

La existencia del archivo no garantiza que sea válido.

Periódicamente deberá comprobarse que:

* Puede abrirse.
* Puede restaurarse correctamente.
* Su contenido es consistente.

---

# Restauración

La restauración deberá ser un proceso controlado.

Pasos recomendados:

1. Confirmación del usuario autorizado.
2. Selección del respaldo.
3. Validación del archivo.
4. Ejecución de la restauración.
5. Registro en auditoría.

---

# Roles autorizados

## SuperAdmin

Puede:

* Crear respaldos.
* Descargar respaldos.
* Restaurar respaldos.
* Configurar políticas.

## Tesorero

Puede consultar el estado de los respaldos, pero no restaurarlos.

## Administrador

Sin permisos de respaldo.

## Socio

Sin acceso.

---

# Integración con el cierre mensual

Antes del cierre de un período, el sistema deberá:

* Mostrar la fecha del último respaldo disponible.
* Recomendar generar uno nuevo si es necesario.
* Permitir iniciar un respaldo desde el Asistente de Cierre.

---

# Auditoría

Cada operación deberá registrar:

* Usuario.
* Fecha y hora.
* Tipo de operación (creación o restauración).
* Nombre del archivo.
* Resultado.
* Observaciones.

---

# Recuperación ante desastres

Ante una pérdida de información, el procedimiento recomendado será:

1. Detener operaciones sobre la base afectada.
2. Identificar el respaldo válido más reciente.
3. Restaurar en un entorno controlado.
4. Verificar integridad.
5. Reanudar operaciones.

---

# Recomendaciones operativas

* Mantener copias en más de una ubicación.
* Probar periódicamente el proceso de restauración.
* Documentar cualquier incidente relacionado con respaldos.
* Evitar eliminar respaldos sin una política definida.

---

# Principio rector

Un respaldo solo puede considerarse confiable si ha sido verificado y puede restaurarse exitosamente. La estrategia de recuperación forma parte integral de la operación segura de FONEVI.
