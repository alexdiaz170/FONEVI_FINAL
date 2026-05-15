// FONEVI — Ruta: Aportes (/api/aportes)
const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

const { mapAporte } = require('../lib/mappings');

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
        socio:   { select: { nombre: true, codigo: true, documento: true } },
        periodo: { select: { nombre: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ ok: true, datos: aportes.map(mapAporte) });
  } catch (e) {
    console.error('[aportes/listar]', e);
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
router.post('/', requireAuth, requireRole('administrador', 'tesorero'), async (req, res) => {
  try {
    const { socio_id, periodo_id, periodo, monto, metodo, notas, fecha_pago, estado } = req.body;

    if (!socio_id || (!periodo_id && !periodo) || !monto)
      return res.status(400).json({ ok: false, mensaje: 'socio_id, periodo (o id) y monto son requeridos' });

    // 1. Buscar socio (por ID/documento o por código)
    const socio = await prisma.socio.findFirst({
      where: { OR: [{ id: socio_id }, { codigo: socio_id }] }
    });
    if (!socio) return res.status(404).json({ ok: false, mensaje: 'Socio no encontrado' });
    const sId = socio.id;

    // 2. Buscar o validar periodo
    let pId = parseInt(periodo_id);
    if (!pId && periodo) {
      const p = await prisma.periodo.findUnique({ where: { nombre: periodo } });
      if (!p) return res.status(404).json({ ok: false, mensaje: `Período '${periodo}' no existe en la BD` });
      pId = p.id;
    }

    const montoVal    = parseFloat(monto);
    const estadoFinal = estado || 'pagado';

    const nuevo = await prisma.aporte.create({
      data: {
        socioId:   sId,
        periodoId: pId,
        monto:     montoVal,
        metodo:    metodo     || 'efectivo',
        notas:     notas      || null,
        fechaPago: fecha_pago ? new Date(fecha_pago) : new Date(),
        estado:    estadoFinal,
      },
      include: {
        socio:   { select: { nombre: true, codigo: true, documento: true } },
        periodo: { select: { nombre: true } },
      },
    });

    if (estadoFinal === 'pagado') {
      await prisma.socio.update({
        where: { id: sId },
        data:  { ahorroAcumulado: { increment: montoVal } }
      });
    }

    await audit(req, { accion: 'REGISTRAR_APORTE', tabla: 'aportes', registroId: nuevo.id, detalle: { socio_id, monto } });
    return res.status(201).json({ ok: true, datos: mapAporte(nuevo), mensaje: 'Aporte registrado' });
  } catch (e) {
    console.error('[aportes/crear]', e);
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
      data:  { estado: req.body.estado },
      include: {
        socio:   { select: { nombre: true, codigo: true } },
        periodo: { select: { nombre: true } },
      },
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
    return res.json({ ok: true, datos: mapAporte(actualizado) });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, mensaje: 'Aporte no encontrado' });
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

module.exports = router;
