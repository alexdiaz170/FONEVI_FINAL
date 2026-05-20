# FONEVI Project Snapshot

## File List
- `README.md`
- `ARQUITECTURA_REFACTORACION.md`
- `DEPLOYMENT.md`
- `LIMPIEZA_ARQUITECTURA_HIBRIDA.md`
- Other project files (see directory listing)

---

## README.md

# FONEVI — Sistema de Gestión del Fondo de Empleados Docentes

<div align="center">

![FONEVI](https://img.shields.io/badge/FONEVI-v1.0.0-0f2d52?style=for-the-badge&logoColor=white)
![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-c9922a?style=for-the-badge)
![Licencia](https://img.shields.io/badge/Licencia-MIT-1d9e75?style=for-the-badge)
![Node](https://img.shields.io/badge/Node.js-≥18.0-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

</div>

---

## ARQUITECTURA_REFACTORACION.md

# REFACTORIZACIÓN A ARQUITECTURA BACKEND-FIRST
## FONEVI — Plan de Acción Detallado

**Fecha inicio:** 2026-05-18  
**Responsable:** Arquitecto de Software  
**Objetivo:** Migrar de arquitectura híbrida (hybrid-frontend-mock-db) a arquitectura backend-first real (Express + PostgreSQL)

---

## DEPLOYMENT.md

# 🚀 FONEVI - Configuración para Producción

## 📋 Checklist de Despliegue

### 1. Backend - Desplegar en un servicio cloud

**Opciones recomendadas:**
- **Railway** (Recomendado) - https://railway.app
- **Render** - https://render.com
- **Vercel** - https://vercel.com
- **Heroku** - https://heroku.com
- **DigitalOcean App Platform** - https://digitalocean.com

**Pasos:**
1. Sube tu código backend a GitHub
2. Conecta el repositorio al servicio de despliegue
3. Configura las variables de entorno:
```
DATABASE_URL=postgresql://USUARIO:PASSWORD@HOST:PUERTO/postgres?schema=public
JWT_SECRET=tu-jwt-secret-super-secreto
JWT_EXPIRES_IN=8h
BCRYPT_ROUNDS=12
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
CORS_ORIGIN=https://tu-dominio.com
```
4. Despliega y obtén la URL del backend

### 2. Frontend - Configurar URL del backend

**Archivo a editar:** `js/config.js`
```javascript
getBackendURL() {
  if (this.isProduction()) {
    // ⚠️ CAMBIA ESTA URL ⚠️
    return "https://tu-backend-desplegado.com/api";
    // Ejemplos según el servicio:
    // Railway: "https://fonevi-backend-production.up.railway.app/api"
    // Render:  "https://fonevi-backend.onrender.com/api"
    // Vercel:  "https://fonevi-backend.vercel.app/api"
    // Heroku:  "https://fonevi-backend.herokuapp.com/api"
  }
  return "http://127.0.0.1:3000/api";
}
```
---

## LIMPIEZA_ARQUITECTURA_HIBRIDA.md

# REPORTE EXHAUSTIVO: LIMPIEZA DE ARQUITECTURA HÍBRIDA
## FONEVI — Fase 1 Ejecución

**Fecha:** 2026-05-18  
**Estado:** COMPLETADO  
**Objetivo:** Eliminar 100% de código offline, mock, sync, DB local y fallback

---

## 📋 PLAN DE EJECUCIÓN

### ORDEN RECOMENDADO (sin dependencias cruzadas)

#### FASE 1A: Eliminar Backend Sync
1. Eliminar línea de `app.js` que importa sync
2. Eliminar archivo `backend/src/routes/sync.js`

#### FASE 1B: Limpiar `api.js` (elimina fallback)
1. Eliminar líneas de `MODO_OFFLINE`
2. Eliminar método `_fallback()` completo (≈300 líneas)

#### FASE 1C: Eliminar Imports de `data.js` (18 archivos HTML)
1. Buscar `<script src="../js/data.js"></script>` en cada página y eliminar
2. Buscar `<script src="js/data.js"></script>` en `index.html` y eliminar

#### FASE 1D: Eliminar DataSync Calls (8 páginas)
1. Eliminar `await window.DataSync?.init();`
2. Eliminar `await DataSync.sync*();` calls

#### FASE 1E: Eliminar Offline UI (`index.html`)
1. Eliminar offline banner CSS/JS
2. Eliminar offline connection dot display

#### FASE 1F: Eliminar `js/data.js` (archivo completo)
1. Borrar `js/data.js`

---

*Documento generado: 2026-05-18*
*Etapa: Pre-limpieza exhaustiva*
*Estado: Listo para ejecución*
