import { Monto } from '@fonevi/shared';
import { getPrismaClient } from '../../infrastructure/persistence/prismaClient.js';

export interface MoraCalculada {
  socioId: string;
  socioNombre: string;
  aportesVencidos: number;
  totalAdeudado: number;
  diasMora: number;
  interesMora: number;
}

export class MoraService {
  async calcularMoraPorSocio(socioId: string): Promise<MoraCalculada | null> {
    const prisma = getPrismaClient();

    const socio = await prisma.socio.findUnique({
      where: { id: socioId },
      select: { id: true, nombre: true },
    });
    if (!socio) return null;

    const aportesVencidos = await prisma.aporte.findMany({
      where: { socioId, estado: { in: ['mora', 'vencido', 'pendiente'] } } as never,
      orderBy: { fechaPago: 'asc' as never },
      select: { monto: true, fechaPago: true, estado: true },
    });

    if (aportesVencidos.length === 0) return null;

    const totalAdeudado = aportesVencidos.reduce((sum, a) => sum + Number(a.monto), 0);

    const fechaMasAntigua = aportesVencidos
      .filter((a) => a.fechaPago)
      .sort((a, b) => new Date(a.fechaPago!).getTime() - new Date(b.fechaPago!).getTime())[0];

    const diasMora = fechaMasAntigua?.fechaPago
      ? Math.floor(
          (Date.now() - new Date(fechaMasAntigua.fechaPago).getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;

    const tasaMensualMora = 0;
    const interesMora = 0;

    return {
      socioId: socio.id,
      socioNombre: socio.nombre,
      aportesVencidos: aportesVencidos.length,
      totalAdeudado,
      diasMora,
      interesMora,
    };
  }

  async listarSociosEnMora(): Promise<MoraCalculada[]> {
    const prisma = getPrismaClient();
    const sociosEnMora = await prisma.socio.findMany({
      where: { estado: 'mora', deletedAt: null },
      select: { id: true },
    });

    const resultados: MoraCalculada[] = [];
    for (const s of sociosEnMora) {
      const mora = await this.calcularMoraPorSocio(s.id);
      if (mora) resultados.push(mora);
    }
    return resultados;
  }
}
