import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import {
  IWaLogRepository,
  WaLogEntry,
  WaLogFilter,
  WaLogListResult,
} from '../../domain/repositories/IWaLogRepository.js';

export class PrismaWaLogRepository implements IWaLogRepository {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async create(data: {
    numero: string;
    template: string;
    estado: string;
    messageId?: string | null;
    enviadoEn?: Date;
  }): Promise<WaLogEntry> {
    return (await this.prisma.waLog.create({
      data: {
        numero: data.numero,
        template: data.template,
        estado: data.estado,
        messageId: data.messageId ?? null,
        enviadoEn: data.enviadoEn ?? new Date(),
      },
    })) as unknown as WaLogEntry;
  }

  async findAll(filters: WaLogFilter = {}): Promise<WaLogListResult> {
    const { estado, numero, page = 1, limit = 10 } = filters;
    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (numero) where.numero = { contains: numero } as never;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.waLog.findMany({
        where: where as never,
        orderBy: { enviadoEn: 'desc' } as never,
        skip,
        take: limit,
      }) as unknown as Promise<WaLogEntry[]>,
      this.prisma.waLog.count({ where: where as never }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
