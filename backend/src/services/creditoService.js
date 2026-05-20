const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class CreditoService {
  async listAll({ socioId, estado } = {}) {
    let sql = `
      SELECT c.id, c.socio_id as "socioId", c.monto, c.tasa_mensual as "tasaMensual", 
             c.cuotas, c.cuotas_pagadas as "cuotasPagadas", c.saldo_capital as "saldoCapital",
             c.fecha_desembolso as "fechaDesembolso", c.estado, c.proposito, 
             c.aprobado_por as "aprobadoPor", c.notas, c.created_at as "createdAt",
             s.nombre as "socioNombre"
      FROM creditos c
      JOIN socios s ON c.socio_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (socioId) {
      params.push(socioId);
      sql += ` AND c.socio_id = $${params.length}`;
    }
    if (estado) {
      params.push(estado);
      sql += ` AND c.estado = $${params.length}`;
    }
    sql += ` ORDER BY c.created_at DESC`;

    const res = await db.query(sql, params);
    return res.rows;
  }

  async findById(id) {
    const res = await db.query(`
      SELECT id, socio_id as "socioId", monto, tasa_mensual as "tasaMensual", 
             cuotas, cuotas_pagadas as "cuotasPagadas", saldo_capital as "saldoCapital",
             fecha_desembolso as "fechaDesembolso", estado, proposito, 
             aprobado_por as "aprobadoPor", notas, created_at as "createdAt"
      FROM creditos
      WHERE id = $1
    `, [id]);
    return res.rows[0] || null;
  }

  async create({ socioId, monto, tasaMensual, cuotas, cuotasPagadas = 0, saldoCapital, fechaDesembolso = new Date(), estado = 'activo', proposito = null, aprobadoPor = null, notas = null }) {
    const id = uuidv4();
    const query = `
      INSERT INTO creditos (id, socio_id, monto, tasa_mensual, cuotas, cuotas_pagadas, saldo_capital, fecha_desembolso, estado, proposito, aprobado_por, notas, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id, socio_id as "socioId", monto, tasa_mensual as "tasaMensual", 
                cuotas, cuotas_pagadas as "cuotasPagadas", saldo_capital as "saldoCapital",
                fecha_desembolso as "fechaDesembolso", estado, proposito, 
                aprobado_por as "aprobadoPor", notas, created_at as "createdAt"
    `;
    const res = await db.query(query, [
      id, socioId, monto, tasaMensual, cuotas, cuotasPagadas, saldoCapital || monto, fechaDesembolso, estado, proposito, aprobadoPor, notas
    ]);
    return res.rows[0];
  }

  async update(id, { monto, tasaMensual, cuotas, cuotasPagadas, saldoCapital, fechaDesembolso, estado, proposito, aprobadoPor, notas }) {
    const query = `
      UPDATE creditos
      SET monto = COALESCE($1, monto),
          tasa_mensual = COALESCE($2, tasa_mensual),
          cuotas = COALESCE($3, cuotas),
          cuotas_pagadas = COALESCE($4, cuotas_pagadas),
          saldo_capital = COALESCE($5, saldo_capital),
          fecha_desembolso = COALESCE($6, fecha_desembolso),
          estado = COALESCE($7, estado),
          proposito = COALESCE($8, proposito),
          aprobado_por = COALESCE($9, aprobado_por),
          notas = COALESCE($10, notas),
          updated_at = NOW()
      WHERE id = $11
      RETURNING id, socio_id as "socioId", monto, tasa_mensual as "tasaMensual", 
                cuotas, cuotas_pagadas as "cuotasPagadas", saldo_capital as "saldoCapital",
                fecha_desembolso as "fechaDesembolso", estado, proposito, 
                aprobado_por as "aprobadoPor", notas, created_at as "createdAt"
    `;
    const res = await db.query(query, [
      monto, tasaMensual, cuotas, cuotasPagadas, saldoCapital, fechaDesembolso, estado, proposito, aprobadoPor, notas, id
    ]);
    return res.rows[0] || null;
  }

  async delete(id) {
    const res = await db.query('DELETE FROM creditos WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  }
}

module.exports = new CreditoService();
