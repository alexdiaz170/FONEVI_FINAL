import { Monto } from '@fonevi/shared';
import { SolidaridadMovimiento } from '../../../domain/entities/SolidaridadMovimiento.js';
import { ISolidaridadMovimientoRepository } from '../../../domain/repositories/ISolidaridadMovimientoRepository.js';

export class RegistrarSolidaridadUseCase {
  constructor(private readonly solidaridadRepo: ISolidaridadMovimientoRepository) {}

  async execute(dto: {
    tipo: string;
    descripcion: string;
    monto: number;
    fecha?: string | null;
    beneficiario?: string | null;
  }): Promise<SolidaridadMovimiento> {
    const monto = Monto.create(dto.monto);
    const fecha = dto.fecha ? new Date(dto.fecha) : new Date();

    const movimiento = SolidaridadMovimiento.create({
      tipo: dto.tipo,
      descripcion: dto.descripcion,
      monto,
      fecha,
      beneficiario: dto.beneficiario ?? null,
    });

    return await this.solidaridadRepo.save(movimiento);
  }
}
