# Auditoría Integral — Módulo de Notificaciones
## Sistema FONEVI — Fondo de Empleados Docentes

---

**Fecha de auditoría:** 17 de junio de 2026
**Auditor:** Arquitecto de Software Senior / Auditor Técnico
**Versión del sistema:** FONEVI FINAL
**Alcance:** Módulo de Notificaciones (backend + frontend + badges + envío masivo)
**Clasificación:** 🟠 **RIESGO ALTO — Módulo parcialmente funcional con desconexión frontend-backend**

---

## 1. Resumen Ejecutivo

### Estado general del módulo
El módulo de Notificaciones tiene una **base backend funcional** (lectura, marcado individual y masivo como leído) y una **interfaz frontend completa** (listado, filtros, KPIs, modal de creación). Sin embargo, presenta una **desconexión crítica**: la creación de notificaciones y el marcado como leídas operan solo en memoria del navegador (`DB.notificaciones`) sin persistir al backend. Además, el "Envío masivo" de recordatorios es simulado con mensajes Toast hardcodeados.

### Nivel de madurez
🟡 **Beta funcional con fallas graves de persistencia** — Backend parcial, frontend parcialmente desconectado.

### Fortalezas
1. **Backend REST funcional**: GET, PUT leer individual y PUT leer todas operan contra PostgreSQL.
2. **Filtros en frontend**: "Todas", "No leídas" y "Urgentes" funcionan correctamente sobre datos locales.
3. **Modelo de datos correcto**: `Notificacion` en Prisma con campos apropiados (`tipo`, `titulo`, `mensaje`, `leida`, `urgente`).
4. **Badge en sidebar**: El contador de no leídas se muestra en el menú de navegación lateral.
5. **Punto rojo en topbar**: Indicador visual de notificaciones no leídas en la barra superior.
6. **Integración global**: `app.js` precarga notificaciones al iniciar sesión y actualiza badges.
7. **RBAC**: Solo `administrador` y `tesorero` pueden acceder al módulo de notificaciones.
8. **Seed inicial**: Crea notificación de bienvenida al inicializar la base de datos.
9. **Límite de 50 registros**: Backend limita a 50 notificaciones, evitando respuestas masivas.

### Debilidades
1. **🔴 `guardarNotificacion()` solo crea en memoria**: La función push a `DB.notificaciones` pero nunca llama a la API para persistir en BD.
2. **🔴 `marcarLeida()` y `marcarTodasLeidas()` solo modifican memoria**: Nunca llaman a `API.notificaciones.marcarLeida()` ni `marcarTodas()`. En recarga de página, todas vuelven a no leídas.
3. **🔴 `enviarMasivo()` es simulado**: Muestra un Toast con mensajes hardcodeados ("Enviado a 6 socios"). No se conecta al módulo WhatsApp ni envía realmente nada.
4. **🟠 Backend no tiene endpoint `POST /api/notificaciones`**: No es posible crear notificaciones desde el servidor. La ruta solo soporta GET y PUT.
5. **🟠 Sin controlador ni servicio**: La lógica está inline en el route handler, sin capa de servicio ni controlador.
6. **🟠 Sin auditoría**: No se registra quién creó, leyó o marcó notificaciones.
7. **🟠 Las alertas del Dashboard son independientes**: `renderAlertas()` en dashboard.html no usa el módulo de notificaciones — genera HTML hardcodeado.
8. **🟡 ID débil en frontend**: `"N" + String(DB.notificaciones.length + 1)` para nuevas notificaciones.

### Riesgos principales

| Riesgo | Nivel | Impacto |
|--------|-------|---------|
| Creación de notificaciones solo en memoria | 🔴 Crítico | Las notificaciones creadas se pierden al recargar |
| Marcado como leído no persiste | 🔴 Crítico | Usuarios ven siempre las mismas no leídas |
| Envío masivo simulado con hardcode | 🟠 Alto | Usuarios creen que se enviaron recordatorios reales |
| Sin endpoint POST para crear notificaciones | 🟠 Alto | Backend incompleto para operación de escritura |
| Sin controlador ni servicio | 🟡 Medio | Difícil mantenimiento y testing |

### Conclusión ejecutiva
El módulo de Notificaciones es **funcional a medias**: la lectura desde backend y la visualización en frontend funcionan correctamente, pero la creación y el marcado como leído no persisten. Es como un buzón de correos donde puedes *ver* los mensajes que llegan, pero cuando los *marcas como leídos* o *escribes uno nuevo*, esos cambios se pierden al cerrar la página. El envío masivo es completamente simulado.

---

## 2. Inventario de Archivos Analizados

### Backend

| # | Archivo | Rol |
|---|---------|-----|
| 1 | `backend/src/routes/notificaciones.js` | Ruta con 3 endpoints: GET /, PUT /:id/leer, PUT /leer-todas |
| 2 | `backend/prisma/schema.prisma` | Modelo `Notificacion` (líneas 107-117) |
| 3 | `backend/src/app.js` | Registro de ruta `/api/notificaciones` (línea 109) |
| 4 | `backend/src/middleware/auth.js` | JWT `requireAuth` en todos los endpoints |
| 5 | `backend/prisma/seed.js` | Seed con 1 notificación inicial (líneas 119-124) |

### Frontend — Página Principal

| # | Archivo | Rol |
|---|---------|-----|
| 6 | `pages/notificaciones.html` | Página completa: KPIs, filtros, lista, modal creación, envío masivo (312 líneas) |

### Frontend — Módulos Compartidos

| # | Archivo | Rol |
|---|---------|-----|
| 7 | `js/api.js` | Cliente HTTP: `notificaciones.listar()`, `marcarLeida()`, `marcarTodas()` (líneas 193-197) |
| 8 | `js/app.js` | Precarga de notificaciones, badge y punto rojo (líneas 243-283) |
| 9 | `js/roles.js` | RBAC, badge en sidebar con conteo de no leídas (líneas 162-169) |
| 10 | `js/layout.js` | Botón de notificaciones en topbar con punto rojo (líneas 72-74) |
| 11 | `js/search.js` | Entrada en búsqueda global |
| 12 | `js/transitions.js` | Orden de transición de página |

### Frontend — Integraciones

| # | Archivo | Rol |
|---|---------|-----|
| 13 | `pages/dashboard.html` | `renderAlertas()` independiente — no usa el módulo de notificaciones (líneas 600-620) |
| 14 | `pages/whatsapp-panel.html` | Módulo separado de WhatsApp — no conectado a notificaciones |

---

## 3. Clasificación por Archivo

### Conservar (con mejoras)

| Archivo | Motivo |
|---------|--------|
| `backend/prisma/schema.prisma` (modelo Notificacion) | Modelo correcto con campos apropiados |
| `js/api.js` (módulo notificaciones) | API client correcto, bien definido |
| `js/roles.js` | Integración de badge en sidebar funcional |
| `js/layout.js` | Botón con punto rojo en topbar funcional |
| `js/app.js` (precarga) | Carga inicial y actualización de badges correcta |

### Refactorizar

| Archivo | Motivo |
|---------|--------|
| `backend/src/routes/notificaciones.js` | **CRÍTICO**: Agregar POST, mover lógica a controlador + servicio, agregar validación y auditoría |
| `pages/notificaciones.html` | **CRÍTICO**: `guardarNotificacion()` debe llamar API; `marcarLeida/marcarTodasLeidas` debe llamar API; `enviarMasivo()` debe conectarse a WhatsApp o eliminarse |
| `pages/dashboard.html` (renderAlertas) | **MEDIO**: Las alertas del Dashboard deberían alimentarse del módulo de notificaciones, no ser HTML independiente |

### Crear

| Archivo | Motivo |
|---------|--------|
| `backend/src/controllers/notificacionController.js` | Separar lógica de la ruta |
| `backend/src/services/notificacionService.js` | Lógica de negocio para notificaciones |

### Eliminar / Reemplazar

| Archivo | Motivo |
|---------|--------|
| `pages/notificaciones.html:302-309` (enviarMasivo) | Función simulada que engaña al usuario. Reemplazar por integración real con WhatsApp o remover |

---

## 4. Riesgos Técnicos Detectados

### 4.1 🔴 `guardarNotificacion()` no persiste — solo memoria

**Archivo:** `pages/notificaciones.html:282-300`
```javascript
function guardarNotificacion() {
  // ... validación ...
  DB.notificaciones.push({
    id: "N" + String(DB.notificaciones.length + 1).padStart(3, "0"),
    tipo, titulo, mensaje, fecha: new Date().toISOString().split("T")[0],
    leida: false, urgente: ...
  });
  // ... toast ...
  // ❌ NUNCA llama a API.notificaciones.crear() ni a ningún endpoint
}
```

**Riesgo:** 🔴 Crítico. Cualquier notificación creada por el usuario existe solo en `DB.notificaciones` (memoria del navegador). Al recargar la página, la notificación desaparece para siempre.

**Además:** El backend **no tiene endpoint POST** para crear notificaciones, por lo que aunque el frontend quisiera persistir, no podría.

### 4.2 🔴 `marcarLeida()` no persiste — solo memoria

**Archivo:** `pages/notificaciones.html:265-273`
```javascript
function marcarLeida(id, el) {
  const n = DB.notificaciones.find(x => x.id === id);
  if (n && !n.leida) {
    n.leida = true;  // ❌ Solo cambia en memoria
    el.style.background = "transparent";
    renderKPIs();
    // ❌ NUNCA llama a API.notificaciones.marcarLeida(id)
  }
}
```

**Riesgo:** 🔴 Crítico. Al recargar la página, todas las notificaciones vuelven a estado "no leídas". El badge del sidebar siempre mostrará el total desde el backend.

### 4.3 🔴 `marcarTodasLeidas()` no persiste — solo memoria

**Archivo:** `pages/notificaciones.html:275-280`
```javascript
function marcarTodasLeidas() {
  DB.notificaciones.forEach(n => n.leida = true);  // ❌ Solo memoria
  renderKPIs();
  renderNotificaciones(filtroNotif);
  Toast.success("Todas las notificaciones marcadas como leídas.");
  // ❌ NUNCA llama a API.notificaciones.marcarTodas()
}
```

**Riesgo:** 🔴 Crítico. Ídem anterior.

### 4.4 🔴 `enviarMasivo()` es completamente simulado

**Archivo:** `pages/notificaciones.html:302-309`
```javascript
function enviarMasivo(tipo) {
  const msgs = {
    mora:   "Recordatorio de mora enviado a 6 socios por email.",
    pago:   "Recordatorio de pago enviado a 18 socios pendientes.",
    cierre: "Aviso de cierre de período enviado a todos los socios."
  };
  Toast.success(msgs[tipo] || "Notificación enviada.");
}
```

**Riesgos múltiples:**
- Los números (6, 18, "todos") están hardcodeados
- No se conecta al módulo WhatsApp para enviar realmente
- No se conecta a ningún servicio de email
- No registra en BD que se enviaron recordatorios
- El usuario cree que se realizó una acción real cuando no es así

### 4.5 🟠 Sin endpoint POST para crear notificaciones

**Archivo:** `backend/src/routes/notificaciones.js`

El backend expone:
- `GET /` — listar notificaciones
- `PUT /:id/leer` — marcar una como leída
- `PUT /leer-todas` — marcar todas como leídas

**Pero NO expone:**
- `POST /` — crear notificación
- `DELETE /:id` — eliminar notificación

### 4.6 🟠 Sin controlador ni servicio

**Archivo:** `backend/src/routes/notificaciones.js`

Todo el código está inline en el route handler. No hay:
- `notificacionController.js`
- `notificacionService.js`

Esto impide reutilizar lógica (ej. crear notificaciones automáticas desde otros módulos como aportes, créditos).

### 4.7 🟠 Sin auditoría en backend

**Archivo:** `backend/src/routes/notificaciones.js`

No se llama a `audit()` en ninguna operación. No se registra:
- Quién marcó notificaciones como leídas
- Cuándo se marcaron
- Cuántas se marcaron

### 4.8 🟡 Sin paginación real — límite fijo de 50

**Archivo:** `backend/src/routes/notificaciones.js:10-14`
```javascript
const notifs = await prisma.notificacion.findMany({
  where:   soloNL ? { leida: false } : {},
  orderBy: { createdAt: 'desc' },
  take:    50,
});
```

El límite está fijo en 50. No hay `skip` ni paginación real. Si hay más de 50 notificaciones, el usuario nunca las verá.

### 4.9 🟡 ID débil en frontend para nuevas notificaciones

**Archivo:** `pages/notificaciones.html:288`
```javascript
id: "N" + String(DB.notificaciones.length + 1).padStart(3, "0"),
```

Genera IDs como `N001`, `N002`, etc. Esto es frágil porque:
- Depende del orden del arreglo, no de un valor único real
- Si se elimina una notificación del arreglo, los IDs se desordenan
- Colisiona con IDs UUID reales del backend

### 4.10 🟡 Fecha mostrada incorrecta en frontend

**Archivo:** `pages/notificaciones.html:255`
```javascript
DataHelper.formatFecha(n.fecha)
```

El modelo Prisma usa `createdAt` como campo de timestamp. Pero el frontend espera `n.fecha`. Si las notificaciones provienen del backend, `n.fecha` es `undefined` y `DataHelper.formatFecha(undefined)` devuelve `"—"`.

**Riesgo:** Las notificaciones cargadas desde el backend muestran "—" como fecha.

### 4.11 🟡 `renderNotificaciones()` revierte arreglo cada render

**Archivo:** `pages/notificaciones.html:222`
```javascript
let lista = DB.notificaciones.slice().reverse();
```

Crea una copia y la revierte cada vez que se renderiza. Esto es O(n) por render. Con pocas notificaciones no es problema, pero es ineficiente si el módulo se escala.

### 4.12 🟡 Categorías de tipo hardcodeadas

**Archivo:** `pages/notificaciones.html:189-195`
```javascript
const TIPO_CONFIG = {
  mora:      { cls: "danger", icon: "🔴", label: "Mora" },
  aporte:    { cls: "success", icon: "🟢", label: "Aporte" },
  credito:   { cls: "warn",   icon: "🟡", label: "Crédito" },
  solicitud: { cls: "info",   icon: "🔵", label: "Solicitud" },
  general:   { cls: "info",   icon: "ℹ️", label: "General" }
};
```

Los tipos están hardcodeados. Si el backend usa un tipo como `"sistema"` (como en el seed: `tipo: 'sistema'`), el frontend cae en `TIPO_CONFIG.general` y muestra el ícono `ℹ️` en lugar de algo más específico.

---

## 5. Riesgos Funcionales Detectados

### 5.1 🔴 Las notificaciones marcadas como leídas se restablecen al recargar

Este es el riesgo funcional más crítico. Un usuario que:
1. Marca 10 notificaciones como leídas (una por una o "marcar todas")
2. Recarga la página
3. **Todas aparecen como no leídas nuevamente**

El badge muestra el número total del backend, no el estado real deseado por el usuario.

### 5.2 🔴 Las notificaciones creadas se pierden al recargar

Un administrador que crea una notificación importante y recarga la página la pierde para siempre.

### 5.3 🟠 Dashboard tiene su propio sistema de alertas

**Archivo:** `pages/dashboard.html:600-620`

Las alertas del Dashboard (`renderAlertas()`) generan HTML hardcodeado con:
- Socios en mora (desde resumen del dashboard)
- Créditos en mora (filtro local)
- Cierre de período (desde config)

Estas alertas **no se conectan al módulo de notificaciones**. No se genera una `Notificacion` cuando un socio cae en mora. Son dos sistemas paralelos e incomunicados.

### 5.4 🟠 `enviarMasivo()` da falsa sensación de acción real

Un tesorero que hace clic en "Recordatorio de mora" ve un Toast que dice "Enviado a 6 socios por email", pero:
- No se envió ningún email
- No se envió ningún WhatsApp
- No se registró ninguna acción
- Los 6 socios en mora realmente existen? No se verifica

### 5.5 🟡 KPIs de notificaciones no coinciden con backend

**Archivo:** `pages/notificaciones.html:197-218`

```javascript
const total    = DB.notificaciones.length;
const noLeidas = DB.notificaciones.filter(n => !n.leida).length;
const urgentes = DB.notificaciones.filter(n => n.urgente && !n.leida).length;
```

Los KPIs usan `DB.notificaciones` (memoria local), no hacen una llamada al backend para obtener conteos precisos. Si otro usuario agregó o modificó notificaciones, el conteo local es incorrecto.

### 5.6 🟡 Filtro "Urgentes" incluye leídas

El filtro de pestaña "urgentes" (`notificaciones.html:224`) hace:
```javascript
if (filtro === "urgentes") lista = lista.filter(n => n.urgente);
```

Pero el KPI de urgentes excluye leídas:
```javascript
const urgentes = DB.notificaciones.filter(n => n.urgente && !n.leida).length;
```

Hay inconsistencia: el KPI muestra solo urgentes no leídas, pero la pestaña "Urgentes" muestra todas las urgentes (incluyendo leídas).

### 5.7 🟡 Sin notificaciones automáticas del sistema

No hay código en ningún módulo que genere notificaciones automáticas cuando:
- Un socio cae en mora
- Se acerca el cierre de período
- Un crédito es aprobado
- Se registra un pago

Todas las notificaciones actuales son solo las del seed inicial.

---

## 6. Código Duplicado o Muerto

### 6.1 Código muerto: `API.notificaciones.marcarLeida()` y `marcarTodas()` no son llamados

**Archivo:** `js/api.js:194-196`

```javascript
notificaciones: {
  listar:      (soloNL=false) => API.get(`/notificaciones?solo_no_leidas=${soloNL}`),
  marcarLeida: (id)           => API.put(`/notificaciones/${id}/leer`),
  marcarTodas: ()             => API.put("/notificaciones/leer-todas"),
},
```

Estos dos métodos existen en la API y el backend los soporta, pero **nunca son llamados** desde la interfaz. `marcarLeida()` y `marcarTodasLeidas()` en frontend solo modifican memoria.

### 6.2 Duplicación: Dashboard tiene alertas independientes

La lógica para determinar mora y mostrar alertas existe en:
- `dashboard.html:600-620` (renderAlertas) — HTML hardcodeado
- El módulo de Notificaciones no se usa para generar estas alertas
- El módulo WhatsApp también tiene su propia lógica de alertas de mora

### 6.3 Código muerto: `renderKPIs()` en app.js para notificaciones

**Archivo:** `js/app.js:276-283`

```javascript
const badge = document.getElementById("notifBadge");
if (badge) { ... }
const dot = document.getElementById("topNotifDot");
if (dot) { ... }
```

El badge con id `"notifBadge"` **no existe en layout.js**. Revisando `layout.js`, no hay ningún elemento con `id="notifBadge"` en el sidebar. El badge que se muestra en el sidebar es generado por `roles.js` con clase `"nav-badge"`, no con id `"notifBadge"`.

Esto significa que el código de `app.js:276-281` que busca `document.getElementById("notifBadge")` siempre encuentra `null` y no actualiza nada. Es código muerto.

---

## 7. Problemas de Arquitectura

### 7.1 Rutas sin capas (Controller + Service)

**Archivo:** `backend/src/routes/notificaciones.js`

La ruta de notificaciones es la única (junto con dashboard) que no tiene controlador ni servicio separados. La lógica está toda inline. Esto viola el patrón de capas que siguen otros módulos como socios, aportes, créditos.

### 7.2 Backend incompleto — Sin endpoint de escritura

El backend permite **leer** notificaciones y **marcar como leídas**, pero no permite:
- **Crear** (`POST /`)
- **Eliminar** (`DELETE /:id`)
- **Contar** (`GET /count` o similar)

Para un módulo que debería generar notificaciones automáticas desde otros procesos, la ausencia del endpoint de creación es una omisión grave.

### 7.3 Frontend desconectado del backend

El frontend de notificaciones tiene una relación extraña con el backend:
| Operación | Backend soporta | Frontend usa |
|-----------|----------------|--------------|
| Listar | ✅ GET / | ✅ `app.js` precarga |
| Marcar leída | ✅ PUT /:id/leer | ❌ Solo memoria |
| Marcar todas | ✅ PUT /leer-todas | ❌ Solo memoria |
| Crear | ❌ No existe | ❌ Solo memoria |

### 7.4 Sin integración entre módulos

El módulo de Notificaciones debería ser el **centro de alertas del sistema**, pero actualmente está aislado:
- Dashboard tiene sus propias alertas
- WhatsApp tiene su propio panel
- No hay generación automática desde socios, aportes o créditos
- No hay evento que dispare una notificación

### 7.5 Punto rojo de topbar no se actualiza dinámicamente

**Archivo:** `js/layout.js:72-74`

```html
<button class="btn-icon" onclick="window.location.href='notificaciones.html'" title="Notificaciones">
  🔔<span class="dot" id="topNotifDot" style="display:none"></span>
</button>
```

El punto rojo solo se actualiza en la precarga de `app.js`. Si el usuario marca notificaciones como leídas en la página de notificaciones, el punto rojo en el topbar no se actualiza hasta recargar.

### 7.6 Sin actualización en tiempo real

No hay WebSocket, Server-Sent Events ni polling periódico. Las notificaciones solo se actualizan al cargar la página por primera vez (`app.js`). Si otro usuario crea una notificación, los demás no la verán hasta recargar.

---

## 8. Evaluación del Modelo de Datos

### 8.1 Modelo Prisma actual

```prisma
model Notificacion {
  id        String   @id @default(uuid())
  tipo      String
  titulo    String
  mensaje   String
  leida     Boolean  @default(false)
  urgente   Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  @@map("notificaciones")
}
```

### 8.2 Evaluación de campos

| Campo | Estado | Observación |
|-------|--------|-------------|
| `id` | ✅ Correcto | UUID auto-generado |
| `tipo` | ✅ Correcto | String para categorización |
| `titulo` | ✅ Correcto | Título de la notificación |
| `mensaje` | ✅ Correcto | Cuerpo del mensaje |
| `leida` | ✅ Correcto | Boolean con default false |
| `urgente` | ✅ Correcto | Boolean con default false |
| `createdAt` | ✅ Correcto | Timestamp auto-generado |

### 8.3 Campos faltantes

| Campo | ¿Necesario? | Motivo |
|-------|-------------|--------|
| `usuarioId` (origen) | 🟠 Sí | Para saber qué usuario/sistema generó la notificación |
| `socioId` (destino) | 🟠 Sí | Para notificaciones dirigidas a un socio específico |
| `leidoPor` | 🟡 Opcional | Para saber quién marcó como leída |
| `fechaLectura` | 🟡 Opcional | Para saber cuándo se leyó |
| `enlace` | 🟡 Opcional | Enlace a página relacionada (ej. "Ver crédito") |

### 8.4 Índices

El modelo no tiene índices explícitos más allá del índice primario de `id`. Para consultas frecuentes como "notificaciones no leídas" o "urgentes", un índice compuesto en `(leida, urgente, createdAt)` mejoraría el rendimiento.

---

## 9. Compatibilidad con las Reglas Oficiales de Negocio de FONEVI

### 9.1 Regla §12.1 — "Ninguna regla financiera deberá implementarse únicamente en el frontend"

**Estado:** ✅ No aplica directamente (las notificaciones no contienen reglas financieras).

### 9.2 Regla §12.2 — "Las reglas de negocio deberán centralizarse en el backend"

**Estado:** ❌ **PARCIALMENTE VIOLADA**

Las operaciones de marcado como leído deberían centralizarse en el backend, pero el frontend las ejecuta solo en memoria.

### 9.3 Regla §9 — "Toda operación crítica deberá ser trazable"

**Estado:** ❌ **VIOLADA**

No hay auditoría en ninguna operación de notificaciones.

### 9.4 Regla §7 — Cierre mensual

**Estado:** Potencial de integración no aprovechado. El cierre mensual debería generar notificaciones automáticas, pero no lo hace.

### 9.5 Regla §8 — Mora

**Estado:** Potencial de integración no aprovechado. La detección de mora en el Dashboard no genera notificaciones.

---

## 10. Evaluación de los KPIs y Métricas

### 10.1 Total Notificaciones

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | Frontend (`notificaciones.html:198`) |
| **Origen** | `DB.notificaciones.length` — datos en memoria |
| **Persiste** | ❌ No |
| **Riesgo** | 🟠 Alto: No refleja el total real en BD si hay cambios de otros usuarios |

### 10.2 Sin Leer

| Aspecto | Evaluación |
|---------|------------|
| **Fórmula** | `DB.notificaciones.filter(n => !n.leida).length` |
| **Riesgo** | 🟠 Alto: Ídem anterior |

### 10.3 Urgentes Sin Leer

| Aspecto | Evaluación |
|---------|------------|
| **Fórmula** | `DB.notificaciones.filter(n => n.urgente && !n.leida).length` |
| **Riesgo** | 🟠 Alto: Ídem anterior + inconsistencia con el filtro de pestaña Urgentes |

### 10.4 Badge del Sidebar

| Aspecto | Evaluación |
|---------|------------|
| **Dónde se calcula** | `roles.js:162-163` usando `DataHelper.getNotificacionesNoLeidas()` |
| **Origen** | `window.DB.notificaciones` (memoria) |
| **Se actualiza** | Solo al cargar página por `app.js` |
| **Riesgo** | 🟡 Medio: No refleja cambios en tiempo real |

---

## 11. Evaluación de la Trazabilidad

### 11.1 Estado actual: Sin trazabilidad

| Pregunta | Respuesta |
|----------|-----------|
| ¿Quién creó una notificación? | ❌ No se registra |
| ¿Quién marcó como leída? | ❌ No se registra |
| ¿Cuándo se leyó cada notificación? | ❌ No hay `fechaLectura` |
| ¿Qué notificaciones se enviaron masivamente? | ❌ No hay registro |
| ¿Se puede reconstruir el historial de notificaciones? | 🟡 Parcial: Las creadas por seed/backend persisten en BD; las creadas en frontend se pierden |

### 11.2 Mejora propuesta

El modelo `Notificacion` debería incluir:
- `usuario_origen_id` — quién o qué sistema generó la notificación
- `socio_destino_id` — a quién va dirigida (null =全体党员)
- Para trazabilidad completa, `marcarLeida` debería registrar `fechaLectura` y `usuario_lectura_id`

---

## 12. Recomendaciones de Mejora

### Inmediatas (Críticas antes de producción)

| # | Recomendación | Archivo(s) | Impacto | Esfuerzo |
|---|---------------|------------|---------|----------|
| **I1** | Conectar `marcarLeida()` a `API.notificaciones.marcarLeida(id)` | `notificaciones.html:265-273` | 🔴 Persistencia de lectura | 1 hora |
| **I2** | Conectar `marcarTodasLeidas()` a `API.notificaciones.marcarTodas()` | `notificaciones.html:275-280` | 🔴 Persistencia de lectura masiva | 1 hora |
| **I3** | Agregar endpoint `POST /api/notificaciones` en backend | `routes/notificaciones.js` | 🔴 Permitir crear notificaciones | 2 horas |
| **I4** | Conectar `guardarNotificacion()` a `POST /api/notificaciones` | `notificaciones.html:282-300`, `js/api.js` | 🔴 Persistencia de creación | 2 horas |
| **I5** | Eliminar o reemplazar `enviarMasivo()` con funcionalidad real que use el módulo WhatsApp | `notificaciones.html:302-309` | 🟠 Eliminar funcionalidad falsa | 4 horas |
| **I6** | Corregir `app.js:276` — buscar `nav-badge` en lugar de `notifBadge` | `js/app.js:276` | 🟡 Badge funcional | 30 min |

### Mediano Plazo (1-2 sprints)

| # | Recomendación | Impacto | Esfuerzo |
|---|---------------|---------|----------|
| **M1** | Crear `notificacionService.js` y `notificacionController.js` con lógica separada | 🟠 Clean Architecture | 4 horas |
| **M2** | Agregar auditoría a operaciones de notificaciones | 🟠 Trazabilidad | 2 horas |
| **M3** | Agregar campo `usuarioOrigenId` al modelo Notificacion | 🟡 Trazabilidad | 2 horas |
| **M4** | Agregar campo `fechaLectura` y `leidoPor` al modelo | 🟡 Trazabilidad | 2 horas |
| **M5** | Integrar Dashboard con módulo de notificaciones: `renderAlertas()` debe consumir notificaciones reales | 🟠 Consistencia | 4 horas |
| **M6** | Agregar paginación real con `skip` en backend | 🟡 Escalabilidad | 1 hora |
| **M7** | Actualizar punto rojo del topbar dinámicamente al marcar leídas | 🟡 UX | 1 hora |
| **M8** | Agregar filtro por tipo en backend (`?tipo=mora`) | 🟡 Flexibilidad | 1 hora |

### Largo Plazo (3+ sprints)

| # | Recomendación | Impacto | Esfuerzo |
|---|---------------|---------|----------|
| **L1** | Implementar WebSockets o SSE para notificaciones en tiempo real | 🟠 UX | 12 horas |
| **L2** | Generar notificaciones automáticas desde otros módulos (mora, aportes vencidos, cierre de período) | 🟠 Automatización | 8 horas |
| **L3** | Agregar notificaciones dirigidas por socio (`socioId`) | 🟡 Personalización | 4 horas |
| **L4** | Implementar envío real de notificaciones push/email/WhatsApp desde el backend | 🟠 Comunicación real | 8 horas |
| **L5** | Agregar opción de eliminar notificaciones (con soft-delete) | 🟡 Mantenimiento | 2 horas |
| **L6** | Agregar búsqueda y filtros combinados en frontend (tipo + urgente + no leídas) | 🟡 UX | 2 horas |

---

## 13. Observaciones para Futura Migración

### Clean Architecture
- **Preparación actual:** 🟠 Baja. La ruta no tiene controlador ni servicio.
- **Acción requerida:** Extraer `notificacionController.js` y `notificacionService.js` siguiendo el patrón de otros módulos.

### Domain-Driven Design (DDD)
- **Entidad de dominio:** `Notificacion` con propiedades: tipo, título, mensaje, urgente.
- **Comportamientos:** marcarComoLeida(), crear(), esUrgente().
- **Eventos de dominio:** `NotificacionCreada`, `NotificacionLeida`.

### SaaS Multi-Tenant
- **Preparación actual:** 🔴 No preparado.
- **Acción:** Agregar `tenantId` al modelo Notificacion.

### Event Sourcing
- **Preparación actual:** 🟡 Potencial. Las notificaciones son eventos por naturaleza.
- **Beneficio:** Cada "notificación creada" y "marcada como leída" sería un evento inmutable.

### Integración con Sistema de Alertas
- **Visión a futuro:** Unificar:
  - Dashboard `renderAlertas()`
  - Módulo Notificaciones
  - WhatsApp Panel
  - Envío de emails
- En un solo **Sistema Central de Alertas y Comunicaciones**.

---

## 14. Conclusión Final

### ¿Está listo para producción?

**NO.** El módulo de Notificaciones **no está listo para producción** debido a la desconexión entre frontend y backend en las operaciones de escritura.

### Principales riesgos

1. **🔴 Marcado como leído no persiste**: `marcarLeida()` y `marcarTodasLeidas()` solo modifican memoria. Los endpoints PUT existen en backend pero nunca se llaman.
2. **🔴 Creación de notificaciones no persiste**: `guardarNotificacion()` solo agrega a un arreglo en memoria. Backend no tiene endpoint POST.
3. **🔴 Envío masivo simulado**: Las funciones de envío masivo muestran mensajes hardcodeados sin realizar ninguna acción real.
4. **🟠 Sin controlador ni servicio**: Backend con lógica inline, difícil de mantener y extender.
5. **🟠 Falta de auditoría**: No hay registro de operaciones sobre notificaciones.
6. **🟡 Badge `notifBadge` no existe en DOM**: El código de `app.js` busca un elemento que no está en ninguna página.

### Nivel de confiabilidad

| Aspecto | Nivel |
|---------|-------|
| Lectura de notificaciones desde BD | 🟢 Confiable |
| Visualización y filtros en frontend | 🟢 Confiable |
| Marcado como leído | 🔴 **No persiste** |
| Creación de notificaciones | 🔴 **No persiste** |
| Envío masivo de recordatorios | 🔴 **Simulado** |
| Badge de sidebar | 🟡 Se actualiza solo al cargar página |
| Punto rojo topbar | 🟡 Se actualiza solo al cargar página |
| Integración con Dashboard | 🔴 **No existe** (alertas independientes) |

### Recomendación final del auditor

1. **Antes de producción**: Aplicar correcciones I1 a I5 para que las operaciones de escritura persistan en backend. Es trabajo de unas pocas horas pero cambia completamente la confiabilidad del módulo.
2. **El backend tiene buena base**: Los endpoints GET y PUT existen y funcionan. Solo falta conectar el frontend a ellos y agregar POST.
3. **Eliminar o reemplazar `enviarMasivo()`**: Esta función es engañosa. Si no hay integración real con WhatsApp/email, mejor quitarla que mostrar mensajes falsos.
4. **Unificar el sistema de alertas**: A mediano plazo, integrar Dashboard, Notificaciones y WhatsApp en un solo sistema.

### Veredicto

> **🟠 NO APTO PARA PRODUCCIÓN — Módulo parcial con correcciones rápidas posibles.** El módulo de Notificaciones tiene un backend funcional para lectura y marcado, pero el frontend no utiliza los endpoints de escritura. Con correcciones estimadas en **4-6 horas de trabajo**, el módulo quedaría completamente funcional. El principal riesgo no es técnico sino de **desconexión frontend-backend**: el código parece funcionar pero los cambios no persisten.

---

*Documento generado el 17 de junio de 2026 — Auditoría integral del Módulo de Notificaciones de FONEVI.*
