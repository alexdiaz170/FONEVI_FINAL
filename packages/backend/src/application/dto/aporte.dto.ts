import { z } from 'zod';

export const crearAporteSchema = z.object({
  socioId: z.string().min(1, 'socioId inválido'),
  periodoId: z.number().int().positive('periodoId inválido'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  fechaPago: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  estado: z.enum(['pendiente', 'pagado', 'mora', 'vencido', 'anulado']).default('pagado'),
  tipoOperacion: z.enum(['cuota_normal', 'abono_credito', 'adelanto_cuotas']).optional(),
  metodo: z.string().max(50).optional().nullable(),
  notas: z.string().max(500).optional().nullable(),
});

export const actualizarAporteSchema = z.object({
  monto: z.number().positive('El monto debe ser mayor a 0').optional(),
  fechaPago: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  estado: z.enum(['pendiente', 'pagado', 'mora', 'vencido', 'anulado']).optional(),
  metodo: z.string().max(50).optional().nullable(),
  notas: z.string().max(500).optional().nullable(),
});

export const listarAportesSchema = z.object({
  socioId: z.string().min(1).optional(),
  periodoId: z.coerce.number().int().positive().optional(),
  estado: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type CrearAporteDTO = z.infer<typeof crearAporteSchema>;
export type ActualizarAporteDTO = z.infer<typeof actualizarAporteSchema>;
export type ListarAportesDTO = z.infer<typeof listarAportesSchema>;
