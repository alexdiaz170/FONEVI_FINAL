import { Monto } from '@fonevi/shared';
import { SolidaridadMovimiento } from '../../../domain/entities/SolidaridadMovimiento.js';
import { ISolidaridadMovimientoRepository } from '../../../domain/repositories/ISolidaridadMovimientoRepository.js';
import { IMovimientoRepository } from '../../../domain/repositories/IMovimientoRepository.js';
import { Movimiento } from '../../../domain/entities/Movimiento.js';
import { DomainError } from '../../../domain/errors.js';

export class RegistrarSolidaridadUseCase {
  constructor(
    private readonly solidaridadRepo: ISolidaridadMovimientoRepository,
    private readonly movimientoRepo: IMovimientoRepository,
  ) {}

  async execute(dto: {
    tipo: string;
    descripcion: string;
    monto: number;
    fecha?: string | null;
    beneficiario?: string | null;
    socioId?: string;
  }): Promise<SolidaridadMovimiento> {
    if (dto.tipo === 'egreso') {
      const ingresos = await this.solidaridadRepo.sumMontoByTipo('ingreso');
      const egresos = await this.solidaridadRepo.sumMontoByTipo('egreso');
      const saldo = ingresos - egresos;
      if (saldo < dto.monto) {
        throw new DomainError(
          `Saldo insuficiente en fondo de solidaridad: disponible ${saldo}, solicitado ${dto.monto}`,
        );
      }
    }

    const monto = Monto.create(dto.monto);
    const fecha = dto.fecha ? new Date(dto.fecha) : new Date();

    const movimiento = SolidaridadMovimiento.create({
      tipo: dto.tipo,
      descripcion: dto.descripcion,
      monto,
      fecha,
      beneficiario: dto.beneficiario ?? null,
    });

    const solidaridadMov = await this.solidaridadRepo.save(movimiento);

    const mov = Movimiento.create({
      tipo: dto.tipo,
      categoria: 'Solidaridad',
      descripcion: `[Solidaridad] ${dto.descripcion}`,
      monto,
      fecha,
      socioId: dto.socioId,
    });

    await this.movimientoRepo.save(mov);

    return solidaridadMov;
  }
}
