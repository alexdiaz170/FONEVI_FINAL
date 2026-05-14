// FONEVI — Ruta: Auditoría (/api/auditoria)
const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/auditoria
router.get('/', requireAuth, requireRole('administrador'), async (req, res) => {
  try {
    const { usuario_id, accion, limit = 100 } = req.query;
    const where = {};
    if (usuario_id) where.usuarioId = usuario_id;
    if (accion)     where.accion    = { contains: accion, mode: 'insensitive' };

    const logs = await prisma.auditoria.findMany({
      where,
      include: { usuario: { select: { nombre: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take:    parseInt(limit),
    });
    return res.json({ ok: true, datos: logs, total: logs.length });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

module.exports = router;
