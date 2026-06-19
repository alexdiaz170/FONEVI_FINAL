import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { Periodo } from '../../domain/entities/Periodo.js';
import { IPeriodoRepository } from '../../domain/repositories/IPeriodoRepository.js';

interface PeriodoRow {
  id: number;
  nombre: string;
  anio: number;
  mes: number;
  activo: boolean;
  createdAt: Date;
}

export class PrismaPeriodoRepository implements IPeriodoRepository {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  private toDomain(row: PeriodoRow): Periodo {
    return Periodo.fromPersistence({
      id: row.id,
      nombre: row.nombre,
      anio: row.anio,
      mes: row.mes,
      activo: row.activo,
      createdAt: row.createdAt,
    });
  }

  async findById(id: number): Promise<Periodo | null> {
    const row = (await this.prisma.periodo.findUnique({
      where: { id },
    })) as unknown as PeriodoRow | null;
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByNombre(nombre: string): Promise<Periodo | null> {
    const row = (await this.prisma.periodo.findUnique({
      where: { nombre },
    })) as unknown as PeriodoRow | null;
    if (!row) return null;
    return this.toDomain(row);
  }

  async findActivo(): Promise<Periodo | null> {
    const row = (await this.prisma.periodo.findFirst({
      where: { activo: true },
    })) as unknown as PeriodoRow | null;
    if (!row) return null;
    return this.toDomain(row);
  }

  async findAll(): Promise<Periodo[]> {
    const rows = (await this.prisma.periodo.findMany({
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    })) as unknown as PeriodoRow[];
    return rows.map((row) => this.toDomain(row));
  }

  async save(periodo: Periodo): Promise<Periodo> {
    const row = (await this.prisma.periodo.create({
      data: {
        nombre: periodo.nombre,
        anio: periodo.anio,
        mes: periodo.mes,
        activo: periodo.activo,
      },
    })) as unknown as PeriodoRow;
    return this.toDomain(row);
  }

  async update(periodo: Periodo): Promise<Periodo> {
    const row = (await this.prisma.periodo.update({
      where: { id: periodo.id },
      data: {
        nombre: periodo.nombre,
        anio: periodo.anio,
        mes: periodo.mes,
        activo: periodo.activo,
      },
    })) as unknown as PeriodoRow;
    return this.toDomain(row);
  }
}
