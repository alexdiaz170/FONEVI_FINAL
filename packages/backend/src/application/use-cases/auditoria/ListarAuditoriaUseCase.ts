import { getPrismaClient } from '../../../infrastructure/persistence/prismaClient.js';

export interface AuditoriaListResult {
  data: Array<{
    id: string;
    usuarioId: string | null;
    usuarioNombre: string | null;
    accion: string;
    tabla: string | null;
    registroId: string | null;
    detalle: string | null;
    ip: string | null;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListarAuditoriaUseCase {
  async execute(filters: {
    page?: number;
    limit?: number;
    usuarioId?: string;
    tabla?: string;
  }): Promise<AuditoriaListResult> {
    const prisma = getPrismaClient();
    const { page = 1, limit = 10, usuarioId, tabla } = filters;
    const where: Record<string, unknown> = {};
    if (usuarioId) where.usuarioId = usuarioId;
    if (tabla) where.tabla = tabla;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.auditoria.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' } as never,
        skip,
        take: limit,
        include: { usuario: { select: { nombre: true } } },
      }),
      prisma.auditoria.count({ where: where as never }),
    ]);

    return {
      data: (data as unknown as Array<Record<string, unknown>>).map(
        (r: Record<string, unknown>) => ({
          id: r['id'] as string,
          usuarioId: (r['usuarioId'] as string) ?? null,
          usuarioNombre: ((r['usuario'] as Record<string, unknown>)?.['nombre'] as string) ?? null,
          accion: r['accion'] as string,
          tabla: (r['tabla'] as string) ?? null,
          registroId: (r['registroId'] as string) ?? null,
          detalle: (r['detalle'] as string) ?? null,
          ip: (r['ip'] as string) ?? null,
          createdAt: r['createdAt'] as Date,
        }),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
