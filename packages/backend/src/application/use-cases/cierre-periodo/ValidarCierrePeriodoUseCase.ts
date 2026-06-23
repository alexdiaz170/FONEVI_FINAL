import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export interface ValidacionCierre {
  valido: boolean;
  periodo: {
    id: number;
    nombre: string;
    anio: number;
    mes: number;
  } | null;
  errores: string[];
  advertencias: string[];
}

export class ValidarCierrePeriodoUseCase {
  async execute(): Promise<ValidacionCierre> {
    const prisma = getPrismaClient();
    const errores: string[] = [];
    const advertencias: string[] = [];

    const periodoActivo = await prisma.periodo.findFirst({
      where: { activo: true },
    });

    if (!periodoActivo) {
      errores.push('No hay un período activo para cerrar');
      return { valido: false, periodo: null, errores, advertencias };
    }

    const configCount = await prisma.configuracion.count();
    if (configCount === 0) {
      errores.push('No hay configuración financiera registrada');
    }

    const aportesPendientes = await prisma.aporte.count({
      where: { periodoId: periodoActivo.id, estado: 'pendiente' },
    });
    if (aportesPendientes > 0) {
      advertencias.push(`${aportesPendientes} socio(s) tienen aportes pendientes en este período`);
    }

    const creditosActivos = await prisma.credito.count({
      where: { estado: 'activo' },
    });
    if (creditosActivos > 0) {
      advertencias.push(
        `Hay ${creditosActivos} crédito(s) activos que continuarán al siguiente período`,
      );
    }

    const totalAportes = await prisma.aporte.count({
      where: { periodoId: periodoActivo.id },
    });
    if (totalAportes === 0) {
      advertencias.push('No hay aportes registrados en este período');
    }

    return {
      valido: errores.length === 0,
      periodo: {
        id: periodoActivo.id,
        nombre: periodoActivo.nombre,
        anio: periodoActivo.anio,
        mes: periodoActivo.mes,
      },
      errores,
      advertencias,
    };
  }
}
