import {
  INotificacionRepository,
  NotificacionListResult,
} from '../../../domain/repositories/INotificacionRepository.js';

export class ListarNotificacionesUseCase {
  constructor(private readonly notificacionRepo: INotificacionRepository) {}

  async execute(filters: {
    leida?: boolean;
    tipo?: string;
    page?: number;
    limit?: number;
  }): Promise<NotificacionListResult> {
    return await this.notificacionRepo.findAll(filters);
  }
}
