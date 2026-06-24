import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export interface ResultadoCierre {
  exitoso: boolean;
  periodo: {
    id: number;
    nombre: string;
    anio: number;
    mes: number;
  };
  totalRecaudado: number;
  totalSolidaridad: number;
  totalAhorro: number;
  totalAplicadoCreditos: number;
  movimientosCreados: number;
  mensaje: string;
}

export class EjecutarCierrePeriodoUseCase {
  async execute(usuarioId: string): Promise<ResultadoCierre> {
    const prisma = getPrismaClient();

    const periodoActivo = await prisma.periodo.findFirst({
      where: { activo: true },
    });

    if (!periodoActivo) {
      throw new Error('No hay un período activo para cerrar');
    }

    const aportes = await prisma.aporte.findMany({
      where: { periodoId: periodoActivo.id },
      select: { monto: true, pagoSolidaridad: true, pagoCredito: true },
    });

    const totalRecaudado = aportes.reduce((s, a) => s + Number(a.monto), 0);
    const totalSolidaridad = aportes.reduce((s, a) => s + Number(a.pagoSolidaridad), 0);
    const totalAplicadoCreditos = aportes.reduce((s, a) => s + Number(a.pagoCredito), 0);
    const totalAhorro = totalRecaudado - totalSolidaridad - totalAplicadoCreditos;

    const [totalSociosAportaron, totalAportes] = await Promise.all([
      prisma.aporte
        .groupBy({
          by: ['socioId'],
          where: { periodoId: periodoActivo.id },
          _count: true,
        })
        .then((r) => r.length),
      prisma.aporte.count({ where: { periodoId: periodoActivo.id } }),
    ]);

    await prisma.$transaction(async () => {
      await prisma.movimiento.create({
        data: {
          tipo: 'ingreso',
          categoria: 'cierre_periodo',
          descripcion: `Cierre de período: ${periodoActivo.nombre}`,
          monto: Math.round(totalRecaudado * 100) / 100,
          fecha: new Date(),
        },
      });

      await prisma.periodo.update({
        where: { id: periodoActivo.id },
        data: { activo: false },
      });

      await prisma.auditoria.create({
        data: {
          usuarioId,
          accion: 'CIERRE_PERIODO',
          tabla: 'periodos',
          registroId: String(periodoActivo.id),
          detalle: `Cierre ejecutado para ${periodoActivo.nombre}. Total recaudado: $${totalRecaudado.toLocaleString()}`,
          ip: null,
        },
      });

      await prisma.cierrePeriodo.create({
        data: {
          periodoId: periodoActivo.id,
          usuarioId,
          totalRecaudado: Math.round(totalRecaudado * 100) / 100,
          totalSolidaridad: Math.round(totalSolidaridad * 100) / 100,
          totalAhorro: Math.round(totalAhorro * 100) / 100,
          totalAplicadoCreditos: Math.round(totalAplicadoCreditos * 100) / 100,
          totalSociosAportaron,
          totalAportes,
          fechaCierre: new Date(),
        },
      });
    });

    return {
      exitoso: true,
      periodo: {
        id: periodoActivo.id,
        nombre: periodoActivo.nombre,
        anio: periodoActivo.anio,
        mes: periodoActivo.mes,
      },
      totalRecaudado: Math.round(totalRecaudado * 100) / 100,
      totalSolidaridad: Math.round(totalSolidaridad * 100) / 100,
      totalAhorro: Math.round(totalAhorro * 100) / 100,
      totalAplicadoCreditos: Math.round(totalAplicadoCreditos * 100) / 100,
      movimientosCreados: 1,
      mensaje: `Período "${periodoActivo.nombre}" cerrado exitosamente`,
    };
  }
}
