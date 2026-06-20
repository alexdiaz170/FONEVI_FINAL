import { Periodo } from '../../../domain/entities/Periodo.js';
import { IPeriodoRepository } from '../../../domain/repositories/IPeriodoRepository.js';
import { DomainError } from '../../../domain/errors.js';

export interface CrearPeriodoDTO {
  nombre: string;
  anio: number;
  mes: number;
}

export class CrearPeriodoUseCase {
  constructor(private readonly periodoRepo: IPeriodoRepository) {}

  async execute(dto: CrearPeriodoDTO): Promise<Periodo> {
    const existente = await this.periodoRepo.findByNombre(dto.nombre);
    if (existente) throw new DomainError(`Ya existe un periodo con el nombre "${dto.nombre}"`);

    const periodo = Periodo.create({ nombre: dto.nombre, anio: dto.anio, mes: dto.mes });
    return this.periodoRepo.save(periodo);
  }
}
