// FONEVI — Ruta: Aportes (/api/aportes)
const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

// GET /api/aportes
router.get('/', requireAuth, async (req, res) => {
  try {
    const { socio_id, estado, periodo_id } = req.query;
    const where = {};
    if (socio_id)   where.socioId   = socio_id;
    if (estado)     where.estado    = estado;
    if (periodo_id) where.periodoId = parseInt(periodo_id);

    const aportes = await prisma.aporte.findMany({
      where,
      include: {
        socio:   { select: { nombre: true, codigo: true } },
        periodo: { select: { nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = aportes.map(a => ({
      ...a,
      socio_nombre:   a.socio?.nombre,
      periodo_nombre: a.periodo?.nombre,
    }));

    return res.json({ ok: true, datos: mapped });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// GET /api/aportes/resumen/:periodo_id
router.get('/resumen/:periodo_id', requireAuth, async (req, res) => {
  try {
    const pid     = parseInt(req.params.periodo_id);
    const aportes = await prisma.aporte.findMany({ where: { periodoId: pid } });
    const pagados = aportes.filter(a => a.estado === 'pagado');
    return res.json({ ok: true, datos: {
      pagados:         pagados.length,
      pendientes:      aportes.filter(a => a.estado === 'pendiente').length,
      en_mora:         aportes.filter(a => ['mora','vencido'].includes(a.estado)).length,
      total_recaudado: pagados.reduce((t,a) => t + Number(a.monto), 0),
    }});
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// POST /api/aportes
router.post('/', requireAuth, requireRole('administrador','tesorero'), async (req, res) => {
  try {
    const { socio_id, periodo_id, periodo, monto, metodo, notas, estado } = req.body;
    if (!socio_id || (!periodo_id && !periodo) || !monto)
      return res.status(400).json({ ok: false, mensaje: 'socio_id, periodo o periodo_id y monto son requeridos' });

    // Buscar el socio real (puede venir UUID o código como 'S001')
    const socio = await prisma.socio.findFirst({
      where: { OR: [{ id: socio_id }, { codigo: socio_id }] }
    });
    if (!socio) return res.status(404).json({ ok: false, mensaje: 'Socio no encontrado' });
    const sId = socio.id;

    let pId = periodo_id ? parseInt(periodo_id) : null;
    if (!pId && periodo) {
      const p = await prisma.periodo.findUnique({ where: { nombre: periodo } });
      if (!p) return res.status(400).json({ ok: false, mensaje: 'El periodo no existe' });
      pId = p.id;
    }

    const estadoFinal = estado || 'pagado';
    const montoVal = Number(monto);

    const nuevo = await prisma.aporte.create({
      data: {
        socioId:   sId,
        periodoId: pId,
        monto:     montoVal,
        fechaPago: estadoFinal === 'pagado' ? new Date() : null,
        estado:    estadoFinal,
        metodo:    metodo || 'efectivo',
        notas:     notas  || null,
      }
    });

    if (estadoFinal === 'pagado') {
      await prisma.socio.update({
        where: { id: sId },
        data:  { ahorroAcumulado: { increment: montoVal } }
      });
    }

    await audit(req, { accion: 'REGISTRAR_APORTE', tabla: 'aportes', registroId: nuevo.id, detalle: { socio_id, monto } });
    return res.status(201).json({ ok: true, datos: nuevo, mensaje: 'Aporte registrado correctamente' });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// PUT /api/aportes/:id/estado
router.put('/:id/estado', requireAuth, requireRole('administrador','tesorero'), async (req, res) => {
  try {
    const aporteActual = await prisma.aporte.findUnique({ where: { id: req.params.id } });
    if (!aporteActual) return res.status(404).json({ ok: false, mensaje: 'Aporte no encontrado' });

    const actualizado = await prisma.aporte.update({
      where: { id: req.params.id },
      data:  { estado: req.body.estado }
    });

    if (aporteActual.estado !== 'pagado' && req.body.estado === 'pagado') {
      await prisma.socio.update({
        where: { id: actualizado.socioId },
        data: { ahorroAcumulado: { increment: Number(actualizado.monto) } }
      });
    } else if (aporteActual.estado === 'pagado' && req.body.estado !== 'pagado') {
      await prisma.socio.update({
        where: { id: actualizado.socioId },
        data: { ahorroAcumulado: { decrement: Number(actualizado.monto) } }
      });
    }

    await audit(req, { accion: 'CAMBIAR_ESTADO_APORTE', tabla: 'aportes', registroId: req.params.id });
    return res.json({ ok: true, datos: actualizado });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, mensaje: 'Aporte no encontrado' });
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

module.exports = router;
