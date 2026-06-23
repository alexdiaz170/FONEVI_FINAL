import {
  IMovimientoRepository,
  MovimientoListResult,
} from '../../../domain/repositories/IMovimientoRepository.js';

export class ListarMovimientosUseCase {
  constructor(private readonly movimientoRepo: IMovimientoRepository) {}

  async execute(filters: {
    tipo?: string;
    categoria?: string;
    desde?: string;
    hasta?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<MovimientoListResult> {
    return await this.movimientoRepo.findAll({
      tipo: filters.tipo,
      categoria: filters.categoria,
      desde: filters.desde ? new Date(filters.desde) : undefined,
      hasta: filters.hasta ? new Date(filters.hasta) : undefined,
      q: filters.q,
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
    });
  }
}
