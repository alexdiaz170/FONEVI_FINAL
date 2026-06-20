import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { Movimiento } from '../../domain/entities/Movimiento.js';
import {
  IMovimientoRepository,
  MovimientoFilter,
  MovimientoListResult,
} from '../../domain/repositories/IMovimientoRepository.js';
import { Monto } from '@fonevi/shared';

interface MovimientoRow {
  id: string;
  socioId: string | null;
  tipo: string;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: Date;
  createdAt: Date;
}

export class PrismaMovimientoRepository implements IMovimientoRepository {
  protected readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  private toDomain(row: MovimientoRow): Movimiento {
    return Movimiento.fromPersistence({
      id: row.id,
      socioId: row.socioId,
      tipo: row.tipo,
      categoria: row.categoria,
      descripcion: row.descripcion,
      monto: Monto.create(Number(row.monto)),
      fecha: row.fecha,
      createdAt: row.createdAt,
    });
  }

  async findById(id: string): Promise<Movimiento | null> {
    const row = (await this.prisma.movimiento.findUnique({
      where: { id },
    })) as unknown as MovimientoRow | null;
    if (!row) return null;
    return this.toDomain(row);
  }

  async findAll(filters: MovimientoFilter = {}): Promise<MovimientoListResult> {
    const { tipo, categoria, desde, hasta, page = 1, limit = 10 } = filters;
    const where: Record<string, unknown> = {};
    if (tipo) where.tipo = tipo;
    if (categoria) where.categoria = categoria;
    if (desde || hasta) {
      const fechaFilter: Record<string, Date> = {};
      if (desde) fechaFilter.gte = desde;
      if (hasta) fechaFilter.lte = hasta;
      where.fecha = fechaFilter;
    }
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.movimiento.findMany({
        where: where as never,
        orderBy: { fecha: 'desc' } as never,
        skip,
        take: limit,
      }) as unknown as Promise<MovimientoRow[]>,
      this.prisma.movimiento.count({ where: where as never }),
    ]);

    return {
      data: data.map((row) => this.toDomain(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSocioNombres(socioIds: string[]): Promise<Map<string, string>> {
    if (socioIds.length === 0) return new Map();
    const rows = (await this.prisma.socio.findMany({
      where: { id: { in: socioIds } },
      select: { id: true, nombre: true },
    })) as { id: string; nombre: string }[];
    return new Map(rows.map((r) => [r.id, r.nombre]));
  }

  async save(movimiento: Movimiento): Promise<Movimiento> {
    const row = (await this.prisma.movimiento.create({
      data: {
        id: movimiento.id,
        socioId: movimiento.socioId ?? null,
        tipo: movimiento.tipo,
        categoria: movimiento.categoria,
        descripcion: movimiento.descripcion,
        monto: movimiento.monto.value,
        fecha: movimiento.fecha,
      } as never,
    })) as unknown as MovimientoRow;
    return this.toDomain(row);
  }

  async update(movimiento: Movimiento): Promise<Movimiento> {
    const row = (await this.prisma.movimiento.update({
      where: { id: movimiento.id },
      data: {
        socioId: movimiento.socioId ?? null,
        tipo: movimiento.tipo,
        categoria: movimiento.categoria,
        descripcion: movimiento.descripcion,
        monto: movimiento.monto.value,
        fecha: movimiento.fecha,
      } as never,
    })) as unknown as MovimientoRow;
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.movimiento.delete({ where: { id } });
  }
}
