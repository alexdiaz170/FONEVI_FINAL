// FONEVI — Ruta: Auditoría (/api/auditoria)
const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

/* ── GET /api/auditoria ──────────────────────────────────── */
router.get('/', requireAuth, requireRole('administrador'), async (req, res) => {
  try {
    const {
      usuario_id, accion, tabla,
      fecha_desde, fecha_hasta,
      limit = 200, offset = 0
    } = req.query;

    const where = {};
    if (usuario_id)  where.usuarioId = usuario_id;
    if (accion)      where.accion    = { contains: accion,  mode: 'insensitive' };
    if (tabla)       where.tabla     = { contains: tabla,   mode: 'insensitive' };
    if (fecha_desde || fecha_hasta) {
      where.createdAt = {};
      if (fecha_desde) where.createdAt.gte = new Date(fecha_desde);
      if (fecha_hasta) {
        const fin = new Date(fecha_hasta);
        fin.setHours(23, 59, 59, 999);
        where.createdAt.lte = fin;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditoria.findMany({
        where,
        include: {
          usuario: { select: { nombre: true, email: true, rol: true } }
        },
        orderBy: { createdAt: 'desc' },
        take:   Math.min(parseInt(limit)  || 200, 500),
        skip:   parseInt(offset) || 0,
      }),
      prisma.auditoria.count({ where }),
    ]);

    return res.json({ ok: true, datos: logs, total });
  } catch (e) {
    console.error('[auditoria/listar]', e);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

/* ── DELETE /api/auditoria/limpiar ──────────────────────── */
// Elimina registros anteriores a N días (por defecto 90)
router.delete('/limpiar', requireAuth, requireRole('administrador'), async (req, res) => {
  try {
    const dias  = parseInt(req.query.dias) || 90;
    const corte = new Date();
    corte.setDate(corte.getDate() - dias);

    const resultado = await prisma.auditoria.deleteMany({
      where: { createdAt: { lt: corte } }
    });

    return res.json({
      ok:      true,
      mensaje: `Se eliminaron ${resultado.count} registros anteriores a ${corte.toLocaleDateString('es-CO')}`,
      eliminados: resultado.count,
    });
  } catch (e) {
    console.error('[auditoria/limpiar]', e);
    return res.status(500).json({ ok: false, mensaje: 'Error al limpiar auditoría' });
  }
});

module.exports = router;

