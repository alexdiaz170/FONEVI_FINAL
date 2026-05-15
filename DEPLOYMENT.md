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

Tambien puedes definir la URL antes de cargar `js/config.js` si tu hosting permite inyectar configuracion:

```html
<script>
  window.FONEVI_API_URL = "https://tu-backend-desplegado.com/api";
</script>
```

En produccion el modo offline esta deshabilitado para escrituras: si el backend no responde, la app debe mostrar error en vez de guardar datos simulados en `data.js`.

### 3. Frontend - Desplegar

**Opciones para frontend estático:**
- **Vercel** (Recomendado) - https://vercel.com
- **Netlify** - https://netlify.com
- **GitHub Pages** - https://pages.github.com
- **Railway** (static) - https://railway.app

**Pasos:**
1. Sube el código frontend a GitHub
2. Conecta a Vercel/Netlify/etc.
3. Despliega automáticamente

### 4. Configuración CORS (Importante)

En tu backend, asegúrate de que `CORS_ORIGIN` permita tu dominio frontend:

```javascript
// En backend/src/app.js
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 5. Verificación

Después del despliegue:
1. ✅ Frontend carga correctamente
2. ✅ Login funciona con credenciales de Supabase
3. ✅ Datos se guardan en Supabase (no localmente)
4. ✅ No hay errores de CORS en consola

## 🔧 Solución de Problemas

### Error: "Failed to fetch" en producción
- Verifica que la URL del backend en `js/config.js` sea correcta
- Asegúrate de que el backend esté corriendo
- Revisa configuración CORS

### Error: "Prepared statement already exists"
- Es normal con Supabase pooler, no afecta funcionalidad
- Si es problemático, considera usar conexión directa de Supabase

### Modo offline se activa en producción
- El frontend detecta automáticamente si está en producción
- Si hay problemas de conexión, mostrará errores en consola
- Revisa que la URL del backend sea accesible

## 📞 Credenciales de Prueba

```
Admin:     admin@fonevi.edu.co     / Admin2026!
Tesorero:  tesorero@fonevi.edu.co  / Tesorero2026!
Socio:     ana.torres@fonevi.edu.co / Socio2026!
```

## 🎯 Próximos Pasos

1. **Dominio personalizado** - Configura un dominio para tu app
2. **HTTPS** - Asegúrate de que todo use HTTPS
3. **Backup** - Configura backups automáticos en Supabase
4. **Monitoreo** - Agrega logging y monitoreo
5. **Optimización** - Minifica archivos, optimiza imágenes

---

¡Tu aplicación FONEVI está lista para producción! 🚀
