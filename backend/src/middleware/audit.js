const db = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Registra en la tabla `auditoria` cada acción importante.
 * Se llama manualmente desde los controllers.
 */
async function audit(req, { accion, tabla = null, registroId = null, detalle = null }) {
  try {
    const usuarioId = req.usuario?.id || null;
    const ip = req.ip || req.connection?.remoteAddress || null;
    const detalleStr = detalle ? JSON.stringify(detalle) : null;
    const id = uuidv4();

    await db.query(
      `INSERT INTO auditoria (id, usuario_id, accion, tabla, registro_id, detalle, ip, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [id, usuarioId, accion, tabla, registroId ? String(registroId) : null, detalleStr, ip]
    );
  } catch (e) {
    console.error('[Auditoría] Error al registrar:', e.message);
  }
}

module.exports = { audit };
