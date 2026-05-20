const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class AporteService {
  async listAll({ socioId, periodoId, estado } = {}) {
    let sql = `
      SELECT a.id, a.socio_id as "socioId", a.periodo_id as "periodoId", p.nombre as "periodo", a.monto, 
             a.fecha_pago as "fechaPago", a.estado, a.metodo, a.notas, a.created_at as "createdAt",
             s.nombre as "socioNombre"
      FROM aportes a
      JOIN socios s ON a.socio_id = s.id
      JOIN periodos p ON a.periodo_id = p.id
      WHERE 1=1
    `;
    const params = [];
    if (socioId) {
      params.push(socioId);
      sql += ` AND a.socio_id = $${params.length}`;
    }
    if (periodoId) {
      params.push(periodoId);
      sql += ` AND a.periodo_id = $${params.length}`;
    }
    if (estado) {
      params.push(estado);
      sql += ` AND a.estado = $${params.length}`;
    }
    sql += ` ORDER BY a.created_at DESC`;

    const res = await db.query(sql, params);
    return res.rows;
  }

  async findById(id) {
    const res = await db.query(`
      SELECT a.id, a.socio_id as "socioId", a.periodo_id as "periodoId", p.nombre as "periodo", a.monto, 
             a.fecha_pago as "fechaPago", a.estado, a.metodo, a.notas, a.created_at as "createdAt"
      FROM aportes a
      JOIN periodos p ON a.periodo_id = p.id
      WHERE a.id = $1
    `, [id]);
    return res.rows[0] || null;
  }

  async create({ socioId, periodoId, monto, fechaPago = null, estado = 'pendiente', metodo = null, notas = null }) {
    const id = uuidv4();
    return await db.transaction(async (client) => {
      const query = `
        INSERT INTO aportes (id, socio_id, periodo_id, monto, fecha_pago, estado, metodo, notas, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id, socio_id as "socioId", periodo_id as "periodoId", monto, 
                  fecha_pago as "fechaPago", estado, metodo, notas, created_at as "createdAt"
      `;
      const res = await client.query(query, [id, socioId, periodoId, monto, fechaPago, estado, metodo, notas]);
      const aporte = res.rows[0];

      if (estado === 'pagado') {
        await client.query(`
          UPDATE socios
          SET ahorro_acumulado = ahorro_acumulado + $1
          WHERE id = $2
        `, [monto, socioId]);
      }

      return aporte;
    });
  }

  async update(id, { monto, fechaPago, estado, metodo, notas }) {
    return await db.transaction(async (client) => {
      const curRes = await client.query('SELECT socio_id, monto, estado FROM aportes WHERE id = $1', [id]);
      const cur = curRes.rows[0];
      if (!cur) return null;

      const query = `
        UPDATE aportes
        SET monto = COALESCE($1, monto),
            fecha_pago = COALESCE($2, fecha_pago),
            estado = COALESCE($3, estado),
            metodo = COALESCE($4, metodo),
            notas = COALESCE($5, notas),
            updated_at = NOW()
        WHERE id = $6
        RETURNING id, socio_id as "socioId", periodo_id as "periodoId", monto, 
                  fecha_pago as "fechaPago", estado, metodo, notas, created_at as "createdAt"
      `;
      const res = await client.query(query, [monto, fechaPago, estado, metodo, notas, id]);
      const updated = res.rows[0];

      const oldPaid = cur.estado === 'pagado';
      const newPaid = (estado || cur.estado) === 'pagado';
      const oldMonto = parseFloat(cur.monto);
      const newMonto = monto !== undefined ? parseFloat(monto) : oldMonto;

      if (!oldPaid && newPaid) {
        await client.query('UPDATE socios SET ahorro_acumulado = ahorro_acumulado + $1 WHERE id = $2', [newMonto, cur.socio_id]);
      } else if (oldPaid && !newPaid) {
        await client.query('UPDATE socios SET ahorro_acumulado = ahorro_acumulado - $1 WHERE id = $2', [oldMonto, cur.socio_id]);
      } else if (oldPaid && newPaid && oldMonto !== newMonto) {
        const diff = newMonto - oldMonto;
        await client.query('UPDATE socios SET ahorro_acumulado = ahorro_acumulado + $1 WHERE id = $2', [diff, cur.socio_id]);
      }

      return updated;
    });
  }

  async delete(id) {
    return await db.transaction(async (client) => {
      const curRes = await client.query('SELECT socio_id, monto, estado FROM aportes WHERE id = $1', [id]);
      const cur = curRes.rows[0];
      if (!cur) return false;

      const res = await client.query('DELETE FROM aportes WHERE id = $1 RETURNING id', [id]);
      const deleted = res.rowCount > 0;

      if (deleted && cur.estado === 'pagado') {
        await client.query('UPDATE socios SET ahorro_acumulado = ahorro_acumulado - $1 WHERE id = $2', [parseFloat(cur.monto), cur.socio_id]);
      }

      return deleted;
    });
  }
}

module.exports = new AporteService();
