import { Notificacion } from '../../../domain/entities/Notificacion.js';
import { INotificacionRepository } from '../../../domain/repositories/INotificacionRepository.js';
import { EntityNotFoundError } from '../../../domain/errors.js';

export class MarcarNotificacionLeidaUseCase {
  constructor(private readonly notificacionRepo: INotificacionRepository) {}

  async execute(id: string): Promise<Notificacion> {
    const existente = await this.notificacionRepo.findById(id);
    if (!existente) throw new EntityNotFoundError('Notificacion', id);
    return await this.notificacionRepo.marcarLeida(id);
  }
}
