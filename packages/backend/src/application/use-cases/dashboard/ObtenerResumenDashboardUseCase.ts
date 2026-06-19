import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export interface ResumenDashboard {
  socios: {
    activos: number;
    enMora: number;
    total: number;
  };
  ahorros: {
    totalAcumulado: number;
  };
  creditos: {
    activos: number;
    montoPrestado: number;
    saldoPorCobrar: number;
    pagados: number;
  };
  aportes: {
    delMes: number;
    totalRecibido: number;
  };
  solidaridad: {
    totalRecibido: number;
  };
  movimientos: {
    ingresos: number;
    egresos: number;
  };
  reservas: number;
}

export class ObtenerResumenDashboardUseCase {
  async execute(): Promise<ResumenDashboard> {
    const prisma = getPrismaClient();

    const [
      totalSocios,
      sociosActivos,
      sociosMora,
      totalAhorros,
      creditosActivos,
      creditosPagados,
      totalSolidaridad,
      totalAportes,
      movimientosIngresos,
      movimientosEgresos,
      configReservas,
      aportesMes,
    ] = await Promise.all([
      prisma.socio.count({ where: { deletedAt: null } }),
      prisma.socio.count({ where: { estado: 'activo', deletedAt: null } }),
      prisma.socio.count({ where: { estado: 'mora', deletedAt: null } }),
      prisma.socio.aggregate({ _sum: { ahorroAcumulado: true }, where: { deletedAt: null } }),
      prisma.credito.count({ where: { estado: 'activo', deletedAt: null } }),
      prisma.credito.count({ where: { estado: 'pagado' } }),
      prisma.solidaridadMovimiento.aggregate({ _sum: { monto: true }, where: { tipo: 'ingreso' } }),
      prisma.aporte.aggregate({ _sum: { monto: true }, where: { estado: 'pagado' } }),
      prisma.movimiento.aggregate({ _sum: { monto: true }, where: { tipo: 'ingreso' } }),
      prisma.movimiento.aggregate({ _sum: { monto: true }, where: { tipo: 'egreso' } }),
      prisma.configuracion.findUnique({ where: { clave: 'reservas' } }),
      prisma.aporte.aggregate({
        _sum: { monto: true },
        where: {
          estado: 'pagado',
          fechaPago: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    const creditosActivosData = await prisma.credito.aggregate({
      _sum: { saldoCapital: true },
      where: { estado: 'activo', deletedAt: null },
    });

    return {
      socios: {
        activos: sociosActivos,
        enMora: sociosMora,
        total: totalSocios,
      },
      ahorros: {
        totalAcumulado: Number(totalAhorros._sum.ahorroAcumulado ?? 0),
      },
      creditos: {
        activos: creditosActivos,
        montoPrestado: Number(creditosActivosData._sum.saldoCapital ?? 0),
        saldoPorCobrar: Number(creditosActivosData._sum.saldoCapital ?? 0),
        pagados: creditosPagados,
      },
      aportes: {
        delMes: Number(aportesMes._sum.monto ?? 0),
        totalRecibido: Number(totalAportes._sum.monto ?? 0),
      },
      solidaridad: {
        totalRecibido: Number(totalSolidaridad._sum.monto ?? 0),
      },
      movimientos: {
        ingresos: Number(movimientosIngresos._sum.monto ?? 0),
        egresos: Number(movimientosEgresos._sum.monto ?? 0),
      },
      reservas: Number(configReservas?.valor ?? 2500000),
    };
  }
}
