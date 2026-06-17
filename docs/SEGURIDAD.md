# SEGURIDAD.md

# Política de Seguridad de FONEVI

## Objetivo

Definir las medidas de seguridad que deben implementarse para proteger la información, las operaciones financieras y los usuarios del sistema FONEVI.

---

# 1. Principios generales

Toda funcionalidad deberá diseñarse siguiendo los principios de:

* Confidencialidad.
* Integridad.
* Disponibilidad.
* Trazabilidad.
* Mínimo privilegio.

---

# 2. Autenticación

El acceso al sistema requerirá autenticación válida.

Cada usuario deberá identificarse mediante credenciales personales.

No se permitirá compartir cuentas entre usuarios.

---

# 3. Gestión de sesiones

Las sesiones deberán:

* Asociarse al usuario autenticado.
* Invalidarse al cerrar sesión.
* Expirar tras un período razonable de inactividad.
* Renovarse cuando corresponda por motivos de seguridad.

---

# 4. Autorización basada en roles

Los permisos deberán validarse utilizando los roles oficiales del sistema.

Ejemplos:

* SuperAdmin.
* Tesorero.
* Administrador.
* Socio.

No se permitirá acceder a funcionalidades únicamente ocultándolas en la interfaz; la autorización deberá verificarse también en el backend.

---

# 5. Protección de rutas

Toda ruta protegida deberá comprobar:

* Existencia de sesión válida.
* Rol autorizado.
* Permisos específicos para la operación solicitada.

---

# 6. Protección de operaciones críticas

Las siguientes acciones deberán requerir validación estricta:

* Configuración financiera.
* Aprobación de créditos.
* Restauración de respaldos.
* Cierre mensual.
* Cambios masivos.
* Gestión de usuarios.

---

# 7. Auditoría

Las operaciones críticas deberán registrarse indicando, como mínimo:

* Usuario.
* Fecha y hora.
* Acción realizada.
* Entidad afectada.
* Resultado.

La auditoría debe ser inmutable y conservarse para consulta histórica.

---

# 8. Protección de datos personales

La información de los socios deberá utilizarse exclusivamente para fines autorizados por el Fondo.

Los datos personales deberán protegerse frente a accesos no autorizados y exposiciones innecesarias.

---

# 9. Validación de entradas

Toda información recibida desde el cliente deberá validarse en el servidor.

Nunca debe asumirse que los datos enviados por el navegador son correctos o confiables.

---

# 10. Consultas a la base de datos

Las consultas deberán utilizar mecanismos seguros de parametrización para evitar inyecciones SQL.

No se deberán construir consultas concatenando directamente valores proporcionados por el usuario.

---

# 11. Gestión de errores

Los mensajes mostrados al usuario no deberán revelar detalles internos del sistema.

La información técnica completa deberá registrarse únicamente en los mecanismos de diagnóstico y auditoría.

---

# 12. Protección del Panel SuperAdmin

El Panel SuperAdmin deberá contar con medidas adicionales de protección debido a su capacidad para modificar parámetros críticos.

Se recomienda:

* Confirmaciones explícitas para acciones sensibles.
* Registro detallado de cambios.
* Auditoría completa de operaciones.

---

# 13. Seguridad del cierre mensual

El cierre de período deberá:

* Ser iniciado únicamente por usuarios autorizados.
* Requerir confirmación explícita.
* Recomendar verificar o generar un respaldo previo.
* Registrar toda la operación en auditoría.

---

# 14. Seguridad de respaldos

Los respaldos deberán:

* Almacenarse de forma segura.
* Ser accesibles únicamente por usuarios autorizados.
* Verificarse periódicamente.
* Mantener múltiples versiones disponibles.

---

# 15. Seguridad de configuración

Los parámetros financieros no deberán modificarse directamente en el código fuente.

Toda actualización deberá realizarse mediante mecanismos autorizados y quedar registrada.

---

# 16. Registros de actividad

El sistema podrá registrar eventos relevantes para análisis de seguridad, incluyendo:

* Inicio de sesión.
* Cierre de sesión.
* Intentos fallidos de autenticación.
* Cambios administrativos.
* Operaciones financieras críticas.

---

# 17. Disponibilidad

La estrategia de operación deberá contemplar:

* Respaldos.
* Recuperación ante desastres.
* Procedimientos documentados de restauración.

---

# 18. Actualizaciones

Las mejoras de seguridad deberán incorporarse de manera continua conforme evolucionen los riesgos y las necesidades operativas del Fondo.

---

# Principio rector

La seguridad debe implementarse como una responsabilidad transversal de toda la plataforma. Ninguna medida de protección deberá depender exclusivamente de la interfaz de usuario; las verificaciones críticas deberán realizarse también en el backend y en los componentes responsables de la lógica de negocio.
