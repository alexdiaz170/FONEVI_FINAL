import { z } from 'zod';

export const registrarAcuerdoSchema = z.object({
  socioId: z.string().min(1, 'socioId es requerido'),
  montoTotal: z.number().positive('El monto total debe ser mayor a 0'),
  cuotas: z.number().int().min(1, 'Debe haber al menos 1 cuota'),
  fechaInicio: z.string().optional(),
  notas: z.string().nullable().optional(),
});

export const calcularMoraSchema = z.object({
  socioId: z.string().min(1, 'socioId es requerido'),
});

export const crearDividendoSchema = z.object({
  periodo: z.string().min(1, 'El período es requerido'),
  montoTotal: z.number().positive('El monto total debe ser mayor a 0'),
  fechaCalculo: z.string().optional(),
});

export const distribuirDividendoSchema = z.object({
  socioIds: z.array(z.string()).min(1, 'Debe incluir al menos un socio'),
});

export const actualizarConfigSchema = z.object({
  valor: z.string().min(1, 'El valor es requerido'),
});

export const listarAuditoriaSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  usuarioId: z.string().optional(),
  tabla: z.string().optional(),
});
