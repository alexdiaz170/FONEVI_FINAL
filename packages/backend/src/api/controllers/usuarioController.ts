import { Request, Response, NextFunction } from 'express';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.js';
import { Password } from '../../domain/value-objects/Password.js';
import { RegistrarUsuarioUseCase } from '../../application/use-cases/auth/RegistrarUsuarioUseCase.js';
import { apiResponse } from '../response.js';
import { z } from 'zod';
import { ValidationError } from '../../application/errors.js';

export const crearUsuarioSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(200),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['admin', 'socio', 'superadmin', 'contador']),
});

const actualizarUsuarioSchema = z.object({
  nombre: z.string().min(2).max(200).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres').optional(),
  rol: z.enum(['admin', 'socio', 'superadmin', 'contador']).optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
});

export function createUsuarioController(usuarioRepo: IUsuarioRepository) {
  const registerUseCase = new RegistrarUsuarioUseCase(usuarioRepo);

  return {
    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const usuarios = await usuarioRepo.findAll();
        apiResponse.success(
          res,
          usuarios.map((u) => ({
            id: u.id,
            nombre: u.nombre,
            email: u.email.value,
            rol: u.rol,
            estado: u.estado,
            createdAt: u.createdAt,
          })),
        );
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const { nombre, email, password, rol } = req.body;
        const usuario = await registerUseCase.execute({ nombre, email, password, rol });
        apiResponse.created(res, {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email.value,
          rol: usuario.rol,
          estado: usuario.estado,
          createdAt: usuario.createdAt,
        });
      } catch (error) {
        next(error);
      }
    },

    async update(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        const parsed = actualizarUsuarioSchema.safeParse(req.body);
        if (!parsed.success)
          throw new ValidationError('Datos inválidos', parsed.error.flatten().fieldErrors);

        const existing = await usuarioRepo.findById(id);
        if (!existing) {
          apiResponse.error(res, 404, 'Usuario no encontrado', 'NOT_FOUND');
          return;
        }

        const { nombre, email, password, rol, estado } = parsed.data;
        const updated = existing
          .cambiarNombre(nombre ?? existing.nombre)
          .cambiarEmail(email ?? existing.email.value)
          .cambiarRol(rol ?? existing.rol);

        const final = estado ? (estado === 'inactivo' ? updated.desactivar() : updated) : updated;
        const saved = await usuarioRepo.update(final);

        if (password) {
          const pwd = Password.fromPlain(password);
          await usuarioRepo.updatePassword(id, pwd);
        }

        apiResponse.success(res, {
          id: saved.id,
          nombre: saved.nombre,
          email: saved.email.value,
          rol: saved.rol,
          estado: saved.estado,
          createdAt: saved.createdAt,
        });
      } catch (error) {
        next(error);
      }
    },

    async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const id = String(req.params.id ?? '');
        await usuarioRepo.delete(id);
        apiResponse.success(res, { mensaje: 'Usuario eliminado correctamente' });
      } catch (error) {
        next(error);
      }
    },
  };
}
