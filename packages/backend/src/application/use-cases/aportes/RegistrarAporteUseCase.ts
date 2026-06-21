import { Monto } from '@fonevi/shared';
import { Aporte } from '../../../domain/entities/Aporte.js';
import { AporteDetalle } from '../../../domain/entities/AporteDetalle.js';
import { Periodo } from '../../../domain/entities/Periodo.js';
import { EstadoAporte } from '../../../domain/value-objects/EstadoAporte.js';
import { IAporteRepository } from '../../../domain/repositories/IAporteRepository.js';
import { IPeriodoRepository } from '../../../domain/repositories/IPeriodoRepository.js';
import { ISocioRepository } from '../../../domain/repositories/ISocioRepository.js';
import {
  DistribucionAporteService,
  CreditoActivo,
} from '../../../domain/services/DistribucionAporteService.js';
import { DomainError, EntityNotFoundError } from '../../../domain/errors.js';
import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';
import { CalculadorCuota } from '../../../domain/services/CalculadorCuota.js';

export class RegistrarAporteUseCase {
  constructor(
    private readonly aporteRepo: IAporteRepository,
    private readonly periodoRepo: IPeriodoRepository,
    private readonly socioRepo: ISocioRepository,
    private readonly distribucionService: DistribucionAporteService,
  ) {}

  async execute(dto: {
    socioId: string;
    periodoId: number;
    monto: number;
    fechaPago?: string | null;
    estado?: string;
    tipoOperacion?: string;
    metodo?: string | null;
    notas?: string | null;
  }): Promise<Aporte> {
    const socio = await this.socioRepo.findById(dto.socioId);
    if (!socio) throw new EntityNotFoundError('Socio', dto.socioId);

    const periodo = await this.periodoRepo.findById(dto.periodoId);
    if (!periodo) throw new EntityNotFoundError('Periodo', String(dto.periodoId));

    const montoTotal = Monto.create(dto.monto);
    const estado = EstadoAporte.create(dto.estado ?? 'pendiente');
    const fechaPago = dto.fechaPago
      ? (() => {
          const parts = dto.fechaPago!.split('-').map(Number);
          return new Date(parts[0]!, parts[1]! - 1, parts[2]!);
        })()
      : null;

    const prisma = getPrismaClient();

    const [solidaridadCfg, seguroCfg, ahorroCfg] = await Promise.all([
      prisma.configuracion.findUnique({ where: { clave: 'valor_solidaridad' } }),
      prisma.configuracion.findUnique({ where: { clave: 'porcentaje_seguro' } }),
      prisma.configuracion.findUnique({ where: { clave: 'valor_ahorro_mensual' } }),
    ]);
    const valorSolidaridad = Number(solidaridadCfg?.valor ?? 5000);
    const tasaSeguro = Number(seguroCfg?.valor ?? 0.5) / 1000;
    const valorAhorroMensual = Number(ahorroCfg?.valor ?? 125000);

    return await prisma.$transaction(async () => {
      let creditoActivo: CreditoActivo | null = null;

      const creditos = (await prisma.credito.findMany({
        where: {
          socioId: dto.socioId,
          estado: 'activo',
          saldoCapital: { gt: 0 },
        },
        orderBy: { createdAt: 'asc' as never },
        take: 1,
      })) as unknown as {
        id: string;
        monto: number;
        saldoCapital: number;
        tasaMensual: number;
        cuotas: number;
        fechaDesembolso: Date;
      }[];

      if (creditos.length > 0 && creditos[0]) {
        const ultimoPago = await prisma.pagoCuota.findFirst({
          where: { creditoId: creditos[0].id },
          orderBy: { createdAt: 'desc' as never },
          select: { createdAt: true },
        });

        const calculador = new CalculadorCuota();
        const cuotaMensual = calculador.calcularCuotaFijaConSeguro(
          Monto.create(Number(creditos[0].monto)),
          Number(creditos[0].tasaMensual),
          creditos[0].cuotas,
          tasaSeguro,
        );

        creditoActivo = {
          id: creditos[0].id,
          saldoCapital: Monto.create(Number(creditos[0].saldoCapital)),
          tasaMensual: Number(creditos[0].tasaMensual),
          fechaDesembolso: creditos[0].fechaDesembolso,
          ultimoPagoFecha: ultimoPago?.createdAt ?? null,
          cuotaMensual,
        };
      }

      const distribucion = this.distribucionService.distribuir(
        montoTotal,
        creditoActivo,
        dto.tipoOperacion ?? 'cuota_normal',
        fechaPago,
        valorSolidaridad,
        tasaSeguro,
        valorAhorroMensual,
      );

      const detalle = AporteDetalle.create({
        aporteId: '', // will be set after saving
        solidaridad: distribucion.pagoSolidaridad,
        interes: distribucion.pagoInteres,
        seguro: distribucion.pagoSeguro,
        capital: distribucion.pagoCapital,
        ahorro: distribucion.ahorro,
      });

      const aporte = Aporte.create({
        socioId: dto.socioId,
        periodoId: dto.periodoId,
        monto: montoTotal,
        fechaPago,
        estado,
        metodo: dto.metodo ?? null,
        notas: dto.notas ?? null,
        pagoSolidaridad: distribucion.pagoSolidaridad,
        pagoCredito: distribucion.totalPagoCredito,
        detalle,
      });

      const saved = await this.aporteRepo.save(aporte);

      const tipoOpLabel =
        dto.tipoOperacion === 'adelanto_cuotas'
          ? 'Adelanto Cuotas'
          : dto.tipoOperacion === 'abono_credito'
            ? 'Abono Crédito'
            : 'Cuota Normal';

      await prisma.movimiento.create({
        data: {
          socioId: socio.id,
          tipo: 'ingreso',
          categoria: tipoOpLabel,
          descripcion: periodo.nombre,
          monto: montoTotal.value,
          fecha: new Date(),
        },
      });

      if (creditoActivo && distribucion.totalPagoCredito.value > 0) {
        const creditoActual = await prisma.credito.findUnique({
          where: { id: creditoActivo.id },
          select: { cuotasPagadas: true, cuotas: true },
        });
        const nuevasPagadas = (creditoActual?.cuotasPagadas ?? 0) + 1;

        await prisma.pagoCuota.create({
          data: {
            id: crypto.randomUUID(),
            creditoId: creditoActivo.id,
            numeroCuota: nuevasPagadas,
            monto: distribucion.totalPagoCredito.value,
            montoCapital: distribucion.pagoCapital.value,
            montoInteres: distribucion.pagoInteres.value,
            fechaPago: fechaPago ?? new Date(),
          },
        });

        await prisma.credito.update({
          where: { id: creditoActivo.id },
          data: {
            saldoCapital: distribucion.nuevoSaldoCapital.value,
            cuotasPagadas: nuevasPagadas,
            estado: distribucion.creditoPagado ? 'pagado' : 'activo',
          },
        });
      }

      if (distribucion.pagoSolidaridad.value > 0) {
        await prisma.solidaridadMovimiento.create({
          data: {
            tipo: 'ingreso',
            descripcion: 'Aporte solidaridad',
            monto: distribucion.pagoSolidaridad.value,
            fecha: new Date(),
            beneficiario: socio.nombre,
          },
        });
      }

      if (estado.esMoraOVencido()) {
        await prisma.socio.update({
          where: { id: dto.socioId },
          data: { estado: 'mora' },
        });
      }

      if (estado.esPagado()) {
        const moraPendiente = await prisma.aporte.count({
          where: { socioId: dto.socioId, estado: { in: ['mora', 'vencido'] } } as never,
        });

        if (moraPendiente === 0) {
          await prisma.socio.update({
            where: { id: dto.socioId },
            data: { estado: 'activo' },
          });
        }
      }

      const nuevoAhorro = await this.aporteRepo.recalcularAhorroAcumulado(dto.socioId);
      await prisma.socio.update({
        where: { id: dto.socioId },
        data: { ahorroAcumulado: nuevoAhorro.value },
      });

      return saved;
    });
  }
}
