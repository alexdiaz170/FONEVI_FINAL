import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { Credito } from '../../domain/entities/Credito.js';
import { TasaInteres } from '../../domain/value-objects/TasaInteres.js';
import { EstadoCredito } from '../../domain/value-objects/EstadoCredito.js';
import {
  ICreditoRepository,
  CreditoFilter,
  CreditoListResult,
} from '../../domain/repositories/ICreditoRepository.js';
import { Monto } from '@fonevi/shared';

interface CreditoRow {
  id: string;
  socioId: string;
  monto: number;
  tasaMensual: number;
  cuotas: number;
  cuotasPagadas: number;
  saldoCapital: number;
  fechaDesembolso: Date;
  fechaUltimoPago: Date | null;
  estado: string;
  proposito: string | null;
  aprobadoPor: string | null;
  notas: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaCreditoRepository implements ICreditoRepository {
  protected readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  private toDomain(row: CreditoRow): Credito {
    return Credito.fromPersistence({
      id: row.id,
      socioId: row.socioId,
      monto: Monto.create(Number(row.monto)),
      tasaMensual: TasaInteres.create(Number(row.tasaMensual)),
      cuotas: row.cuotas,
      cuotasPagadas: row.cuotasPagadas,
      saldoCapital: Monto.create(Number(row.saldoCapital)),
      fechaDesembolso: row.fechaDesembolso,
      fechaUltimoPago: row.fechaUltimoPago,
      estado: EstadoCredito.create(row.estado),
      proposito: row.proposito,
      aprobadoPor: row.aprobadoPor,
      notas: row.notas,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<Credito | null> {
    const row = (await this.prisma.credito.findUnique({
      where: { id },
    })) as unknown as CreditoRow | null;
    if (!row) return null;
    return this.toDomain(row);
  }

  async findAll(filters: CreditoFilter = {}): Promise<CreditoListResult> {
    const { socioId, estado, fechaDesde, fechaHasta, page = 1, limit = 10 } = filters;
    const where: Record<string, unknown> = { deletedAt: null };
    if (socioId) where.socioId = socioId;
    if (estado) {
      const estados = estado
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (estados.length === 1) {
        where.estado = estados[0];
      } else {
        where.estado = { in: estados };
      }
    }
    if (fechaDesde || fechaHasta) {
      const fechaFilter: Record<string, Date> = {};
      if (fechaDesde) fechaFilter.gte = fechaDesde;
      if (fechaHasta) fechaFilter.lte = fechaHasta;
      where.fechaDesembolso = fechaFilter;
    }
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.credito.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' } as never,
        skip,
        take: limit,
      }) as unknown as Promise<CreditoRow[]>,
      this.prisma.credito.count({ where: where as never }),
    ]);

    return {
      data: data.map((row) => this.toDomain(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActiveOrPendingBySocioId(socioId: string): Promise<Credito | null> {
    const row = (await this.prisma.credito.findFirst({
      where: { socioId, estado: { in: ['activo', 'pendiente'] }, deletedAt: null } as never,
      orderBy: { createdAt: 'desc' } as never,
    })) as unknown as CreditoRow | null;
    if (!row) return null;
    return this.toDomain(row);
  }

  async sumSaldoCapitalBySocioId(socioId: string): Promise<number> {
    const result = await this.prisma.credito.aggregate({
      where: { socioId, estado: { in: ['activo', 'pendiente'] }, deletedAt: null } as never,
      _sum: { saldoCapital: true },
    });
    return Number(result._sum.saldoCapital ?? 0);
  }

  async save(credito: Credito): Promise<Credito> {
    const row = (await this.prisma.credito.create({
      data: {
        id: credito.id,
        socioId: credito.socioId,
        monto: credito.monto.value,
        tasaMensual: credito.tasaMensual.value,
        cuotas: credito.cuotas,
        cuotasPagadas: credito.cuotasPagadas,
        saldoCapital: credito.saldoCapital.value,
        fechaDesembolso: credito.fechaDesembolso,
        fechaUltimoPago: credito.fechaUltimoPago,
        estado: credito.estado.toString(),
        proposito: credito.proposito,
        notas: credito.notas,
      } as never,
    })) as unknown as CreditoRow;
    return this.toDomain(row);
  }

  async update(credito: Credito): Promise<Credito> {
    const row = (await this.prisma.credito.update({
      where: { id: credito.id },
      data: {
        cuotasPagadas: credito.cuotasPagadas,
        saldoCapital: credito.saldoCapital.value,
        estado: credito.estado.toString(),
        proposito: credito.proposito,
        aprobadoPor: credito.aprobadoPor,
        notas: credito.notas,
      } as never,
    })) as unknown as CreditoRow;
    return this.toDomain(row);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.credito.update({
      where: { id },
      data: { deletedAt: new Date(), estado: 'cancelado' } as never,
    });
  }

  async countByEstado(estado: string): Promise<number> {
    return this.prisma.credito.count({ where: { estado, deletedAt: null } as never });
  }

  async sumMontoByEstados(estados: string[]): Promise<number> {
    const result = await this.prisma.credito.aggregate({
      where: { estado: { in: estados }, deletedAt: null } as never,
      _sum: { monto: true },
    });
    return Number(result._sum.monto ?? 0);
  }

  async sumSaldoCapitalByEstado(estado: string): Promise<number> {
    const result = await this.prisma.credito.aggregate({
      where: { estado, deletedAt: null } as never,
      _sum: { saldoCapital: true },
    });
    return Number(result._sum.saldoCapital ?? 0);
  }

  async countDistinctSocioIdByEstados(estados: string[]): Promise<number> {
    const result = await this.prisma.credito.findMany({
      where: { estado: { in: estados }, deletedAt: null } as never,
      select: { socioId: true },
      distinct: ['socioId'],
    });
    return result.length;
  }
}
