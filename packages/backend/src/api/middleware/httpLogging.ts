import morgan from 'morgan';
import type { Request, Response } from 'express';
import { logger } from '../../infrastructure/logging/logger.js';

const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

morgan.token('user-id', (req: Request) => {
  const usuario = (req as unknown as Record<string, unknown>).usuario as
    | Record<string, unknown>
    | undefined;
  return (usuario?.id as string) || '-';
});

morgan.token('correlation-id', () => {
  return crypto.randomUUID().slice(0, 8);
});

export const httpLogger = morgan(
  ':correlation-id :method :url :status :res[content-length] :response-time ms - :user-id',
  { stream, skip: (req) => req.url === '/health' },
);
