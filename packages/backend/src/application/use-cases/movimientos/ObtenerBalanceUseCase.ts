import { CalculadorBalanceGeneral, BalanceGeneral } from '../../../domain/services/contabilidad.js';
import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export class ObtenerBalanceUseCase {
  constructor(private readonly calculador: CalculadorBalanceGeneral) {}

  async execute(): Promise<BalanceGeneral> {
    const prisma = getPrismaClient();

    const [totalAhorros, creditosActivos, solidaridadIngresos, solidaridadEgresos, totalAportes] =
      await Promise.all([
        prisma.socio.aggregate({ _sum: { ahorroAcumulado: true }, where: { deletedAt: null } }),
        prisma.credito.aggregate({
          _sum: { saldoCapital: true },
          where: { estado: 'activo', deletedAt: null },
        }),
        prisma.solidaridadMovimiento.aggregate({
          _sum: { monto: true },
          where: { tipo: 'ingreso' },
        }),
        prisma.solidaridadMovimiento.aggregate({
          _sum: { monto: true },
          where: { tipo: 'egreso' },
        }),
        prisma.aporte.aggregate({ _sum: { monto: true }, where: { estado: 'pagado' } }),
      ]);

    const totalSolidaridad =
      Number(solidaridadIngresos._sum.monto ?? 0) - Number(solidaridadEgresos._sum.monto ?? 0);

    return this.calculador.calcular(
      Number(totalAhorros._sum.ahorroAcumulado ?? 0),
      Number(creditosActivos._sum.saldoCapital ?? 0),
      totalSolidaridad,
      Number(totalAportes._sum.monto ?? 0),
    );
  }
}
