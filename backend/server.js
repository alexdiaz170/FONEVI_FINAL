/**
 * FONEVI — Servidor Backend Simple
 * Sirve el frontend + API backend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, '..');

// Middleware
// Desactivar la política CSP estricta de Helmet para permitir scripts inline del frontend
// (en producción deberías configurar CSP apropiadamente)
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// Durante desarrollo permitir conexiones a backend en 3001 desde la UI servida en 3000
if ((process.env.NODE_ENV || 'development') !== 'production') {
  // Proxyear llamadas /api al backend completo que corre en :3001
  app.use('/api', createProxyMiddleware({
    target: 'http://127.0.0.1:3001',
    changeOrigin: true,
    logLevel: 'debug',
    onError: (err, req, res) => {
      console.error('Proxy error:', err && err.message);
      if (!res.headersSent) {
        res.status(502).json({ ok: false, mensaje: 'Proxy error' });
      }
    }
  }));

  app.use((req, res, next) => {
    const connectTargets = ["'self'", 'http://127.0.0.1:3001', 'http://localhost:3001'];
    const scriptSrc = ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://cdn.jsdelivr.net'];
    const policy = `default-src 'self'; connect-src ${connectTargets.join(' ')}; script-src ${scriptSrc.join(' ')}; img-src 'self' data:; style-src 'self' 'unsafe-inline';`;
    res.setHeader('Content-Security-Policy', policy);
    next();
  });
}
app.use(express.json());

// Servir archivos estáticos (CSS, JS, etc)
app.use(express.static(frontendPath, { 
  index: false,
  extensions: ['html', 'css', 'js', 'json', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp']
}));

// Fallback a index.html para rutas no-API
app.use((req, res) => {
  const indexFile = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' });
  }
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n✅ FONEVI Backend corriendo en http://localhost:' + PORT);
  console.log('📝 Base de datos: Supabase PostgreSQL');
  console.log('🔐 CORS: Habilitado para todos los orígenes\n');
});

// Manejar Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo servidor...');
  server.close(() => process.exit(0));
});
