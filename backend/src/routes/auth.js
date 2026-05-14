// ─────────────────────────────────────────────────────────────
// FONEVI — Ruta: Autenticación (/api/auth)
// ─────────────────────────────────────────────────────────────
const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { audit }       = require('../middleware/audit');

/* ── POST /api/auth/login ─────────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ ok: false, mensaje: 'Email y contraseña requeridos' });

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() }
    });

    if (!usuario || usuario.estado !== 'activo')
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });

    const passwordOk = await bcrypt.compare(password, usuario.password);
    if (!passwordOk)
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });

    const payload = { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

    await audit(req, { accion: 'LOGIN', detalle: { email: usuario.email } });

    return res.json({ ok: true, token, usuario: { ...payload, avatar: usuario.avatar } });
  } catch (e) {
    console.error('[auth/login]', e);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
  }
});

/* ── GET /api/auth/perfil ─────────────────────────────────── */
router.get('/perfil', requireAuth, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: { id: true, nombre: true, email: true, rol: true, avatar: true, createdAt: true }
    });
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    return res.json({ ok: true, datos: usuario });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

/* ── PUT /api/auth/cambiar-password ──────────────────────── */
router.put('/cambiar-password', requireAuth, async (req, res) => {
  try {
    const { password_actual, password_nuevo } = req.body;

    if (!password_actual || !password_nuevo)
      return res.status(400).json({ ok: false, mensaje: 'Faltan campos requeridos' });

    if (password_nuevo.length < 6)
      return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });

    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
    const ok      = await bcrypt.compare(password_actual, usuario.password);
    if (!ok) return res.status(401).json({ ok: false, mensaje: 'Contraseña actual incorrecta' });

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hash   = await bcrypt.hash(password_nuevo, rounds);
    await prisma.usuario.update({ where: { id: req.usuario.id }, data: { password: hash } });

    await audit(req, { accion: 'CAMBIAR_PASSWORD', tabla: 'usuarios', registroId: req.usuario.id });
    return res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente' });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

module.exports = router;
