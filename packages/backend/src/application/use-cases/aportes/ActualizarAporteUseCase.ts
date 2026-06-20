import { Monto } from '@fonevi/shared';
import { Aporte } from '../../../domain/entities/Aporte.js';
import { EstadoAporte } from '../../../domain/value-objects/EstadoAporte.js';
import { IAporteRepository } from '../../../domain/repositories/IAporteRepository.js';
import { EntityNotFoundError } from '../../../domain/errors.js';
import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export class ActualizarAporteUseCase {
  constructor(private readonly aporteRepo: IAporteRepository) {}

  async execute(
    id: string,
    dto: {
      monto?: number;
      fechaPago?: string | null;
      estado?: string;
      metodo?: string | null;
      notas?: string | null;
    },
  ): Promise<Aporte> {
    const aporte = await this.aporteRepo.findById(id);
    if (!aporte) throw new EntityNotFoundError('Aporte', id);

    const actualizaciones: Record<string, unknown> = {};
    if (dto.monto !== undefined) actualizaciones.monto = Monto.create(dto.monto);
    if (dto.fechaPago !== undefined)
      actualizaciones.fechaPago = dto.fechaPago
        ? (() => {
            const parts = dto.fechaPago!.split('-').map(Number);
            return new Date(parts[0]!, parts[1]! - 1, parts[2]!);
          })()
        : null;
    if (dto.estado !== undefined) actualizaciones.estado = EstadoAporte.create(dto.estado);
    if (dto.metodo !== undefined) actualizaciones.metodo = dto.metodo ?? null;
    if (dto.notas !== undefined) actualizaciones.notas = dto.notas ?? null;

    const actualizado = aporte.actualizarDatos(
      actualizaciones as Parameters<typeof aporte.actualizarDatos>[0],
    );
    const saved = await this.aporteRepo.update(actualizado);

    const prisma = getPrismaClient();
    const nuevoAhorro = await this.aporteRepo.recalcularAhorroAcumulado(aporte.socioId);
    await prisma.socio.update({
      where: { id: aporte.socioId },
      data: { ahorroAcumulado: nuevoAhorro.value },
    });

    return saved;
  }
}
