const express = require("express");
const router = express.Router();
const { prisma } = require("../lib/prisma");

// GET /api/movimientos — Obtener todos los movimientos contables
router.get("/", async (req, res) => {
  try {
    const { tipo, categoria } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;
    if (categoria) where.categoria = categoria;

    const movs = await prisma.movimiento.findMany({
      where,
      orderBy: { fecha: "desc" },
    });

    res.json({ ok: true, datos: movs });
  } catch (error) {
    console.error("[Movimientos] Error al listar:", error);
    res.status(500).json({ ok: false, mensaje: "Error al listar movimientos contables" });
  }
});

// POST /api/movimientos — Registrar un movimiento manual (contabilidad general)
router.post("/", async (req, res) => {
  try {
    const { tipo, categoria, descripcion, monto, fecha } = req.body;

    if (!tipo || !categoria || !descripcion || !monto || !fecha) {
      return res.status(400).json({ ok: false, mensaje: "Faltan campos requeridos" });
    }

    if (tipo !== "ingreso" && tipo !== "egreso") {
      return res.status(400).json({ ok: false, mensaje: "Tipo de movimiento inválido" });
    }

    const nuevo = await prisma.movimiento.create({
      data: {
        tipo,
        categoria,
        descripcion,
        monto: parseFloat(monto),
        fecha: new Date(fecha),
      },
    });

    if (req.audit) {
      await req.audit(`Registro ${tipo} contable`, "Movimiento", nuevo.id, { monto: nuevo.monto, categoria });
    }

    res.json({ ok: true, datos: nuevo, mensaje: "Movimiento registrado" });
  } catch (error) {
    console.error("[Movimientos] Error al crear:", error);
    res.status(500).json({ ok: false, mensaje: "Error al registrar movimiento" });
  }
});

// DELETE /api/movimientos/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.movimiento.delete({ where: { id } });
    if (req.audit) {
      await req.audit("Eliminar movimiento", "Movimiento", id, {});
    }
    res.json({ ok: true, mensaje: "Movimiento eliminado" });
  } catch (error) {
    console.error("[Movimientos] Error al eliminar:", error);
    res.status(500).json({ ok: false, mensaje: "Error al eliminar" });
  }
});

module.exports = router;
