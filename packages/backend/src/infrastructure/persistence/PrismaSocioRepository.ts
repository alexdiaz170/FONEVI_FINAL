import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { Socio } from '../../domain/entities/Socio.js';
import { TipoDocumento } from '../../domain/value-objects/TipoDocumento.js';
import { EstadoSocio } from '../../domain/value-objects/EstadoSocio.js';
import { ISocioRepository } from '../../domain/repositories/ISocioRepository.js';
import { Email, Monto, Telefono } from '@fonevi/shared';

interface SocioRow {
  id: string;
  codigo: string;
  codigo_socio: string | null;
  nombre: string;
  documento: string;
  email: string | null;
  telefono: string | null;
  fechaIngreso: Date;
  aporteMensual: number;
  ahorroAcumulado: number;
  estado: string;
  cargo: string | null;
  sede: string | null;
  departamento: string | null;
  municipio: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  password: string | null;
  accesoActivo: boolean;
  ultimoLogin: Date | null;
}

export class PrismaSocioRepository implements ISocioRepository {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  private parseDocumento(doc: string): { tipo: string; numero: string } {
    const idx = doc.indexOf('-');
    if (idx > 0) {
      return { tipo: doc.substring(0, idx), numero: doc.substring(idx + 1) };
    }
    return { tipo: 'CC', numero: doc };
  }

  private toDomain(row: SocioRow): Socio {
    const { tipo, numero } = this.parseDocumento(row.documento);
    return Socio.fromPersistence({
      id: row.id,
      codigo: row.codigo,
      codigoSocio: row.codigo_socio ?? undefined,
      nombre: row.nombre,
      tipoDocumento: TipoDocumento.create(tipo),
      numeroDocumento: numero,
      email: row.email ? Email.create(row.email) : null,
      telefono: row.telefono ? Telefono.create(row.telefono) : null,
      fechaIngreso: row.fechaIngreso,
      aporteMensual: Monto.create(Number(row.aporteMensual ?? 0) || 0),
      ahorroAcumulado: Monto.create(Number(row.ahorroAcumulado ?? 0) || 0),
      estado: EstadoSocio.create(row.estado),
      cargo: row.cargo,
      sede: row.sede,
      departamento: row.departamento,
      municipio: row.municipio,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toPrisma(socio: Socio) {
    return {
      id: socio.id,
      codigo: socio.codigo,
      codigo_socio: socio.codigoSocio,
      nombre: socio.nombre,
      documento: `${socio.tipoDocumento}-${socio.numeroDocumento}`,
      email: socio.email?.value ?? null,
      telefono: socio.telefono?.toString() ?? null,
      fechaIngreso: socio.fechaIngreso,
      aporteMensual: socio.aporteMensual.value,
      ahorroAcumulado: socio.ahorroAcumulado.value,
      estado: socio.estado.toString(),
      cargo: socio.cargo,
      sede: socio.sede,
      departamento: socio.departamento,
      municipio: socio.municipio,
      deletedAt: socio.deletedAt,
    };
  }

  async findById(id: string): Promise<Socio | null> {
    const row = (await this.prisma.socio.findUnique({
      where: { id },
    })) as unknown as SocioRow | null;
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByIdOrCodigo(idOrCodigo: string): Promise<Socio | null> {
    const row = (await this.prisma.socio.findFirst({
      where: {
        OR: [{ id: idOrCodigo }, { codigo: idOrCodigo }, { codigo_socio: idOrCodigo }],
      },
    })) as unknown as SocioRow | null;
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByDocumento(documento: string): Promise<Socio | null> {
    const row = (await this.prisma.socio.findFirst({
      where: { documento },
    })) as unknown as SocioRow | null;
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByEmail(email: string): Promise<Socio | null> {
    const row = (await this.prisma.socio.findFirst({
      where: { email },
    })) as unknown as SocioRow | null;
    if (!row) return null;
    return this.toDomain(row);
  }

  async findAll(includeDeleted = false): Promise<Socio[]> {
    const where = includeDeleted ? {} : { deletedAt: null };
    const rows = (await this.prisma.socio.findMany({
      where: where as never,
    })) as unknown as SocioRow[];
    return rows.map((row) => this.toDomain(row));
  }

  async findPaginated(page: number, limit: number, includeDeleted = false) {
    const where = includeDeleted ? {} : { deletedAt: null };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.socio.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
      }) as unknown as Promise<SocioRow[]>,
      this.prisma.socio.count({ where: where as never }),
    ]);

    return {
      data: data.map((row) => this.toDomain(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async save(socio: Socio): Promise<Socio> {
    const data = this.toPrisma(socio);
    const row = (await this.prisma.socio.create({
      data: {
        ...data,
        password: null,
        accesoActivo: true,
        ultimoLogin: null,
      } as never,
    })) as unknown as SocioRow;
    return this.toDomain(row);
  }

  async update(socio: Socio): Promise<Socio> {
    const data = this.toPrisma(socio);
    const row = (await this.prisma.socio.update({
      where: { id: socio.id },
      data,
    })) as unknown as SocioRow;
    return this.toDomain(row);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.socio.update({
      where: { id },
      data: { deletedAt: new Date(), estado: 'retirado' },
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.prisma.socio.delete({ where: { id } });
  }

  async count(includeDeleted = false): Promise<number> {
    const where = includeDeleted ? {} : { deleted_at: null };
    return this.prisma.socio.count({ where: where as never });
  }

  async obtenerMaximoSufijo(): Promise<number> {
    const rows = (await this.prisma.socio.findMany({
      where: { codigo_socio: { startsWith: 'SOC-' } },
      orderBy: { codigo_socio: 'desc' },
      take: 1,
      select: { codigo_socio: true },
    })) as unknown as { codigo_socio: string | null }[];

    if (rows.length === 0 || !rows[0]?.codigo_socio) return 0;

    const match = rows[0].codigo_socio.match(/SOC-(\d{4})/);
    return match ? parseInt(match[1]!, 10) : 0;
  }
}
