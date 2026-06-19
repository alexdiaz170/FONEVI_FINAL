import { DomainError } from '../errors.js';

export class RefreshToken {
  readonly id: string;
  readonly usuarioId: string;
  readonly token: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly revokedAt: Date | null;

  private constructor(props: {
    id?: string;
    usuarioId: string;
    token: string;
    expiresAt: Date;
    createdAt?: Date;
    revokedAt?: Date | null;
  }) {
    this.id = props.id ?? crypto.randomUUID();
    this.usuarioId = props.usuarioId;
    this.token = props.token;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt ?? new Date();
    this.revokedAt = props.revokedAt ?? null;
  }

  static create(usuarioId: string, token: string, ttlMs: number): RefreshToken {
    if (!usuarioId) throw new DomainError('usuarioId es requerido');
    if (!token) throw new DomainError('token es requerido');
    if (ttlMs <= 0) throw new DomainError('ttlMs debe ser mayor a 0');

    return new RefreshToken({
      usuarioId,
      token,
      expiresAt: new Date(Date.now() + ttlMs),
    });
  }

  static fromPersistence(data: {
    id: string;
    usuarioId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    revokedAt: Date | null;
  }): RefreshToken {
    return new RefreshToken(data);
  }

  estaExpirado(): boolean {
    return Date.now() > this.expiresAt.getTime();
  }

  estaRevocado(): boolean {
    return this.revokedAt !== null;
  }

  esValido(): boolean {
    return !this.estaExpirado() && !this.estaRevocado();
  }

  revocar(): RefreshToken {
    return new RefreshToken({
      ...this,
      revokedAt: new Date(),
    });
  }
}
