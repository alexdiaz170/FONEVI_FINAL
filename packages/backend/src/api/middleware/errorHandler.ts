import { Request, Response, NextFunction } from 'express';
import { AppError, domainErrorToAppError } from '../../application/errors.js';
import { DomainError } from '../../domain/errors.js';
import { config } from '../../config/index.js';
import { logger } from '../../infrastructure/logging/logger.js';
import { apiResponse } from '../response.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
      details: err.details,
    });
    apiResponse.error(res, err.statusCode, err.message, err.code, err.details);
    return;
  }

  if (err instanceof DomainError) {
    const appError = domainErrorToAppError(err);
    logger.warn(`DomainError: ${err.message}`, { code: err.code });
    apiResponse.error(res, appError.statusCode, err.message, err.code);
    return;
  }

  logger.error('Error no capturado', { error: err.message, stack: err.stack });
  apiResponse.error(res, 500, config.isDev ? err.message : 'Error interno del servidor');
}
