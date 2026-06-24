import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { DomainError } from '../errors.js';

export interface TokenPayload {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  tipo: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class TokenService {
  private readonly secret: string;
  private readonly accessTtl: string;
  private readonly refreshTtl: number;

  constructor() {
    this.secret = config.jwtSecret;
    this.accessTtl = config.jwtExpiresIn;
    this.refreshTtl = config.jwtRefreshTtlMs;
  }

  generateAccessToken(payload: Omit<TokenPayload, 'tipo'>): string {
    return jwt.sign({ ...payload, tipo: 'access' as const }, this.secret, {
      expiresIn: this.accessTtl,
    } as jwt.SignOptions);
  }

  generateRefreshToken(payload: Omit<TokenPayload, 'tipo'>): string {
    return jwt.sign({ ...payload, tipo: 'refresh' as const }, this.secret, {
      expiresIn: config.jwtRefreshExpiresIn,
    } as jwt.SignOptions);
  }

  generateTokenPair(payload: Omit<TokenPayload, 'tipo'>): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret) as TokenPayload;
      return decoded;
    } catch {
      throw new DomainError('Token inválido o expirado', 'INVALID_TOKEN');
    }
  }

  getRefreshTtl(): number {
    return this.refreshTtl;
  }
}
