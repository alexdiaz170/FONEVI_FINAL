import { describe, it, expect } from 'vitest';
import { Socio } from '../../../src/domain/entities/Socio.js';
import { TipoDocumento } from '../../../src/domain/value-objects/TipoDocumento.js';
import { EstadoSocio } from '../../../src/domain/value-objects/EstadoSocio.js';
import { Monto, Email } from '@fonevi/shared';

describe('Socio', () => {
  const validProps = {
    codigo: 'S001',
    nombre: 'Juan Pérez',
    tipoDocumento: TipoDocumento.CC,
    numeroDocumento: '1234567890',
    email: Email.create('juan@example.com'),
    fechaIngreso: new Date('2024-01-01'),
    aporteMensual: Monto.create(50000),
    estado: EstadoSocio.ACTIVO,
  };

  it('should create a valid socio', () => {
    const socio = Socio.create(validProps);
    expect(socio.nombre).toBe('Juan Pérez');
    expect(socio.codigo).toBe('S001');
    expect(socio.estado.toString()).toBe('activo');
    expect(socio.esActivo()).toBe(true);
  });

  it('should throw if nombre is too short', () => {
    expect(() => Socio.create({ ...validProps, nombre: 'A' })).toThrow(
      'El nombre debe tener al menos 2 caracteres',
    );
  });

  it('should throw if codigo is empty', () => {
    expect(() => Socio.create({ ...validProps, codigo: '' })).toThrow(
      'El código del socio es requerido',
    );
  });

  it('should allow credit request when active', () => {
    const socio = Socio.create(validProps);
    expect(socio.puedeSolicitarCredito()).toBe(true);
  });

  it('should deny credit request when in mora', () => {
    const socio = Socio.create({ ...validProps, estado: EstadoSocio.MORA });
    expect(socio.puedeSolicitarCredito()).toBe(false);
  });

  it('should soft delete socio', () => {
    const socio = Socio.create(validProps);
    expect(socio.estaEliminado()).toBe(false);

    const eliminado = socio.eliminar();
    expect(eliminado.estaEliminado()).toBe(true);
    expect(eliminado.estado.toString()).toBe('retirado');
    expect(eliminado.esActivo()).toBe(false);
  });

  it('should change estado', () => {
    const socio = Socio.create(validProps);
    const enMora = socio.actualizarEstado(EstadoSocio.MORA);
    expect(enMora.estado.toString()).toBe('mora');
    expect(enMora.puedeSolicitarCredito()).toBe(false);
  });

  it('should update partial data', () => {
    const socio = Socio.create(validProps);
    const actualizado = socio.actualizarDatos({ nombre: 'Juan Actualizado', cargo: 'Presidente' });
    expect(actualizado.nombre).toBe('Juan Actualizado');
    expect(actualizado.cargo).toBe('Presidente');
    expect(actualizado.codigo).toBe('S001');
  });

  it('should serialize to props and back', () => {
    const socio = Socio.create(validProps);
    const props = socio.toProps();
    const restored = Socio.fromPersistence(props);
    expect(restored.id).toBe(socio.id);
    expect(restored.nombre).toBe(socio.nombre);
    expect(restored.codigo).toBe(socio.codigo);
  });
});
