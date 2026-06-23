import { Request, Response, NextFunction } from 'express';
import { INotificacionRepository } from '../../domain/repositories/INotificacionRepository.js';
import { CrearNotificacionUseCase } from '../../application/use-cases/notificaciones/CrearNotificacionUseCase.js';
import { EliminarNotificacionUseCase } from '../../application/use-cases/notificaciones/EliminarNotificacionUseCase.js';
import { ListarNotificacionesUseCase } from '../../application/use-cases/notificaciones/ListarNotificacionesUseCase.js';
import { MarcarNotificacionLeidaUseCase } from '../../application/use-cases/notificaciones/MarcarNotificacionLeidaUseCase.js';
import { apiResponse } from '../response.js';
import {
  crearNotificacionSchema,
  listarNotificacionesSchema,
} from '../../application/dto/notificacion-solidaridad.dto.js';
import { ValidationError } from '../../application/errors.js';

export function createNotificacionController(notificacionRepo: INotificacionRepository) {
  const crearUseCase = new CrearNotificacionUseCase(notificacionRepo);
  const eliminarUseCase = new EliminarNotificacionUseCase(notificacionRepo);
  const listarUseCase = new ListarNotificacionesUseCase(notificacionRepo);
  const marcarLeidaUseCase = new MarcarNotificacionLeidaUseCase(notificacionRepo);

  function mapNotificacion(n: {
    id: string;
    tipo: string;
    titulo: string;
    mensaje: string;
    leida: boolean;
    urgente: boolean;
    referenciaId: string | null;
    referenciaTipo: string | null;
    createdAt: Date;
  }) {
    return {
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      mensaje: n.mensaje,
      leida: n.leida,
      urgente: n.urgente,
      referenciaId: n.referenciaId,
      referenciaTipo: n.referenciaTipo,
      createdAt: n.createdAt,
    };
  }

  return {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const query = listarNotificacionesSchema.parse(req.query);
        const result = await listarUseCase.execute(query);
        apiResponse.paginated(
          res,
          result.data.map(mapNotificacion),
          result.total,
          result.page,
          result.limit,
        );
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parsed = crearNotificacionSchema.safeParse(req.body);
        if (!parsed.success)
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        const notificacion = await crearUseCase.execute(parsed.data);
        apiResponse.created(res, mapNotificacion(notificacion));
      } catch (error) {
        next(error);
      }
    },

    async marcarLeida(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        const notificacion = await marcarLeidaUseCase.execute(id);
        apiResponse.success(res, mapNotificacion(notificacion));
      } catch (error) {
        next(error);
      }
    },

    async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        await eliminarUseCase.execute(id);
        apiResponse.success(res, { mensaje: 'Notificación eliminada correctamente' });
      } catch (error) {
        next(error);
      }
    },
  };
}
