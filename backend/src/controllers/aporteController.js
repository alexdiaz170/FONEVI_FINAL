const aporteService = require('../services/aporteService');
const db = require('../db');
const { audit } = require('../middleware/audit');
const { mapAporte } = require('../lib/mappings');

function normalizeQueryValue(value) {
  return value === undefined || value === null || value === '' || value === 'undefined' || value === 'null'
    ? undefined
    : value;
}

class AporteController {
  async list(req, res, next) {
    try {
      const pageValue  = normalizeQueryValue(req.query.page);
      const limitValue = normalizeQueryValue(req.query.limit);
      const page  = pageValue !== undefined ? parseInt(pageValue, 10) : undefined;
      const limit = limitValue !== undefined ? parseInt(limitValue, 10) : undefined;
      const result = await aporteService.listAll({
        socioId:   normalizeQueryValue(req.query.socioId),
        periodoId: normalizeQueryValue(req.query.periodoId),
        periodo:   normalizeQueryValue(req.query.periodo),
        estado:    normalizeQueryValue(req.query.estado),
        fecha:     normalizeQueryValue(req.query.fecha),
        metodo:    normalizeQueryValue(req.query.metodo),
        q:         normalizeQueryValue(req.query.q),
        page,
        limit,
      });
      const datos = result.datos.map(mapAporte);
      if (page !== undefined || limit !== undefined) {
        return res.json({
          ok: true,
          datos,
          total: result.total,
          totalPages: result.totalPages,
          page: result.page,
          limit: result.limit,
        });
      }
      return res.json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  async get(req, res, next) {
    try {
      const aporte = await aporteService.findById(req.params.id);
      if (!aporte) {
        return res.status(404).json({ ok: false, mensaje: 'Aporte no encontrado' });
      }
return res.json({ ok: true, datos: mapAporte(aporte) });
    } catch (e) {
      next(e);
    }
  }

  async create(req, res, next) {
    try {
      const { socioId, periodoId, monto, fechaPago, estado, metodo, notas, pago_solidaridad, pago_credito } = req.body;
      if (!socioId || !periodoId || !monto) {
        return res.status(400).json({ ok: false, mensaje: 'Campos requeridos faltantes (socioId, periodoId, monto)' });
      }

      let resolvedPeriodoId = periodoId;
      if (typeof periodoId === 'string') {
        const trimmed = periodoId.trim();
        if (/^\d+$/.test(trimmed)) {
          resolvedPeriodoId = parseInt(trimmed, 10);
        } else {
          const periodoRes = await db.query(
            'SELECT id FROM periodos WHERE nombre = $1 LIMIT 1',
            [trimmed]
          );
          if (!periodoRes.rows[0]) {
            return res.status(400).json({ ok: false, mensaje: 'Periodo desconocido: ' + periodoId });
          }
          resolvedPeriodoId = periodoRes.rows[0].id;
        }
      }

      const nuevoAporte = await aporteService.create({
        socioId, periodoId: resolvedPeriodoId, monto, fechaPago, estado, metodo, notas,
        pago_solidaridad: Number(pago_solidaridad || 0),
        pago_credito: Number(pago_credito || 0)
      });

      await audit(req, { accion: 'REGISTRAR_APORTE', tabla: 'aportes', registroId: nuevoAporte.id, detalle: { monto } });
      return res.status(201).json({ ok: true, datos: nuevoAporte });
    } catch (e) {
      next(e);
    }
  }

  async update(req, res, next) {
    try {
      const actualizado = await aporteService.update(req.params.id, req.body);
      if (!actualizado) {
        return res.status(404).json({ ok: false, mensaje: 'Aporte no encontrado' });
      }

      await audit(req, { accion: 'ACTUALIZAR_APORTE', tabla: 'aportes', registroId: actualizado.id, detalle: { monto: actualizado.monto } });
      return res.json({ ok: true, datos: actualizado });
    } catch (e) {
      next(e);
    }
  }

  async delete(req, res, next) {
    try {
      const aporte = await aporteService.findById(req.params.id);
      if (!aporte) {
        return res.status(404).json({ ok: false, mensaje: 'Aporte no encontrado' });
      }

      const completado = await aporteService.delete(req.params.id);
      if (!completado) {
        return res.status(400).json({ ok: false, mensaje: 'No se pudo eliminar el aporte' });
      }

      await audit(req, { accion: 'ELIMINAR_APORTE', tabla: 'aportes', registroId: req.params.id, detalle: { monto: aporte.monto } });
      return res.json({ ok: true, mensaje: 'Aporte eliminado correctamente' });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new AporteController();
