import { Monto } from '@fonevi/shared';
import { Movimiento } from '../../../domain/entities/Movimiento.js';
import { IMovimientoRepository } from '../../../domain/repositories/IMovimientoRepository.js';

export class RegistrarMovimientoUseCase {
  constructor(private readonly movimientoRepo: IMovimientoRepository) {}

  async execute(dto: {
    tipo: string;
    categoria: string;
    descripcion: string;
    monto: number;
    fecha?: string | null;
  }): Promise<Movimiento> {
    const monto = Monto.create(dto.monto);
    const fecha = dto.fecha ? new Date(dto.fecha) : new Date();

    const movimiento = Movimiento.create({
      tipo: dto.tipo,
      categoria: dto.categoria,
      descripcion: dto.descripcion,
      monto,
      fecha,
    });

    return await this.movimientoRepo.save(movimiento);
  }
}
