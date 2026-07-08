import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { CreditoMovimiento } from '../../domain/entities/CreditoMovimiento.js';
import { ICreditoMovimientoRepository } from '../../domain/repositories/ICreditoMovimientoRepository.js';
import { Monto } from '@fonevi/shared';

interface CreditoMovimientoRow {
  id: string;
  creditoId: string;
  tipo: string;
  monto: number;
  montoCapital: number | null;
  montoInteres: number | null;
  seguro: number | null;
  saldoCapitalAnterior: number;
  saldoCapitalPosterior: number;
  descripcion: string | null;
  createdAt: Date;
}

export class PrismaCreditoMovimientoRepository implements ICreditoMovimientoRepository {
  protected readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  private toDomain(row: CreditoMovimientoRow): CreditoMovimiento {
    return CreditoMovimiento.fromPersistence({
      id: row.id,
      creditoId: row.creditoId,
      tipo: row.tipo as 'desembolso' | 'pago_cuota' | 'reversion' | 'aprobacion' | 'cancelacion',
      monto: Monto.create(Number(row.monto)),
      montoCapital: row.montoCapital !== null ? Monto.create(Number(row.montoCapital)) : null,
      montoInteres: row.montoInteres !== null ? Monto.create(Number(row.montoInteres)) : null,
      seguro: row.seguro !== null ? Monto.create(Number(row.seguro)) : null,
      saldoCapitalAnterior: Monto.create(Number(row.saldoCapitalAnterior)),
      saldoCapitalPosterior: Monto.create(Number(row.saldoCapitalPosterior)),
      descripcion: row.descripcion,
      createdAt: row.createdAt,
    });
  }

  async findByCreditoId(creditoId: string): Promise<CreditoMovimiento[]> {
    const rows = (await this.prisma.creditoMovimiento.findMany({
      where: { creditoId },
      orderBy: { createdAt: 'asc' },
    })) as unknown as CreditoMovimientoRow[];
    return rows.map((row) => this.toDomain(row));
  }

  async save(movimiento: CreditoMovimiento): Promise<CreditoMovimiento> {
    const row = (await this.prisma.creditoMovimiento.create({
      data: {
        id: movimiento.id,
        creditoId: movimiento.creditoId,
        tipo: movimiento.tipo,
        monto: movimiento.monto.value,
        montoCapital: movimiento.montoCapital?.value ?? null,
        montoInteres: movimiento.montoInteres?.value ?? null,
        seguro: movimiento.seguro?.value ?? null,
        saldoCapitalAnterior: movimiento.saldoCapitalAnterior.value,
        saldoCapitalPosterior: movimiento.saldoCapitalPosterior.value,
        descripcion: movimiento.descripcion ?? null,
      },
    })) as unknown as CreditoMovimientoRow;
    return this.toDomain(row);
  }
}
