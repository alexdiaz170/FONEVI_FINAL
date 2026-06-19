import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { AcuerdoPago } from '../../domain/entities/AcuerdoPago.js';
import { IAcuerdoPagoRepository } from '../../domain/repositories/IAcuerdoPagoRepository.js';
import { Monto } from '@fonevi/shared';

interface AcuerdoRow {
  id: string;
  socioId: string;
  montoTotal: number;
  cuotas: number;
  montoCuota: number;
  estado: string;
  fechaInicio: Date;
  fechaFin: Date | null;
  notas: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaAcuerdoPagoRepository implements IAcuerdoPagoRepository {
  protected readonly prisma: PrismaClient;
  constructor() {
    this.prisma = getPrismaClient();
  }

  private toDomain(row: AcuerdoRow): AcuerdoPago {
    return AcuerdoPago.fromPersistence({
      id: row.id,
      socioId: row.socioId,
      montoTotal: Monto.create(Number(row.montoTotal)),
      cuotas: row.cuotas,
      montoCuota: Monto.create(Number(row.montoCuota)),
      estado: row.estado,
      fechaInicio: row.fechaInicio,
      fechaFin: row.fechaFin,
      notas: row.notas,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string) {
    const row = (await this.prisma.acuerdoPago.findUnique({
      where: { id },
    })) as unknown as AcuerdoRow | null;
    return row ? this.toDomain(row) : null;
  }

  async findBySocioId(socioId: string) {
    const rows = (await this.prisma.acuerdoPago.findMany({
      where: { socioId } as never,
    })) as unknown as AcuerdoRow[];
    return rows.map(this.toDomain);
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.acuerdoPago.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' } as never,
      }) as unknown as Promise<AcuerdoRow[]>,
      this.prisma.acuerdoPago.count(),
    ]);
    return {
      data: data.map((r) => this.toDomain(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(acuerdo: AcuerdoPago) {
    const row = (await this.prisma.acuerdoPago.create({
      data: {
        id: acuerdo.id,
        socioId: acuerdo.socioId,
        montoTotal: acuerdo.montoTotal.value,
        cuotas: acuerdo.cuotas,
        montoCuota: acuerdo.montoCuota.value,
        estado: acuerdo.estado,
        fechaInicio: acuerdo.fechaInicio,
        fechaFin: acuerdo.fechaFin,
        notas: acuerdo.notas,
      } as never,
    })) as unknown as AcuerdoRow;
    return this.toDomain(row);
  }

  async update(acuerdo: AcuerdoPago) {
    const row = (await this.prisma.acuerdoPago.update({
      where: { id: acuerdo.id },
      data: { estado: acuerdo.estado, fechaFin: acuerdo.fechaFin, notas: acuerdo.notas } as never,
    })) as unknown as AcuerdoRow;
    return this.toDomain(row);
  }
}
