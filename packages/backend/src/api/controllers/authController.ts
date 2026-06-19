import { Request, Response, NextFunction } from 'express';
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase.js';
import { RegistrarUsuarioUseCase } from '../../application/use-cases/auth/RegistrarUsuarioUseCase.js';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase.js';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.js';
import { TokenService } from '../../domain/services/TokenService.js';
import { apiResponse } from '../response.js';
import { loginSchema, registerSchema, refreshSchema } from '../../application/dto/auth.dto.js';
import { ValidationError } from '../../application/errors.js';

export function createAuthController(usuarioRepo: IUsuarioRepository) {
  const tokenService = new TokenService();
  const loginUseCase = new LoginUseCase(usuarioRepo, tokenService);
  const registerUseCase = new RegistrarUsuarioUseCase(usuarioRepo);
  const refreshUseCase = new RefreshTokenUseCase(usuarioRepo, tokenService);

  return {
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        }

        const { email, password } = parsed.data;
        const result = await loginUseCase.execute(email, password);

        apiResponse.success(res, {
          token: result.accessToken,
          refreshToken: result.refreshToken,
          usuario: {
            id: result.usuario.id,
            nombre: result.usuario.nombre,
            email: result.usuario.email.value,
            rol: result.usuario.rol,
          },
        });
      } catch (error) {
        next(error);
      }
    },

    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        }

        const usuario = await registerUseCase.execute(parsed.data);

        apiResponse.created(res, {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email.value,
          rol: usuario.rol,
        });
      } catch (error) {
        next(error);
      }
    },

    async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parsed = refreshSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);
        }

        const tokens = await refreshUseCase.execute(parsed.data.refreshToken);

        apiResponse.success(res, {
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      } catch (error) {
        next(error);
      }
    },

    async profile(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        if (!req.usuario) {
          throw new ValidationError('No autenticado');
        }

        const usuario = await usuarioRepo.findById(req.usuario.id);
        if (!usuario) {
          apiResponse.error(res, 404, 'Usuario no encontrado', 'USER_NOT_FOUND');
          return;
        }

        apiResponse.success(res, {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email.value,
          rol: usuario.rol,
          estado: usuario.estado,
          avatar: usuario.avatar,
        });
      } catch (error) {
        next(error);
      }
    },
  };
}
