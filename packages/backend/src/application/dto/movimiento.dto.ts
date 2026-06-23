import { z } from 'zod';

export const registrarMovimientoSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso'], { message: 'El tipo debe ser "ingreso" o "egreso"' }),
  categoria: z.string().min(2, 'La categoría debe tener al menos 2 caracteres'),
  descripcion: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  fecha: z.string().optional(),
  socioId: z.string().optional(),
});

export const listarMovimientosSchema = z.object({
  tipo: z.enum(['ingreso', 'egreso']).optional(),
  categoria: z.string().optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type RegistrarMovimientoDTO = z.infer<typeof registrarMovimientoSchema>;
export type ListarMovimientosDTO = z.infer<typeof listarMovimientosSchema>;
