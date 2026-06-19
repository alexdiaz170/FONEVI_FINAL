import { describe, it, expect } from 'vitest';
import { EstadoSocio } from '../../../src/domain/value-objects/EstadoSocio.js';

describe('EstadoSocio', () => {
  it('should create valid estados', () => {
    expect(EstadoSocio.create('activo').toString()).toBe('activo');
    expect(EstadoSocio.create('mora').toString()).toBe('mora');
    expect(EstadoSocio.create('retirado').toString()).toBe('retirado');
    expect(EstadoSocio.create('suspendido').toString()).toBe('suspendido');
  });

  it('should reject invalid estado', () => {
    expect(() => EstadoSocio.create('invalido')).toThrow('Estado de socio inválido');
  });

  it('should normalize case', () => {
    expect(EstadoSocio.create('ACTIVO').toString()).toBe('activo');
    expect(EstadoSocio.create('Mora').toString()).toBe('mora');
  });

  it('should check credit eligibility', () => {
    expect(EstadoSocio.ACTIVO.puedeSolicitarCredito()).toBe(true);
    expect(EstadoSocio.MORA.puedeSolicitarCredito()).toBe(false);
    expect(EstadoSocio.RETIRADO.puedeSolicitarCredito()).toBe(false);
    expect(EstadoSocio.SUSPENDIDO.puedeSolicitarCredito()).toBe(false);
  });

  it('should check active state', () => {
    expect(EstadoSocio.ACTIVO.esActivo()).toBe(true);
    expect(EstadoSocio.MORA.esActivo()).toBe(false);
  });

  it('should compare equality', () => {
    expect(EstadoSocio.ACTIVO.equals(EstadoSocio.create('activo'))).toBe(true);
    expect(EstadoSocio.ACTIVO.equals(EstadoSocio.MORA)).toBe(false);
  });
});
