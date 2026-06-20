import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export interface ResumenCreditos {
  totalMontoPrestado: number;
  totalSociosConCredito: number;
  saldoPorCobrar: number;
  creditosActivos: number;
  creditosPagados: number;
  creditosPendientes: number;
}

export class ObtenerResumenCreditosUseCase {
  async execute(): Promise<ResumenCreditos> {
    const prisma = getPrismaClient();

    const [montoAgg, socioAgg, activosCount, pagadosCount, pendientesCount] = await Promise.all([
      prisma.credito.aggregate({
        _sum: { monto: true },
        where: { deletedAt: null },
      }),
      prisma.credito.findMany({
        where: { deletedAt: null, estado: { in: ['activo', 'pendiente'] } },
        select: { socioId: true },
        distinct: ['socioId'],
      }),
      prisma.credito.count({ where: { estado: 'activo', deletedAt: null } }),
      prisma.credito.count({ where: { estado: 'pagado' } }),
      prisma.credito.count({ where: { estado: 'pendiente', deletedAt: null } }),
    ]);

    const saldoAgg = await prisma.credito.aggregate({
      _sum: { saldoCapital: true },
      where: { estado: 'activo', deletedAt: null },
    });

    return {
      totalMontoPrestado: Number(montoAgg._sum.monto ?? 0),
      totalSociosConCredito: socioAgg.length,
      saldoPorCobrar: Number(saldoAgg._sum.saldoCapital ?? 0),
      creditosActivos: activosCount,
      creditosPagados: pagadosCount,
      creditosPendientes: pendientesCount,
    };
  }
}
