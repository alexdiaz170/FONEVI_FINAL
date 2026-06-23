import { z } from 'zod';

export const solicitarCreditoSchema = z.object({
  socioId: z.string().min(1, 'socioId es requerido'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  tasaMensual: z
    .number()
    .positive('La tasa debe ser mayor a 0')
    .max(100, 'La tasa no puede exceder 100')
    .optional(),
  cuotas: z.number().int().min(1, 'Debe haber al menos 1 cuota'),
  fechaDesembolso: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .optional(),
  proposito: z.string().nullable().optional(),
  notas: z.string().nullable().optional(),
});

export const pagarCuotaSchema = z.object({
  fechaPago: z.string().optional(),
});

export const listarCreditosSchema = z.object({
  socioId: z.string().optional(),
  estado: z.string().optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type SolicitarCreditoDTO = z.infer<typeof solicitarCreditoSchema>;
export type PagarCuotaDTO = z.infer<typeof pagarCuotaSchema>;
export type ListarCreditosDTO = z.infer<typeof listarCreditosSchema>;
