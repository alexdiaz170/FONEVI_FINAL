import { Request, Response, NextFunction } from 'express';
import { IPeriodoRepository } from '../../domain/repositories/IPeriodoRepository.js';
import { CrearPeriodoUseCase } from '../../application/use-cases/periodos/CrearPeriodoUseCase.js';
import { ActivarPeriodoUseCase } from '../../application/use-cases/periodos/ActivarPeriodoUseCase.js';
import { apiResponse } from '../response.js';
import { ValidationError } from '../../application/errors.js';
import { z } from 'zod';

export const crearPeriodoSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  anio: z.number().int().min(2000).max(2100),
  mes: z.number().int().min(1).max(12),
});

export function createPeriodoController(periodoRepo: IPeriodoRepository) {
  const crearUseCase = new CrearPeriodoUseCase(periodoRepo);
  const activarUseCase = new ActivarPeriodoUseCase(periodoRepo);

  return {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const periodos = await periodoRepo.findAll();
        apiResponse.success(
          res,
          periodos.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            anio: p.anio,
            mes: p.mes,
            activo: p.activo,
          })),
        );
      } catch (error) {
        next(error);
      }
    },

    async getActive(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const periodo = await periodoRepo.findActivo();
        if (!periodo) {
          apiResponse.success(res, null);
          return;
        }
        apiResponse.success(res, {
          id: periodo.id,
          nombre: periodo.nombre,
          anio: periodo.anio,
          mes: periodo.mes,
          activo: periodo.activo,
        });
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const periodo = await crearUseCase.execute(req.body);
        apiResponse.created(res, {
          id: periodo.id,
          nombre: periodo.nombre,
          anio: periodo.anio,
          mes: periodo.mes,
          activo: periodo.activo,
        });
      } catch (error) {
        next(error);
      }
    },

    async activate(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params.id);
        if (isNaN(id)) throw new ValidationError('ID de período inválido');
        await activarUseCase.execute(id);
        apiResponse.success(res, { mensaje: 'Período activado correctamente' });
      } catch (error) {
        next(error);
      }
    },

    async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = Number(req.params.id);
        if (isNaN(id)) throw new ValidationError('ID de período inválido');
        await periodoRepo.delete(id);
        apiResponse.success(res, { mensaje: 'Período eliminado correctamente' });
      } catch (error) {
        next(error);
      }
    },
  };
}
