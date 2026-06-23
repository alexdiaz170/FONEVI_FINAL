import { Notificacion } from '../../../domain/entities/Notificacion.js';
import { INotificacionRepository } from '../../../domain/repositories/INotificacionRepository.js';

export class CrearNotificacionUseCase {
  constructor(private readonly notificacionRepo: INotificacionRepository) {}

  async execute(dto: {
    tipo: string;
    titulo: string;
    mensaje: string;
    urgente?: boolean;
    referenciaId?: string;
    referenciaTipo?: string;
  }): Promise<Notificacion> {
    const notificacion = Notificacion.create({
      tipo: dto.tipo,
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      urgente: dto.urgente ?? false,
      referenciaId: dto.referenciaId ?? null,
      referenciaTipo: dto.referenciaTipo ?? null,
    });
    return await this.notificacionRepo.save(notificacion);
  }
}
