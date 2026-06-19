import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class BaseRepository<TEntity, TCreate = unknown, TUpdate = unknown> {
  protected readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  protected abstract get model(): {
    findUnique(args: { where: { id: string } }): Promise<TEntity | null>;
    findFirst(args: { where: Partial<TEntity> }): Promise<TEntity | null>;
    findMany(args: {
      where?: Partial<TEntity>;
      orderBy?: unknown;
      include?: unknown;
      skip?: number;
      take?: number;
    }): Promise<TEntity[]>;
    create(args: { data: TCreate }): Promise<TEntity>;
    update(args: { where: { id: string }; data: TUpdate }): Promise<TEntity>;
    delete(args: { where: { id: string } }): Promise<TEntity>;
    count(args: { where?: Partial<TEntity> }): Promise<number>;
  };

  async findById(id: string): Promise<TEntity | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findFirst(where: Partial<TEntity>): Promise<TEntity | null> {
    return this.model.findFirst({ where });
  }

  async findAll(options?: {
    where?: Partial<TEntity>;
    orderBy?: unknown;
    include?: unknown;
  }): Promise<TEntity[]> {
    return this.model.findMany(options ?? {});
  }

  async findPaginated(options: {
    page: number;
    limit: number;
    where?: Partial<TEntity>;
    orderBy?: unknown;
    include?: unknown;
  }): Promise<PaginatedResult<TEntity>> {
    const { page, limit, where, orderBy, include } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.findMany({ where, orderBy, include, skip, take: limit }),
      this.model.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: TCreate): Promise<TEntity> {
    return this.model.create({ data });
  }

  async update(id: string, data: TUpdate): Promise<TEntity> {
    return this.model.update({ where: { id }, data });
  }

  async delete(id: string): Promise<TEntity> {
    return this.model.delete({ where: { id } });
  }

  async count(where?: Partial<TEntity>): Promise<number> {
    return this.model.count({ where });
  }
}
