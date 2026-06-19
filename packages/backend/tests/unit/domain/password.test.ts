import { describe, it, expect } from 'vitest';
import { Password } from '../../../src/domain/value-objects/Password.js';

describe('Password', () => {
  it('should create from plain text and verify', () => {
    const password = Password.fromPlain('MiPassword123');
    expect(password.hash).toBeDefined();
    expect(password.hash.length).toBeGreaterThan(20);
    expect(password.compare('MiPassword123')).toBe(true);
  });

  it('should reject short password', () => {
    expect(() => Password.fromPlain('12345')).toThrow(
      'La contraseña debe tener al menos 6 caracteres',
    );
  });

  it('should reject empty password', () => {
    expect(() => Password.fromPlain('')).toThrow('La contraseña debe tener al menos 6 caracteres');
  });

  it('should create from existing hash and compare', () => {
    const original = Password.fromPlain('TestPass123');
    const fromHash = Password.fromHash(original.hash);
    expect(fromHash.compare('TestPass123')).toBe(true);
    expect(fromHash.compare('WrongPass')).toBe(false);
  });

  it('should reject invalid hash', () => {
    expect(() => Password.fromHash('')).toThrow('Hash de contraseña inválido');
    expect(() => Password.fromHash('short')).toThrow('Hash de contraseña inválido');
  });
});
