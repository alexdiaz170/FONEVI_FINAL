import { z } from 'zod';

export const crearNotificacionSchema = z.object({
  tipo: z.string().min(1, 'El tipo es requerido'),
  titulo: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  mensaje: z.string().min(3, 'El mensaje debe tener al menos 3 caracteres'),
  urgente: z.boolean().optional(),
});

export const listarNotificacionesSchema = z.object({
  leida: z.coerce.boolean().optional(),
  tipo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CrearNotificacionDTO = z.infer<typeof crearNotificacionSchema>;
export type ListarNotificacionesDTO = z.infer<typeof listarNotificacionesSchema>;

export const registrarSolidaridadSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso'], { message: 'El tipo debe ser "ingreso" o "egreso"' }),
  descripcion: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  fecha: z.string().optional(),
  beneficiario: z.string().nullable().optional(),
});

export const listarSolidaridadSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type RegistrarSolidaridadDTO = z.infer<typeof registrarSolidaridadSchema>;
export type ListarSolidaridadDTO = z.infer<typeof listarSolidaridadSchema>;
