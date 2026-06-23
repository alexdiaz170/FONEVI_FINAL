import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export interface SimulacionCierre {
  periodo: {
    id: number;
    nombre: string;
    anio: number;
    mes: number;
  };
  totalSociosActivos: number;
  totalAportes: number;
  totalRecaudado: number;
  totalSolidaridad: number;
  totalAhorro: number;
  totalAplicadoCreditos: number;
  sociosEnMora: number;
  sociosAlDia: number;
  creditosActivos: number;
  saldoPorCobrar: number;
}

export class SimularCierrePeriodoUseCase {
  async execute(): Promise<SimulacionCierre> {
    const prisma = getPrismaClient();

    const periodoActivo = await prisma.periodo.findFirst({
      where: { activo: true },
    });

    if (!periodoActivo) {
      throw new Error('No hay un período activo para simular');
    }

    const [sociosActivos, aportes, creditos, mora] = await Promise.all([
      prisma.socio.count({ where: { deletedAt: null, estado: 'activo' } }),
      prisma.aporte.findMany({
        where: { periodoId: periodoActivo.id },
        select: { monto: true, pagoSolidaridad: true, pagoCredito: true },
      }),
      prisma.credito.aggregate({
        where: { estado: { in: ['activo', 'pendiente'] } },
        _sum: { saldoCapital: true },
      }),
      prisma.aporte.count({
        where: { periodoId: periodoActivo.id, estado: 'vencido' },
      }),
    ]);

    const totalRecaudado = aportes.reduce((s, a) => s + Number(a.monto), 0);
    const totalSolidaridad = aportes.reduce((s, a) => s + Number(a.pagoSolidaridad), 0);
    const totalAplicadoCreditos = aportes.reduce((s, a) => s + Number(a.pagoCredito), 0);
    const totalAhorro = totalRecaudado - totalSolidaridad - totalAplicadoCreditos;
    const sociosAlDia = await prisma.aporte.count({
      where: { periodoId: periodoActivo.id, estado: 'pagado' },
    });
    const sociosEnMora = await prisma.aporte.groupBy({
      by: ['socioId'],
      where: { periodoId: periodoActivo.id, estado: { in: ['pendiente', 'vencido'] } },
    });

    return {
      periodo: {
        id: periodoActivo.id,
        nombre: periodoActivo.nombre,
        anio: periodoActivo.anio,
        mes: periodoActivo.mes,
      },
      totalSociosActivos: sociosActivos,
      totalAportes: aportes.length,
      totalRecaudado: Math.round(totalRecaudado * 100) / 100,
      totalSolidaridad: Math.round(totalSolidaridad * 100) / 100,
      totalAhorro: Math.round(totalAhorro * 100) / 100,
      totalAplicadoCreditos: Math.round(totalAplicadoCreditos * 100) / 100,
      sociosEnMora: sociosEnMora.length,
      sociosAlDia: sociosAlDia,
      creditosActivos: creditos._sum.saldoCapital
        ? Number(creditos._sum.saldoCapital) > 0
          ? 1
          : 0
        : 0,
      saldoPorCobrar: Number(creditos._sum.saldoCapital ?? 0),
    };
  }
}
