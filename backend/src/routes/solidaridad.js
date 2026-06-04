const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

// GET /api/solidaridad/movimientos — Obtener todos los movimientos
router.get("/movimientos", requireAuth, async (req, res) => {
  try {
    const query = { orderBy: { fecha: "desc" } };
    if (req.query.beneficiario) {
      query.where = { beneficiario: req.query.beneficiario };
    }
    const movs = await prisma.solidaridadMovimiento.findMany(query);
    res.json({ ok: true, datos: movs });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al listar movimientos" });
  }
});

// GET /api/solidaridad/saldo — Obtener el saldo actual
router.get("/saldo", requireAuth, async (req, res) => {
  try {
    const aggs = await prisma.solidaridadMovimiento.groupBy({
      by: ["tipo"],
      _sum: { monto: true },
    });
    let ingresos = 0; let egresos = 0;
    aggs.forEach((agg) => {
      if (agg.tipo === "ingreso") ingresos += Number(agg._sum.monto || 0);
      if (agg.tipo === "egreso") egresos += Number(agg._sum.monto || 0);
    });
    res.json({ ok: true, saldo_actual: ingresos - egresos });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: "Error al calcular saldo" });
  }
});

// POST /api/solidaridad/movimientos — Registrar un ingreso o egreso
router.post("/movimientos", requireAuth, async (req, res) => {
  try {
    const { tipo, descripcion, monto, fecha, beneficiario } = req.body;
    if (!tipo || !descripcion || !monto) {
      return res.status(400).json({ ok: false, mensaje: "Faltan campos" });
    }

    const nuevo = await prisma.solidaridadMovimiento.create({
      data: {
        tipo,
        descripcion,
        monto: parseFloat(monto),
        fecha: fecha ? new Date(fecha) : new Date(),
        beneficiario: beneficiario || null,
      },
    });

    res.status(201).json({ ok: true, datos: { ...nuevo, monto: Number(nuevo.monto) } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: "Error al registrar movimiento" });
  }
});

module.exports = router;
