import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { PagoCuota } from '../../domain/entities/PagoCuota.js';
import { IPagoCuotaRepository } from '../../domain/repositories/IPagoCuotaRepository.js';
import { Monto } from '@fonevi/shared';

interface PagoCuotaRow {
  id: string;
  creditoId: string;
  numeroCuota: number;
  monto: number;
  montoCapital: number;
  montoInteres: number;
  fechaPago: Date;
  createdAt: Date;
}

export class PrismaPagoCuotaRepository implements IPagoCuotaRepository {
  protected readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  private toDomain(row: PagoCuotaRow): PagoCuota {
    return PagoCuota.fromPersistence({
      id: row.id,
      creditoId: row.creditoId,
      numeroCuota: row.numeroCuota,
      monto: Monto.create(Number(row.monto)),
      montoCapital: Monto.create(Number(row.montoCapital)),
      montoInteres: Monto.create(Number(row.montoInteres)),
      fechaPago: row.fechaPago,
      createdAt: row.createdAt,
    });
  }

  async findById(id: string): Promise<PagoCuota | null> {
    const row = (await this.prisma.pagoCuota.findUnique({
      where: { id },
    })) as unknown as PagoCuotaRow | null;
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByCreditoId(creditoId: string): Promise<PagoCuota[]> {
    const rows = (await this.prisma.pagoCuota.findMany({
      where: { creditoId } as never,
      orderBy: { numeroCuota: 'asc' } as never,
    })) as unknown as PagoCuotaRow[];
    return rows.map((row) => this.toDomain(row));
  }

  async save(pagoCuota: PagoCuota): Promise<PagoCuota> {
    const row = (await this.prisma.pagoCuota.create({
      data: {
        id: pagoCuota.id,
        creditoId: pagoCuota.creditoId,
        numeroCuota: pagoCuota.numeroCuota,
        monto: pagoCuota.monto.value,
        montoCapital: pagoCuota.montoCapital.value,
        montoInteres: pagoCuota.montoInteres.value,
        fechaPago: pagoCuota.fechaPago,
      } as never,
    })) as unknown as PagoCuotaRow;
    return this.toDomain(row);
  }
}
