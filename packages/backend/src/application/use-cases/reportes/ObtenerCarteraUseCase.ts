import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export interface CarteraItem {
  socioId: string;
  socioNombre: string;
  creditoId: string;
  monto: number;
  saldoCapital: number;
  cuotas: number;
  cuotasPagadas: number;
  cuotasRestantes: number;
  cuotaMensual: number;
  tasaMensual: number;
  fechaDesembolso: Date;
  estado: string;
  totalPagado: number;
}

export class ObtenerCarteraUseCase {
  async execute(): Promise<CarteraItem[]> {
    const prisma = getPrismaClient();

    const creditos = await prisma.credito.findMany({
      where: { estado: { in: ['activo', 'pagado'] }, deletedAt: null },
      include: {
        socio: { select: { id: true, nombre: true } },
        pagoCuotas: { select: { monto: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return creditos.map((c) => {
      const totalPagado = c.pagoCuotas.reduce((sum, p) => sum + Number(p.monto), 0);
      return {
        socioId: c.socioId,
        socioNombre: c.socio.nombre,
        creditoId: c.id,
        monto: Number(c.monto),
        saldoCapital: Number(c.saldoCapital),
        cuotas: c.cuotas,
        cuotasPagadas: c.cuotasPagadas,
        cuotasRestantes: c.cuotas - c.cuotasPagadas,
        cuotaMensual: (() => {
          const p = Number(c.monto);
          const r = Number(c.tasaMensual) / 100;
          const n = c.cuotas;
          if (r === 0) return Math.round((p / n) * 100) / 100;
          const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
          return Math.round(p * factor * 100) / 100;
        })(),
        tasaMensual: Number(c.tasaMensual),
        fechaDesembolso: c.fechaDesembolso,
        estado: c.estado,
        totalPagado,
      };
    });
  }
}
