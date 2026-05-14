// FONEVI — Ruta: Créditos (/api/creditos)
const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { audit } = require('../middleware/audit');

// Simulador de cuota (helper interno)
function calcularCuota(monto, tasaMensual, cuotas) {
  const r = tasaMensual / 100;
  if (r === 0) return monto / cuotas;
  return monto * (r * Math.pow(1 + r, cuotas)) / (Math.pow(1 + r, cuotas) - 1);
}

// GET /api/creditos/simular?monto=&cuotas=&tasa=
router.get('/simular', requireAuth, async (req, res) => {
  try {
    const conf    = await prisma.configuracion.findUnique({ where: { clave: 'tasa_credito_mensual' } });
    const tasaDef = conf ? parseFloat(conf.valor) : 1.5;
    const monto   = parseFloat(req.query.monto)  || 0;
    const cuotas  = parseInt(req.query.cuotas)   || 12;
    const tasa    = parseFloat(req.query.tasa)   || tasaDef;
    const cuota   = calcularCuota(monto, tasa, cuotas);
    return res.json({ ok: true, datos: {
      monto,
      tasa_mensual:    tasa,
      num_cuotas:      cuotas,
      cuota_mensual:   Math.round(cuota * 100) / 100,
      total_pagar:     Math.round(cuota * cuotas * 100) / 100,
      total_intereses: Math.round((cuota * cuotas - monto) * 100) / 100,
    }});
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// GET /api/creditos
router.get('/', requireAuth, async (req, res) => {
  try {
    const { socio_id, estado } = req.query;
    const where = {};
    if (socio_id) where.socioId = socio_id;
    if (estado)   where.estado  = estado;

    const creditos = await prisma.credito.findMany({
      where,
      include: { socio: { select: { nombre: true, codigo: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const mapped = creditos.map(c => ({ ...c, socio_nombre: c.socio?.nombre }));
    return res.json({ ok: true, datos: mapped });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// GET /api/creditos/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const credito = await prisma.credito.findUnique({
      where:   { id: req.params.id },
      include: { socio: { select: { nombre: true } } }
    });
    if (!credito) return res.status(404).json({ ok: false, mensaje: 'Crédito no encontrado' });
    return res.json({ ok: true, datos: credito });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// POST /api/creditos
router.post('/', requireAuth, requireRole('administrador', 'tesorero'), async (req, res) => {
  try {
    const { socio_id, monto, tasa_mensual, cuotas, proposito, fecha_desembolso } = req.body;
    if (!socio_id || !monto || !cuotas)
      return res.status(400).json({ ok: false, mensaje: 'socio_id, monto y cuotas son requeridos' });

    // Buscar el socio real (puede venir UUID o código como 'S001')
    const socio = await prisma.socio.findFirst({
      where: { OR: [{ id: socio_id }, { codigo: socio_id }] }
    });
    if (!socio) return res.status(404).json({ ok: false, mensaje: 'Socio no encontrado' });
    const sId = socio.id;

    const conf  = await prisma.configuracion.findUnique({ where: { clave: 'tasa_credito_mensual' } });
    const tasa  = tasa_mensual || (conf ? parseFloat(conf.valor) : 1.5);
    const montoVal = parseFloat(monto);

    const nuevo = await prisma.credito.create({
      data: {
        socioId:         sId,
        monto:           montoVal,
        tasaMensual:     tasa,
        cuotas:          parseInt(cuotas),
        cuotasPagadas:   0,
        saldoCapital:    montoVal,
        fechaDesembolso: fecha_desembolso ? new Date(fecha_desembolso) : new Date(),
        estado:          'activo',
        proposito:       proposito   || null,
        aprobadoPor:     req.usuario.id,
      }
    });
    await audit(req, { accion: 'CREAR_CREDITO', tabla: 'creditos', registroId: nuevo.id, detalle: { socio_id, monto } });
    const responseData = { 
      ...nuevo, 
      monto: Number(nuevo.monto), 
      tasaMensual: Number(nuevo.tasaMensual), 
      saldoCapital: Number(nuevo.saldoCapital) 
    };
    return res.status(201).json({ ok: true, datos: responseData, mensaje: 'Crédito creado exitosamente' });
  } catch (e) {
    console.error('[creditos/crear]', e);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// POST /api/creditos/:id/pagar-cuota
router.post('/:id/pagar-cuota', requireAuth, requireRole('administrador', 'tesorero'), async (req, res) => {
  try {
    const credito = await prisma.credito.findUnique({ where: { id: req.params.id } });
    if (!credito) return res.status(404).json({ ok: false, mensaje: 'Crédito no encontrado' });
    if (credito.estado === 'pagado') return res.status(400).json({ ok: false, mensaje: 'El crédito ya está pagado' });

    const tasa       = Number(credito.tasaMensual) / 100;
    const cuotaValor = calcularCuota(Number(credito.monto), Number(credito.tasaMensual), credito.cuotas);
    const interes    = Number(credito.saldoCapital) * tasa;
    const capital    = cuotaValor - interes;
    const nuevoSaldo = Math.max(0, Number(credito.saldoCapital) - capital);
    const nuevasPagadas = credito.cuotasPagadas + 1;
    const estadoNuevo   = nuevasPagadas >= credito.cuotas ? 'pagado' : 'activo';

    const actualizado = await prisma.credito.update({
      where: { id: req.params.id },
      data:  { cuotasPagadas: nuevasPagadas, saldoCapital: nuevoSaldo, estado: estadoNuevo }
    });
    await audit(req, { accion: 'PAGAR_CUOTA_CREDITO', tabla: 'creditos', registroId: req.params.id, detalle: { cuota: nuevasPagadas } });
    return res.json({ ok: true, datos: actualizado, mensaje: `Cuota ${nuevasPagadas} registrada` });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

module.exports = router;
