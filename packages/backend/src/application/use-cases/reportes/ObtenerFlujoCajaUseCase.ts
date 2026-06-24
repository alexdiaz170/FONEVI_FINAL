import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export interface FlujoCajaItem {
  fecha: Date;
  tipo: string;
  categoria: string;
  descripcion: string;
  monto: number;
}

export interface FlujoCajaResumen {
  ingresos: number;
  egresos: number;
  saldo: number;
  movimientos: FlujoCajaItem[];
}

export class ObtenerFlujoCajaUseCase {
  async execute(desde?: string, hasta?: string): Promise<FlujoCajaResumen> {
    const prisma = getPrismaClient();

    const where: Record<string, unknown> = {};
    if (desde || hasta) {
      const fechaFilter: Record<string, Date> = {};
      if (desde) {
        const parts = desde.split('-').map(Number);
        fechaFilter.gte = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
      }
      if (hasta) {
        const parts = hasta.split('-').map(Number);
        fechaFilter.lte = new Date(parts[0]!, parts[1]! - 1, parts[2]! + 1);
      }
      where.fecha = fechaFilter;
    }

    const movimientos = await prisma.movimiento.findMany({
      where,
      orderBy: { fecha: 'desc' },
    });

    const items: FlujoCajaItem[] = movimientos.map((m) => ({
      fecha: m.fecha,
      tipo: m.tipo,
      categoria: m.categoria,
      descripcion: m.descripcion,
      monto: Number(m.monto),
    }));

    const ingresos = items.filter((i) => i.tipo === 'ingreso').reduce((s, i) => s + i.monto, 0);

    const egresos = items.filter((i) => i.tipo === 'egreso').reduce((s, i) => s + i.monto, 0);

    return { ingresos, egresos, saldo: ingresos - egresos, movimientos: items };
  }
}
