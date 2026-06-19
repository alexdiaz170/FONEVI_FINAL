import express from 'express';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { config } from './config/index.js';
import { logger } from './infrastructure/logging/logger.js';
import { httpLogger } from './api/middleware/httpLogging.js';
import { securityHeaders, corsMiddleware, rateLimiter } from './api/middleware/security.js';
import { errorHandler } from './api/middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
import healthRouter from './api/routes/health.js';
import authRouter from './api/routes/auth.js';
import sociosRouter from './api/routes/socios.js';
import aportesRouter from './api/routes/aportes.js';
import creditosRouter from './api/routes/creditos.js';
import dashboardRouter from './api/routes/dashboard.js';
import movimientosRouter from './api/routes/movimientos.js';
import notificacionesRouter from './api/routes/notificaciones.js';
import solidaridadRouter from './api/routes/solidaridad.js';
import moraRouter from './api/routes/mora.js';
import dividendosRouter from './api/routes/dividendos.js';
import configuracionRouter from './api/routes/configuracion.js';
import auditoriaRouter from './api/routes/auditoria.js';

const app = express();

// ─── Middleware global ─────────────────────────────────────
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(rateLimiter);
app.use(httpLogger);
app.use(express.json({ limit: '1mb' }));

// ─── Rutas ─────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/api/socios', sociosRouter);
app.use('/api/aportes', aportesRouter);
app.use('/api/creditos', creditosRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/movimientos', movimientosRouter);
app.use('/api/notificaciones', notificacionesRouter);
app.use('/api/solidaridad', solidaridadRouter);
app.use('/api/mora', moraRouter);
app.use('/api/dividendos', dividendosRouter);
app.use('/api/configuracion', configuracionRouter);
app.use('/api/auditoria', auditoriaRouter);

// ─── Frontend build (SPA) ──────────────────────────────────
const publicDir = resolve(__dirname, '..', 'public');
if (existsSync(publicDir)) {
  logger.info(`Sirviendo frontend desde ${publicDir}`);
  // Cache static assets for a week
  app.use('/assets', express.static(resolve(publicDir, 'assets'), { maxAge: '7d' }));
  // Root static files (favicon, icons, etc.)
  app.use(express.static(publicDir));
  // SPA catch-all — any unmatched GET route returns index.html
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path === '/health')
      return next();
    res.sendFile(resolve(publicDir, 'index.html'), { headers: { 'Content-Type': 'text/html' } });
  });
} else {
  logger.info('Frontend build no encontrado — solo modo API');
}

// ─── Error handler global ──────────────────────────────────
app.use(errorHandler);

// ─── Inicio del servidor ───────────────────────────────────
export async function startServer(port = config.port) {
  return new Promise<{ app: express.Application; server: ReturnType<typeof app.listen> }>(
    (resolve, reject) => {
      try {
        const server = app.listen(port, () => {
          logger.info(`Servidor iniciado en puerto ${port} (${config.env})`);
          resolve({ app, server });
        });
        server.on('error', reject);
      } catch (err) {
        reject(err);
      }
    },
  );
}

// Solo arranca el server si es el entry point directo
const isMainModule =
  process.argv[1]?.includes('index') ||
  process.argv[1]?.includes('dist/index') ||
  process.argv[1]?.includes('tsx');
if (isMainModule) {
  startServer().catch((err) => {
    logger.error('Error al iniciar el servidor', { error: String(err) });
    process.exit(1);
  });
}

export { app, logger };
export default app;
