import { Usuario } from '../entities/Usuario.js';
import { Password } from '../value-objects/Password.js';

export interface IUsuarioRepository {
  findById(id: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<Usuario | null>;
  findAll(): Promise<Usuario[]>;
  save(usuario: Usuario, password: Password): Promise<Usuario>;
  update(usuario: Usuario): Promise<Usuario>;
  updatePassword(id: string, password: Password): Promise<void>;
  verifyPassword(id: string, plainPassword: string): Promise<boolean>;
  delete(id: string): Promise<void>;
}
