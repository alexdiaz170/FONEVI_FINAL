import { config as dotenv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar .env desde la raíz del proyecto legacy
dotenv({ path: resolve(__dirname, '..', '..', '..', '..', '.env') });

export const config = {
  env: process.env['NODE_ENV'] || 'development',
  port: parseInt(process.env['PORT'] || '3001', 10),
  corsOrigin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
  jwtSecret: process.env['JWT_SECRET'] || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '8h',
  jwtRefreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  jwtRefreshTtlMs: parseInt(
    process.env['JWT_REFRESH_TTL_MS'] || String(7 * 24 * 60 * 60 * 1000),
    10,
  ),
  logLevel:
    process.env['LOG_LEVEL'] || (process.env['NODE_ENV'] === 'production' ? 'info' : 'debug'),
  isDev: process.env['NODE_ENV'] !== 'production',
  isProd: process.env['NODE_ENV'] === 'production',
  whatsappApiUrl: process.env['WHATSAPP_API_URL'] || '',
  whatsappToken: process.env['WHATSAPP_TOKEN'] || '',
};
