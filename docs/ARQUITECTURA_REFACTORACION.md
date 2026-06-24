# REFACTORIZACIÓN A ARQUITECTURA BACKEND-FIRST

## FONEVI — Plan de Acción Detallado

**Fecha inicio:** 2026-05-18  
**Responsable:** Arquitecto de Software  
**Objetivo:** Migrar de arquitectura híbrida (hybrid-frontend-mock-db) a arquitectura backend-first real (Express + PostgreSQL)

---

## 📊 ESTADO ACTUAL

### ✗ PROBLEMAS CRÍTICOS IDENTIFICADOS

```
1. /api/sync/all — Descarga TODA la BD a memoria (SECURITY RISK)
   └─ Sin filtrado por usuario/rol
   └─ Permite acceso no autorizado a datos de otros usuarios

2. dataSync + DB local (js/data.js)
   └─ Arrays globales: DB.socios, DB.aportes, DB.creditos
   └─ Frontend renderiza desde memoria, no desde API
   └─ Caché de 2 minutos de datos obsoletos

3. Fallback mode
   └─ api.js aún tiene código fallback a BD local
   └─ Aunque config dice OFFLINE_MODE: false

4. Endpoints mock sin autorización
   └─ GET /api/usuarios → no verifica rol ni propiedad de datos
   └─ POST /api/aportes → cualquier usuario puede crear aportes para otros

5. sessionStorage inseguro
   └─ Guarda token + session data completa
   └─ Frontend renderiza desde sesión cacheada, no valida contra servidor
```

### ✓ LO QUE FUNCIONA BIEN

- Express skeleton básico ✓
- JWT real en auth.js ✓
- bcryptjs configurado ✓
- Prisma singleton correctamente ✓
- CORS + helmet + rate-limit ✓
- Audit middleware presente ✓

---

## 🎯 OBJETIVO FINAL

```
Frontend (HTML/JS)
    ↓ (HTTP GET/POST + JWT)
    └─ Express API REST
         ↓ (SQL queries con autorización por usuario)
         └─ PostgreSQL (persistencia real)
              ↓
         Response JSON (datos filtrados por rol/usuario)
              ↓
         Frontend renderiza SOLO UI temporal
```

**Características obligatorias:**

- NO sync/all
- NO DB local
- NO localStorage para datos financieros
- NO arrays globales
- JWT en CADA request
- Autorización granular (usuario ve SOLO sus datos)
- Auditoría de cambios
- Paginación en queries grandes

---

## 📋 FASES DE IMPLEMENTACIÓN

### FASE 1: SETUP + ELIMINAR HÍBRIDA (ESTA SESIÓN)

#### 1.1 Validar Prisma schema

- [ ] Leer `backend/prisma/schema.prisma`
- [ ] Verificar relaciones Usuario → Socio
- [ ] Verificar que cada tabla sabe "a quién pertenece"
- [ ] Crear migration si es necesario

**Deliverable:** `backend/prisma/schema.prisma` validado

#### 1.2 Implementar middleware de autorización

**Archivo:** `backend/src/middleware/auth.js`

```javascript
// requireAuth — valida JWT
module.exports.requireAuth = async (req, res, next) => { ... }

// requireRole(...roles) — valida rol específico
module.exports.requireRole = (...roles) => (req, res, next) => { ... }

// requireOwnership(field) — valida propiedad de recurso
module.exports.requireOwnership = (field) => (req, res, next) => { ... }
```

**Deliverable:** Middleware robusto y reusable

#### 1.3 Eliminar /api/sync/all

- [ ] Eliminar ruta en `backend/src/routes/sync.js`
- [ ] O cambiarla a endpoint específico (no más "sync/all" bulk)
- [ ] Verificar que no hay imports en frontend

**Deliverable:** ✓ Eliminado completamente

#### 1.4 Limpiar frontend (js/api.js)

- [ ] Eliminar fallback mode
- [ ] Eliminar referencias a dataSync
- [ ] Mantener SOLO HTTP + JWT
- [ ] Validar que getSession() SOLO retorna token

**Deliverable:** `js/api.js` limpio, solo HTTP

#### 1.5 Eliminar dataSync

- [ ] Eliminar `window.DataSync` de `js/data.js`
- [ ] Eliminar imports de dataSync en todas las páginas
- [ ] Eliminar caché de sessionStorage.fonevi_last_sync

**Deliverable:** dataSync eliminado

---

### FASE 2: IMPLEMENTAR ENDPOINTS REALES (PRÓXIMA SESIÓN)

#### 2.1 Endpoint: GET /api/socios (con autorización)

```javascript
// GET /api/socios?page=1&limit=50&estado=?&buscar=?
// Auth: ✓ JWT
// Rule: socio ve SOLO SU registro, admin ve todos

Response:
{
  ok: true,
  datos: [...],
  total: 150,
  page: 1,
  limit: 50
}
```

**Cambios necesarios:**

- Agregar WHERE en Prisma query
- Si usuario.rol === 'socio' → filtrar por id
- Agregar búsqueda fuzzy (nombre, documento)
- Paginación: skip + take

#### 2.2 Endpoints: POST/PUT /api/socios

- Validar entrada (nombre, documento, email, etc.)
- Verificar autenticación + autorización
- Guardar en PostgreSQL
- Auditar cambio

#### 2.3 Endpoint: GET /api/aportes (con filtro automático)

```javascript
// GET /api/aportes?page=1&limit=50&mes=?&ano=?
// Auth: ✓ JWT
// Rule: socio ve SOLO SUS aportes (filtro automático)

if (req.usuario.rol === 'socio') {
  where.socio_id = req.usuario.socio_id; // Filtro automático
}
```

#### 2.4 Endpoint: GET /api/dashboard/resumen (personalizado)

```javascript
// Response varía según rol:
// - admin/gerente: resumen global
// - socio: SOLO datos personales
// - contador: read-only de totales
```

---

### FASE 3: REFACTORIZAR FRONTEND (SEMANA 2)

#### 3.1 Reescribir paginas para consumir APIs

**Patrón NUEVO:**

```javascript
// pages/socios.html → pages/socios.js
async function cargarSocios() {
  try {
    const res = await API.get('/api/socios?page=1&limit=50');
    if (!res.ok) throw new Error(res.mensaje);

    mostrarTabla(res.datos);
    actualizarPaginacion(res.page, res.total);
  } catch (e) {
    Toast.error(e.message);
  }
}
```

**Patrón VIEJO (a eliminar):**

```javascript
// ❌ MALO: Usar DB local
const socios = DB.socios;
mostrarTabla(socios);

// ❌ MALO: dataSync cacheando
window.DataSync.init();
```

#### 3.2 Eliminar js/data.js completamente

- Verificar que NO hay imports en ningún archivo
- Mover datos de configuración a endpoint GET /api/configuracion

---

### FASE 4: VALIDACIÓN + SECURITY (SEMANA 3)

- [ ] Test: 2 usuarios simultáneos → verifica que NO ven datos del otro
- [ ] Test: Usuario intenta acceder GET /api/socios/otro-id → 403
- [ ] Test: Usuario intenta crear aporte para otro socio → 403
- [ ] Auditoría: Verificar que CADA cambio se registra
- [ ] Performance: Query /api/socios con 10k registros en <500ms

---

## 🔧 TAREAS INMEDIATAS (Esta sesión)

### ✓ TODO Checklist

```
PASO 1: Validar Prisma
  - [ ] Leer schema.prisma
  - [ ] Verificar relaciones
  - [ ] Documentar cambios necesarios

PASO 2: Implementar Middleware
  - [ ] Crear requireRole middleware
  - [ ] Crear requireOwnership middleware
  - [ ] Testear en postman

PASO 3: Eliminar Híbrida
  - [ ] Eliminar /api/sync/all
  - [ ] Eliminar dataSync de js/data.js
  - [ ] Eliminar fallback en js/api.js
  - [ ] Eliminar imports de data.js

PASO 4: Validar Frontend
  - [ ] Verificar que API.js SOLO hace HTTP
  - [ ] Verificar que sessionStorage SOLO tiene token
  - [ ] Compilar proyecto sin errores

PASO 5: Documentación
  - [ ] Crear ENDPOINTS_SPEC.md con rutas nuevas
  - [ ] Actualizar docs/DEPLOYMENT.md con instrucciones
  - [ ] Crear MIGRATION_CHECKLIST.md
```

---

## 📁 ARCHIVOS A MODIFICAR

### Backend

```
✓ backend/src/app.js
  └─ Eliminar /api/sync
  └─ Mantener resto de rutas

⚠ backend/src/middleware/auth.js
  └─ Agregar requireRole, requireOwnership

⚠ backend/src/routes/sync.js
  └─ ❌ ELIMINAR O REFACTORIZAR (no más sync/all)

🔧 backend/src/routes/socios.js
  └─ Implementar con autorización granular

🔧 backend/src/routes/aportes.js
  └─ Implementar con filtro automático de usuario

🔧 backend/src/routes/creditos.js
  └─ Similar a aportes

🔧 backend/src/routes/dashboard.js
  └─ Personalizar por rol

⚠ backend/prisma/schema.prisma
  └─ Validar integridad
  └─ Crear migration si es necesario
```

### Frontend

```
✓ js/config.js
  └─ Mantener (ya está bien)

⚠ js/api.js
  └─ Eliminar fallback + dataSync
  └─ Validar getSession()

❌ js/data.js
  └─ ELIMINAR COMPLETAMENTE
  └─ Mover config a API endpoint

⚠ js/app.js
  └─ Eliminar imports de data.js
  └─ Refactorizar para APIs

🔧 pages/*.html
  └─ Refactorizar cada página para consumir APIs
```

---

## 🚨 BREAKING CHANGES

⚠️ **CUIDADO: Estos cambios rompen compatibilidad con offline mode**

```
1. /api/sync/all desaparece
   → Frontend que confía en sync/all fallará
   → Solution: Usar endpoints granulares (/api/socios, /api/aportes, etc.)

2. DB local (data.js) desaparece
   → Scripts que importan DB.socios fallarán
   → Solution: Importar desde API

3. dataSync desaparece
   → window.DataSync.init() no existirá
   → Solution: Reemplazar con llamadas API individuales

4. Fallback mode desaparece
   → Si no hay servidor, NO hay fallback
   → Solution: Usar backend real (no hay alternativa)
```

---

## 📚 DOCUMENTOS DE REFERENCIA

Ver archivos en `/memories/session/`:

- `diagnosis-and-strategy.md` — Diagnóstico detallado
- `architecture-spec.md` — Especificación técnica completa

---

## ✅ CHECKLIST DE VALIDACIÓN FINAL

Antes de dar por completada cada fase:

```
SEGURIDAD
  - [ ] ¿Todos los endpoints tienen JWT validation?
  - [ ] ¿Hay verificación de autorización granular?
  - [ ] ¿Usuario NO puede ver datos de otros usuarios?
  - [ ] ¿Hay auditoría de cambios?

FUNCIONALIDAD
  - [ ] ¿GET /api/socios devuelve datos filtrados?
  - [ ] ¿POST /api/aportes guarda en PostgreSQL?
  - [ ] ¿GET /api/dashboard personaliza por rol?
  - [ ] ¿Paginación funciona?

FRONTEND
  - [ ] ¿API.js consume endpoints sin fallback?
  - [ ] ¿Tablas se renderizan desde respuestas API?
  - [ ] ¿Errores se muestran en UI?
  - [ ] ¿NO hay console warnings?

PERFORMANCE
  - [ ] ¿Queries con 10k registros < 500ms?
  - [ ] ¿Paginación reduce payload?
  - [ ] ¿NO hay N+1 queries?
```

---

## 🎓 LECCIONES APRENDIDAS

**Para evitar problemas futuros:**

1. ❌ NUNCA descargues "toda la BD" a un endpoint (sync/all)
2. ❌ NUNCA guardes datos de negocio en localStorage/sessionStorage
3. ❌ NUNCA tengas fallback a BD local
4. ✓ SIEMPRE valida autorización en CADA endpoint
5. ✓ SIEMPRE filtra datos por usuario/rol
6. ✓ SIEMPRE usa JWT real, no fake tokens

---

## 📞 SOPORTE

Si encuentras bloqueadores:

1. Revisar este documento
2. Revisar `architecture-spec.md`
3. Revisar `diagnosis-and-strategy.md`
4. Consultar stack trace en terminal

**Red flags:**

- Si frontend aún hace referencias a `DB.socios` ← refactorizar
- Si ves `DataSync.init()` ← eliminar
- Si endpoint devuelve arrays sin filtrar ← agregar WHERE
- Si jwt.verify() NO está en middleware ← agregar
