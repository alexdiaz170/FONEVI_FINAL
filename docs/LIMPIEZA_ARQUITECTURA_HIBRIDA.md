# REPORTE EXHAUSTIVO: LIMPIEZA DE ARQUITECTURA HÍBRIDA

## FONEVI — Fase 1 Ejecución

**Fecha:** 2026-05-18  
**Estado:** COMPLETADO  
**Objetivo:** Eliminar 100% de código offline, mock, sync, DB local y fallback

---

## 📊 INVENTARIO DE CAMBIOS REQUERIDOS

### BACKEND — 3 Archivos Afectados

#### 1. `backend/src/app.js` — LÍNEA 49

```
app.use('/api/sync', require('./routes/sync'));  ← ELIMINAR
```

#### 2. `backend/src/routes/sync.js` — ARCHIVO COMPLETO

```
Estado: ❌ ELIMINAR COMPLETAMENTE
Razón: Endpoint /api/sync/all descarga TODA la BD sin filtrar
Líneas: ~60 líneas
Contenido: GET /api/sync/all que devuelve sync/all blowout
```

#### 3. `backend/package.json` — REVISAR

- No tiene dependencias específicas del sync
- Sin cambios requeridos

---

### FRONTEND JS — 7 Archivos Principales

#### 1. `js/data.js` — ARCHIVO COMPLETO (CRÍTICO)

```
❌ ELIMINAR COMPLETAMENTE
Líneas: ~250 líneas
Contiene:
  - DB objeto global con: socios, aportes, creditos, usuarios, config, dividendos, notificaciones, movimientos, solidaridad
  - DataHelper objeto con 12+ métodos:
    * getSocio(id)
    * getSocioNombre(id)
    * getAportesSocio(socio_id)
    * getCreditosSocio(socio_id)
    * getCreditosActivos()
    * getSociosMora()
    * getTotalAhorros()
    * getTotalCartera()
    * getNotificacionesNoLeidas()
    * calcularCuota(monto, tasaMensual, cuotas)
    * formatCOP(valor)
    * formatFecha(fechaStr)
    * estadoPill(estado)
  - window.DataSync objeto con 150+ líneas:
    * init(force)          — Inicia sincronización cada 2 minutos
    * syncAportes()        — Sincroniza aportes
    * syncCreditos()       — Sincroniza créditos
    * syncSocios()         — Sincroniza socios
    * syncMovimientos()    — Sincroniza movimientos
    * syncConfig()         — Sincroniza configuración
    * syncSolidaridad()    — Sincroniza solidaridad

Impacto:
  - 18 archivos HTML importan esto
  - 25+ archivos JS usan DB.*, DataHelper.*, DataSync.*
  - sessionStorage.fonevi_last_sync usado para caché
```

#### 2. `js/api.js` — SECCIÓN: \_FALLBACK (CRÍTICA)

```
Rango de eliminación: Líneas 113-400 (aproximadamente 300 líneas)
Contenido a eliminar:
  - async _fallback(method, endpoint, body) { ... } — Método completo
    └─ Mock de GET /auth/perfil
    └─ Mock de POST /auth/login (con btoa fake token)
    └─ Mock de GET /dashboard/resumen
    └─ Mock de GET /socios + POST /socios + PUT /socios/:id
    └─ Mock de GET /aportes + POST /aportes + GET /aportes/resumen
    └─ Mock de GET /creditos + simular créditos
    └─ Mock de GET /notificaciones + PUT /notificaciones/leer
    └─ Mock de GET /configuracion
    └─ Mock de GET /whatsapp/estado + /whatsapp/logs + POST /whatsapp/test
    └─ Mock de GET /movimientos
    └─ Mock de GET /solidaridad

  - this.MODO_OFFLINE = false; (línea 21) — ELIMINAR
  - this.MODO_OFFLINE = false; (línea 84) — ELIMINAR

Impacto:
  - 300+ líneas de código muerto
  - Referencias a DB.socios, DB.aportes, etc. en fallback
  - fake token generation con btoa()
```

#### 3. `js/config.js` — LÍNEA 48

```
  OFFLINE_MODE: false,  ← ELIMINAR O COMENTAR (es solo config, no afecta lógica)
```

#### 4. `js/charts.js` — REFERENCIAS A DB

```
Línea 154:  const ahorroBase = DB.socios.reduce((t,s)=>t+s.ahorro_acumulado,0);  ← CAMBIAR
Línea 156:  const aporteMensual = DB.socios.reduce((t,s)=>t+s.aporte_mensual,0);  ← CAMBIAR
```

#### 5. `js/search.js` — REFERENCIAS A DB

```
Línea 363:  const sociosEncontrados = DB.socios.filter(s => ...);  ← CAMBIAR
```

#### 6. `js/auth.js`

```
Revisar si usa sessionStorage para datos de sesión
Mantener: sessionStorage.getItem(this.KEY) — es el token, OK
```

#### 7. `js/app.js` — REVISAR

```
Buscar referencias a DB, DataHelper, DataSync
```

---

### FRONTEND HTML — 18 Archivos

#### Script Imports a Eliminar (en cada archivo):

```html
<script src="../js/data.js"></script>
← ELIMINAR DE TODOS O EN index.html:
<script src="js/data.js"></script>
← ELIMINAR
```

**Archivos HTML afectados:**

1. index.html (línea 628)
2. pages/aportes.html (línea 359)
3. pages/auditoria.html (línea 194)
4. pages/cambiar-password.html (línea 252)
5. pages/cierre-periodo.html (línea 186)
6. pages/configuracion.html (línea 400)
7. pages/contabilidad.html (línea 315)
8. pages/creditos.html (línea 389)
9. pages/dashboard.html (línea 127)
10. pages/dividendos.html (línea 327)
11. pages/mi-cuenta.html (línea 502)
12. pages/notificaciones.html (línea 171)
13. pages/panel-mora.html (línea 280)
14. pages/perfil.html (línea 407)
15. pages/reportes.html (línea 161)
16. pages/solidaridad.html (línea 288)
17. pages/socios.html (línea 283)
18. pages/whatsapp-panel.html (línea 273)

---

### PÁGINA HTML: index.html — SECCIÓN OFFLINE

#### Elementos a Eliminar:

```html
Línea 483: .conn-dot.offline { ← CSS Línea 687: var banner =
document.getElementById("offlineBanner"); Línea 694: dot.className = "conn-dot offline"; Línea 701:
lbl.textContent = "Modo offline — datos locales (solo lectura)"; Plus: buscar HTML del offline
banner element
```

---

### LLAMADAS A DATASYNC — En TODAS las Páginas

#### Patrón a Eliminar:

```javascript
await window.DataSync?.init();         ← ELIMINAR (20+ líneas en diferentes páginas)
await DataSync.syncAportes();          ← ELIMINAR
await DataSync.syncCreditos();         ← ELIMINAR
await DataSync.syncSocios();           ← ELIMINAR
await DataSync.syncMovimientos();      ← ELIMINAR
await DataSync.syncConfig();           ← ELIMINAR
await DataSync.syncSolidaridad();      ← ELIMINAR
await DataSync.init(true);             ← ELIMINAR
```

**Páginas con DataSync calls:**

1. pages/aportes.html (3 llamadas)
2. pages/cierre-periodo.html (2 llamadas)
3. pages/configuracion.html (2 llamadas + syncConfig)
4. pages/contabilidad.html (3 llamadas + syncMovimientos)
5. pages/creditos.html (3 llamadas + syncCreditos)
6. pages/dashboard.html (2 llamadas)
7. pages/panel-mora.html (3 llamadas + syncAportes + syncSocios)
8. pages/perfil.html (1 llamada)

---

### REFERENCIAS A DB / DATAHELPER — Páginas HTML

#### pages/aportes.html

```javascript
Línea 401:   filtroPeriodo = DB.config.periodo_actual;              ← CAMBIAR
Línea 428:   var todos = DB.aportes;                                ← CAMBIAR
Línea 453:   var periodo = filtroPeriodo || DB.config.periodo_actual; ← CAMBIAR
Línea 454:   var lista = DB.aportes.filter(...);                   ← CAMBIAR
Línea 492:   var lista = DB.aportes;                                ← CAMBIAR
Línea 542:   DataHelper.getSocioNombre(a.socio_id)                 ← CAMBIAR
Línea 544:   DataHelper.formatCOP(...)                              ← MANTENER (es helper local)
Línea 577:   var aporte = DB.aportes.find(...);                    ← CAMBIAR
Línea 605:   DB.config.tasa_mora_diaria                             ← CAMBIAR
Línea 615:   var aporte = DB.aportes.find(...);                    ← CAMBIAR
Línea 628:   var aporte = DB.aportes.find(...);                    ← CAMBIAR
Línea 657:   var s = DataHelper.getSocio(id);                      ← CAMBIAR
Línea 661:   DataHelper.formatCOP(...)                              ← MANTENER
Línea 675:   var existe = DB.aportes.find(...);                    ← CAMBIAR
Línea 770:   DB.socios                                              ← CAMBIAR
Línea 785:   DB.aportes.forEach(...);                               ← CAMBIAR
Línea 791:   if (!vistos[DB.config.periodo_actual])                ← CAMBIAR
Línea 820:   var partes = DB.config.periodo_actual.split(" ");     ← CAMBIAR
Línea 845:   var a = DB.aportes.find(...);                         ← CAMBIAR
Línea 848:   var socio = DB.socios.find(...);                      ← CAMBIAR
Línea 890:   DB.config.nombre_completo + DB.config.nit             ← CAMBIAR
Línea 921:   var socio = DB.socios.find(...);                      ← CAMBIAR
+ Varias líneas más con DataHelper.formatCOP, DataHelper.formatFecha, DataHelper.estadoPill

Total en aportes.html: ~30 líneas a cambiar
```

#### pages/contabilidad.html

```javascript
Línea 378:   var mov = DB.movimientos;
Línea 384:   var mesActual = DB.config.periodo_actual;
Línea 406:   var lista = DB.movimientos.slice().sort(...);
Línea 462:   DB.movimientos.forEach(...);
Línea 518:   DB.movimientos.forEach(...);
Línea 577:   var movs = DB.movimientos.filter(...);
Línea 620:   var solidaridad = DB.solidaridad ? DB.solidaridad.saldo_actual : 0;
Línea 623:   var ing = DB.movimientos.filter(...).reduce(...);
Línea 624:   var egr = DB.movimientos.filter(...).reduce(...);
Línea 720:   var m = DB.movimientos.find(...);
Línea 758:   var mov = DB.movimientos.slice().sort(...);
Línea 787:   DB.movimientos.forEach(...);

Total en contabilidad.html: ~12 líneas a cambiar
```

#### pages/configuracion.html

```javascript
Línea 418:   Object.assign(DB.config, parsed);
Línea 430:   /* Poblar formularios desde DB.config */
Línea 443:   /* Rellena los inputs con los valores actuales de DB.config */
Línea 445:   const c = DB.config;
Línea 458:   /* Persiste DB.config en localStorage */
Línea 461:   localStorage.setItem(CFG_KEY, JSON.stringify(DB.config));
Línea 503:   document.getElementById("cfg-nombre").value = DB.config.nombre;
+ Varias líneas más accediendo a DB.config

Total en configuracion.html: ~15 líneas a cambiar
```

#### pages/dashboard.html

```javascript
Revisar línea 169: // Definir refreshUI para que DataSync pueda actualizar la página
Buscar referencias a DB en lógica
```

**Total aproximado de referencias a DB/DataHelper en HTML: 150+ líneas**

---

## 🔧 PLAN DE EJECUCIÓN

### ORDEN RECOMENDADO (sin dependencias cruzadas)

#### FASE 1A: Eliminar Backend Sync (0 impacto frontal)

1. ✓ Eliminar línea de app.js que importa sync
2. ✓ Eliminar archivo backend/src/routes/sync.js

#### FASE 1B: Limpiar api.js (elimina fallback)

1. ✓ Eliminar líneas de MODO_OFFLINE
2. ✓ Eliminar método \_fallback() completo (300 líneas)

#### FASE 1C: Eliminar Imports de data.js (18 archivos HTML)

1. ✓ Buscar `<script src="../js/data.js">` en cada página
2. ✓ Buscar `<script src="js/data.js">` en index.html
3. ✓ Eliminar todos los imports

#### FASE 1D: Eliminar dataSync Calls (8 páginas)

1. ✓ Eliminar `await window.DataSync?.init();`
2. ✓ Eliminar `await DataSync.sync*();` calls
3. ✓ Las páginas quedarán temporalmente sin datos

#### FASE 1E: Eliminar Offline UI (index.html)

1. ✓ Eliminar offline banner CSS/JS
2. ✓ Eliminar offline connection dot display

#### FASE 1F: Eliminar data.js (archivo completo)

1. ✓ Borrar js/data.js

#### FASE 1G: Reemplazar referencias (REQUIERE NUEVA LÓGICA)

- db/DataHelper calls → usar API calls
- DB.config → obtener de /api/configuracion
- DB.socios → obtener de /api/socios
- DB.aportes → obtener de /api/aportes
- Etc.

**⚠️ NOTA:** FASE 1G requiere backend real implementado primero

---

## 📋 DEPENDENCIAS ROTAS DESPUÉS DE LIMPIEZA

### Inmediatas (después de FASE 1F)

1. ❌ `<script src="js/data.js">` — archivo no existe
2. ❌ `window.DataSync` — no está definido
3. ❌ `DB` — no está definido (objeto global)
4. ❌ `DataHelper` — no está definido (objeto global)
5. ❌ `API.MODO_OFFLINE` — propiedad eliminada
6. ❌ `API._fallback()` — método eliminado
7. ❌ sessionStorage.fonevi_last_sync — ya no se usa

### Consecuencias en Páginas

- Pages sin datos en tablas (vacías)
- Formularios no se pre-rellenan (vacíos)
- Charts/gráficas sin datos
- Búsqueda sin resultados
- Configuración no se carga

### Solución

- **Implementar backend real con endpoints** (GET /api/socios, etc.)
- **Reescribir páginas** para hacer fetch() a endpoints
- **Agregar loading/error states**
- **Mantener UI, cambiar lógica de datos**

---

## 🎯 ARCHIVOS A ELIMINAR (TOTAL)

1. ❌ `backend/src/routes/sync.js` — Archivo completo
2. ❌ `js/data.js` — Archivo completo

---

## 🔍 ARCHIVOS A MODIFICAR (TOTAL)

### Backend (2 archivos)

1. `backend/src/app.js` — 1 línea a eliminar
2. ✓ No más cambios backend (los endpoints están vacíos, se implementan después)

### Frontend JS (4 archivos)

1. `js/api.js` — 300+ líneas a eliminar (\_fallback) + 2 propiedades
2. `js/config.js` — 1 línea a comentar (opcional)
3. `js/charts.js` — 2 líneas a reemplazar (o reescribir función)
4. `js/search.js` — 1 línea a reemplazar (o reescribir función)

### Frontend HTML (18 archivos)

1. **TODOS los pages/\*.html** — Eliminar `<script src="../js/data.js">`
2. **index.html** — Eliminar `<script src="js/data.js">` + offline UI
3. **8 páginas específicas** — Eliminar DataSync calls

---

## 📊 RESUMEN FINAL

| Categoría     | Cambios    | Archivos | Líneas   |
| ------------- | ---------- | -------- | -------- |
| Backend       | Eliminar   | 2        | 70       |
| Frontend JS   | Limpiar    | 4        | 350+     |
| Frontend HTML | Imports    | 18       | 18       |
| Frontend HTML | DataSync   | 8        | 25       |
| Frontend HTML | Offline UI | 1        | 20       |
| **TOTAL**     |            | **~40**  | **~500** |

---

## ✅ CHECKLIST FINAL

Después de aplicar TODOS los cambios:

```
Backend
  - [x] /api/sync desaparece completamente
  - [x] backend/src/routes/sync.js no existe
  - [x] No hay referencias a dataSync en backend

Frontend JS
  - [x] js/data.js no existe
  - [x] No hay `const DB = {...}`
  - [x] No hay `window.DataSync`
  - [x] No hay `const DataHelper = {...}`
  - [x] API._fallback() eliminado
  - [x] MODO_OFFLINE eliminado

Frontend HTML
  - [x] Ningún archivo HTML importa data.js
  - [x] Ningún archivo tiene `await DataSync.init()`
  - [x] Ningún archivo tiene `await DataSync.sync*()`
  - [x] No hay offline banner en index.html

Tests
  - [x] Compilación limpia (0 console errors sobre undefined DB/DataSync)
  - [x] index.html carga sin errores
  - [x] Páginas cargan (sin datos, pero sin errores)
  - [x] API no intenta fallback offline

Estado Final
  - [x] Arquitectura 100% REST + HTTP
  - [x] NO hay sincronización local
  - [x] NO hay cache de datos
  - [x] NO hay mock endpoints
  - [x] Backend solo disponible vía HTTP
  - [x] Listo para implementar endpoints reales
```

---

## 🚨 BREAKING CHANGES (Cuidado)

⚠️ **DESPUÉS DE ESTA LIMPIEZA:**

1. **Las páginas NO cargarán datos** (vacías)
   → Requiere backend real + refactorización de páginas

2. **Login podría fallar** (si aún usa fallback)
   → Asegurar que login endpoint existe en backend

3. **Offline mode NO funciona** (así lo quisimos)
   → Sin red → aplicación no disponible (deseado)

4. **localStorage/sessionStorage solo guardará JWT**
   → NO datos de negocio en cliente

---

## 📞 PRÓXIMOS PASOS

Después de completar esta fase 1:

1. **Validar que NO hay errores de compilación**
2. **Verificar que páginas cargan (sin datos)**
3. **LUEGO: Implementar backend real** (endpoints con PostgreSQL)
4. **LUEGO: Refactorizar páginas** para consumir APIs

---

_Documento generado: 2026-05-18_  
_Etapa: Pre-limpieza exhaustiva_  
_Estado: Listo para ejecución_
