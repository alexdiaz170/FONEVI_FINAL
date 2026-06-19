import bcrypt from 'bcryptjs';
import { ValueObjectError } from '../errors.js';

const BCRYPT_ROUNDS = 12;

export class Password {
  private constructor(readonly hash: string) {
    if (!hash || hash.length < 20) {
      throw new ValueObjectError('Hash de contraseña inválido');
    }
  }

  static fromPlain(plainText: string): Password {
    if (!plainText || plainText.length < 6) {
      throw new ValueObjectError('La contraseña debe tener al menos 6 caracteres');
    }
    const hash = bcrypt.hashSync(plainText, BCRYPT_ROUNDS);
    return new Password(hash);
  }

  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  compare(plainText: string): boolean {
    return bcrypt.compareSync(plainText, this.hash);
  }
}
