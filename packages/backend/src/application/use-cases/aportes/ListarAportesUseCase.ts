import { Aporte } from '../../../domain/entities/Aporte.js';
import {
  IAporteRepository,
  AporteFilter,
  AporteListResult,
} from '../../../domain/repositories/IAporteRepository.js';

export class ListarAportesUseCase {
  constructor(private readonly aporteRepo: IAporteRepository) {}

  async execute(filters: AporteFilter): Promise<AporteListResult> {
    return this.aporteRepo.findAll(filters);
  }
}
