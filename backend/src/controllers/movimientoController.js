const movimientoService = require('../services/movimientoService');
const { audit } = require('../middleware/audit');

class MovimientoController {
  async list(req, res, next) {
    try {
      const { tipo, categoria } = req.query;
      const movimientos = await movimientoService.listAll({ tipo, categoria });
      return res.json({ ok: true, datos: movimientos });
    } catch (e) {
      next(e);
    }
  }

  async get(req, res, next) {
    try {
      const movimiento = await movimientoService.findById(req.params.id);
      if (!movimiento) {
        return res.status(404).json({ ok: false, mensaje: 'Movimiento no encontrado' });
      }
      return res.json({ ok: true, datos: movimiento });
    } catch (e) {
      next(e);
    }
  }

  async create(req, res, next) {
    try {
      const { tipo, categoria, descripcion, monto, fecha } = req.body;
      if (!tipo || !categoria || !monto || !descripcion) {
        return res.status(400).json({ ok: false, mensaje: 'Campos requeridos faltantes (tipo, categoria, monto, descripcion)' });
      }

      const nuevoMovimiento = await movimientoService.create({
        tipo, categoria, descripcion, monto, fecha
      });

      await audit(req, { accion: 'REGISTRAR_MOVIMIENTO', tabla: 'movimientos', registroId: nuevoMovimiento.id, detalle: { monto } });
      return res.status(201).json({ ok: true, datos: nuevoMovimiento });
    } catch (e) {
      next(e);
    }
  }

  async update(req, res, next) {
    try {
      const actualizado = await movimientoService.update(req.params.id, req.body);
      if (!actualizado) {
        return res.status(404).json({ ok: false, mensaje: 'Movimiento no encontrado' });
      }

      await audit(req, { accion: 'ACTUALIZAR_MOVIMIENTO', tabla: 'movimientos', registroId: actualizado.id, detalle: { monto: actualizado.monto } });
      return res.json({ ok: true, datos: actualizado });
    } catch (e) {
      next(e);
    }
  }

  async delete(req, res, next) {
    try {
      const movimiento = await movimientoService.findById(req.params.id);
      if (!movimiento) {
        return res.status(404).json({ ok: false, mensaje: 'Movimiento no encontrado' });
      }

      const completado = await movimientoService.delete(req.params.id);
      if (!completado) {
        return res.status(400).json({ ok: false, mensaje: 'No se pudo eliminar el movimiento' });
      }

      await audit(req, { accion: 'ELIMINAR_MOVIMIENTO', tabla: 'movimientos', registroId: req.params.id, detalle: { monto: movimiento.monto } });
      return res.json({ ok: true, mensaje: 'Movimiento eliminado correctamente' });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new MovimientoController();
