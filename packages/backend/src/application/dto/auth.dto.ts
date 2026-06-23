import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const registerSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(200),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['admin', 'socio']).default('socio'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token requerido'),
});

export const cambiarPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});

export type LoginDTO = z.infer<typeof loginSchema>;
export type RegisterDTO = z.infer<typeof registerSchema>;
export type RefreshDTO = z.infer<typeof refreshSchema>;
export type CambiarPasswordDTO = z.infer<typeof cambiarPasswordSchema>;
