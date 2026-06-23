import { z } from 'zod';

export const enviarWhatsAppSchema = z.object({
  numero: z.string().min(1, 'Número requerido'),
  template: z.string().min(1, 'Template requerido'),
  variables: z.record(z.string(), z.string()).optional(),
});

export type EnviarWhatsAppDTO = z.infer<typeof enviarWhatsAppSchema>;

export const listarLogsSchema = z.object({
  estado: z.string().optional(),
  numero: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});
