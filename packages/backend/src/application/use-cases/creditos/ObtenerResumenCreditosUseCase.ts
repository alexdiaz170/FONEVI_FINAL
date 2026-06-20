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

    const estadosOtorgados = ['activo', 'pagado'];

    const [montoAgg, socioAgg, activosCount, pagadosCount, pendientesCount] = await Promise.all([
      prisma.credito.aggregate({
        _sum: { monto: true },
        where: { estado: { in: estadosOtorgados }, deletedAt: null },
      }),
      prisma.credito.findMany({
        where: { estado: { in: estadosOtorgados }, deletedAt: null },
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
