# Auditoría de Módulo — WhatsApp

> **Módulo:** WhatsApp Business / Notificaciones WhatsApp  
> **Fecha:** 2026-06-17  
> **Rol:** Arquitecto de Software Senior / Auditor Técnico  
> **Clasificación:** 🔴 **No apto para producción**

---

## 1. Resumen Ejecutivo

El módulo WhatsApp tiene una estructura backend mínima (ruta única sin controlador ni servicio) y un frontend completo con panel de administración. Sin embargo, **el módulo está permanentemente en modo simulación** porque `WA_TOKEN` y `WA_PHONE_ID` están vacíos en `.env`. No existe webhook para confirmaciones de entrega, no hay sistema de reintentos, no hay programación automática (cron) a pesar de que la UI afirma que los envíos son "Automático: todos los días 8:00 AM". Las plantillas prometidas en la UI (`fonevi_aporte_confirmado`, `fonevi_credito_aprobado`, `fonevi_bienvenida`) no tienen puntos de activación en los flujos correspondientes (crear socio, registrar aporte, crear crédito).

---

## 2. Inventario de Componentes

### 2.1 Backend

| Componente | Archivo | Estado |
|-----------|---------|--------|
| Ruta | `backend/src/routes/whatsapp.js` | ✅ 137 líneas, 5 endpoints |
| Controlador | ❌ No existe | 🔴 Lógica en ruta |
| Servicio | ❌ No existe | 🔴 Lógica en ruta |
| Modelo Prisma | `WaLog` en `schema.prisma:171` | ✅ Mapea a `wa_logs` |
| Webhook | ❌ No existe | 🔴 Sin endpoint de Meta |
| Cron/Scheduler | ❌ No existe | 🔴 Sin envíos automáticos |
| Middleware auth | `requireAuth` en todos los endpoints | ✅ |
| Middleware roles | `requireRole` en logs, test, recordatorios, alertas, individual | ✅ |
| Middleware auditoría | ❌ No implementado | 🔴 Sin registro de auditoría |

### 2.2 Frontend

| Componente | Archivo | Estado |
|-----------|---------|--------|
| Panel | `pages/whatsapp-panel.html` | ✅ 472 líneas, completo |
| API client | `js/api.js:209-216` | ✅ 6 métodos |
| Roles | `js/roles.js:32,71,108` | ✅ Solo admin/tesorero |
| Búsqueda | `js/search.js:478` | ✅ Indexado en buscador |

### 2.3 Endpoints

| Método | Ruta | Autenticación | Controlador | Servicio | Auditoría |
|--------|------|---------------|-------------|----------|-----------|
| GET | `/api/whatsapp/estado` | `requireAuth` | ❌ En ruta | ❌ | ❌ |
| GET | `/api/whatsapp/logs` | `requireAuth` + `requireRole('administrador','tesorero')` | ❌ En ruta | ❌ | ❌ |
| POST | `/api/whatsapp/test` | `requireAuth` + `requireRole('administrador')` | ❌ En ruta | ❌ | ❌ |
| POST | `/api/whatsapp/recordatorios` | `requireAuth` + `requireRole('administrador','tesorero')` | ❌ En ruta | ❌ | ❌ |
| POST | `/api/whatsapp/alertas-mora` | `requireAuth` + `requireRole('administrador','tesorero')` | ❌ En ruta | ❌ | ❌ |
| POST | `/api/whatsapp/individual` | `requireAuth` + `requireRole('administrador','tesorero')` | ❌ En ruta | ❌ | ❌ |

---

## 3. Clasificación del Módulo

| Dimensión | Clasificación | Detalle |
|-----------|--------------|---------|
| Arquitectura backend | 🟠 **Solo ruta** | Sin controlador ni servicio; lógica en ruta |
| Frontend | ✅ **Completo** | Panel con estado, KPIs, acciones, logs |
| Integración WhatsApp | 🔴 **Simulación permanente** | `WA_TOKEN` y `WA_PHONE_ID` vacíos |
| Automatización | 🔴 **Inexistente** | UI afirma envíos diarios 8AM/lunes 9AM pero no hay cron |
| Webhook | 🔴 **No implementado** | Sin confirmaciones de entrega ni mensajes entrantes |
| Persistencia | ✅ **Presente** | Modelo `WaLog` en Prisma |
| Roles/permisos | ✅ **Correcto** | Admin y tesorero según endpoint |

---

## 4. Riesgos Técnicos

### RT-01: Modo Simulación Permanente (Crítico)
- **Dónde:** `.env:9-10` — `WA_TOKEN=""` y `WA_PHONE_ID=""`
- **Impacto:** Todos los envíos se registran como "simulado". Ningún mensaje real llega a los socios. El sistema reporta "funcionando" pero no entrega nada.
- **Causa raíz:** Las variables de entorno necesarias para Meta WhatsApp Business API están declaradas pero vacías.

### RT-02: Sin Webhook de Meta WhatsApp (Crítico)
- **Dónde:** No existe endpoint `GET /api/whatsapp/webhook` ni `POST /api/whatsapp/webhook`
- **Impacto:**
  - Meta requiere un webhook para verificar la propiedad del número y recibir delivery receipts
  - Sin webhook, la integración no puede ser verificada por Meta
  - No se puede saber si un mensaje fue entregado, leído o falló
  - No se pueden recibir mensajes entrantes de socios

### RT-03: Automatización Prometida pero Inexistente (Alto)
- **Dónde:** `whatsapp-panel.html:141-144,151-153` — texto "Automático: todos los días 8:00 AM" y "Automático: lunes 9:00 AM"
- **Impacto:** Engaño funcional. La UI comunica a los usuarios que los envíos son automáticos, pero no hay `node-cron`, `node-schedule`, `setInterval` ni ningún scheduler en el backend.
- **Evidencia:** `grep -r "cron\|schedule" backend/` solo encuentra timeouts para cierre graceful.

### RT-04: Sin Capa de Servicio (Alto)
- **Dónde:** `routes/whatsapp.js` — toda la lógica está en el archivo de ruta
- **Impacto:**
  - `sendWA()` es una función privada dentro del router, no reutilizable
  - No se puede llamar desde otros módulos (ej. al crear socio o registrar aporte)
  - Violación del patrón establecido (socios, aportes, créditos tienen controlador+servicio)
  - No testeable unitariamente

### RT-05: Sin Reintentos en Fallos de Envío (Medio)
- **Dónde:** `sendWA()` en `routes/whatsapp.js:9-29`
- **Impacto:** Si la API de Meta responde con error (rate limit, timeout, error temporal), el mensaje se pierde. No hay cola de reintentos ni backoff.

### RT-06: Sin Logging de Errores de API (Medio)
- **Dónde:** Todos los `catch` en `routes/whatsapp.js` — todos responden con `'Error interno'`
- **Impacto:** No se registra la causa real del error. Imposible diagnosticar por qué falla un envío sin acceder al servidor en vivo.

### RT-07: Sin Rate Limiting para Meta API (Medio)
- **Dónde:** `sendWA()` y bucles `for` en recordatorios/alertas
- **Impacto:**
  - Los bucles en `recordatorios` y `alertas-mora` envían todos los mensajes secuencialmente sin pausa
  - Meta WhatsApp Business API tiene límites de ~80 mensajes/segundo para mensajes de notificación
  - Con 300+ socios, se excede el rate limit y los mensajes adicionales fallan

---

## 5. Riesgos Funcionales

### RF-01: Plantillas Sin Puntos de Activación (Alto)
- **Dónde:** `whatsapp-panel.html:174-203` lista 5 plantillas con "Trigger automático"
- **Impacto:**
  - `fonevi_aporte_confirmado`: No se envía al registrar aporte
  - `fonevi_credito_aprobado`: No se envía al crear crédito
  - `fonevi_bienvenida`: No se envía al crear socio
  - Las únicas plantillas realmente enviables son `fonevi_recordatorio_pago` y `fonevi_mora_alerta` (solo vía acción manual en el panel)
- **Evidencia:** No hay llamadas a `sendWA` ni a `prisma.waLog.create` en `routes/aportes.js`, `routes/creditos.js` ni `routes/socios.js`.

### RF-02: Sin Confirmación de Entrega (Alto)
- **Dónde:** Todo el módulo
- **Impacto:** Todos los envíos se marcan como "enviado" o "simulado" inmediatamente después de la llamada a Meta API, sin esperar el webhook de delivery receipt. No hay forma de saber si el mensaje realmente llegó.

### RF-03: Número de Teléfono Sin Validación de Prefijo (Medio)
- **Dónde:** `sendWA()` en `routes/whatsapp.js:13` — concatena `57` al número del socio
- **Impacto:**
  - Asume que todos los socios son colombianos (prefijo +57)
  - No valida formato internacional
  - No permite números de otros países

### RF-04: Socio sin Teléfono no Notificado (Medio)
- **Dónde:** Recordatorios y alertas-mora verifican `!tel || tel.length < 10`
- **Impacto:** Socios sin teléfono no reciben notificación y no hay un mecanismo alternativo (ej. email, notificación en app). El conteo `sinTelefono` se reporta pero no se actúa sobre él.

---

## 6. Código Duplicado

| Patrón | Archivo | Líneas |
|--------|---------|--------|
| Llamada idéntica a `sendWA()` + `prisma.waLog.create()` | `routes/whatsapp.js` — replicado 4 veces (test:63-64, recordatorios:88-89, alertas:110-111, individual:129-130) | ~8 c/u |
| Validación de teléfono (`replace(/\D/g, ''); !tel || tel.length < 10`) | `routes/whatsapp.js` — replicado 3 veces (test:58-59, recordatorios:87, alertas:109) | ~3 c/u |

---

## 7. Evaluación de Arquitectura

### 7.1 Patrón de Capas: 🔴 Incompleto

El módulo WhatsApp tiene **solo la capa de ruta**. No hay controlador ni servicio, a diferencia de los módulos socios, aportes, créditos y movimientos que sí implementan las 3 capas.

```
Socios/Aportes/Créditos:     routes/ → controllers/ → services/ → db
WhatsApp:                    routes/ (todo inline)              → prisma
```

La función `sendWA()` está definida dentro del archivo de ruta, lo que impide su reutilización desde otros módulos (ej. enviar confirmación al crear un socio).

### 7.2 Reutilización: 🔴 Aislado

No hay forma de que otros módulos envíen mensajes WhatsApp. Si un administrador crea un socio, no se puede enviar `fonevi_bienvenida` porque:
1. `sendWA()` no está exportada
2. Está definida dentro del router, no en un servicio

### 7.3 Mantenibilidad: 🟠 Aceptable

El panel frontend está bien estructurado y la lógica de UI es clara. El backend, aunque plano, es legible. La falta de separación de concerns es el principal problema de mantenibilidad.

### 7.4 Seguridad: 🟠 Parcial

- ✅ Autenticación JWT en todos los endpoints
- ✅ Roles (admin/tesorero) correctamente aplicados
- ❌ Sin auditoría de envíos
- ❌ Sin rate limiting en envíos masivos
- ❌ No se valida que el socio autenticado sea el dueño del número en `individual` (posible uso de fuerza bruta para enviar mensajes a números arbitrarios)

---

## 8. Modelo de Datos

### 8.1 Modelo `WaLog`

```prisma
model WaLog {
  id        String   @id @default(uuid())
  numero    String
  template  String
  estado    String
  messageId String?  @map("message_id")
  enviadoEn DateTime @map("enviado_en")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([numero])
  @@index([enviadoEn])
  @@map("wa_logs")
}
```

### 8.2 Problemas del Modelo

| Problema | Detalle |
|----------|---------|
| Sin relación con Socio | `numero` es texto suelto, no hay FK a `socios.telefono`. No se puede consultar "qué mensajes recibió este socio" sin hacer JOIN por número |
| Sin campo `error` | Cuando `estado = 'error'`, no hay columna para almacenar el mensaje de error |
| Sin campo `leido` | No se registra confirmación de lectura (solo delivery) |
| `estado` como string libre | Sin enum o valores controlados; cualquier string es válido |
| `enviadoEn` sin timezone | Tipo `DateTime` en Prisma, no se especifica zona horaria |

---

## 9. Reglas de Negocio

### 9.1 Ubicación Actual

| Regla | Ubicación | Estado |
|-------|-----------|--------|
| Enviar recordatorio a aportes pendientes | `routes/whatsapp.js:73-97` | Solo manual vía panel |
| Enviar alerta a socios en mora | `routes/whatsapp.js:100-119` | Solo manual vía panel |
| Prefijo +57 para Colombia | `routes/whatsapp.js:13` | Hardcodeado |
| Modo simulación si no hay credenciales | `routes/whatsapp.js:6,10` | ✅ Adecuado |
| Frecuencia automática diaria 8AM | `whatsapp-panel.html:144` | ❌ No implementado |
| Frecuencia automática lunes 9AM | `whatsapp-panel.html:153` | ❌ No implementado |

### 9.2 Problemas

1. **Reglas de automatición inexistentes** — Las frecuencias prometidas en UI no tienen implementación
2. **Sin activación por evento** — Los triggers automáticos (crear socio, registrar aporte, crear crédito) no están conectados
3. **Prefijo de país hardcodeado** — Asume Colombia (+57)

---

## 10. KPIs del Módulo

| KPI | Valor | Estado |
|-----|-------|--------|
| Endpoints con controlador+servicio | 0/6 (0%) | 🔴 |
| Envíos reales vs simulados | 0% reales (WA_TOKEN vacío) | 🔴 |
| Automatización implementada | 0/2 (0%) | 🔴 |
| Plantillas con trigger real | 2/5 (recordatorios, alertas-mora vía manual) | 🟠 |
| Webhook implementado | 0/1 | 🔴 |
| Reintentos en fallos | 0 (0%) | 🔴 |
| Cobertura de auditoría | 0/6 endpoints | 🔴 |
| Logging de errores | ❌ | 🔴 |

---

## 11. Trazabilidad

| Aspecto | Estado |
|---------|--------|
| Log de envíos en BD | ✅ `wa_logs` con estado, fecha, template |
| ID de mensaje Meta | ✅ Almacena `messageId` si está disponible |
| Quién envió el mensaje | ❌ No registra `usuarioId` ni `req.usuario` |
| Auditoría (middleware) | ❌ No implementada en ningún endpoint WhatsApp |
| IP de origen | ❌ No registrada |
| Error details | ❌ No almacenadas cuando falla |

---

## 12. Recomendaciones

### Inmediatas (Prioridad Crítica)

| # | Recomendación | Esfuerzo | Impacto |
|---|--------------|----------|---------|
| R1 | **Configurar credenciales Meta:** Poblar `WA_TOKEN` y `WA_PHONE_ID` en `.env` con valores reales de Meta Business Manager | 30 min | Activa envíos reales |
| R2 | **Implementar webhook:** Crear `GET /api/whatsapp/webhook` (verificación Meta) y `POST /api/whatsapp/webhook` (delivery receipts) siguiendo la documentación de Meta | 2-3 días | RT-02, RF-02 |
| R3 | **Agregar rate limiting y cola de mensajes:** Implementar cola con pausas de 50ms entre mensajes para no exceder límites de Meta | 1-2 días | Mitiga RT-07 |
| R4 | **Agregar logging de errores:** Capturar y almacenar el mensaje de error de Meta en `wa_logs` y en console.error | 1 día | Mitiga RT-06 |

### Corto Plazo (30 días)

| # | Recomendación | Esfuerzo | Impacto |
|---|--------------|----------|---------|
| R5 | **Crear servicio WhatsApp (`services/whatsappService.js`):** Extraer `sendWA()` a un servicio exportable que pueda ser llamado desde otros módulos | 1 día | RT-04, RF-01 |
| R6 | **Crear controlador WhatsApp (`controllers/whatsappController.js`):** Mover lógica de los 6 endpoints a un controlador | 1 día | RT-04 |
| R7 | **Implementar scheduler con node-cron:** Agregar cron diario 8AM para recordatorios y semanal lunes 9AM para alertas de mora | 1-2 días | RT-03 |
| R8 | **Conectar triggers desde otros módulos:** Llamar a `whatsappService.send()` desde `socioController.create()`, `aporteController.create()`, `creditoController.create()` | 2-3 días | RF-01 |
| R9 | **Agregar reintentos con backoff exponencial:** Envolver `sendWA()` con 3 reintentos (1s, 5s, 15s) ante errores de Meta | 1 día | Mitiga RT-05 |
| R10 | **Agregar auditoría:** Implementar `audit()` middleware o llamada directa en cada endpoint | 1 día | Trazabilidad |

### Mejoras Adicionales

| # | Recomendación | Esfuerzo | Impacto |
|---|--------------|----------|---------|
| R11 | **Validar formato internacional de teléfono:** Usar librería `libphonenumber-js` para validar y formatear números | 1 día | RF-03 |
| R12 | **Agregar FK `socioId` en `WaLog`:** Relacionar logs con socios para consultas de historial por socio | 1 día | Modelo de datos |
| R13 | **Implementar endpoint `GET /api/whatsapp/plantillas`:** Servir lista de plantillas desde backend en lugar de HTML hardcodeado | 1 día | Mantenibilidad |
| R14 | **Agregar columna `error` en `WaLog` y tipos controlados (`estado` como enum)** | 1 día | Modelo de datos |
| R15 | **Notificar socios sin teléfono por email o notificación in-app** | 2-3 días | RF-04 |

---

## 13. Plan de Migración

### Fase 0: Funcionalidad Básica (Semana 1)

```
Día 1:
  ├── R1: Configurar credenciales Meta (WA_TOKEN, WA_PHONE_ID)
  ├── R2: Implementar webhook (GET + POST)
  └── R4: Logging de errores

Día 2:
  ├── R5: Crear WhatsAppService
  ├── R6: Crear WhatsAppController
  └── R3: Rate limiting + cola en envíos masivos

Día 3:
  ├── R7: node-cron (recordatorios 8AM, alertas mora lunes 9AM)
  └── R9: Reintentos con backoff

Día 4-5:
  ├── R8: Conectar triggers (socio, aporte, crédito)
  ├── R10: Auditoría en endpoints WhatsApp
  └── Pruebas de integración con Meta
```

### Fase 1: Maduración (Semana 2-3)

```
Semana 2:
  ├── R11: Validación internacional de teléfonos
  ├── R12: FK socioId en WaLog
  └── R14: Enumerar estados + columna error

Semana 3:
  ├── R13: Endpoint de plantillas
  ├── R15: Canal alternativo para socios sin teléfono
  └── Pruebas de carga con envíos masivos
```

---

## 14. Conclusión

**Clasificación final: 🔴 No apto para producción**

El módulo WhatsApp tiene una base sólida (panel frontend completo, modelo de datos, integración con Prisma, autenticación y roles correctos), pero falla en tres aspectos fundamentales:

1. **No envía mensajes reales** — `WA_TOKEN` y `WA_PHONE_ID` están vacíos. El módulo lleva en modo simulación desde su creación.
2. **No cumple lo que promete** — La UI afirma envíos automáticos diarios/semanales y triggers por eventos, pero ninguna de estas automatizaciones está implementada.
3. **Arquitectura incompleta** — Sin controlador ni servicio, la lógica no es reutilizable por otros módulos del sistema.

**El módulo es rescatable con ~2 semanas de trabajo enfocado.** La prioridad debe ser: activar credenciales → webhook → scheduler → conectar triggers → reintentos. Una vez completado, FONEVI tendría un canal de comunicación directo con los socios que hoy no existe.

**Veredicto:** El módulo WhatsApp necesita una semana de estabilización técnica antes de poder ser utilizado. No debería desplegarse a producción en su estado actual, ya que los usuarios creerán que están enviando mensajes reales cuando en realidad solo se están simulando.

- Modo simulación permanente — WA_TOKEN y WA_PHONE_ID están vacíos en .env
- Sin webhook — Meta no puede confirmar entregas ni verificar el número
- Automatización prometida pero inexistente — UI dice "Automático: 8:00 AM / lunes 9:00 AM" pero no hay cron
- Triggers de plantillas no conectados — fonevi_aporte_confirmado, fonevi_credito_aprobado, fonevi_bienvenida no se activan al crear socio/aporte/crédito
- Sin controlador ni servicio — Toda la lógica en la ruta, sendWA() no es reutilizable
- Sin rate limiting ni reintentos — Los envíos masivos se hacen sin pausa, excederán límites de Meta
Rescatable con ~2 semanas; requiere activar credenciales → webhook → scheduler → triggers → reintentos.
