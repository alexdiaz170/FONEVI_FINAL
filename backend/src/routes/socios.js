// ─────────────────────────────────────────────────────────────
// FONEVI — Ruta: Socios (/api/socios)
// ─────────────────────────────────────────────────────────────
const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

/* ── GET /api/socios ─────────────────────────────────────── */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { estado, buscar, sede } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (sede)   where.sede   = { contains: sede, mode: 'insensitive' };
    if (buscar) where.OR = [
      { nombre:    { contains: buscar, mode: 'insensitive' } },
      { documento: { contains: buscar, mode: 'insensitive' } },
      { email:     { contains: buscar, mode: 'insensitive' } },
    ];

    const socios = await prisma.socio.findMany({
      where,
      orderBy: { nombre: 'asc' },
    });
    return res.json({ ok: true, datos: socios, total: socios.length });
  } catch (e) {
    console.error('[socios/listar]', e);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

/* ── GET /api/socios/:id ─────────────────────────────────── */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const socio = await prisma.socio.findUnique({ where: { id: req.params.id } });
    if (!socio) return res.status(404).json({ ok: false, mensaje: 'Socio no encontrado' });
    return res.json({ ok: true, datos: socio });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

/* ── GET /api/socios/:id/estado-cuenta ───────────────────── */
router.get('/:id/estado-cuenta', requireAuth, async (req, res) => {
  try {
    const [socio, aportes, creditos] = await Promise.all([
      prisma.socio.findUnique({ where: { id: req.params.id } }),
      prisma.aporte.findMany({
        where: { socioId: req.params.id },
        include: { periodo: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.credito.findMany({
        where: { socioId: req.params.id },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    if (!socio) return res.status(404).json({ ok: false, mensaje: 'Socio no encontrado' });
    return res.json({ ok: true, datos: { socio, aportes, creditos } });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

/* ── POST /api/socios ────────────────────────────────────── */
router.post('/', requireAuth, requireRole('administrador', 'tesorero'), async (req, res) => {
  try {
    const { nombre, documento, email, telefono, fechaIngreso, aporteMensual, cargo, sede } = req.body;

    if (!nombre || !documento || !aporteMensual)
      return res.status(400).json({ ok: false, mensaje: 'nombre, documento y aporteMensual son requeridos' });

    // Generar código único S001, S002...
    const count  = await prisma.socio.count();
    const codigo = 'S' + String(count + 1).padStart(3, '0');

    const nuevo = await prisma.socio.create({
      data: {
        codigo,
        nombre,
        documento,
        email:        email   || null,
        telefono:     telefono || null,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : new Date(),
        aporteMensual: parseFloat(aporteMensual),
        ahorroAcumulado: 0,
        cargo: cargo || null,
        sede:  sede  || null,
      }
    });

    await audit(req, { accion: 'CREAR_SOCIO', tabla: 'socios', registroId: nuevo.id, detalle: { nombre } });
    return res.status(201).json({ ok: true, datos: nuevo, mensaje: 'Socio creado exitosamente' });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ ok: false, mensaje: 'Ya existe un socio con ese documento' });
    console.error('[socios/crear]', e);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

/* ── PUT /api/socios/:id ─────────────────────────────────── */
router.put('/:id', requireAuth, requireRole('administrador', 'tesorero'), async (req, res) => {
  try {
    const { nombre, email, telefono, aporteMensual, cargo, sede, estado } = req.body;

    const actualizado = await prisma.socio.update({
      where: { id: req.params.id },
      data: {
        ...(nombre        && { nombre }),
        ...(email         && { email }),
        ...(telefono      && { telefono }),
        ...(aporteMensual && { aporteMensual: parseFloat(aporteMensual) }),
        ...(cargo         && { cargo }),
        ...(sede          && { sede }),
        ...(estado        && { estado }),
      }
    });

    await audit(req, { accion: 'ACTUALIZAR_SOCIO', tabla: 'socios', registroId: req.params.id });
    return res.json({ ok: true, datos: actualizado, mensaje: 'Socio actualizado' });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, mensaje: 'Socio no encontrado' });
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

/* ── DELETE /api/socios/:id ──────────────────────────────── */
router.delete('/:id', requireAuth, requireRole('administrador'), async (req, res) => {
  try {
    // Soft delete: cambiar estado a "retirado"
    await prisma.socio.update({
      where: { id: req.params.id },
      data:  { estado: 'retirado' }
    });
    await audit(req, { accion: 'RETIRAR_SOCIO', tabla: 'socios', registroId: req.params.id });
    return res.json({ ok: true, mensaje: 'Socio retirado del sistema' });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ ok: false, mensaje: 'Socio no encontrado' });
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

module.exports = router;
