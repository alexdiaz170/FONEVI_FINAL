# Auditoría Integral — Módulo de Solidaridad

Fecha: 2026-06-16

## 1. Resumen Ejecutivo

### Estado General del Módulo
El **Módulo de Solidaridad** de FONEVI provee una interfaz gráfica de consulta, KPIs de saldo y un flujo básico para el registro de auxilios e ingresos manuales al fondo. No obstante, a nivel de backend y de base de datos, el módulo presenta deficiencias graves que vulneran la integridad contable, la trazabilidad financiera y la seguridad de la aplicación. 

La lógica de solidaridad se encuentra fragmentada: mientras las ayudas y aportes directos se operan sin validación alguna de saldo o autorización en las rutas Express, las distribuciones automáticas del módulo de Aportes se realizan usando valores fijos en el código (hardcodeados) y sin consistencia de datos relacionales en la columna `beneficiario`.

### Nivel de Madurez
* **Maturity Level: Deficiente / No Apto para Producción.**
* La ausencia de controles de autorización en la API (cualquier socio autenticado puede crear egresos arbitrarios del fondo) y la total desconexión entre la eliminación de aportes y los movimientos de solidaridad hacen de este módulo una pieza inestable y riesgosa para operar dinero real.

### Fortalezas
* **Interactividad en el Frontend:** La interfaz `pages/solidaridad.html` está bien organizada, calcula porcentajes de distribución lógicos para la visualización y bloquea el botón de envío en el cliente si la ayuda supera el saldo cargado en memoria.
* **Exportador de Datos:** Posee una función ágil para la descarga del historial de movimientos a formato Excel (XLSX).

### Debilidades
* **Vulnerabilidad Crítica de Autorización:** La ruta `POST /api/solidaridad/movimientos` carece de chequeo de rol, permitiendo que cualquier socio autenticado registre retiros u egresos ficticios de la caja.
* **Polimorfismo Corrupto en `beneficiario`:** La columna `beneficiario` de la tabla `solidaridad_movimientos` no posee integridad referencial (no es llave foránea). El código guarda allí en ocasiones el UUID/Documento del socio (desde el frontend) y en otras el nombre completo como string plano (desde `aporteService.js`). Esto provoca que las búsquedas filtradas por socio fallen.
* **Huérfanos Contables por Borrado/Actualización:** Si se elimina o actualiza un aporte registrado como pago en el sistema, el movimiento de solidaridad asociado de `$5.000` **no se anula ni se actualiza**, provocando un saldo contable inflado y ficticio en el fondo.
* **Ausencia de Registro de Auditoría:** El registro de movimientos de solidaridad no invoca al middleware de auditoría, imposibilitando rastrear quién autorizó o de qué IP provino un egreso del fondo.

### Riesgos Principales
* **Desfalco / Retiro Ficticio de Fondos:** Un usuario malintencionado con rol `socio` puede invocar directamente a la API para auto-aprobarse auxilios económicos ilegítimos.
* **Saldos Negativos:** El backend no valida el saldo actual del fondo de solidaridad al procesar egresos, lo que permite que el fondo caiga en saldo negativo a nivel de base de datos.
* **Inconsistencia de Estados de Cuenta:** Los socios no verán reflejados sus aportes mensuales de solidaridad en sus extractos consolidados debido a que la consulta SQL busca coincidencias por el ID del socio, pero las inserciones automáticas guardan únicamente el nombre en texto plano.

### Conclusión Ejecutiva
El Módulo de Solidaridad **NO está preparado para producción**. La implementación carece de las salvaguardas financieras, transaccionales y de seguridad indispensables para gestionar un fondo mutualista.

---

## 2. Inventario de Archivos Analizados

Para realizar esta auditoría, se examinaron minuciosamente los siguientes componentes:

### Backend
1. **[schema.prisma](file:///c:/Users/ingea/Music/FONEVI_FINAL/backend/prisma/schema.prisma):** Modelo de base de datos de la entidad `SolidaridadMovimiento` y la relación (o falta de ella) con socios.
2. **[solidaridad.js (Rutas)](file:///c:/Users/ingea/Music/FONEVI_FINAL/backend/src/routes/solidaridad.js):** Lógica del router Express de los endpoints de consulta de saldo y creación de movimientos.
3. **[aporteService.js](file:///c:/Users/ingea/Music/FONEVI_FINAL/backend/src/services/aporteService.js):** Servicio de aportes que crea los registros automáticos de solidaridad y maneja las eliminaciones/actualizaciones.
4. **[socioService.js](file:///c:/Users/ingea/Music/FONEVI_FINAL/backend/src/services/socioService.js):** Capa que ejecuta el estado de cuenta y consulta los movimientos del socio de manera fallida.
5. **[dashboard.js (Rutas)](file:///c:/Users/ingea/Music/FONEVI_FINAL/backend/src/routes/dashboard.js):** Router del dashboard para verificar si consolida datos contables de solidaridad.
6. **[seed.js](file:///c:/Users/ingea/Music/FONEVI_FINAL/backend/prisma/seed.js):** Inicialización de los parámetros base del fondo de solidaridad.

### Frontend
7. **[solidaridad.html](file:///c:/Users/ingea/Music/FONEVI_FINAL/pages/solidaridad.html):** Vista del administrador para el control del saldo, simulación de categorías y registro de ayudas.
8. **[reportes.html](file:///c:/Users/ingea/Music/FONEVI_FINAL/pages/reportes.html):** Vista de balance general para evaluar la consolidación de activos del fondo.
9. **[perfil.html](file:///c:/Users/ingea/Music/FONEVI_FINAL/pages/perfil.html):** Vista del socio que renderiza el historial de ayudas y extracto consolidado.
10. **[api.js](file:///c:/Users/ingea/Music/FONEVI_FINAL/js/api.js):** Métodos de consumo HTTP de la API de solidaridad.

---

## 3. Clasificación por Archivo

| Archivo | Clasificación | Motivo y Acción Sugerida |
| :--- | :--- | :--- |
| `backend/prisma/schema.prisma` | **Refactorizar** | Es imperativo definir relaciones explícitas con la tabla `socios` para el campo `beneficiario` e incluir llaves foráneas y campos de auditoría. |
| `backend/src/routes/solidaridad.js` | **Refactorizar** | La ruta debe trasladar la lógica a un controlador e implementar middleware de roles (`requireRole`) y validación de saldo del fondo en egresos. |
| `backend/src/services/aporteService.js` | **Refactorizar** | **Urgente:** Al anular o actualizar aportes, se deben reversar o modificar de forma atómica y transaccional los movimientos de solidaridad relacionados. |
| `backend/src/services/socioService.js` | **Refactorizar** | Cambiar la consulta SQL de `solidaridadRes` para contemplar las búsquedas por ID o nombre estandarizado en la tabla de movimientos. |
| `pages/solidaridad.html` | **Conservar** | Su diseño estético, simuladores y flujo de interfaz son adecuados. Refactorizar llamadas de API para usar parámetros estandarizados. |
| `pages/reportes.html` | **Conservar** | Contabiliza correctamente el saldo del fondo en la vista del balance general. |
| `pages/perfil.html` | **Conservar** | Renderiza la información contable disponible, pero requiere sincronización con la corrección de base de datos para mostrar el historial completo. |

---

## 4. Riesgos Técnicos Detectados

### Concurrencia y Race Conditions
* **Doble Desembolso en Transacciones Simultáneas:** Si se procesan dos registros de egresos concurrentes muy cercanos en milisegundos cuando el fondo cuenta con poco saldo disponible:
  * El backend no bloquea las filas ni implementa transacciones bloqueantes (pesimistas/optimistas) para evaluar el saldo real.
  * El sistema podría aprobar ambos retiros de manera simultánea, dejando el fondo con saldo negativo a nivel real en la base de datos PostgreSQL.

### Transacciones Incompletas
* En `aporteService.js` (Línea 260), la creación del movimiento de solidaridad se realiza dentro de la transacción del aporte:
```javascript
    await client.query(`
      INSERT INTO solidaridad_movimientos (id, tipo, descripcion, monto, fecha, beneficiario, created_at)
      VALUES ($1, 'ingreso', $2, $3, NOW(), $4, NOW())
    `, [uuidv4(), 'Aporte solidaridad', pagoSolid, nombreSocio]);
```
  * Esto es correcto para la inserción. Sin embargo, en el borrado (`delete`) del aporte o en su actualización (`update`), **no se utiliza ninguna transacción** para retirar el movimiento de solidaridad asociado. La transacción del aporte se completa con éxito y deja el movimiento de solidaridad huérfano e intacto.

### Tipado y Seguridad Financiera
* **Vulneración de API Abierta:** La ruta Express para registrar ingresos y egresos carece de un validador de perfil. Un atacante con acceso a cualquier cuenta de socio activa puede realizar peticiones curl a `/api/solidaridad/movimientos` y forzar egresos del sistema.
* **Casteo Manual Vulnerable:** Se utiliza `parseFloat(monto)` en la entrada. Si el valor ingresado es un string malformado o si no se controla adecuadamente la precisión decimal en JavaScript, se pueden producir descuadres de centavos que a lo largo del tiempo distorsionarán el arqueo de caja.

### Trazabilidad de Auditoría
* La creación de movimientos de solidaridad no genera ningún registro en la tabla `auditoria`. Un administrador con mala fe podría sustraer montos del fondo registrándolos como ayudas médicas ficticias sin que su ID de usuario quede plasmado en las bitácoras de auditoría de seguridad del sistema.

---

## 5. Riesgos Funcionales Detectados

### Distribución Incorrecta e Inflado de Saldo
* Al no existir una sincronización de actualización/borrado, si un socio realiza un aporte por transferencia que resulta rebotada, el tesorero anulará el aporte en el sistema. El ahorro acumulado del socio se corregirá, pero el fondo de solidaridad mantendrá el ingreso de `$5.000` que nunca ingresó al banco, originando un **saldo contable mayor al dinero real en custodia física**.

### Inconsistencias en el Filtro por Socio en Extractos
* En `socioService.js`, el extracto del socio busca en movimientos de solidaridad con:
```sql
WHERE beneficiario = $1 (donde $1 es el UUID del socio, ej. '12345678')
```
* Sin embargo, `aporteService.js` inserta la solidaridad automática pasando el **nombre completo del socio** en la columna `beneficiario`.
* **Consecuencia Funcional:** El historial de solidaridad de la cuenta de cobro del socio aparecerá siempre en `$0` o vacío, ya que el ID del socio nunca coincidirá con la cadena de texto de su nombre completo.

### Desembolsos sin Restricción
* No existen topes máximos de desembolso por tipo de ayuda en el backend. Si el catálogo frontend especifica que la asesoría jurídica es de máximo `$200.000`, el backend no valida este tope, permitiendo egresos de cualquier cuantía que vacíen el fondo en una sola transacción.

---

## 6. Código Duplicado o Muerto Identificado

### Detección y Mapeo
1. **Lógica de Categorización Duplicada (Frontend vs Backend):**
   * En `pages/solidaridad.html` (Línea 476): Existe la función `detectarTipo(desc)` que lee la descripción del movimiento y busca coincidencias como `"médic"`, `"funerar"`, o `"calamid"` para agrupar las estadísticas en la UI.
   * La base de datos no clasifica las ayudas por categoría oficial; simplemente guarda el string de descripción ingresado manualmente. Esto es un error arquitectónico: la categoría de la ayuda debe estructurarse desde el backend y almacenarse en una columna dedicada (`categoria`), evitando el escaneo por heurística de texto en el frontend.
2. **Consultas de Saldo Redundantes:**
   * El saldo se recalcula en caliente ejecutando un `SUM` agrupado en la base de datos cada vez que se requiere. Debería persistirse el saldo consolidado o utilizar una tabla de balances mensuales para evitar el escaneo completo de la tabla a medida que crecen los registros contables.

---

## 7. Problemas de Arquitectura

### Clean Architecture y Desacoplamiento
* **Enrutador con Responsabilidad de Negocio:** El archivo `backend/src/routes/solidaridad.js` acumula las labores de controlador y lógica de negocio. Realiza consultas directas a Prisma ORM, calcula la agregación del saldo y retorna respuestas Express. Esto imposibilita las pruebas unitarias aisladas de la lógica financiera del fondo.
* **Integración Cruda Inter-módulos:** El servicio de Aportes inserta directamente filas en la tabla `solidaridad_movimientos` mediante queries nativos SQL en lugar de interactuar a través de un dominio de Solidarity para registrar la transacción. Esto crea un acoplamiento directo y de alta dependencia entre el esquema físico de ambos módulos.

---

## 8. Evaluación del Modelo de Datos de Solidaridad

### Tabla `solidaridad_movimientos` en `schema.prisma`
```prisma
model SolidaridadMovimiento {
  id           String   @id @default(uuid())
  tipo         String
  descripcion  String
  monto        Decimal  @db.Decimal(15, 2)
  fecha        DateTime
  beneficiario String?
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([tipo])
  @@index([fecha])
  @@map("solidaridad_movimientos")
}
```

### Fortalezas
* Tipado correcto del monto como `Decimal` con precisión de dos decimales para resguardar la precisión numérica contra problemas de redondeo en almacenamiento.
* Índices establecidos en `tipo` y `fecha`, idóneos para consultas veloces del histórico.

### Debilidades y Vacíos Estructurales
1. **Falta de Llave Foránea para `beneficiario`:** Se definió como un `String?` genérico sin relación, permitiendo la inconsistencia de datos (nombres de texto vs UUIDs). Debe enlazarse con `Socio.id`.
2. **Sin Relación al Origen del Aporte:** No existe un campo `aporteId` opcional. Si un movimiento de solidaridad proviene de la recaudación mensual de un aporte, debe registrarse la referencia cruzada para mantener la integridad en anulaciones.
3. **Ausencia de Clasificación Estructurada:** No existe columna para subcategorías de ayuda (`medica`, `calamidad`, `funeraria`), delegando esta tarea a parseos de texto en la vista del cliente.
4. **Campos de Auditoría Nulos:** La tabla no almacena qué usuario del personal administrativo del fondo ejecutó el desembolso (`creado_por`), ni cuenta con control de versión.

---

## 9. Compatibilidad con las Reglas Oficiales de FONEVI

| Regla de Negocio | Estado en Código | Diagnóstico Técnico |
| :--- | :--- | :--- |
| **Recaudo de Solidaridad** | ⚠️ **Parcial** | Se realiza el cobro mensual, pero la tasa de aporte está quemada en código (`5000` en `aporteService.js`) en lugar de leerse de los parámetros financieros de configuración. |
| **Integración con Aportes** | ❌ **No Cumple** | Los aportes y el fondo de solidaridad se desincronizan en la base de datos al anular o borrar aportes en el backend. |
| **Integración con Estados de Cuenta** | ❌ **No Cumple** | El socio no ve sus abonos al fondo debido al uso de nombre plano en `beneficiario` durante el recaudo automático. |
| **Utilización del Fondo (Egreso)** | ⚠️ **Parcial** | Registra los egresos en el cliente, pero no cuenta con validación de saldo en caliente en el backend ni validaciones de topes reglamentarios. |
| **Integración con Cierre Mensual** | ❌ **No Cumple** | No existe consolidación del saldo de solidaridad al cerrar el mes ni generación de estadísticas permanentes en base de datos. |

---

## 10. Evaluación del Procesamiento Financiero

### Flujo de Cálculo y Registro
* El aporte mensual obligatorio de solidaridad se deduce restando el valor del aporte ingresado por el socio:
```javascript
let pagoSolid = 5000; // Hardcodeado en backend/src/services/aporteService.js:120
let restante = montoTotal - pagoSolid;
```
* **Evaluación del Hardcodeo:**
  * Si la junta directiva de FONEVI decide aumentar el fondo de solidaridad a `$6.000` mediante un cambio normativo, modificar el parámetro en el panel de configuración de la UI no tendrá efecto sobre la transacción del backend.
  * El código del servidor continuará descontando `$5.000` y generando errores de inconsistencia con lo simulado.
  * Es obligatorio cambiar `let pagoSolid = 5000` por una consulta al parámetro `aporte_solidaridad` de la tabla `configuracion`.

---

## 11. Evaluación de la Trazabilidad Financiera

Actualmente, **no es posible reconstruir la trazabilidad histórica de forma fiable**:
1. **¿Quién aportó?** No se puede responder a nivel de SQL. Al estar guardado el nombre del socio en `beneficiario` de forma plana (ej. `"Ana María Torres"`), si existen socios con nombres idénticos u homónimos, o si el socio cambia su nombre en su ficha personal, el histórico contable se rompe.
2. **¿Quién autorizó la ayuda?** Imposible de conocer. El endpoint no almacena el ID del administrador que aprobó el auxilio de solidaridad.
3. **¿Cuál era el saldo a una fecha específica?** Inexacto. Debido a que las anulaciones de aportes no descuentan los movimientos del fondo de solidaridad, el saldo acumulado devuelto por la agregación estará contablemente inflado respecto al dinero real existente en cada fecha histórica.

---

## 12. Recomendaciones de Mejora

### Inmediatas (Antes de Producción)
1. **Seguridad en Rutas de API:**
   * Agregar el middleware `requireRole('administrador', 'tesorero')` en la ruta `POST /api/solidaridad/movimientos`. Ningún socio común debe poder registrar movimientos manuales.
2. **Eliminar Hardcoding Contable:**
   * Cambiar el valor fijo de `$5.000` en `aporteService.js` por la lectura dinámica del parámetro `aporte_solidaridad` desde la base de datos.
3. **Validar Saldo en Egreso:**
   * Agregar una validación en la creación del movimiento de tipo `egreso` en el backend. Si el monto supera el saldo disponible actual, retornar error `400 (Saldo insuficiente)`.

### Mediano Plazo
1. **Normalización Contable (Relación con Socio):**
   * Modificar el modelo de datos de solidaridad para enlazar `beneficiarioId` a la tabla `socios` mediante una relación formal con llave foránea.
2. **Trazabilidad en Eliminaciones de Aportes:**
   * Modificar el borrado y actualización de aportes en `aporteService.js` para que localicen y eliminen/reversen el movimiento de solidaridad asociado a dicho aporte en la misma transacción.
3. **Agregar Columnas de Auditoría:**
   * Adicionar el campo `creadoPorId` (relación al Usuario que registra la ayuda) y audit logs en solidaridad.

### Largo Plazo
1. **Arquitectura Contable (Subcuentas):**
   * Integrar el fondo de solidaridad dentro de un libro contable unificado (Ledger), donde cada aporte y ayuda constituya una partida doble vinculada a cuentas de activos y patrimonio del fondo.

---

## 13. Observaciones para Futura Migración

* **SaaS Multi-Tenant:**
  * La tabla `solidaridad_movimientos` requerirá la columna `tenant_id` y su respectiva clave compuesta para asegurar el aislamiento de los fondos entre distintos inquilinos o cooperativas en la nube.
* **Event Sourcing:**
  * Al ser un módulo financiero basado en caja, solidaridad es un candidato ideal para *Event Sourcing*. En lugar de actualizar un estado mutable, el saldo se calcula proyectando la secuencia inmutable de eventos (`AporteRecibido`, `AyudaOtorgada`, `MovimientoReversado`).

---
## Recomendaciones adicionales para incorporar al plan maestro de FONEVI

A partir de esta auditoría, añadiría las siguientes mejoras estratégicas:

1. Crear una entidad propia para el Fondo de Solidaridad

En lugar de depender únicamente de una suma de movimientos:

solidaridad_movimiento
solidaridad_balance_mensual (opcional para cierres)
solidaridad_auxilio (si se desea separar solicitudes aprobadas de movimientos contables)

De esta manera, el saldo siempre podrá reconstruirse y auditarse.

Vincular el recaudo automático con el aporte origen

Cuando un aporte mensual genere ingreso al fondo, el movimiento debería guardar una referencia explícita:

solidaridad_movimiento
----------------------
id
aporte_id
tipo
monto
fecha
descripcion
beneficiario_id
created_by

Así, si el aporte se revierte o elimina, el movimiento asociado puede revertirse automáticamente.

3. Eliminar completamente los valores hardcodeados

Todos estos parámetros deberían provenir exclusivamente de la configuración del sistema:

aporte_solidaridad
porcentaje_seguro_credito
topes_auxilio
categorías_permitidas
montos máximos
políticas de aprobación

El backend debe ser la única fuente de verdad para estas reglas.

4. Implementar un flujo formal de aprobación de auxilios

En lugar de crear directamente un egreso, sería recomendable manejar un ciclo como:

SOLICITUD
      ↓
PENDIENTE
      ↓
APROBADA / RECHAZADA
      ↓
DESEMBOLSADA
      ↓
MOVIMIENTO CONTABLE

Esto mejora la gobernanza y la trazabilidad.

5. Integrar el módulo con el cierre mensual

El cierre debería generar automáticamente un resumen del fondo de solidaridad, incluyendo:

Saldo inicial.
Ingresos del período.
Auxilios otorgados.
Saldo final.
Número de movimientos.
Responsable del cierre.

Ese resumen debería conservarse como parte de la auditoría del período.

6. Incorporar validaciones obligatorias en el backend

Antes de registrar un auxilio:

Verificar que el usuario tenga permisos adecuados.
Validar que exista saldo suficiente.
Comprobar que el monto no exceda los límites configurados.
Registrar la operación en la auditoría.
Ejecutar todo dentro de una transacción.
Prioridad de corrección

Clasificaría los hallazgos de esta manera:

🔴 Críticos (resolver antes de producción)
Control de roles para registrar movimientos.
Eliminar valores hardcodeados.
Revertir movimientos de solidaridad al anular aportes.
Corregir el almacenamiento inconsistente del beneficiario.
Validar saldo disponible antes de egresos.
🟠 Importantes
Relacionar movimientos con aportes y socios mediante claves foráneas.
Registrar auditoría específica del módulo.
Persistir categorías estructuradas de auxilios.
Mejorar la trazabilidad histórica.
🟢 Deseables
Flujo formal de solicitudes y aprobaciones.
Resúmenes mensuales del fondo.
Evolución hacia un ledger financiero/event sourcing.

## 14. Conclusión Final

* **¿Está listo para producción?**
  * **No.** Las fallas de seguridad de la API y las inconsistencias de cálculo contable por borrado de aportes inhabilitan su despliegue seguro.
* **Riesgos Críticos:**
  * Fuga de dinero y manipulación no autorizada de la caja de solidaridad por la falta de control de roles en la API.
  * Reportes e información de saldos desfasados del dinero real en cuenta debido a la carencia de anulación de movimientos ante anulaciones de aportes.
* **Nivel de Confiabilidad:** **Muy Bajo.**
* **Recomendación Final del Auditor:**
  * Aplicar inmediatamente la validación de rol de administración en la API de solidaridad y sincronizar la anulación de movimientos al borrar aportes antes de realizar pruebas con dinero real.

---
*Fin del reporte de auditoría de solidaridad.*
