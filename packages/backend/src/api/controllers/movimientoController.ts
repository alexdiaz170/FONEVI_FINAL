import { Request, Response, NextFunction } from 'express';
import { IMovimientoRepository } from '../../domain/repositories/IMovimientoRepository.js';
import { RegistrarMovimientoUseCase } from '../../application/use-cases/movimientos/RegistrarMovimientoUseCase.js';
import { ListarMovimientosUseCase } from '../../application/use-cases/movimientos/ListarMovimientosUseCase.js';
import { apiResponse } from '../response.js';
import { listarMovimientosSchema } from '../../application/dto/movimiento.dto.js';
import { PrismaMovimientoRepository } from '../../infrastructure/persistence/PrismaMovimientoRepository.js';

type RepoWithSocio = IMovimientoRepository & {
  findSocioNombres(ids: string[]): Promise<Map<string, string>>;
};

export function createMovimientoController(movimientoRepo: RepoWithSocio) {
  const registrarUseCase = new RegistrarMovimientoUseCase(movimientoRepo);
  const listarUseCase = new ListarMovimientosUseCase(movimientoRepo);

  function mapMovimiento(movimiento: {
    id: string;
    socioId?: string;
    tipo: string;
    categoria: string;
    descripcion: string;
    monto: { value: number };
    fecha: Date;
    createdAt: Date;
    socioNombre?: string;
  }) {
    return {
      id: movimiento.id,
      socioId: movimiento.socioId ?? null,
      socioNombre: movimiento.socioNombre ?? null,
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
        const ids = result.data.map((m) => m.socioId).filter(Boolean) as string[];
        const socioNombres = await movimientoRepo.findSocioNombres(ids);
        const mapped = result.data.map((m) =>
          mapMovimiento({
            ...m,
            socioNombre: m.socioId ? (socioNombres.get(m.socioId) ?? '—') : '—',
          }),
        );
        apiResponse.paginated(res, mapped, result.total, result.page, result.limit);
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const movimiento = await registrarUseCase.execute(req.body);
        apiResponse.created(res, mapMovimiento(movimiento));
      } catch (error) {
        next(error);
      }
    },
  };
}
