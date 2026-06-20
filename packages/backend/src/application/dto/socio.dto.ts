import { z } from 'zod';

export const crearSocioSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(200),
  tipoDocumento: z.enum(['CC', 'CE', 'NIT', 'PASAPORTE']),
  numeroDocumento: z.string().min(3, 'Número de documento requerido'),
  email: z.string().email('Email inválido').optional().nullable(),
  telefono: z
    .string()
    .regex(/^\d{7,10}$/, 'Teléfono inválido')
    .optional()
    .nullable(),
  fechaIngreso: z.string().datetime({ offset: true }).optional(),
  aporteMensual: z.number().nonnegative('Aporte mensual no puede ser negativo').optional(),
  ahorroAcumulado: z.number().nonnegative().optional(),
  estado: z.enum(['activo', 'mora', 'retirado', 'suspendido']).default('activo'),
  cargo: z.string().max(100).optional().nullable(),
  sede: z.string().max(100).optional().nullable(),
  departamento: z.string().max(100).optional().nullable(),
  municipio: z.string().max(100).optional().nullable(),
});

export const actualizarSocioSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(200).optional(),
  email: z.string().email('Email inválido').optional().nullable(),
  telefono: z
    .string()
    .regex(/^\d{7,10}$/, 'Teléfono inválido')
    .optional()
    .nullable(),
  fechaIngreso: z.string().datetime({ offset: true }).optional(),
  aporteMensual: z.number().nonnegative('Aporte mensual no puede ser negativo').optional(),
  ahorroAcumulado: z.number().nonnegative().optional(),
  estado: z.enum(['activo', 'mora', 'retirado', 'suspendido']).optional(),
  cargo: z.string().max(100).optional().nullable(),
  sede: z.string().max(100).optional().nullable(),
  departamento: z.string().max(100).optional().nullable(),
  municipio: z.string().max(100).optional().nullable(),
});

export const socioQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(9999).default(10),
  includeDeleted: z.coerce.boolean().default(false),
});

export type CrearSocioDTO = z.infer<typeof crearSocioSchema>;
export type ActualizarSocioDTO = z.infer<typeof actualizarSocioSchema>;
export type SocioQueryDTO = z.infer<typeof socioQuerySchema>;
