const socioService = require('../services/socioService');
const { audit } = require('../middleware/audit');
const { mapSocio } = require('../lib/mappings');

class SocioController {
  async list(req, res, next) {
    try {
const socios = await socioService.listAll();
    const datos = socios.map(mapSocio);
    return res.json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  async get(req, res, next) {
    try {
      const socio = await socioService.findByIdOrCodigo(req.params.id);
      if (!socio) {
        return res.status(404).json({ ok: false, mensaje: 'Socio no encontrado' });
      }
      return res.json({ ok: true, datos: mapSocio(socio) });
    } catch (e) {
      next(e);
    }
  }

  async create(req, res, next) {
    try {
      const { id, codigo, nombre, documento, email, telefono, fechaIngreso, aporteMensual, ahorroAcumulado, estado, cargo, sede } = req.body;
      
      if (!id || !codigo || !nombre || !documento) {
        return res.status(400).json({ ok: false, mensaje: 'Campos requeridos faltantes (id, codigo, nombre, documento)' });
      }

      // Validar duplicados
      const existeDoc = await socioService.findByDocumento(documento);
      if (existeDoc) {
        return res.status(400).json({ ok: false, mensaje: 'Ya existe un socio con este documento' });
      }

      const nuevoSocio = await socioService.create({
        id, codigo, nombre, documento, email, telefono, fechaIngreso, aporteMensual, ahorroAcumulado, estado, cargo, sede
      });

      await audit(req, { accion: 'CREAR_SOCIO', tabla: 'socios', registroId: nuevoSocio.id, detalle: { nombre: nuevoSocio.nombre } });
      return res.status(201).json({ ok: true, datos: nuevoSocio });
    } catch (e) {
      next(e);
    }
  }

  async update(req, res, next) {
    try {
      const actualizado = await socioService.update(req.params.id, req.body);
      if (!actualizado) {
        return res.status(404).json({ ok: false, mensaje: 'Socio no encontrado' });
      }

      await audit(req, { accion: 'ACTUALIZAR_SOCIO', tabla: 'socios', registroId: actualizado.id, detalle: { nombre: actualizado.nombre } });
      return res.json({ ok: true, datos: actualizado });
    } catch (e) {
      next(e);
    }
  }

  async delete(req, res, next) {
    try {
      const socio = await socioService.findByIdOrCodigo(req.params.id);
      if (!socio) {
        return res.status(404).json({ ok: false, mensaje: 'Socio no encontrado' });
      }

      const completado = await socioService.delete(socio.id);
      if (!completado) {
        return res.status(400).json({ ok: false, mensaje: 'No se pudo eliminar el socio' });
      }

      await audit(req, { accion: 'ELIMINAR_SOCIO', tabla: 'socios', registroId: socio.id, detalle: { nombre: socio.nombre } });
      return res.json({ ok: true, mensaje: 'Socio eliminado correctamente' });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new SocioController();
