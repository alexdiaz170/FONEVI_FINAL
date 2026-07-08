import { Request, Response, NextFunction } from 'express';
import { ISolidaridadMovimientoRepository } from '../../domain/repositories/ISolidaridadMovimientoRepository.js';
import { IMovimientoRepository } from '../../domain/repositories/IMovimientoRepository.js';
import { RegistrarSolidaridadUseCase } from '../../application/use-cases/solidaridad/RegistrarSolidaridadUseCase.js';
import { ListarSolidaridadUseCase } from '../../application/use-cases/solidaridad/ListarSolidaridadUseCase.js';
import { apiResponse } from '../response.js';
import { listarSolidaridadSchema } from '../../application/dto/notificacion-solidaridad.dto.js';

export function createSolidaridadController(
  solidaridadRepo: ISolidaridadMovimientoRepository,
  movimientoRepo: IMovimientoRepository,
) {
  const registrarUseCase = new RegistrarSolidaridadUseCase(solidaridadRepo, movimientoRepo);
  const listarUseCase = new ListarSolidaridadUseCase(solidaridadRepo);

  function mapSolidaridad(m: {
    id: string;
    tipo: string;
    descripcion: string;
    monto: { value: number };
    fecha: Date;
    beneficiario: string | null;
    createdAt: Date;
  }) {
    return {
      id: m.id,
      tipo: m.tipo,
      descripcion: m.descripcion,
      monto: m.monto.value,
      fecha: m.fecha,
      beneficiario: m.beneficiario,
      createdAt: m.createdAt,
    };
  }

  return {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const query = listarSolidaridadSchema.parse(req.query);
        const result = await listarUseCase.execute({
          tipo: query.tipo,
          desde: query.desde ? new Date(query.desde) : undefined,
          hasta: query.hasta ? new Date(query.hasta) : undefined,
          page: query.page,
          limit: query.limit,
        });
        apiResponse.paginated(
          res,
          result.data.map(mapSolidaridad),
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
        const movimiento = await registrarUseCase.execute(req.body);
        apiResponse.created(res, mapSolidaridad(movimiento));
      } catch (error) {
        next(error);
      }
    },
  };
}
