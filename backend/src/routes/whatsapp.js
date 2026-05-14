// FONEVI — Ruta: WhatsApp (/api/whatsapp)
const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const WA_ENABLED = () => !!(process.env.WA_TOKEN && process.env.WA_PHONE_ID);

// Envío real a WhatsApp Business API
async function sendWA(telefono, template, params = []) {
  if (!WA_ENABLED()) return { simulado: true };
  const body = {
    messaging_product: 'whatsapp',
    to: `57${telefono}`,
    type: 'template',
    template: { name: template, language: { code: 'es_CO' }, components: params.length
      ? [{ type: 'body', parameters: params.map(p => ({ type: 'text', text: String(p) })) }]
      : []
    }
  };
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${process.env.WA_PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  return res.json();
}

// GET /api/whatsapp/estado
router.get('/estado', requireAuth, (req, res) => {
  const habilitado = WA_ENABLED();
  return res.json({
    ok: true,
    habilitado,
    mensaje: habilitado
      ? 'WhatsApp Business API configurado y activo'
      : 'Modo simulado — configura WA_TOKEN y WA_PHONE_ID en .env',
  });
});

// GET /api/whatsapp/logs
router.get('/logs', requireAuth, requireRole('administrador', 'tesorero'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs  = await prisma.waLog.findMany({ orderBy: { enviadoEn: 'desc' }, take: limit });
    return res.json({ ok: true, datos: logs, total: logs.length });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// POST /api/whatsapp/test
router.post('/test', requireAuth, requireRole('administrador'), async (req, res) => {
  try {
    const { telefono, nombre } = req.body;
    const tel = (telefono || '').replace(/\D/g, '');
    if (!tel || tel.length < 10)
      return res.status(400).json({ ok: false, mensaje: 'Número inválido. Usa 10 dígitos sin +57.' });

    const resultado = await sendWA(tel, 'fonevi_bienvenida', [nombre || 'Socio']);
    await prisma.waLog.create({
      data: { numero: `57${tel}`, template: 'fonevi_bienvenida', estado: WA_ENABLED() ? 'enviado' : 'simulado', messageId: resultado.messages?.[0]?.id || null, enviadoEn: new Date() }
    });
    return res.json({ ok: true, resultado });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// POST /api/whatsapp/recordatorios
router.post('/recordatorios', requireAuth, requireRole('administrador', 'tesorero'), async (req, res) => {
  try {
    const periodoActivo = await prisma.periodo.findFirst({ where: { activo: true } });
    if (!periodoActivo) return res.status(400).json({ ok: false, mensaje: 'No hay periodo activo' });

    const pendientes = await prisma.aporte.findMany({
      where:   { periodoId: periodoActivo.id, estado: 'pendiente' },
      include: { socio: true },
    });

    let enviados = 0, sinTel = 0;
    const detalle = [];
    for (const a of pendientes) {
      const tel = (a.socio.telefono || '').replace(/\D/g, '');
      if (!tel || tel.length < 10) { sinTel++; detalle.push({ socio: a.socio.nombre, ok: false, razon: 'sin_telefono' }); continue; }
      await sendWA(tel, 'fonevi_recordatorio_pago', [a.socio.nombre, periodoActivo.nombre]);
      await prisma.waLog.create({ data: { numero: `57${tel}`, template: 'fonevi_recordatorio_pago', estado: WA_ENABLED() ? 'enviado' : 'simulado', enviadoEn: new Date() } });
      enviados++;
      detalle.push({ socio: a.socio.nombre, ok: true });
    }
    return res.json({ ok: true, resultado: { enviados, sinTelefono: sinTel, fallidos: 0, detalle } });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// POST /api/whatsapp/alertas-mora
router.post('/alertas-mora', requireAuth, requireRole('administrador', 'tesorero'), async (req, res) => {
  try {
    const morosos = await prisma.socio.findMany({
      where: { estado: 'mora' },
    });
    let enviados = 0, sinTel = 0;
    const detalle = [];
    for (const s of morosos) {
      const tel = (s.telefono || '').replace(/\D/g, '');
      if (!tel || tel.length < 10) { sinTel++; continue; }
      await sendWA(tel, 'fonevi_mora_alerta', [s.nombre]);
      await prisma.waLog.create({ data: { numero: `57${tel}`, template: 'fonevi_mora_alerta', estado: WA_ENABLED() ? 'enviado' : 'simulado', enviadoEn: new Date() } });
      enviados++;
      detalle.push({ socio: s.nombre, ok: true });
    }
    return res.json({ ok: true, resultado: { enviados, sinTelefono: sinTel, fallidos: 0, detalle } });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// POST /api/whatsapp/individual
router.post('/individual', requireAuth, requireRole('administrador', 'tesorero'), async (req, res) => {
  try {
    const { socio_id, template } = req.body;
    const socio = await prisma.socio.findUnique({ where: { id: socio_id } });
    if (!socio) return res.status(404).json({ ok: false, mensaje: 'Socio no encontrado' });
    const tel = (socio.telefono || '').replace(/\D/g, '');
    if (!tel || tel.length < 10) return res.status(400).json({ ok: false, mensaje: 'El socio no tiene teléfono registrado' });
    await sendWA(tel, template || 'fonevi_recordatorio_pago', [socio.nombre]);
    await prisma.waLog.create({ data: { numero: `57${tel}`, template: template || 'fonevi_recordatorio_pago', estado: WA_ENABLED() ? 'enviado' : 'simulado', enviadoEn: new Date() } });
    return res.json({ ok: true, resultado: { numero: `57${tel}`, socio: socio.nombre } });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

module.exports = router;
