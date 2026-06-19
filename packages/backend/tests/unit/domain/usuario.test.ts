import { describe, it, expect } from 'vitest';
import { Usuario } from '../../../src/domain/entities/Usuario.js';
import { Email } from '@fonevi/shared';

describe('Usuario', () => {
  const validProps = {
    nombre: 'Juan Pérez',
    email: Email.create('juan@example.com'),
    rol: 'admin' as const,
  };

  it('should create a valid usuario', () => {
    const usuario = Usuario.create(validProps);
    expect(usuario.nombre).toBe('Juan Pérez');
    expect(usuario.email.value).toBe('juan@example.com');
    expect(usuario.rol).toBe('admin');
    expect(usuario.estado).toBe('activo');
  });

  it('should throw if nombre is too short', () => {
    expect(() => Usuario.create({ ...validProps, nombre: 'A' })).toThrow(
      'El nombre debe tener al menos 2 caracteres',
    );
  });

  it('should throw if rol is invalid', () => {
    expect(() => Usuario.create({ ...validProps, rol: 'invalid' as never })).toThrow(
      'Rol de usuario inválido',
    );
  });

  it('should be active by default', () => {
    const usuario = Usuario.create(validProps);
    expect(usuario.esActivo()).toBe(true);
  });

  it('should deactivate usuario', () => {
    const usuario = Usuario.create(validProps);
    const inactivo = usuario.desactivar();
    expect(inactivo.esActivo()).toBe(false);
    expect(inactivo.estado).toBe('inactivo');
  });

  it('should check admin role', () => {
    const admin = Usuario.create(validProps);
    expect(admin.esAdmin()).toBe(true);

    const socio = Usuario.create({ ...validProps, rol: 'socio' });
    expect(socio.esAdmin()).toBe(false);
  });

  it('should convert to props and back', () => {
    const usuario = Usuario.create(validProps);
    const props = usuario.toProps();
    const restored = Usuario.fromPersistence(props);
    expect(restored.id).toBe(usuario.id);
    expect(restored.nombre).toBe(usuario.nombre);
    expect(restored.email.value).toBe(usuario.email.value);
  });
});
