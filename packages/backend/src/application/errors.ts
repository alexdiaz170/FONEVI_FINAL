import { DomainError } from '../domain/errors.js';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, code = 'APP_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Datos inválidos', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicto', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export function domainErrorToAppError(error: DomainError): AppError {
  switch (error.code) {
    case 'ENTITY_NOT_FOUND':
      return new NotFoundError(error.message);
    case 'ENTITY_ALREADY_EXISTS':
      return new ConflictError(error.message);
    case 'VALUE_OBJECT_ERROR':
      return new ValidationError(error.message);
    case 'BUSINESS_RULE_VIOLATION':
      return new ValidationError(error.message);
    default:
      return new AppError(error.message, 400, error.code);
  }
}
