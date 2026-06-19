import { CalculadorBalanceGeneral, BalanceGeneral } from '../../../domain/services/contabilidad.js';
import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export class ObtenerBalanceUseCase {
  constructor(private readonly calculador: CalculadorBalanceGeneral) {}

  async execute(): Promise<BalanceGeneral> {
    const prisma = getPrismaClient();

    const [totalAhorros, creditosActivos, totalSolidaridad, configReservas, totalAportes] =
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
        prisma.configuracion.findUnique({ where: { clave: 'reservas' } }),
        prisma.aporte.aggregate({ _sum: { monto: true }, where: { estado: 'pagado' } }),
      ]);

    return this.calculador.calcular(
      Number(totalAhorros._sum.ahorroAcumulado ?? 0),
      Number(creditosActivos._sum.saldoCapital ?? 0),
      Number(totalSolidaridad._sum.monto ?? 0),
      Number(configReservas?.valor ?? 2500000),
      Number(totalAportes._sum.monto ?? 0),
    );
  }
}
