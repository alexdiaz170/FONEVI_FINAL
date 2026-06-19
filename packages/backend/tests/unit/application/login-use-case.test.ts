import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUseCase } from '../../../src/application/use-cases/auth/LoginUseCase.js';
import { IUsuarioRepository } from '../../../src/domain/repositories/IUsuarioRepository.js';
import { TokenService } from '../../../src/domain/services/TokenService.js';
import { Usuario } from '../../../src/domain/entities/Usuario.js';
import { Email } from '@fonevi/shared';

describe('LoginUseCase', () => {
  const mockUsuario = Usuario.create({
    nombre: 'Juan',
    email: Email.create('juan@example.com'),
    rol: 'socio',
  });

  let mockRepo: IUsuarioRepository;
  let tokenService: TokenService;
  let loginUseCase: LoginUseCase;

  beforeEach(() => {
    mockRepo = {
      findByEmail: vi.fn().mockResolvedValue(mockUsuario),
      findById: vi.fn().mockResolvedValue(mockUsuario),
      verifyPassword: vi.fn().mockResolvedValue(true),
      findAll: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      updatePassword: vi.fn(),
      delete: vi.fn(),
    };

    tokenService = new TokenService();
    loginUseCase = new LoginUseCase(mockRepo, tokenService);
  });

  it('should login successfully with valid credentials', async () => {
    const result = await loginUseCase.execute('juan@example.com', 'password123');

    expect(result.usuario.nombre).toBe('Juan');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(mockRepo.findByEmail).toHaveBeenCalledWith('juan@example.com');
    expect(mockRepo.verifyPassword).toHaveBeenCalledWith(mockUsuario.id, 'password123');
  });

  it('should throw for non-existent email', async () => {
    vi.mocked(mockRepo.findByEmail).mockResolvedValue(null);

    await expect(loginUseCase.execute('noexiste@example.com', 'password123')).rejects.toThrow(
      'Credenciales incorrectas',
    );
  });

  it('should throw for inactive user', async () => {
    const inactiveUser = Usuario.create({
      nombre: 'Inactivo',
      email: Email.create('inactivo@example.com'),
      rol: 'socio',
    }).desactivar();

    vi.mocked(mockRepo.findByEmail).mockResolvedValue(inactiveUser);

    await expect(loginUseCase.execute('inactivo@example.com', 'password123')).rejects.toThrow(
      'Usuario inactivo',
    );
  });

  it('should throw for wrong password', async () => {
    vi.mocked(mockRepo.verifyPassword).mockResolvedValue(false);

    await expect(loginUseCase.execute('juan@example.com', 'wrongpassword')).rejects.toThrow(
      'Credenciales incorrectas',
    );
  });

  it('should throw for invalid email format', async () => {
    await expect(loginUseCase.execute('email-invalido', 'password123')).rejects.toThrow(
      'Email inválido',
    );
  });
});
