import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from './prismaClient.js';
import { Usuario } from '../../domain/entities/Usuario.js';
import { Password } from '../../domain/value-objects/Password.js';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.js';
import { Email } from '@fonevi/shared';

interface UsuarioRow {
  id: string;
  nombre: string;
  email: string;
  password: string;
  rol: string;
  estado: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaUsuarioRepository implements IUsuarioRepository {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  private toDomain(row: UsuarioRow): Usuario {
    return Usuario.fromPersistence({
      id: row.id,
      nombre: row.nombre,
      email: Email.create(row.email),
      rol: row.rol as Usuario['rol'],
      estado: row.estado as Usuario['estado'],
      avatar: row.avatar,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<Usuario | null> {
    const row = await this.prisma.usuario.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row as unknown as UsuarioRow);
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const row = await this.prisma.usuario.findUnique({ where: { email } });
    if (!row) return null;
    return this.toDomain(row as unknown as UsuarioRow);
  }

  async findAll(): Promise<Usuario[]> {
    const rows = (await this.prisma.usuario.findMany()) as UsuarioRow[];
    return rows.map((row) => this.toDomain(row));
  }

  async save(usuario: Usuario, password: Password): Promise<Usuario> {
    const row = await this.prisma.usuario.create({
      data: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email.value,
        password: password.hash,
        rol: usuario.rol,
        estado: usuario.estado,
        avatar: usuario.avatar,
      },
    });
    return this.toDomain(row as unknown as UsuarioRow);
  }

  async update(usuario: Usuario): Promise<Usuario> {
    const row = await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        nombre: usuario.nombre,
        email: usuario.email.value,
        rol: usuario.rol,
        estado: usuario.estado,
        avatar: usuario.avatar,
      },
    });
    return this.toDomain(row as unknown as UsuarioRow);
  }

  async updatePassword(id: string, password: Password): Promise<void> {
    await this.prisma.usuario.update({
      where: { id },
      data: { password: password.hash },
    });
  }

  async verifyPassword(id: string, plainPassword: string): Promise<boolean> {
    const row = await this.prisma.usuario.findUnique({ where: { id } });
    if (!row || !row.password) return false;
    const stored = Password.fromHash(row.password);
    return stored.compare(plainPassword);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.usuario.delete({ where: { id } });
  }
}
