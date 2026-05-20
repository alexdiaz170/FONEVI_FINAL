const usuarioService = require('../services/usuarioService');
const bcrypt = require('bcryptjs');
const { audit } = require('../middleware/audit');

class UserController {
  async list(req, res, next) {
    try {
      const users = await usuarioService.listAll();
      return res.json({ ok: true, datos: users });
    } catch (e) {
      next(e);
    }
  }

  async get(req, res, next) {
    try {
      const user = await usuarioService.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
      }
      return res.json({ ok: true, datos: user });
    } catch (e) {
      next(e);
    }
  }

  async create(req, res, next) {
    try {
      const { nombre, email, password, rol, estado, avatar } = req.body;
      if (!nombre || !email || !password) {
        return res.status(400).json({ ok: false, mensaje: 'Campos requeridos faltantes (nombre, email, password)' });
      }

      // Validar duplicado
      const existe = await usuarioService.findByEmail(email);
      if (existe) {
        return res.status(400).json({ ok: false, mensaje: 'Ya existe un usuario registrado con este email' });
      }

      const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hash = await bcrypt.hash(password, rounds);

      const nuevoUser = await usuarioService.create({
        nombre, email, password: hash, rol, estado, avatar
      });

      await audit(req, { accion: 'CREAR_USUARIO', tabla: 'usuarios', registroId: nuevoUser.id, detalle: { nombre: nuevoUser.nombre } });
      return res.status(201).json({ ok: true, datos: nuevoUser });
    } catch (e) {
      next(e);
    }
  }

  async update(req, res, next) {
    try {
      const actualizado = await usuarioService.update(req.params.id, req.body);
      if (!actualizado) {
        return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
      }

      await audit(req, { accion: 'ACTUALIZAR_USUARIO', tabla: 'usuarios', registroId: actualizado.id, detalle: { nombre: actualizado.nombre } });
      return res.json({ ok: true, datos: actualizado });
    } catch (e) {
      next(e);
    }
  }

  async delete(req, res, next) {
    try {
      const user = await usuarioService.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
      }

      const completado = await usuarioService.delete(req.params.id);
      if (!completado) {
        return res.status(400).json({ ok: false, mensaje: 'No se pudo eliminar el usuario' });
      }

      await audit(req, { accion: 'ELIMINAR_USUARIO', tabla: 'usuarios', registroId: user.id, detalle: { nombre: user.nombre } });
      return res.json({ ok: true, mensaje: 'Usuario eliminado correctamente' });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new UserController();
