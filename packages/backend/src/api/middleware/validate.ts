import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../application/errors.js';

type ValidateSource = 'body' | 'query' | 'params';

export function validate(schema: z.ZodSchema, source: ValidateSource = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new ValidationError('Datos inválidos', result.error.flatten().fieldErrors));
    }
    req[source] = result.data;
    next();
  };
}
