import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { SolidaridadMovimiento } from '../../domain/entities/SolidaridadMovimiento.js';
import {
  ISolidaridadMovimientoRepository,
  SolidaridadFilter,
  SolidaridadListResult,
} from '../../domain/repositories/ISolidaridadMovimientoRepository.js';
import { Monto } from '@fonevi/shared';

interface SolidaridadRow {
  id: string;
  tipo: string;
  descripcion: string;
  monto: number;
  fecha: Date;
  beneficiario: string | null;
  createdAt: Date;
}

export class PrismaSolidaridadMovimientoRepository implements ISolidaridadMovimientoRepository {
  protected readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  private toDomain(row: SolidaridadRow): SolidaridadMovimiento {
    return SolidaridadMovimiento.fromPersistence({
      id: row.id,
      tipo: row.tipo,
      descripcion: row.descripcion,
      monto: Monto.create(Number(row.monto)),
      fecha: row.fecha,
      beneficiario: row.beneficiario,
      createdAt: row.createdAt,
    });
  }

  async findById(id: string): Promise<SolidaridadMovimiento | null> {
    const row = (await this.prisma.solidaridadMovimiento.findUnique({
      where: { id },
    })) as unknown as SolidaridadRow | null;
    if (!row) return null;
    return this.toDomain(row);
  }

  async findAll(filters: SolidaridadFilter = {}): Promise<SolidaridadListResult> {
    const { tipo, desde, hasta, page = 1, limit = 10 } = filters;
    const where: Record<string, unknown> = {};
    if (tipo) where.tipo = tipo;
    if (desde || hasta) {
      const fechaFilter: Record<string, Date> = {};
      if (desde) fechaFilter.gte = desde;
      if (hasta) fechaFilter.lte = hasta;
      where.fecha = fechaFilter;
    }
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.solidaridadMovimiento.findMany({
        where: where as never,
        orderBy: { fecha: 'desc' } as never,
        skip,
        take: limit,
      }) as unknown as Promise<SolidaridadRow[]>,
      this.prisma.solidaridadMovimiento.count({ where: where as never }),
    ]);

    return {
      data: data.map((row) => this.toDomain(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(movimiento: SolidaridadMovimiento): Promise<SolidaridadMovimiento> {
    const row = (await this.prisma.solidaridadMovimiento.create({
      data: {
        id: movimiento.id,
        tipo: movimiento.tipo,
        descripcion: movimiento.descripcion,
        monto: movimiento.monto.value,
        fecha: movimiento.fecha,
        beneficiario: movimiento.beneficiario,
      } as never,
    })) as unknown as SolidaridadRow;
    return this.toDomain(row);
  }

  async sumMontoByTipo(tipo: string): Promise<number> {
    const result = await this.prisma.solidaridadMovimiento.aggregate({
      where: { tipo } as never,
      _sum: { monto: true },
    });
    return Number(result._sum.monto ?? 0);
  }
}
