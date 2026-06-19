import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository.js';
import { TokenService, TokenPair } from '../../../domain/services/TokenService.js';
import { DomainError } from '../../../domain/errors.js';

export class RefreshTokenUseCase {
  constructor(
    private readonly usuarioRepo: IUsuarioRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(refreshTokenStr: string): Promise<TokenPair> {
    const payload = this.tokenService.verifyToken(refreshTokenStr);

    if (payload.tipo !== 'refresh') {
      throw new DomainError('Token inválido para renovación', 'INVALID_TOKEN');
    }

    const usuario = await this.usuarioRepo.findById(payload.id);
    if (!usuario) {
      throw new DomainError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    if (!usuario.esActivo()) {
      throw new DomainError('Usuario inactivo', 'USER_INACTIVE');
    }

    const newPayload = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email.value,
      rol: usuario.rol,
    };

    return this.tokenService.generateTokenPair(newPayload);
  }
}
