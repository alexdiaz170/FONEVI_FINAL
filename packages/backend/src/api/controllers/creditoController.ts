import { Request, Response, NextFunction } from 'express';
import { ISocioRepository } from '../../domain/repositories/ISocioRepository.js';
import { ICreditoRepository } from '../../domain/repositories/ICreditoRepository.js';
import { IPagoCuotaRepository } from '../../domain/repositories/IPagoCuotaRepository.js';
import { CalculadorCuota } from '../../domain/services/CalculadorCuota.js';
import { ConfiguracionService } from '../../application/services/ConfiguracionService.js';
import { SolicitarCreditoUseCase } from '../../application/use-cases/creditos/SolicitarCreditoUseCase.js';
import { AprobarCreditoUseCase } from '../../application/use-cases/creditos/AprobarCreditoUseCase.js';
import { PagarCuotaUseCase } from '../../application/use-cases/creditos/PagarCuotaUseCase.js';
import { ListarCreditosUseCase } from '../../application/use-cases/creditos/ListarCreditosUseCase.js';
import { ObtenerEstadoCuentaUseCase } from '../../application/use-cases/creditos/ObtenerEstadoCuentaUseCase.js';
import { ObtenerResumenCreditosUseCase } from '../../application/use-cases/creditos/ObtenerResumenCreditosUseCase.js';
import { RechazarCreditoUseCase } from '../../application/use-cases/creditos/RechazarCreditoUseCase.js';
import { EliminarPagoCuotaUseCase } from '../../application/use-cases/creditos/EliminarPagoCuotaUseCase.js';
import { apiResponse } from '../response.js';
import {
  solicitarCreditoSchema,
  pagarCuotaSchema,
  listarCreditosSchema,
} from '../../application/use-cases/creditos/creditoSchemas.js';
import { ValidationError } from '../../application/errors.js';
import { getPrismaClient } from '../../infrastructure/persistence/prismaClient.js';

export function createCreditoController(
  socioRepo: ISocioRepository,
  creditoRepo: ICreditoRepository,
  pagoCuotaRepo: IPagoCuotaRepository,
) {
  const calculador = new CalculadorCuota();
  const configService = new ConfiguracionService();
  const solicitarUseCase = new SolicitarCreditoUseCase(socioRepo, creditoRepo, configService);
  const aprobarUseCase = new AprobarCreditoUseCase(creditoRepo);
  const pagarCuotaUseCase = new PagarCuotaUseCase(
    creditoRepo,
    pagoCuotaRepo,
    calculador,
    configService,
  );
  const listarUseCase = new ListarCreditosUseCase(creditoRepo);
  const resumenUseCase = new ObtenerResumenCreditosUseCase(creditoRepo);
  const rechazarUseCase = new RechazarCreditoUseCase(creditoRepo);
  const estadoCuentaUseCase = new ObtenerEstadoCuentaUseCase(
    creditoRepo,
    pagoCuotaRepo,
    socioRepo,
    calculador,
    configService,
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
    async calcular(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const monto = Number(req.query.monto);
        const tasaMensual = Number(req.query.tasaMensual);
        const cuotas = Number(req.query.cuotas);
        if (!monto || monto <= 0 || !tasaMensual || tasaMensual <= 0 || !cuotas || cuotas < 1) {
          apiResponse.error(
            res,
            400,
            'Parámetros inválidos: monto, tasaMensual, cuotas',
            'VALIDATION',
          );
          return;
        }
        const { Monto } = await import('@fonevi/shared');
        const tasaSeguro = await configService.getTasaSeguro();
        const tabla = calculador.generarTablaAmortizacion(
          Monto.create(monto),
          tasaMensual,
          cuotas,
          tasaSeguro,
        );
        apiResponse.success(res, {
          cuotaFija: tabla.length > 0 ? tabla[0]!.monto.value : 0,
          totalIntereses: tabla.reduce((s, r) => s + r.montoInteres.value, 0),
          totalSeguro: tabla.reduce((s, r) => s + r.seguro.value, 0),
          totalPagar: tabla.reduce((s, r) => s + r.monto.value, 0),
          tabla: tabla.map((r) => ({
            numero: r.numero,
            cuota: r.monto.value,
            capital: r.montoCapital.value,
            interes: r.montoInteres.value,
            seguro: r.seguro.value,
            saldo: r.saldoRestante.value,
          })),
        });
      } catch (error) {
        next(error);
      }
    },

    async resumen(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const data = await resumenUseCase.execute();
        apiResponse.success(res, data);
      } catch (error) {
        next(error);
      }
    },

    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parsed = listarCreditosSchema.parse(req.query);
        const query: Record<string, unknown> = { ...parsed };

        if (req.usuario?.rol === 'socio' && !query.socioId) {
          const socio = await socioRepo.findByEmail(req.usuario.email);
          if (socio) query.socioId = socio.id;
        }

        const result = await listarUseCase.execute(query as never);

        const socioIds = [...new Set(result.data.map((c) => c.socioId))];
        const socios =
          socioIds.length > 0
            ? await getPrismaClient().socio.findMany({
                where: { id: { in: socioIds } },
                select: { id: true, nombre: true, codigo_socio: true },
              })
            : [];
        const socioMap = new Map(socios.map((s) => [s.id, s.nombre ?? s.codigo_socio ?? null]));

        apiResponse.paginated(
          res,
          result.data.map((c) => ({
            ...mapCredito(c),
            nombreSocio: socioMap.get(c.socioId) ?? null,
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
        const result = await estadoCuentaUseCase.execute(id);
        apiResponse.success(res, result);
      } catch (error) {
        next(error);
      }
    },

    async aprobar(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        const usuario = req.usuario!;
        await aprobarUseCase.execute(id, usuario.nombre);
        apiResponse.success(res, { mensaje: 'Crédito aprobado correctamente' });
      } catch (error) {
        next(error);
      }
    },

    async rechazar(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        await rechazarUseCase.execute(id);
        apiResponse.success(res, { mensaje: 'Crédito rechazado correctamente' });
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
        const credito = await solicitarUseCase.execute(parsed.data, req.usuario?.rol);
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

    async eliminarPagoCuota(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const pagoId = String(req.params.pagoId ?? '');
        const useCase = new EliminarPagoCuotaUseCase(pagoCuotaRepo, creditoRepo);
        await useCase.execute(pagoId);
        apiResponse.success(res, { mensaje: 'Pago eliminado correctamente' });
      } catch (error) {
        next(error);
      }
    },

    async getAmortizacion(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        const result = await estadoCuentaUseCase.execute(id);
        const { credito, pagos } = result;
        const pagosMap = new Map(pagos.map((p) => [p.numeroCuota, p]));
        const data = result.tablaAmortizacion.map((c, i, arr) => {
          const saldoInicial = i === 0 ? result.credito.monto : arr[i - 1]!.saldoRestante;
          const pago = pagosMap.get(c.numeroCuota);
          const fechaDesembolso = new Date(credito.fechaDesembolso);
          const fechaVencimiento = new Date(fechaDesembolso);
          fechaVencimiento.setMonth(fechaVencimiento.getMonth() + c.numeroCuota - 1);
          return {
            id: String(c.numeroCuota),
            numeroCuota: c.numeroCuota,
            fechaVencimiento: fechaVencimiento.toISOString(),
            saldoInicial,
            interes: c.montoInteres,
            cuota: c.monto,
            amortizacion: c.montoCapital,
            saldoFinal: c.saldoRestante,
            estado:
              c.numeroCuota <= credito.cuotasPagadas
                ? 'pagado'
                : c.numeroCuota === (pago?.numeroCuota ?? 0)
                  ? 'pagado'
                  : 'pendiente',
          };
        });
        apiResponse.success(res, data);
      } catch (error) {
        next(error);
      }
    },

    async getPagos(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        const result = await estadoCuentaUseCase.execute(id);
        const data = result.pagos.map((p) => ({
          id: p.id,
          fecha: (p.fechaPago as Date).toISOString(),
          monto: p.monto,
          metodoPago: 'Efectivo',
          referencia: '',
          notas: `Cuota #${p.numeroCuota}`,
        }));
        apiResponse.success(res, data);
      } catch (error) {
        next(error);
      }
    },

    async calcularCapacidad(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const socioId = String(req.params.socioId ?? '');
        const socio = await socioRepo.findById(socioId);
        if (!socio) {
          apiResponse.error(res, 404, 'Socio no encontrado');
          return;
        }
        const configService = new ConfiguracionService();
        const multiplicador = await configService.getMultiplicadorMaximoCredito();
        const capacidadBase = socio.ahorroAcumulado.value * multiplicador;
        const creditosActivos = await (async () => {
          const { getPrismaClient } =
            await import('../../infrastructure/persistence/prismaClient.js');
          const rows = await (getPrismaClient() as any).credito.findMany({
            where: { socioId, estado: 'activo', eliminado: false },
          });
          return rows.reduce((sum: number, r: any) => sum + Number(r.saldoCapital), 0);
        })();
        const capacidadMaxima = Math.max(0, capacidadBase - creditosActivos);
        apiResponse.success(res, { capacidadMaxima });
      } catch (error) {
        next(error);
      }
    },
  };
}
