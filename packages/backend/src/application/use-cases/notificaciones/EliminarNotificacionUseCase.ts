import { INotificacionRepository } from '../../../domain/repositories/INotificacionRepository.js';

export class EliminarNotificacionUseCase {
  constructor(private readonly notificacionRepo: INotificacionRepository) {}

  async execute(id: string): Promise<void> {
    const notificacion = await this.notificacionRepo.findById(id);
    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }
    await this.notificacionRepo.delete(id);
  }
}
