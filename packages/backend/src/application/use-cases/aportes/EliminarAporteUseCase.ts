import { IAporteRepository } from '../../../domain/repositories/IAporteRepository.js';
import { EntityNotFoundError } from '../../../domain/errors.js';
import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export class EliminarAporteUseCase {
  constructor(private readonly aporteRepo: IAporteRepository) {}

  async execute(id: string): Promise<void> {
    const aporte = await this.aporteRepo.findById(id);
    if (!aporte) throw new EntityNotFoundError('Aporte', id);

    const prisma = getPrismaClient();

    const movimiento = await prisma.movimiento.findFirst({
      where: { socioId: aporte.socioId, monto: aporte.monto.value, tipo: 'ingreso' },
      orderBy: { createdAt: 'desc' },
    });
    if (movimiento) {
      await prisma.movimiento.delete({ where: { id: movimiento.id } });
    }

    if (aporte.pagoSolidaridad.value > 0) {
      const fechaAporte = aporte.createdAt ?? new Date();
      const ventanaInicio = new Date(fechaAporte.getTime() - 5000);
      const ventanaFin = new Date(fechaAporte.getTime() + 5000);
      const solidaridadMov = await prisma.solidaridadMovimiento.findFirst({
        where: {
          monto: aporte.pagoSolidaridad.value,
          tipo: 'ingreso',
          fecha: { gte: ventanaInicio, lte: ventanaFin },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (solidaridadMov) {
        await prisma.solidaridadMovimiento.delete({ where: { id: solidaridadMov.id } });
      }
    }

    if (aporte.detalle && aporte.detalle.capital.value > 0) {
      const creditoActivo = await prisma.credito.findFirst({
        where: { socioId: aporte.socioId, estado: 'activo' },
        orderBy: { createdAt: 'asc' },
      });
      if (creditoActivo) {
        const pagoCuota = await prisma.pagoCuota.findFirst({
          where: {
            creditoId: creditoActivo.id,
            montoCapital: aporte.detalle.capital.value,
            montoInteres: aporte.detalle.interes.value,
          },
          orderBy: { createdAt: 'desc' },
        });
        if (pagoCuota) {
          await prisma.pagoCuota.delete({ where: { id: pagoCuota.id } });
          await prisma.credito.update({
            where: { id: creditoActivo.id },
            data: { cuotasPagadas: { decrement: 1 } },
          });
        }

        const saldoRestaurado = Number(creditoActivo.saldoCapital) + aporte.detalle.capital.value;
        await prisma.credito.update({
          where: { id: creditoActivo.id },
          data: { saldoCapital: saldoRestaurado, estado: 'activo' },
        });
      }
    }

    await this.aporteRepo.delete(id);

    const nuevoAhorro = await this.aporteRepo.recalcularAhorroAcumulado(aporte.socioId);
    await prisma.socio.update({
      where: { id: aporte.socioId },
      data: { ahorroAcumulado: nuevoAhorro.value },
    });
  }
}
