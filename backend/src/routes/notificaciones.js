// FONEVI — Ruta: Notificaciones (/api/notificaciones)
const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// GET /api/notificaciones
router.get('/', requireAuth, async (req, res) => {
  try {
    const soloNL = req.query.solo_no_leidas === 'true';
    const notifs = await prisma.notificacion.findMany({
      where:   soloNL ? { leida: false } : {},
      orderBy: { createdAt: 'desc' },
      take:    50,
    });
    return res.json({ ok: true, datos: notifs });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// PUT /api/notificaciones/:id/leer
router.put('/:id/leer', requireAuth, async (req, res) => {
  try {
    await prisma.notificacion.update({ where: { id: req.params.id }, data: { leida: true } });
    return res.json({ ok: true, mensaje: 'Marcada como leída' });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// PUT /api/notificaciones/leer-todas
router.put('/leer-todas', requireAuth, async (req, res) => {
  try {
    await prisma.notificacion.updateMany({ where: { leida: false }, data: { leida: true } });
    return res.json({ ok: true, mensaje: 'Todas marcadas como leídas' });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

module.exports = router;
