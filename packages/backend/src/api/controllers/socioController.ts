import { Request, Response, NextFunction } from 'express';
import { CrearSocioUseCase } from '../../application/use-cases/socios/CrearSocioUseCase.js';
import { ActualizarSocioUseCase } from '../../application/use-cases/socios/ActualizarSocioUseCase.js';
import { ObtenerSocioUseCase } from '../../application/use-cases/socios/ObtenerSocioUseCase.js';
import { ListarSociosUseCase } from '../../application/use-cases/socios/ListarSociosUseCase.js';
import { EliminarSocioUseCase } from '../../application/use-cases/socios/EliminarSocioUseCase.js';
import { ISocioRepository } from '../../domain/repositories/ISocioRepository.js';
import { GeneradorCodigoSocio } from '../../domain/services/GeneradorCodigoSocio.js';
import { apiResponse } from '../response.js';
import {
  crearSocioSchema,
  actualizarSocioSchema,
  socioQuerySchema,
} from '../../application/dto/socio.dto.js';
import { ValidationError } from '../../application/errors.js';

export function createSocioController(socioRepo: ISocioRepository) {
  const generadorCodigo = new GeneradorCodigoSocio(socioRepo);
  const crearUseCase = new CrearSocioUseCase(socioRepo, generadorCodigo);
  const actualizarUseCase = new ActualizarSocioUseCase(socioRepo);
  const obtenerUseCase = new ObtenerSocioUseCase(socioRepo);
  const listarUseCase = new ListarSociosUseCase(socioRepo);
  const eliminarUseCase = new EliminarSocioUseCase(socioRepo);

  function mapSocio(socio: {
    id: string;
    codigo: string;
    codigoSocio: string | null;
    nombre: string;
    tipoDocumento: { toString(): string };
    numeroDocumento: string;
    email: { value: string } | null;
    telefono: { toString(): string } | null;
    fechaIngreso: Date;
    aporteMensual: { value: number };
    ahorroAcumulado: { value: number };
    estado: { toString(): string };
    cargo: string | null;
    sede: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: socio.id,
      codigo: socio.codigo,
      codigoSocio: socio.codigoSocio,
      nombre: socio.nombre,
      tipoDocumento: socio.tipoDocumento.toString(),
      numeroDocumento: socio.numeroDocumento,
      email: socio.email?.value ?? null,
      telefono: socio.telefono?.toString() ?? null,
      fechaIngreso: socio.fechaIngreso,
      aporteMensual: socio.aporteMensual.value,
      ahorroAcumulado: socio.ahorroAcumulado.value,
      estado: socio.estado.toString(),
      cargo: socio.cargo,
      sede: socio.sede,
      eliminado: socio.deletedAt !== null,
      createdAt: socio.createdAt,
      updatedAt: socio.updatedAt,
    };
  }

  return {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const query = socioQuerySchema.parse(req.query);
        const result = await listarUseCase.execute(query.page, query.limit, query.includeDeleted);

        apiResponse.paginated(
          res,
          result.data.map(mapSocio),
          result.total,
          result.page,
          result.limit,
        );
      } catch (error) {
        next(error);
      }
    },

    async listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const socios = await listarUseCase.listAll();
        apiResponse.success(res, socios.map(mapSocio));
      } catch (error) {
        next(error);
      }
    },

    async get(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        const socio = await obtenerUseCase.execute(id);
        apiResponse.success(res, mapSocio(socio));
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parsed = crearSocioSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        }

        const result = await crearUseCase.execute(parsed.data);

        apiResponse.created(res, {
          socio: mapSocio(result.socio),
          passwordInicial: result.passwordInicial,
        });
      } catch (error) {
        next(error);
      }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parsed = actualizarSocioSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        }

        const id = String(req.params.id ?? '');
        const socio = await actualizarUseCase.execute(id, parsed.data);
        apiResponse.success(res, mapSocio(socio));
      } catch (error) {
        next(error);
      }
    },

    async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        await eliminarUseCase.execute(id);
        apiResponse.success(res, { mensaje: 'Socio eliminado correctamente' });
      } catch (error) {
        next(error);
      }
    },
  };
}
