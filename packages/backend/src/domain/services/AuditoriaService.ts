import { getPrismaClient } from '../../infrastructure/persistence/prismaClient.js';

export interface AuditEntry {
  usuarioId?: string | null;
  accion: string;
  tabla?: string | null;
  registroId?: string | null;
  detalle?: string | null;
  ip?: string | null;
}

export async function registrarAuditoria(entry: AuditEntry): Promise<void> {
  const prisma = getPrismaClient();
  await prisma.auditoria.create({
    data: {
      usuarioId: entry.usuarioId ?? null,
      accion: entry.accion,
      tabla: entry.tabla ?? null,
      registroId: entry.registroId ?? null,
      detalle: entry.detalle ?? null,
      ip: entry.ip ?? null,
    } as never,
  });
}
