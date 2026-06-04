const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class CreditoService {
  async listAll({ socioId, estado } = {}) {
    let sql = `
            SELECT c.id, c.socio_id as "socioId", c.monto, c.tasa_mensual as "tasaMensual", 
              c.cuotas, c.cuotas_pagadas as "cuotasPagadas", c.saldo_capital as "saldoCapital",
              c.fecha_desembolso as "fechaDesembolso", c.estado, c.proposito, 
              c.aprobado_por as "aprobadoPor", c.notas, c.created_at as "createdAt",
              s.nombre as "socioNombre", s.codigo_socio as "socioCodigo"
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

  calcularCuota(monto, tasaMensual, cuotas) {
    const montoNum = Number(monto) || 0;
    const tasaNum = Number(tasaMensual) || 0;
    const cuotasNum = Number(cuotas) || 0;
    if (cuotasNum <= 0) return 0;
    if (!tasaNum) return montoNum / cuotasNum;
    const i = tasaNum / 100;
    const cuota = (montoNum * i) / (1 - Math.pow(1 + i, -cuotasNum));
    return Number(cuota.toFixed(2));
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

  async payInstallment(id, numeroCuota = null) {
    return db.transaction(async (client) => {
      const creditoRes = await client.query(`
        SELECT id, socio_id, monto, tasa_mensual, cuotas, cuotas_pagadas, saldo_capital, estado
        FROM creditos
        WHERE id = $1
        FOR UPDATE
      `, [id]);
      const credito = creditoRes.rows[0];
      if (!credito) {
        return null;
      }

      const cuotasTotales = Number(credito.cuotas || 0);
      const cuotasPagadas = Number(credito.cuotas_pagadas || 0);
      const saldoCapital = Number(credito.saldo_capital || 0);
      if (cuotasTotales <= 0 || saldoCapital <= 0 || cuotasPagadas >= cuotasTotales) {
        return null;
      }

      const cuota = Number(this.calcularCuota(credito.monto, credito.tasa_mensual, cuotasTotales));
      const tasa = Number(credito.tasa_mensual || 0) / 100;
      const interes = Math.max(0, saldoCapital * tasa);
      let capital = Math.min(Math.max(0, cuota - interes), saldoCapital);
      const nuevasCuotasPagadas = Math.min(cuotasTotales, cuotasPagadas + 1);
      const isFinalPayment = nuevasCuotasPagadas >= cuotasTotales;
      if (isFinalPayment) {
        capital = saldoCapital; // liquidar todo lo que queda
      }
      let nuevoSaldo = isFinalPayment ? 0 : Math.max(0, saldoCapital - capital);
      // Persist as two decimals
      nuevoSaldo = Number(nuevoSaldo.toFixed(2));
      capital = Number(capital.toFixed(2));
      const interesRounded = Number(interes.toFixed(2));
      const nuevoEstado = isFinalPayment ? 'pagado' : (credito.estado === 'mora' ? 'mora' : 'activo');

      const res = await client.query(`
        UPDATE creditos
        SET cuotas_pagadas = $1,
          saldo_capital = $2,
          estado = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING id, socio_id as "socioId", monto, tasa_mensual as "tasaMensual", 
                  cuotas, cuotas_pagadas as "cuotasPagadas", saldo_capital as "saldoCapital",
                  fecha_desembolso as "fechaDesembolso", estado, proposito, aprobado_por as "aprobadoPor", notas, created_at as "createdAt"
      `, [nuevasCuotasPagadas, nuevoSaldo, nuevoEstado, id]);

      return res.rows[0];
    });
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
