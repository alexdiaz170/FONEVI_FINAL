import { Response } from 'express';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SuccessResponse<T = unknown> {
  ok: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ErrorResponse {
  ok: false;
  mensaje: string;
  codigo?: string;
  detalles?: unknown;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

export const apiResponse = {
  success<T>(res: Response, data: T, statusCode = 200, meta?: PaginationMeta): void {
    const body: SuccessResponse<T> = { ok: true, data };
    if (meta) body.meta = meta;
    res.status(statusCode).json(body);
  },

  created<T>(res: Response, data: T): void {
    apiResponse.success(res, data, 201);
  },

  noContent(res: Response): void {
    res.status(204).send();
  },

  error(
    res: Response,
    statusCode: number,
    mensaje: string,
    codigo?: string,
    detalles?: unknown,
  ): void {
    const body: ErrorResponse = { ok: false, mensaje };
    if (codigo) body.codigo = codigo;
    if (detalles) body.detalles = detalles;
    res.status(statusCode).json(body);
  },

  paginated<T>(res: Response, data: T[], total: number, page: number, limit: number): void {
    const totalPages = Math.ceil(total / limit);
    apiResponse.success(res, data, 200, { total, page, limit, totalPages });
  },
};
