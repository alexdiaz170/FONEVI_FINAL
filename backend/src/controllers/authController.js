const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usuarioService = require('../services/usuarioService');
const { audit } = require('../middleware/audit');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ ok: false, mensaje: 'Email y contraseña requeridos' });
      }

      const usuario = await usuarioService.findByEmail(email);
      if (!usuario || usuario.estado !== 'activo') {
        return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
      }

      const isMatch = await bcrypt.compare(password, usuario.password);
      if (!isMatch) {
        return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas' });
      }

      const payload = {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        socioId: usuario.socioId || null
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

      await audit(req, { accion: 'LOGIN', detalle: { email: usuario.email } });

      return res.json({ ok: true, token, usuario: { ...payload, avatar: usuario.avatar } });
    } catch (e) {
      next(e);
    }
  }

  async getProfile(req, res, next) {
    try {
      const usuario = await usuarioService.findById(req.usuario.id);
      if (!usuario) {
        return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
      }
      return res.json({ ok: true, datos: usuario });
    } catch (e) {
      next(e);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { password_actual, password_nuevo } = req.body;
      if (!password_actual || !password_nuevo) {
        return res.status(400).json({ ok: false, mensaje: 'Faltan campos requeridos' });
      }

      if (password_nuevo.length < 6) {
        return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // Buscar usuario completo con hash de contraseña
      const resQuery = await require('../db').query('SELECT * FROM usuarios WHERE id = $1', [req.usuario.id]);
      const usuario = resQuery.rows[0];
      if (!usuario) {
        return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
      }

      const isMatch = await bcrypt.compare(password_actual, usuario.password);
      if (!isMatch) {
        return res.status(401).json({ ok: false, mensaje: 'Contraseña actual incorrecta' });
      }

      const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hash = await bcrypt.hash(password_nuevo, rounds);
      await usuarioService.updatePassword(req.usuario.id, hash);

      await audit(req, { accion: 'CAMBIAR_PASSWORD', tabla: 'usuarios', registroId: req.usuario.id });
      return res.json({ ok: true, mensaje: 'Contraseña actualizada correctamente' });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new AuthController();
