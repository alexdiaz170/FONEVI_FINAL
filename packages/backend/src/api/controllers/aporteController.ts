import { Request, Response, NextFunction } from 'express';
import { RegistrarAporteUseCase } from '../../application/use-cases/aportes/RegistrarAporteUseCase.js';
import { ActualizarAporteUseCase } from '../../application/use-cases/aportes/ActualizarAporteUseCase.js';
import { ListarAportesUseCase } from '../../application/use-cases/aportes/ListarAportesUseCase.js';
import { EliminarAporteUseCase } from '../../application/use-cases/aportes/EliminarAporteUseCase.js';
import { IAporteRepository } from '../../domain/repositories/IAporteRepository.js';
import { IPeriodoRepository } from '../../domain/repositories/IPeriodoRepository.js';
import { ISocioRepository } from '../../domain/repositories/ISocioRepository.js';
import { DistribucionAporteService } from '../../domain/services/DistribucionAporteService.js';
import { apiResponse } from '../response.js';
import {
  crearAporteSchema,
  actualizarAporteSchema,
  listarAportesSchema,
} from '../../application/dto/aporte.dto.js';
import { ValidationError } from '../../application/errors.js';
import { getPrismaClient } from '../../infrastructure/persistence/prismaClient.js';

export function createAporteController(
  aporteRepo: IAporteRepository,
  periodoRepo: IPeriodoRepository,
  socioRepo: ISocioRepository,
) {
  const distribucionService = new DistribucionAporteService();
  const registrarUseCase = new RegistrarAporteUseCase(
    aporteRepo,
    periodoRepo,
    socioRepo,
    distribucionService,
  );
  const actualizarUseCase = new ActualizarAporteUseCase(aporteRepo);
  const listarUseCase = new ListarAportesUseCase(aporteRepo);
  const eliminarUseCase = new EliminarAporteUseCase(aporteRepo);

  function mapAporte(aporte: {
    id: string;
    socioId: string;
    periodoId: number;
    monto: { value: number };
    fechaPago: Date | null;
    estado: { toString(): string };
    metodo: string | null;
    notas: string | null;
    pagoSolidaridad: { value: number };
    pagoCredito: { value: number };
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: aporte.id,
      socioId: aporte.socioId,
      periodoId: aporte.periodoId,
      monto: aporte.monto.value,
      fechaPago: aporte.fechaPago,
      estado: aporte.estado.toString(),
      metodo: aporte.metodo,
      notas: aporte.notas,
      pagoSolidaridad: aporte.pagoSolidaridad.value,
      pagoCredito: aporte.pagoCredito.value,
      createdAt: aporte.createdAt,
      updatedAt: aporte.updatedAt,
    };
  }

  return {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const query = listarAportesSchema.parse(req.query);
        const result = await listarUseCase.execute(query);

        const socioIds = [...new Set(result.data.map((a) => a.socioId))];
        const socios =
          socioIds.length > 0
            ? await getPrismaClient().socio.findMany({
                where: { id: { in: socioIds } },
                select: { id: true, nombre: true },
              })
            : [];
        const socioMap = new Map(socios.map((s) => [s.id, s.nombre]));

        apiResponse.paginated(
          res,
          result.data.map((a) => ({
            ...mapAporte(a),
            nombreSocio: socioMap.get(a.socioId) ?? null,
          })),
          result.total,
          result.page,
          result.limit,
        );
      } catch (error) {
        next(error);
      }
    },

    async get(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        const aporte = await aporteRepo.findById(id);
        if (!aporte) {
          apiResponse.error(res, 404, 'Aporte no encontrado', 'NOT_FOUND');
          return;
        }
        apiResponse.success(res, mapAporte(aporte));
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parsed = crearAporteSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        }

        const aporte = await registrarUseCase.execute(parsed.data);
        apiResponse.created(res, mapAporte(aporte));
      } catch (error) {
        next(error);
      }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        const parsed = actualizarAporteSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        }

        const aporte = await actualizarUseCase.execute(id, parsed.data);
        apiResponse.success(res, mapAporte(aporte));
      } catch (error) {
        next(error);
      }
    },

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        await eliminarUseCase.execute(id);
        apiResponse.success(res, { mensaje: 'Aporte eliminado correctamente' });
      } catch (error) {
        next(error);
      }
    },

    async periodos(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const periodos = await periodoRepo.findAll();
        apiResponse.success(
          res,
          periodos.map(
            (p: { id: number; nombre: string; anio: number; mes: number; activo: boolean }) => ({
              id: p.id,
              nombre: p.nombre,
              anio: p.anio,
              mes: p.mes,
              activo: p.activo,
            }),
          ),
        );
      } catch (error) {
        next(error);
      }
    },
  };
}
