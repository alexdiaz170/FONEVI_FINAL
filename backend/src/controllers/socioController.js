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

  async estadoCuenta(req, res, next) {
    try {
      const page = Number.isInteger(parseInt(req.query.page, 10))
        ? parseInt(req.query.page, 10)
        : 1;
      const limit = Number.isInteger(parseInt(req.query.limit, 10))
        ? parseInt(req.query.limit, 10)
        : 10;
      const datos = await socioService.estadoCuenta(req.params.id, { page, limit });
      if (!datos) {
        return res.status(404).json({ ok: false, mensaje: 'Socio no encontrado' });
      }
      return res.json({ ok: true, datos });
    } catch (e) {
      next(e);
    }
  }

  async perfil(req, res, next) {
    try {
      // Requiere autenticación previa (middleware `requireAuth` establece `req.usuario`)
      if (!req.usuario) return res.status(401).json({ ok: false, mensaje: 'Token faltante' });

      const rol = (req.usuario.rol || '').toString().toLowerCase();
      if (rol !== 'socio') {
        return res.status(403).json({ ok: false, mensaje: 'No tienes permisos suficientes' });
      }

      const socioId = req.usuario.socioId || req.usuario.id;
      // =====================================================
      // VALIDAR ESTADO DEL SOCIO
      // =====================================================

      if (!socio) {
        return res.status(404).json({
          ok: false,
          codigo: 'SOCIO_NO_EXISTE',
          mensaje: 'El socio no existe.',
        });
      }

      const estadoSocio = (socio.estado || '').toLowerCase().trim();

      if (estadoSocio === 'mora' || estadoSocio === 'retirado' || estadoSocio === 'suspendido') {
        return res.status(400).json({
          ok: false,
          codigo: 'SOCIO_NO_HABILITADO',
          mensaje: `El socio se encuentra en estado "${socio.estado}" y no está habilitado para solicitar créditos.`,
        });
      }

      return res.json({
        ok: true,
        datos: {
          id: socio.id,
          codigo_socio: socio.codigo_socio || socio.codigo || null,
          nombre: socio.nombre,
          documento: socio.documento,
          estado: socio.estado,
          ahorro_acumulado: Number(socio.ahorroAcumulado || 0),
          departamento: socio.departamento,
          municipio: socio.municipio,
        },
      });
    } catch (e) {
      next(e);
    }
  }

  async create(req, res, next) {
    try {
      const {
        nombre,
        documento,
        email,
        telefono,
        fechaIngreso,
        aporteMensual,
        ahorroAcumulado,
        estado,
        cargo,
        sede,
        departamento,
        municipio,
      } = req.body;

      if (!nombre || !documento) {
        return res
          .status(400)
          .json({ ok: false, mensaje: 'Campos requeridos faltantes (nombre, documento)' });
      }

      // Validar duplicados
      const existeDoc = await socioService.findByDocumento(documento);
      if (existeDoc) {
        return res
          .status(400)
          .json({ ok: false, mensaje: 'Ya existe un socio con este documento' });
      }

      const nuevoSocio = await socioService.create({
        nombre,
        documento,
        email,
        telefono,
        fechaIngreso,
        aporteMensual,
        ahorroAcumulado,
        estado,
        cargo,
        sede,
        departamento,
        municipio,
      });

      await audit(req, {
        accion: 'CREAR_SOCIO',
        tabla: 'socios',
        registroId: nuevoSocio.id,
        detalle: { nombre: nuevoSocio.nombre },
      });
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

      await audit(req, {
        accion: 'ACTUALIZAR_SOCIO',
        tabla: 'socios',
        registroId: actualizado.id,
        detalle: { nombre: actualizado.nombre },
      });
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

      await audit(req, {
        accion: 'ELIMINAR_SOCIO',
        tabla: 'socios',
        registroId: socio.id,
        detalle: { nombre: socio.nombre },
      });
      return res.json({ ok: true, mensaje: 'Socio eliminado correctamente' });
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new SocioController();
