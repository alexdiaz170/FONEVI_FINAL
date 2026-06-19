import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegistrarUsuarioUseCase } from '../../../src/application/use-cases/auth/RegistrarUsuarioUseCase.js';
import { IUsuarioRepository } from '../../../src/domain/repositories/IUsuarioRepository.js';
import { Usuario } from '../../../src/domain/entities/Usuario.js';
import { Email } from '@fonevi/shared';

describe('RegistrarUsuarioUseCase', () => {
  let mockRepo: IUsuarioRepository;
  let registerUseCase: RegistrarUsuarioUseCase;

  const validDto = {
    nombre: 'Nuevo Usuario',
    email: 'nuevo@example.com',
    password: 'Password123',
    rol: 'socio' as const,
  };

  beforeEach(() => {
    mockRepo = {
      findByEmail: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockImplementation(async (usuario: Usuario) => usuario),
      update: vi.fn(),
      updatePassword: vi.fn(),
      verifyPassword: vi.fn(),
      delete: vi.fn(),
    };

    registerUseCase = new RegistrarUsuarioUseCase(mockRepo);
  });

  it('should register a new user successfully', async () => {
    const usuario = await registerUseCase.execute(validDto);

    expect(usuario.nombre).toBe('Nuevo Usuario');
    expect(usuario.email.value).toBe('nuevo@example.com');
    expect(usuario.rol).toBe('socio');
    expect(usuario.estado).toBe('activo');
    expect(mockRepo.save).toHaveBeenCalledOnce();
  });

  it('should throw if email already exists', async () => {
    const existingUser = Usuario.create({
      nombre: 'Existente',
      email: Email.create('nuevo@example.com'),
      rol: 'socio',
    });

    vi.mocked(mockRepo.findByEmail).mockResolvedValue(existingUser);

    await expect(registerUseCase.execute(validDto)).rejects.toThrow(
      'Ya existe un usuario con email: nuevo@example.com',
    );
  });

  it('should throw for invalid email', async () => {
    await expect(registerUseCase.execute({ ...validDto, email: 'no-email' })).rejects.toThrow(
      'Email inválido',
    );
  });

  it('should throw for short password', async () => {
    await expect(registerUseCase.execute({ ...validDto, password: '12345' })).rejects.toThrow(
      'La contraseña debe tener al menos 6 caracteres',
    );
  });

  it('should throw for short name', async () => {
    await expect(registerUseCase.execute({ ...validDto, nombre: 'A' })).rejects.toThrow(
      'El nombre debe tener al menos 2 caracteres',
    );
  });
});
