import { Email } from '@fonevi/shared';
import { Usuario, UsuarioRol } from '../../../domain/entities/Usuario.js';
import { Password } from '../../../domain/value-objects/Password.js';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository.js';
import { DomainError } from '../../../domain/errors.js';

export interface RegistrarUsuarioDTO {
  nombre: string;
  email: string;
  password: string;
  rol: UsuarioRol;
}

export class RegistrarUsuarioUseCase {
  constructor(private readonly usuarioRepo: IUsuarioRepository) {}

  async execute(dto: RegistrarUsuarioDTO): Promise<Usuario> {
    const email = Email.create(dto.email);

    const existente = await this.usuarioRepo.findByEmail(email.value);
    if (existente) {
      throw new DomainError(
        `Ya existe un usuario con email: ${email.value}`,
        'EMAIL_ALREADY_EXISTS',
      );
    }

    const password = Password.fromPlain(dto.password);

    const usuario = Usuario.create({
      nombre: dto.nombre,
      email,
      rol: dto.rol,
    });

    const saved = await this.usuarioRepo.save(usuario, password);
    return saved;
  }
}
