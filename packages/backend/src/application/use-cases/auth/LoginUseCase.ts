import { Email } from '@fonevi/shared';
import { Usuario } from '../../../domain/entities/Usuario.js';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository.js';
import { TokenService } from '../../../domain/services/TokenService.js';
import { DomainError } from '../../../domain/errors.js';

export interface LoginResult {
  usuario: Usuario;
  accessToken: string;
  refreshToken: string;
}

export class LoginUseCase {
  constructor(
    private readonly usuarioRepo: IUsuarioRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(emailStr: string, password: string): Promise<LoginResult> {
    const email = Email.create(emailStr);

    const usuario = await this.usuarioRepo.findByEmail(email.value);

    if (!usuario) {
      throw new DomainError('Credenciales incorrectas', 'INVALID_CREDENTIALS');
    }

    if (!usuario.esActivo()) {
      throw new DomainError('Usuario inactivo', 'USER_INACTIVE');
    }

    const passwordValid = await this.usuarioRepo.verifyPassword(usuario.id, password);
    if (!passwordValid) {
      throw new DomainError('Credenciales incorrectas', 'INVALID_CREDENTIALS');
    }

    const payload = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email.value,
      rol: usuario.rol,
    };

    const tokens = this.tokenService.generateTokenPair(payload);

    return {
      usuario,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
