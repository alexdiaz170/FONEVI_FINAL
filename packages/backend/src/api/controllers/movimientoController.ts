import { Request, Response, NextFunction } from 'express';
import { IMovimientoRepository } from '../../domain/repositories/IMovimientoRepository.js';
import { RegistrarMovimientoUseCase } from '../../application/use-cases/movimientos/RegistrarMovimientoUseCase.js';
import { ListarMovimientosUseCase } from '../../application/use-cases/movimientos/ListarMovimientosUseCase.js';
import { apiResponse } from '../response.js';
import {
  registrarMovimientoSchema,
  listarMovimientosSchema,
} from '../../application/dto/movimiento.dto.js';
import { ValidationError } from '../../application/errors.js';

export function createMovimientoController(movimientoRepo: IMovimientoRepository) {
  const registrarUseCase = new RegistrarMovimientoUseCase(movimientoRepo);
  const listarUseCase = new ListarMovimientosUseCase(movimientoRepo);

  function mapMovimiento(movimiento: {
    id: string;
    tipo: string;
    categoria: string;
    descripcion: string;
    monto: { value: number };
    fecha: Date;
    createdAt: Date;
  }) {
    return {
      id: movimiento.id,
      tipo: movimiento.tipo,
      categoria: movimiento.categoria,
      descripcion: movimiento.descripcion,
      monto: movimiento.monto.value,
      fecha: movimiento.fecha,
      createdAt: movimiento.createdAt,
    };
  }

  return {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const query = listarMovimientosSchema.parse(req.query);
        const result = await listarUseCase.execute(query);
        apiResponse.paginated(
          res,
          result.data.map(mapMovimiento),
          result.total,
          result.page,
          result.limit,
        );
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parsed = registrarMovimientoSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        }
        const movimiento = await registrarUseCase.execute(parsed.data);
        apiResponse.created(res, mapMovimiento(movimiento));
      } catch (error) {
        next(error);
      }
    },
  };
}
