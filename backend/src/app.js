// ─────────────────────────────────────────────────────────────
// FONEVI — Servidor principal (src/app.js)
// ─────────────────────────────────────────────────────────────
require('dotenv').config();

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');
const fs          = require('fs');
const db          = require('./db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Seguridad y utilidades ──────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
      scriptSrcElem: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*", "http://*"],
      connectSrc: ["'self'", "http://*", "https://*", "ws://*", "wss://*"],
      scriptSrcAttr: ["'unsafe-inline'"],
      upgradeInsecureRequests: null, // Allow HTTP local development testing
    }
  }
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── CORS ────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Origen denegado: ${origin}`);
    return callback(new Error(`CORS: origen no permitido (${origin})`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logger de peticiones para depuración
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// ── Rate Limiting ───────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max:      10,               // máx 10 intentos de login por IP
  message:  { ok: false, mensaje: 'Demasiados intentos. Espera 15 minutos.' },
  standardHeaders: true,
  legacyHeaders:   false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minuto
  max:      200,
  message:  { ok: false, mensaje: 'Límite de peticiones alcanzado. Espera un momento.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    const start = Date.now();
    await db.query('SELECT 1');
    const latency = Date.now() - start;
    return res.json({
      ok: true,
      version: '1.0.0',
      db: 'connected',
      latency: `${latency}ms`,
      env: process.env.NODE_ENV
    });
  } catch (e) {
    console.error('❌ Health check falló:', e);
    return res.status(503).json({ ok: false, mensaje: 'Base de datos no disponible', error: e.message });
  }
});

// ── Rutas ───────────────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/usuarios',       require('./routes/usuarios'));
app.use('/api/socios',         require('./routes/socios'));
app.use('/api/aportes',        require('./routes/aportes'));
app.use('/api/creditos',       require('./routes/creditos'));
app.use('/api/dashboard',      require('./routes/dashboard'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/api/configuracion',  require('./routes/configuracion'));
app.use('/api/auditoria',      require('./routes/auditoria'));
app.use('/api/whatsapp',       require('./routes/whatsapp'));
app.use('/api/solidaridad',    require('./routes/solidaridad'));
app.use('/api/movimientos',    require('./routes/movimientos'));

// ── Servir archivos estáticos del frontend (Same-Origin) ────
const frontendPath = path.join(__dirname, '..', '..');
app.use(express.static(frontendPath, { 
  index: false,
  extensions: ['html', 'css', 'js', 'json', 'svg', 'png', 'jpg', 'jpeg', 'gif', 'webp']
}));

// Fallback a index.html para rutas no-API (SPA architecture)
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  const indexFile = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  next();
});

// ── 404 API ──────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada' });
});

// ── Error handler global ─────────────────────────────────────
app.use(errorHandler);

// ── Arrancar ─────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 3000;

async function main() {
  try {
    // Probar la conexión a PostgreSQL real con el Pooler antes de levantar la app
    await db.query('SELECT 1');
    console.log('✅ PostgreSQL conectado y verificado vía pg Pool');
    
    const HOST = process.env.HOST || '0.0.0.0';
    app.listen(PORT, HOST, () => {
      console.log(`🚀 FONEVI API corriendo en http://${HOST}:${PORT}`);
      console.log(`📋 Health:   http://${HOST}:${PORT}/api/health`);
      console.log(`🌍 Entorno:  ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ No se pudo conectar a la base de datos PostgreSQL:', err.message);
    console.error('   Verifica DATABASE_URL en el archivo .env');
    process.exit(1);
  }
}

main();

// Cierre limpio
process.on('SIGINT',  () => { db.pool.end(); process.exit(0); });
process.on('SIGTERM', () => { db.pool.end(); process.exit(0); });
