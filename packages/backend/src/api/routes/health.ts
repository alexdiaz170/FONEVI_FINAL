import { Router } from 'express';
import { logger } from '../../infrastructure/logging/logger.js';
import { config } from '../../config/index.js';

const router = Router();

router.get('/', (_req, res) => {
  const dbStatus = 'not_checked';

  res.json({
    ok: true,
    datos: {
      status: 'ok',
      version: '0.1.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.env,
      database: dbStatus,
    },
  });

  logger.debug('Health check', { uptime: process.uptime() });
});

export default router;
