import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { Aporte } from '../../domain/entities/Aporte.js';
import { AporteDetalle } from '../../domain/entities/AporteDetalle.js';
import { EstadoAporte } from '../../domain/value-objects/EstadoAporte.js';
import {
  IAporteRepository,
  AporteFilter,
  AporteListResult,
} from '../../domain/repositories/IAporteRepository.js';
import { Monto } from '@fonevi/shared';

interface AporteRow {
  id: string;
  socioId: string;
  periodoId: number;
  monto: number;
  fechaPago: Date | null;
  estado: string;
  metodo: string | null;
  notas: string | null;
  pagoSolidaridad: number;
  pagoCredito: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DetalleRow {
  id: string;
  aporteId: string;
  solidaridad: number;
  interes: number;
  seguro: number;
  capital: number;
  ahorro: number;
}

const detalleInclude = { detalle: true };

export class PrismaAporteRepository implements IAporteRepository {
  protected readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  private toDomain(row: AporteRow & { detalle?: DetalleRow | null }): Aporte {
    const detalle = row.detalle
      ? AporteDetalle.fromPersistence({
          id: (row.detalle as DetalleRow).id,
          aporteId: (row.detalle as DetalleRow).aporteId,
          solidaridad: Monto.create(Number((row.detalle as DetalleRow).solidaridad)),
          interes: Monto.create(Number((row.detalle as DetalleRow).interes)),
          seguro: Monto.create(Number((row.detalle as DetalleRow).seguro)),
          capital: Monto.create(Number((row.detalle as DetalleRow).capital)),
          ahorro: Monto.create(Number((row.detalle as DetalleRow).ahorro)),
        })
      : null;

    return Aporte.fromPersistence({
      id: row.id,
      socioId: row.socioId,
      periodoId: row.periodoId,
      monto: Monto.create(Number(row.monto)),
      fechaPago: row.fechaPago,
      estado: EstadoAporte.create(row.estado),
      metodo: row.metodo,
      notas: row.notas,
      pagoSolidaridad: Monto.create(Number(row.pagoSolidaridad)),
      pagoCredito: Monto.create(Number(row.pagoCredito)),
      detalle,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<Aporte | null> {
    const row = (await this.prisma.aporte.findUnique({
      where: { id },
      include: detalleInclude,
    })) as unknown as (AporteRow & { detalle: DetalleRow | null }) | null;
    if (!row) return null;
    return this.toDomain(row);
  }

  async findAll(filters: AporteFilter = {}): Promise<AporteListResult> {
    const { socioId, periodoId, estado, page = 1, limit = 10 } = filters;
    const where: Record<string, unknown> = {};
    if (socioId) where.socioId = socioId;
    if (periodoId) where.periodoId = periodoId;
    if (estado) where.estado = estado;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.aporte.findMany({
        where: where as never,
        orderBy: { fechaPago: 'desc' } as never,
        skip,
        take: limit,
        include: detalleInclude,
      }) as unknown as Promise<(AporteRow & { detalle: DetalleRow | null })[]>,
      this.prisma.aporte.count({ where: where as never }),
    ]);

    return {
      data: data.map((row) => this.toDomain(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(aporte: Aporte): Promise<Aporte> {
    const detalleData = aporte.detalle
      ? {
          create: {
            id: aporte.detalle.id,
            solidaridad: aporte.detalle.solidaridad.value,
            interes: aporte.detalle.interes.value,
            seguro: aporte.detalle.seguro.value,
            capital: aporte.detalle.capital.value,
            ahorro: aporte.detalle.ahorro.value,
          },
        }
      : undefined;

    const row = (await this.prisma.aporte.create({
      data: {
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
        detalle: detalleData,
      } as never,
      include: detalleInclude,
    })) as unknown as AporteRow & { detalle: DetalleRow | null };
    return this.toDomain(row);
  }

  async update(aporte: Aporte): Promise<Aporte> {
    const row = (await this.prisma.aporte.update({
      where: { id: aporte.id },
      data: {
        monto: aporte.monto.value,
        fechaPago: aporte.fechaPago,
        estado: aporte.estado.toString(),
        metodo: aporte.metodo,
        notas: aporte.notas,
      } as never,
    })) as unknown as AporteRow;
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.aporte.delete({ where: { id } });
  }

  async recalcularAhorroAcumulado(socioId: string): Promise<Monto> {
    const result = (await this.prisma.aporte.aggregate({
      where: { socioId, estado: { not: 'anulado' } } as never,
      _sum: { monto: true, pagoSolidaridad: true, pagoCredito: true },
    })) as unknown as {
      _sum: { monto: number | null; pagoSolidaridad: number | null; pagoCredito: number | null };
    };

    const totalMonto = Number(result._sum.monto || 0);
    const totalSolidaridad = Number(result._sum.pagoSolidaridad || 0);
    const totalCredito = Number(result._sum.pagoCredito || 0);
    const ahorro = Math.max(0, totalMonto - totalSolidaridad - totalCredito);

    return Monto.create(ahorro);
  }
}
