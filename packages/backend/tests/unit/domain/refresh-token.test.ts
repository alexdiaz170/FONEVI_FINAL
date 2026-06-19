import { describe, it, expect, vi } from 'vitest';
import { RefreshToken } from '../../../src/domain/entities/RefreshToken.js';

describe('RefreshToken', () => {
  it('should create a valid refresh token', () => {
    const token = RefreshToken.create('user-1', 'token-string', 3600000);
    expect(token.usuarioId).toBe('user-1');
    expect(token.token).toBe('token-string');
    expect(token.esValido()).toBe(true);
  });

  it('should be expired after ttl', () => {
    vi.useFakeTimers();
    const token = RefreshToken.create('user-1', 'token-string', 1000);
    expect(token.estaExpirado()).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(token.estaExpirado()).toBe(true);
    expect(token.esValido()).toBe(false);

    vi.useRealTimers();
  });

  it('should revoke token', () => {
    const token = RefreshToken.create('user-1', 'token-string', 3600000);
    expect(token.estaRevocado()).toBe(false);

    const revoked = token.revocar();
    expect(revoked.estaRevocado()).toBe(true);
    expect(revoked.esValido()).toBe(false);
    expect(revoked.revokedAt).toBeInstanceOf(Date);
  });

  it('should require valid inputs', () => {
    expect(() => RefreshToken.create('', 'token', 1000)).toThrow('usuarioId es requerido');
    expect(() => RefreshToken.create('user', '', 1000)).toThrow('token es requerido');
    expect(() => RefreshToken.create('user', 'token', 0)).toThrow('ttlMs debe ser mayor a 0');
  });
});
