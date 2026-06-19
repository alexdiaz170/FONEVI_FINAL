import { describe, it, expect } from 'vitest';
import { TipoDocumento } from '../../../src/domain/value-objects/TipoDocumento.js';

describe('TipoDocumento', () => {
  it('should create valid tipos', () => {
    expect(TipoDocumento.create('CC').toString()).toBe('CC');
    expect(TipoDocumento.create('CE').toString()).toBe('CE');
    expect(TipoDocumento.create('NIT').toString()).toBe('NIT');
    expect(TipoDocumento.create('PASAPORTE').toString()).toBe('PASAPORTE');
  });

  it('should reject invalid tipo', () => {
    expect(() => TipoDocumento.create('INVALIDO')).toThrow('Tipo de documento inválido');
  });

  it('should normalize case', () => {
    expect(TipoDocumento.create('cc').toString()).toBe('CC');
    expect(TipoDocumento.create('nit').toString()).toBe('NIT');
  });

  it('should compare equality', () => {
    expect(TipoDocumento.CC.equals(TipoDocumento.create('CC'))).toBe(true);
    expect(TipoDocumento.CC.equals(TipoDocumento.CE)).toBe(false);
  });
});
