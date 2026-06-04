// ─────────────────────────────────────────────────────────────
// FONEVI — Servidor principal (src/app.js)
// ─────────────────────────────────────────────────────────────
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
// path already required above
const fs          = require('fs');
const db          = require('./db');
const { prisma }  = require('./lib/prisma');
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

let server = null;

function logLine(level, title, message, err) {
  const ts = new Date().toISOString();
  console.error(`[${ts}] [${level}] ${title}`);
  if (message) console.error(message);
  if (err && err.stack) {
    console.error('Stack:');
    console.error(err.stack);
  } else if (err) {
    console.error(err);
  }
}

async function gracefulShutdown({ exitCode = 0, reason = 'shutdown' } = {}) {
  try {
    logLine('INFO', `Iniciando graceful shutdown — reason: ${reason}`);
    // Stop accepting new connections
    if (server && server.close) {
      logLine('INFO', 'Cerrando servidor HTTP (no aceptar nuevas conexiones)');
      // wrap close in Promise
      await new Promise((resolve) => server.close(() => resolve()));
      logLine('INFO', 'Servidor HTTP cerrado');
    }

    // Close PostgreSQL pool
    if (db && db.pool) {
      try {
        logLine('INFO', 'Cerrando pg Pool');
        await db.pool.end();
        logLine('INFO', 'pg Pool cerrado');
      } catch (e) {
        logLine('WARN', 'Error cerrando pg Pool', null, e);
      }
    }

    // Disconnect Prisma client if present
    if (prisma && typeof prisma.$disconnect === 'function') {
      try {
        logLine('INFO', 'Desconectando Prisma Client');
        await prisma.$disconnect();
        logLine('INFO', 'Prisma Client desconectado');
      } catch (e) {
        logLine('WARN', 'Error desconectando Prisma', null, e);
      }
    }
  } catch (e) {
    logLine('ERROR', 'Error durante gracefulShutdown', null, e);
  } finally {
    logLine(exitCode === 0 ? 'INFO' : 'ERROR', `Exit process with code ${exitCode}`);
    // small delay to allow logs flush
    setTimeout(() => process.exit(exitCode), 100);
  }
}

async function main() {
  try {
    // Probar la conexión a PostgreSQL real con el Pooler antes de levantar la app
    await db.query('SELECT 1');
    console.log('✅ PostgreSQL conectado y verificado vía pg Pool');

    const HOST = process.env.HOST || '0.0.0.0';
    server = app.listen(PORT, HOST, () => {
      console.log(`🚀 FONEVI API corriendo en http://${HOST}:${PORT}`);
      console.log(`📋 Health:   http://${HOST}:${PORT}/api/health`);
      console.log(`🌍 Entorno:  ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logLine('ERROR', 'No se pudo conectar a la base de datos PostgreSQL', null, err);
    logLine('ERROR', 'Verifica DATABASE_URL en el archivo .env');
    await gracefulShutdown({ exitCode: 1, reason: 'db-connection-failed' });
  }
}

if (require.main === module) {
  main();
}

module.exports = app;

// Global error handlers
process.on('unhandledRejection', async (reason, promise) => {
  logLine('ERROR', 'Unhandled Rejection', 'A promise was rejected and not handled', reason instanceof Error ? reason : { reason });
  try {
    await gracefulShutdown({ exitCode: 1, reason: 'unhandledRejection' });
  } catch (e) {
    // If graceful shutdown fails, force exit
    setTimeout(() => process.exit(1), 100);
  }
});

process.on('uncaughtException', async (err) => {
  logLine('ERROR', 'Uncaught Exception', null, err);
  try {
    await gracefulShutdown({ exitCode: 1, reason: 'uncaughtException' });
  } catch (e) {
    setTimeout(() => process.exit(1), 100);
  }
});

// Handle termination signals gracefully
process.on('SIGINT', async () => {
  logLine('INFO', 'SIGINT received');
  await gracefulShutdown({ exitCode: 0, reason: 'SIGINT' });
});

process.on('SIGTERM', async () => {
  logLine('INFO', 'SIGTERM received');
  await gracefulShutdown({ exitCode: 0, reason: 'SIGTERM' });
});
