import express from 'express';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { config } from './config/index.js';
import { logger } from './infrastructure/logging/logger.js';
import { httpLogger } from './api/middleware/httpLogging.js';
import { securityHeaders, corsMiddleware, rateLimiter } from './api/middleware/security.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import { disconnectPrisma } from './infrastructure/persistence/prismaClient.js';
import { disconnectCache } from './infrastructure/cache/CacheFactory.js';
import { startBackupScheduler } from './infrastructure/backup/BackupScheduler.js';
import { initQueue, initWorker, shutdownQueues } from './infrastructure/queue/JobQueue.js';
import { createWhatsAppProcessor } from './infrastructure/queue/whatsappWorker.js';
import { PrismaWaLogRepository } from './infrastructure/persistence/PrismaWaLogRepository.js';

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
import reportesRouter from './api/routes/reportes.js';
import periodosRouter from './api/routes/periodos.js';
import cierrePeriodoRouter from './api/routes/cierrePeriodo.js';
import whatsappRouter from './api/routes/whatsapp.js';
import usuariosRouter from './api/routes/usuarios.js';
import backupRouter from './api/routes/backup.js';
import exportarRouter from './api/routes/exportar.js';
import docsRouter from './api/routes/docs.js';

const app = express();

app.set('trust proxy', 1);

// ─── Middleware global ─────────────────────────────────────
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(rateLimiter);
app.use(httpLogger);
app.use(express.json({ limit: '1mb' }));

// ─── Rutas ─────────────────────────────────────────────────
app.use('/api-docs', docsRouter);
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
app.use('/api/reportes', reportesRouter);
app.use('/api/periodos', periodosRouter);
app.use('/api/cierre-periodo', cierrePeriodoRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/backup', backupRouter);
app.use('/api/exportar', exportarRouter);

// ─── Frontend build (SPA) ──────────────────────────────────
const publicDir = resolve(__dirname, '..', 'public');
if (existsSync(publicDir)) {
  logger.info(`Sirviendo frontend desde ${publicDir}`);
  app.use('/assets', express.static(resolve(publicDir, 'assets'), { maxAge: '7d' }));
  app.use(express.static(publicDir));
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

// ─── Graceful Shutdown ──────────────────────────────────────
let httpServer: ReturnType<typeof app.listen> | null = null;

async function shutdown(signal: string) {
  logger.info(`Señal ${signal} recibida — iniciando apagado gradual...`);

  if (httpServer) {
    await new Promise<void>((resolve) => {
      httpServer!.close((err) => {
        if (err) {
          logger.error('Error al cerrar servidor HTTP', { error: String(err) });
        } else {
          logger.info('Servidor HTTP cerrado');
        }
        resolve();
      });
    });
  }

  await shutdownQueues();
  await disconnectPrisma();
  await disconnectCache();
  logger.info('Apagado completado');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Inicio del servidor ───────────────────────────────────
export async function startServer(port = config.port) {
  return new Promise<{ app: express.Application; server: ReturnType<typeof app.listen> }>(
    async (resolve, reject) => {
      try {
        // Inicializar colas y workers
        const waLogRepo = new PrismaWaLogRepository();
        const processor = createWhatsAppProcessor(waLogRepo);
        await initWorker(
          'whatsapp',
          processor as unknown as (payload: Record<string, unknown>) => Promise<void>,
        );

        const server = app.listen(port, () => {
          logger.info(`Servidor iniciado en puerto ${port} (${config.env})`);
          httpServer = server;
          startBackupScheduler();
          resolve({ app, server });
        });
        server.on('error', reject);
      } catch (err) {
        reject(err);
      }
    },
  );
}

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
