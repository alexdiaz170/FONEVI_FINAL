// FONEVI — Ruta: Dashboard (/api/dashboard)
const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

// GET /api/dashboard/resumen
router.get('/resumen', requireAuth, async (req, res) => {
  try {
    const [socios, creditos, aportes] = await Promise.all([
      prisma.socio.findMany(),
      prisma.credito.findMany(),
      prisma.aporte.findMany(),
    ]);

    const totalAhorros  = socios.reduce((t, s) => t + Number(s.ahorroAcumulado), 0);
    const cartera       = creditos.filter(c => c.estado !== 'pagado').reduce((t, c) => t + Number(c.saldoCapital), 0);
    const creditosAct   = creditos.filter(c => c.estado === 'activo');
    const sociosMora    = socios.filter(s => s.estado === 'mora');
    const aportePagados = aportes.filter(a => a.estado === 'pagado');

    // Periodo actual
    const periodoActivo = await prisma.periodo.findFirst({ where: { activo: true } });
    const aportesPerAct = periodoActivo
      ? aportes.filter(a => a.periodoId === periodoActivo.id)
      : [];

    return res.json({ ok: true, datos: {
      socios: {
        total:   socios.length,
        activos: socios.filter(s => s.estado === 'activo').length,
        en_mora: sociosMora.length,
      },
      ahorros: { total: totalAhorros },
      creditos: {
        activos: creditosAct.length,
        cartera,
      },
      mora: { socios: sociosMora.length },
      aportes_mes: {
        pagados:          aportesPerAct.filter(a => a.estado === 'pagado').length,
        pendientes:       aportesPerAct.filter(a => a.estado === 'pendiente').length,
        en_mora:          aportesPerAct.filter(a => ['mora','vencido'].includes(a.estado)).length,
        total_recaudado:  aportePagados.reduce((t, a) => t + Number(a.monto), 0),
      },
    }});
  } catch (e) {
    console.error('[dashboard/resumen]', e);
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

// GET /api/dashboard/grafico-anual?anio=2026
router.get('/grafico-anual', requireAuth, async (req, res) => {
  try {
    const anio = parseInt(req.query.anio) || new Date().getFullYear();
    const aportes = await prisma.aporte.findMany({
      where: { estado: 'pagado', periodo: { anio } },
      include: { periodo: true },
    });
    const meses = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      total: aportes
        .filter(a => a.periodo?.mes === i + 1)
        .reduce((t, a) => t + Number(a.monto), 0)
    }));
    return res.json({ ok: true, datos: meses });
  } catch (e) {
    return res.status(500).json({ ok: false, mensaje: 'Error interno' });
  }
});

module.exports = router;
