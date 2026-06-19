import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { Configuracion } from '../../domain/entities/Configuracion.js';
import { IConfiguracionRepository } from '../../domain/repositories/IConfiguracionRepository.js';

export class PrismaConfiguracionRepository implements IConfiguracionRepository {
  protected readonly prisma: PrismaClient;
  constructor() {
    this.prisma = getPrismaClient();
  }

  async findByClave(clave: string) {
    const row = await this.prisma.configuracion.findUnique({ where: { clave } });
    return row
      ? Configuracion.fromPersistence({
          clave: row.clave,
          valor: row.valor,
          updatedAt: row.updatedAt,
        })
      : null;
  }

  async findAll() {
    const rows = await this.prisma.configuracion.findMany();
    return rows.map((r) =>
      Configuracion.fromPersistence({ clave: r.clave, valor: r.valor, updatedAt: r.updatedAt }),
    );
  }

  async save(config: Configuracion) {
    const row = await this.prisma.configuracion.upsert({
      where: { clave: config.clave },
      create: { clave: config.clave, valor: config.valor },
      update: { valor: config.valor },
    });
    return Configuracion.fromPersistence({
      clave: row.clave,
      valor: row.valor,
      updatedAt: row.updatedAt,
    });
  }

  async delete(clave: string) {
    await this.prisma.configuracion.delete({ where: { clave } });
  }
}
