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
      return res.json({ ok: true, datos: mapCredito(credito) });
    } catch (e) {
      next(e);
    }
  }

  // GET /api/creditos/simular
  // Query params: monto, cuotas, tasaMensual
  // Devuelve cálculos en memoria reutilizando CreditoService.calcularCuota()
  async simular(req, res, next) {
    try {
      const monto = Number(req.query.monto);
      const cuotas = Number(req.query.cuotas);
      const tasaMensual = req.query.tasaMensual !== undefined ? Number(req.query.tasaMensual) : 0;

      // Validaciones
      if (isNaN(monto) || isNaN(cuotas) || isNaN(tasaMensual) || monto <= 0 || cuotas <= 0 || tasaMensual < 0) {
        return res.status(400).json({ ok: false, mensaje: 'Parámetros inválidos' });
      }

      const cuota = creditoService.calcularCuota(monto, tasaMensual, cuotas);
      const cuotaMensual = Math.round(cuota);
      const totalPagar = Math.round(cuota * cuotas);
      const totalIntereses = Math.round(totalPagar - monto);

      return res.json({
        ok: true,
        simulacion: {
          monto,
          cuotas,
          tasaMensual,
          cuotaMensual,
          totalPagar,
          totalIntereses
        }
      });
    } catch (e) {
      next(e);
    }
  }

  async create(req, res, next) {
    try {
      const { socioId, monto, tasaMensual, cuotas, cuotasPagadas, saldoCapital, fechaDesembolso, estado, proposito, aprobadoPor, notas } = req.body;
      const montoNum = Number(monto);
      const tasaNum = Number(tasaMensual);
      const cuotasNum = Number(cuotas);
      const cuotasPagadasNum = Number(cuotasPagadas) || 0;
      const saldoCapitalNum = (saldoCapital !== undefined && saldoCapital !== null) ? Number(saldoCapital) : montoNum;
      const fechaValida = fechaDesembolso && !isNaN(new Date(fechaDesembolso).getTime())
        ? fechaDesembolso
        : new Date();

      if (!socioId || isNaN(montoNum) || montoNum <= 0 || isNaN(tasaNum) || tasaNum < 0 || !Number.isInteger(cuotasNum) || cuotasNum <= 0) {
        return res.status(400).json({ ok: false, mensaje: 'Campos requeridos faltantes o inválidos (socioId, monto, tasaMensual, cuotas)' });
      }

      const nuevoCredito = await creditoService.create({
        socioId,
        monto: montoNum,
        tasaMensual: tasaNum,
        cuotas: cuotasNum,
        cuotasPagadas: cuotasPagadasNum,
        saldoCapital: saldoCapitalNum,
        fechaDesembolso: fechaValida,
        estado,
        proposito,
        aprobadoPor,
        notas
      });

      await audit(req, { accion: 'APROBAR_CREDITO', tabla: 'creditos', registroId: nuevoCredito.id, detalle: { monto: montoNum } });
      return res.status(201).json({ ok: true, datos: mapCredito(nuevoCredito) });
    } catch (e) {
      next(e);
    }
  }

  async payInstallment(req, res, next) {
    try {
      const { numero_cuota } = req.body;
      const actualizado = await creditoService.payInstallment(req.params.id, numero_cuota);
      if (!actualizado) {
        return res.status(404).json({ ok: false, mensaje: 'Crédito no encontrado o ya pagado' });
      }

      await audit(req, { accion: 'PAGO_CUOTA', tabla: 'creditos', registroId: actualizado.id, detalle: { numero_cuota } });
      return res.json({ ok: true, datos: mapCredito(actualizado) });
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
      return res.json({ ok: true, datos: mapCredito(actualizado) });
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
