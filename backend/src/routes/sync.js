// FONEVI — Ruta: Sync (/api/sync)
const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { mapSocio, mapAporte, mapCredito } = require('../lib/mappings');

// GET /api/sync/all
router.get('/all', requireAuth, async (req, res) => {
  try {
    const [socios, aportes, creditos, config, solidaridad, movimientos, notificaciones] = await Promise.all([
      prisma.socio.findMany({ orderBy: { nombre: 'asc' } }),
      prisma.aporte.findMany({
        include: { 
          socio: { select: { nombre: true, codigo: true, documento: true } },
          periodo: { select: { nombre: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.credito.findMany({
        include: { socio: { select: { nombre: true, codigo: true, documento: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.configuracion.findMany(),
      prisma.solidaridadMovimiento.findMany({ orderBy: { fecha: 'desc' } }),
      prisma.movimiento.findMany({ orderBy: { fecha: 'desc' } }),
      prisma.notificacion.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);

    const configObj = {};
    config.forEach(c => {
       configObj[c.clave] = isNaN(c.valor) ? c.valor : parseFloat(c.valor);
    });

    const saldosolidaridad = solidaridad.reduce((t, m) => t + (m.tipo === 'ingreso' ? Number(m.monto) : -Number(m.monto)), 0);

    return res.json({
      ok: true,
      datos: {
        socios: socios.map(mapSocio),
        aportes: aportes.map(mapAporte),
        creditos: creditos.map(mapCredito),
        config: configObj,
        solidaridad: {
          saldo_actual: saldosolidaridad,
          movimientos: solidaridad.map(m => ({ ...m, monto: Number(m.monto) }))
        },
        movimientos: movimientos.map(m => ({ ...m, monto: Number(m.monto) })),
        notificaciones: notificaciones
      }
    });
  } catch (e) {
    console.error('[sync/all] Error crítico:', e);
    return res.status(500).json({ ok: false, mensaje: 'Error en sincronización' });
  }
});

module.exports = router;
