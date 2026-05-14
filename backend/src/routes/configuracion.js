// FONEVI — Ruta: Configuración (/api/configuracion)
const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

// GET /api/configuracion
router.get('/', requireAuth, async (req, res) => {
  try {
    const rows = await prisma.configuracion.findMany();
    const datos = {};
    rows.forEach(r => {
      // Convertir numéricos automáticamente
      datos[r.clave] = isNaN(r.valor) ? r.valor : parseFloat(r.valor);
    });
    return res.json({ ok: true, datos });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// PUT /api/configuracion/:clave
router.put('/:clave', requireAuth, requireRole('administrador'), async (req, res) => {
  try {
    const { valor } = req.body;
    await prisma.configuracion.upsert({
      where:  { clave: req.params.clave },
      update: { valor: String(valor) },
      create: { clave: req.params.clave, valor: String(valor) },
    });
    await audit(req, { accion: 'CAMBIAR_CONFIG', detalle: { clave: req.params.clave, valor } });
    return res.json({ ok: true, mensaje: 'Configuración actualizada' });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

module.exports = router;
