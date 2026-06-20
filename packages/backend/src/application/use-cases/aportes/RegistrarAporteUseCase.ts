import { Monto } from '@fonevi/shared';
import { Aporte } from '../../../domain/entities/Aporte.js';
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

    const [solidaridadCfg, seguroCfg] = await Promise.all([
      prisma.configuracion.findUnique({ where: { clave: 'valor_solidaridad' } }),
      prisma.configuracion.findUnique({ where: { clave: 'porcentaje_seguro' } }),
    ]);
    const valorSolidaridad = Number(solidaridadCfg?.valor ?? 5000);
    const tasaSeguro = Number(seguroCfg?.valor ?? 0.5) / 100;

    return await prisma.$transaction(async () => {
      let creditoActivo: CreditoActivo | null = null;

      const creditos = (await prisma.credito.findMany({
        where: {
          socioId: dto.socioId,
          estado: { not: 'pagado' },
          saldoCapital: { gt: 0 },
        },
        orderBy: { createdAt: 'asc' as never },
        take: 1,
      })) as unknown as {
        id: string;
        saldoCapital: number;
        tasaMensual: number;
        fechaDesembolso: Date;
      }[];

      if (creditos.length > 0 && creditos[0]) {
        const ultimoPago = await prisma.pagoCuota.findFirst({
          where: { creditoId: creditos[0].id },
          orderBy: { createdAt: 'desc' as never },
          select: { createdAt: true },
        });

        creditoActivo = {
          id: creditos[0].id,
          saldoCapital: Monto.create(Number(creditos[0].saldoCapital)),
          tasaMensual: Number(creditos[0].tasaMensual),
          fechaDesembolso: creditos[0].fechaDesembolso,
          ultimoPagoFecha: ultimoPago?.createdAt ?? null,
        };
      }

      const distribucion = this.distribucionService.distribuir(
        montoTotal,
        creditoActivo,
        dto.tipoOperacion ?? 'cuota_normal',
        fechaPago,
        valorSolidaridad,
        tasaSeguro,
      );

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
      });

      const saved = await this.aporteRepo.save(aporte);

      await prisma.movimiento.create({
        data: {
          socioId: socio.id,
          tipo: 'ingreso',
          categoria: 'aporte',
          descripcion: `${periodo.nombre}`,
          monto: montoTotal.value,
          fecha: new Date(),
        },
      });

      if (creditoActivo && distribucion.totalPagoCredito.value > 0) {
        await prisma.credito.update({
          where: { id: creditoActivo.id },
          data: {
            saldoCapital: distribucion.nuevoSaldoCapital.value,
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
