const creditoService = require('../services/creditoService');
const { audit } = require('../middleware/audit');
const { mapCredito } = require('../lib/mappings');

class CreditoController {
  async list(req, res, next) {
    try {
      const { socioId, estado } = req.query;
      const creditos = await creditoService.listAll({ socioId, estado });
      const datos = creditos.map(mapCredito);
      return res.json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  async get(req, res, next) {
    try {
      const credito = await creditoService.findById(req.params.id);
      if (!credito) {
        return res.status(404).json({ ok: false, mensaje: 'Crédito no encontrado' });
      }
      return res.json({ ok: true, datos: credito });
    } catch (e) {
      next(e);
    }
  }

  async create(req, res, next) {
    try {
      const { socioId, monto, tasaMensual, cuotas, cuotasPagadas, saldoCapital, fechaDesembolso, estado, proposito, aprobadoPor, notas } = req.body;
      if (!socioId || !monto || !tasaMensual || !cuotas) {
        return res.status(400).json({ ok: false, mensaje: 'Campos requeridos faltantes (socioId, monto, tasaMensual, cuotas)' });
      }

      const nuevoCredito = await creditoService.create({
        socioId, monto, tasaMensual, cuotas, cuotasPagadas, saldoCapital, fechaDesembolso, estado, proposito, aprobadoPor, notas
      });

      await audit(req, { accion: 'APROBAR_CREDITO', tabla: 'creditos', registroId: nuevoCredito.id, detalle: { monto } });
      return res.status(201).json({ ok: true, datos: nuevoCredito });
    } catch (e) {
      next(e);
    }
  }

  async update(req, res, next) {
    try {
      const actualizado = await creditoService.update(req.params.id, req.body);
      if (!actualizado) {
        return res.status(404).json({ ok: false, mensaje: 'Crédito no encontrado' });
      }

      await audit(req, { accion: 'ACTUALIZAR_CREDITO', tabla: 'creditos', registroId: actualizado.id, detalle: { monto: actualizado.monto } });
      return res.json({ ok: true, datos: actualizado });
    } catch (e) {
      next(e);
    }
  }

  async delete(req, res, next) {
    try {
      const credito = await creditoService.findById(req.params.id);
      if (!credito) {
        return res.status(404).json({ ok: false, mensaje: 'Crédito no encontrado' });
      }

      const completado = await creditoService.delete(req.params.id);
      if (!completado) {
        return res.status(400).json({ ok: false, mensaje: 'No se pudo eliminar el crédito' });
      }

      await audit(req, { accion: 'ELIMINAR_CREDITO', tabla: 'creditos', registroId: req.params.id, detalle: { monto: credito.monto } });
      return res.json({ ok: true, mensaje: 'Crédito eliminado correctamente' });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new CreditoController();
