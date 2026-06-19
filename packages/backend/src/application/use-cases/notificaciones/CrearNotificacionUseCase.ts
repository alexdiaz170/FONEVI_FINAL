import { Notificacion } from '../../../domain/entities/Notificacion.js';
import { INotificacionRepository } from '../../../domain/repositories/INotificacionRepository.js';

export class CrearNotificacionUseCase {
  constructor(private readonly notificacionRepo: INotificacionRepository) {}

  async execute(dto: {
    tipo: string;
    titulo: string;
    mensaje: string;
    urgente?: boolean;
  }): Promise<Notificacion> {
    const notificacion = Notificacion.create({
      tipo: dto.tipo,
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      urgente: dto.urgente ?? false,
    });
    return await this.notificacionRepo.save(notificacion);
  }
}
