import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { Notificacion } from '../../domain/entities/Notificacion.js';
import {
  INotificacionRepository,
  NotificacionFilter,
  NotificacionListResult,
} from '../../domain/repositories/INotificacionRepository.js';

interface NotificacionRow {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  urgente: boolean;
  referenciaId: string | null;
  referenciaTipo: string | null;
  createdAt: Date;
}

export class PrismaNotificacionRepository implements INotificacionRepository {
  protected readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  private toDomain(row: NotificacionRow): Notificacion {
    return Notificacion.fromPersistence({
      id: row.id,
      tipo: row.tipo,
      titulo: row.titulo,
      mensaje: row.mensaje,
      leida: row.leida,
      urgente: row.urgente,
      referenciaId: row.referenciaId,
      referenciaTipo: row.referenciaTipo,
      createdAt: row.createdAt,
    });
  }

  async findById(id: string): Promise<Notificacion | null> {
    const row = (await this.prisma.notificacion.findUnique({
      where: { id },
    })) as unknown as NotificacionRow | null;
    if (!row) return null;
    return this.toDomain(row);
  }

  async findAll(filters: NotificacionFilter = {}): Promise<NotificacionListResult> {
    const { leida, tipo, page = 1, limit = 10 } = filters;
    const where: Record<string, unknown> = {};
    if (leida !== undefined) where.leida = leida;
    if (tipo) where.tipo = tipo;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.notificacion.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' } as never,
        skip,
        take: limit,
      }) as unknown as Promise<NotificacionRow[]>,
      this.prisma.notificacion.count({ where: where as never }),
    ]);

    return {
      data: data.map((row) => this.toDomain(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(notificacion: Notificacion): Promise<Notificacion> {
    const row = (await this.prisma.notificacion.create({
      data: {
        id: notificacion.id,
        tipo: notificacion.tipo,
        titulo: notificacion.titulo,
        mensaje: notificacion.mensaje,
        leida: notificacion.leida,
        urgente: notificacion.urgente,
        referenciaId: notificacion.referenciaId,
        referenciaTipo: notificacion.referenciaTipo,
      } as never,
    })) as unknown as NotificacionRow;
    return this.toDomain(row);
  }

  async marcarLeida(id: string): Promise<Notificacion> {
    const row = (await this.prisma.notificacion.update({
      where: { id },
      data: { leida: true } as never,
    })) as unknown as NotificacionRow;
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notificacion.delete({ where: { id } } as never);
  }

  async countNoLeidas(): Promise<number> {
    return await this.prisma.notificacion.count({ where: { leida: false } as never });
  }
}
