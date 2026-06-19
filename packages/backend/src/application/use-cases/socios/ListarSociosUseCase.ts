import { Socio } from '../../../domain/entities/Socio.js';
import { ISocioRepository } from '../../../domain/repositories/ISocioRepository.js';

export interface SociosListResult {
  data: Socio[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListarSociosUseCase {
  constructor(private readonly socioRepo: ISocioRepository) {}

  async execute(page: number, limit: number, includeDeleted = false): Promise<SociosListResult> {
    return this.socioRepo.findPaginated(page, limit, includeDeleted);
  }

  async listAll(includeDeleted = false): Promise<Socio[]> {
    return this.socioRepo.findAll(includeDeleted);
  }
}
