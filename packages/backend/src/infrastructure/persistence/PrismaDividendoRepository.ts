import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { Dividendo } from '../../domain/entities/Dividendo.js';
import { DividendoSocio } from '../../domain/entities/DividendoSocio.js';
import { IDividendoRepository } from '../../domain/repositories/IDividendoRepository.js';
import { Monto } from '@fonevi/shared';

export class PrismaDividendoRepository implements IDividendoRepository {
  protected readonly prisma: PrismaClient;
  constructor() {
    this.prisma = getPrismaClient();
  }

  async findById(id: string) {
    const row = (await this.prisma.dividendo.findUnique({
      where: { id },
    })) as unknown as DividendoRow | null;
    return row ? this.toDomain(row) : null;
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.dividendo.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' } as never,
      }) as unknown as Promise<DividendoRow[]>,
      this.prisma.dividendo.count(),
    ]);
    return {
      data: data.map((r) => this.toDomain(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(dividendo: Dividendo) {
    const row = (await this.prisma.dividendo.create({
      data: {
        id: dividendo.id,
        periodo: dividendo.periodo,
        montoTotal: dividendo.montoTotal.value,
        fechaCalculo: dividendo.fechaCalculo,
      } as never,
    })) as unknown as DividendoRow;
    return this.toDomain(row);
  }

  async saveSocioDividendos(items: DividendoSocio[]) {
    await this.prisma.dividendoSocio.createMany({
      data: items.map((i) => ({
        id: i.id,
        dividendoId: i.dividendoId,
        socioId: i.socioId,
        monto: i.monto.value,
      })) as never,
    });
    const rows = (await this.prisma.dividendoSocio.findMany({
      where: { dividendoId: items[0]!.dividendoId },
    })) as unknown as DividendoSocioRow[];
    return rows.map((r) =>
      DividendoSocio.fromPersistence({
        id: r.id,
        dividendoId: r.dividendoId,
        socioId: r.socioId,
        monto: Monto.create(Number(r.monto)),
        pagado: r.pagado,
        fechaPago: r.fechaPago,
        createdAt: r.createdAt,
      }),
    );
  }

  async findBySocioId(socioId: string) {
    const rows = (await this.prisma.dividendoSocio.findMany({
      where: { socioId } as never,
    })) as unknown as DividendoSocioRow[];
    return rows.map((r) =>
      DividendoSocio.fromPersistence({
        id: r.id,
        dividendoId: r.dividendoId,
        socioId: r.socioId,
        monto: Monto.create(Number(r.monto)),
        pagado: r.pagado,
        fechaPago: r.fechaPago,
        createdAt: r.createdAt,
      }),
    );
  }

  private toDomain(row: DividendoRow): Dividendo {
    return Dividendo.fromPersistence({
      id: row.id,
      periodo: row.periodo,
      montoTotal: Monto.create(Number(row.montoTotal)),
      distribuido: row.distribuido,
      fechaCalculo: row.fechaCalculo,
      fechaPago: row.fechaPago,
      createdAt: row.createdAt,
    });
  }
}

interface DividendoRow {
  id: string;
  periodo: string;
  montoTotal: number;
  distribuido: boolean;
  fechaCalculo: Date;
  fechaPago: Date | null;
  createdAt: Date;
}
interface DividendoSocioRow {
  id: string;
  dividendoId: string;
  socioId: string;
  monto: number;
  pagado: boolean;
  fechaPago: Date | null;
  createdAt: Date;
}
