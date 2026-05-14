// ─────────────────────────────────────────────────────────────
// FONEVI — Middleware: Auditoría automática de acciones
// ─────────────────────────────────────────────────────────────
const { prisma } = require('../lib/prisma');

/**
 * Registra en la tabla `auditoria` cada acción importante.
 * Se llama manualmente desde los controllers.
 */
async function audit(req, { accion, tabla = null, registroId = null, detalle = null }) {
  try {
    await prisma.auditoria.create({
      data: {
        usuarioId:  req.usuario?.id  || null,
        accion,
        tabla,
        registroId: registroId ? String(registroId) : null,
        detalle:    detalle ? JSON.stringify(detalle) : null,
        ip:         req.ip || req.connection?.remoteAddress || null,
      }
    });
  } catch (e) {
    // La auditoría nunca debe bloquear la respuesta principal
    console.error('[Auditoría] Error al registrar:', e.message);
  }
}

module.exports = { audit };
