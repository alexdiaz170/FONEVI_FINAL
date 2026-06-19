import { Request, Response, NextFunction } from 'express';
import { ISocioRepository } from '../../domain/repositories/ISocioRepository.js';
import { ICreditoRepository } from '../../domain/repositories/ICreditoRepository.js';
import { IPagoCuotaRepository } from '../../domain/repositories/IPagoCuotaRepository.js';
import { CalculadorCuota } from '../../domain/services/CalculadorCuota.js';
import { SolicitarCreditoUseCase } from '../../application/use-cases/creditos/SolicitarCreditoUseCase.js';
import { PagarCuotaUseCase } from '../../application/use-cases/creditos/PagarCuotaUseCase.js';
import { ListarCreditosUseCase } from '../../application/use-cases/creditos/ListarCreditosUseCase.js';
import { ObtenerEstadoCuentaUseCase } from '../../application/use-cases/creditos/ObtenerEstadoCuentaUseCase.js';
import { apiResponse } from '../response.js';
import {
  solicitarCreditoSchema,
  pagarCuotaSchema,
  listarCreditosSchema,
} from '../../application/use-cases/creditos/creditoSchemas.js';
import { ValidationError } from '../../application/errors.js';

export function createCreditoController(
  socioRepo: ISocioRepository,
  creditoRepo: ICreditoRepository,
  pagoCuotaRepo: IPagoCuotaRepository,
) {
  const calculador = new CalculadorCuota();
  const solicitarUseCase = new SolicitarCreditoUseCase(socioRepo, creditoRepo);
  const pagarCuotaUseCase = new PagarCuotaUseCase(creditoRepo, pagoCuotaRepo, calculador);
  const listarUseCase = new ListarCreditosUseCase(creditoRepo);
  const estadoCuentaUseCase = new ObtenerEstadoCuentaUseCase(
    creditoRepo,
    pagoCuotaRepo,
    calculador,
  );

  function mapCredito(credito: {
    id: string;
    socioId: string;
    monto: { value: number };
    tasaMensual: { value: number };
    cuotas: number;
    cuotasPagadas: number;
    saldoCapital: { value: number };
    fechaDesembolso: Date;
    estado: { toString(): string };
    cuotaMensual: { value: number };
    proposito: string | null;
    aprobadoPor: string | null;
    notas: string | null;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: credito.id,
      socioId: credito.socioId,
      monto: credito.monto.value,
      tasaMensual: credito.tasaMensual.value,
      cuotas: credito.cuotas,
      cuotasPagadas: credito.cuotasPagadas,
      saldoCapital: credito.saldoCapital.value,
      cuotaMensual: credito.cuotaMensual.value,
      fechaDesembolso: credito.fechaDesembolso,
      estado: credito.estado.toString(),
      proposito: credito.proposito,
      aprobadoPor: credito.aprobadoPor,
      notas: credito.notas,
      eliminado: credito.deletedAt !== null,
      createdAt: credito.createdAt,
      updatedAt: credito.updatedAt,
    };
  }

  return {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const query = listarCreditosSchema.parse(req.query);
        const result = await listarUseCase.execute(query);
        apiResponse.paginated(
          res,
          result.data.map(mapCredito),
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
        const result = await estadoCuentaUseCase.execute(id);
        apiResponse.success(res, result);
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parsed = solicitarCreditoSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        }
        const credito = await solicitarUseCase.execute(parsed.data);
        apiResponse.created(res, mapCredito(credito));
      } catch (error) {
        next(error);
      }
    },

    async pagarCuota(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        const parsed = pagarCuotaSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        }
        const pago = await pagarCuotaUseCase.execute(id, parsed.data);
        apiResponse.created(res, {
          id: pago.id,
          creditoId: pago.creditoId,
          numeroCuota: pago.numeroCuota,
          monto: pago.monto.value,
          montoCapital: pago.montoCapital.value,
          montoInteres: pago.montoInteres.value,
          fechaPago: pago.fechaPago,
        });
      } catch (error) {
        next(error);
      }
    },
  };
}
