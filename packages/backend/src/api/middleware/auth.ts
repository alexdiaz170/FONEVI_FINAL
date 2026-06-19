import { Request, Response, NextFunction } from 'express';
import { TokenService, TokenPayload } from '../../domain/services/TokenService.js';
import { UnauthorizedError } from '../../application/errors.js';

declare global {
  namespace Express {
    interface Request {
      usuario?: TokenPayload;
    }
  }
}

const tokenService = new TokenService();

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Token de acceso requerido'));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = tokenService.verifyToken(token);

    if (payload.tipo !== 'access') {
      next(new UnauthorizedError('Tipo de token inválido'));
      return;
    }

    req.usuario = payload;
    next();
  } catch {
    next(new UnauthorizedError('Token inválido o expirado'));
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      next(new UnauthorizedError('No autenticado'));
      return;
    }

    if (!roles.includes(req.usuario.rol)) {
      next(new UnauthorizedError('No tienes permisos para acceder a este recurso'));
      return;
    }

    next();
  };
}
