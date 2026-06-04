const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class AporteService {
  async listAll({ socioId, periodoId, periodo, estado, fecha, metodo, q, page, limit } = {}) {
    const isValid = (value) => value !== undefined && value !== null && value !== '' && value !== 'undefined' && value !== 'null';
    const params = [];
    let sql = `
      SELECT a.id,
             a.socio_id AS "socioId",
             a.periodo_id AS "periodoId",
             p.nombre AS "periodo",
             a.monto,
             a.pago_solidaridad,
             a.pago_credito,
             a.fecha_pago AS "fechaPago",
             a.estado,
             a.metodo,
             a.notas,
             a.created_at AS "createdAt",
             s.nombre AS "socioNombre"
      FROM aportes a
      JOIN socios s ON a.socio_id = s.id
      JOIN periodos p ON a.periodo_id = p.id
      WHERE 1=1
    `;

    if (isValid(socioId)) {
      params.push(socioId);
      sql += ` AND a.socio_id = $${params.length}`;
    }
    if (isValid(periodoId)) {
      params.push(periodoId);
      sql += ` AND a.periodo_id = $${params.length}`;
    } else if (isValid(periodo)) {
      params.push(periodo.trim());
      sql += ` AND LOWER(p.nombre) = LOWER($${params.length})`;
    }
    if (isValid(estado)) {
      params.push(estado);
      sql += ` AND a.estado = $${params.length}`;
    }
    if (isValid(fecha)) {
      params.push(fecha);
      sql += ` AND a.fecha_pago = $${params.length}`;
    }
    if (isValid(metodo)) {
      params.push(metodo);
      sql += ` AND a.metodo = $${params.length}`;
    }
    if (isValid(q)) {
      const term = '%' + q.trim().toLowerCase() + '%';
      params.push(term);
      const idx = params.length;
      sql += ` AND (LOWER(s.nombre) LIKE $${idx} OR LOWER(s.documento) LIKE $${idx} OR LOWER(p.nombre) LIKE $${idx})`;
    }

    sql += ` ORDER BY a.created_at DESC`;

    const usePagination = Number.isInteger(page) || Number.isInteger(limit);
    if (usePagination) {
      const pageNumber  = Number.isInteger(page) && page > 0 ? page : 1;
      const limitNumber = Number.isInteger(limit) && limit > 0 ? limit : 10;
      const offset      = (pageNumber - 1) * limitNumber;
      const paginatedSql = `
        SELECT sub.*, COUNT(*) OVER() AS total_count
        FROM (
          ${sql}
        ) AS sub
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `;
      params.push(limitNumber, offset);
      const res = await db.query(paginatedSql, params);
      const total = res.rows.length ? Number(res.rows[0].total_count || 0) : 0;
      const datos = res.rows.map((row) => {
        const record = { ...row };
        delete record.total_count;
        return record;
      });
      return {
        datos,
        total,
        totalPages: Math.max(1, Math.ceil(total / limitNumber)),
        page: pageNumber,
        limit: limitNumber,
      };
    }

    const res = await db.query(sql, params);
    return { datos: res.rows };
  }

  async findById(id) {
    const res = await db.query(`
      SELECT a.id, a.socio_id as "socioId", a.periodo_id as "periodoId", p.nombre as "periodo", a.monto, a.pago_solidaridad, a.pago_credito,
             a.fecha_pago as "fechaPago", a.estado, a.metodo, a.notas, a.created_at as "createdAt"
      FROM aportes a
      JOIN periodos p ON a.periodo_id = p.id
      WHERE a.id = $1
    `, [id]);
    return res.rows[0] || null;
  }

  async create({ socioId, periodoId, monto, fechaPago = null, estado = 'pendiente', metodo = null, notas = null, pago_solidaridad = 0, pago_credito = 0 }) {
    const id = uuidv4();
    const pagoSolid = Number(pago_solidaridad || 0);
    const pagoCred  = Number(pago_credito || 0);
    return await db.transaction(async (client) => {
      const query = `
        INSERT INTO aportes (id, socio_id, periodo_id, monto, pago_solidaridad, pago_credito, fecha_pago, estado, metodo, notas, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING id, socio_id as "socioId", periodo_id as "periodoId", monto, pago_solidaridad as "pago_solidaridad", pago_credito as "pago_credito",
                  fecha_pago as "fechaPago", estado, metodo, notas, created_at as "createdAt"
      `;
      const res = await client.query(query, [id, socioId, periodoId, monto, pagoSolid, pagoCred, fechaPago, estado, metodo, notas]);
      const aporte = res.rows[0];

      // Si hay aporte a solidaridad, registrar movimiento (ingreso al fondo)
      if (pagoSolid > 0) {
        const movId = uuidv4();
        await client.query(`
          INSERT INTO solidaridad_movimientos (id, tipo, descripcion, monto, fecha, beneficiario, created_at)
          VALUES ($1, 'ingreso', $2, $3, COALESCE($4, NOW()), $5, NOW())
        `, [movId, 'Aporte solidaridad — ' + socioId, pagoSolid, fechaPago || new Date(), socioId]);
      }

      // Si hay abono a crédito, aplicarlo al crédito activo más reciente
      if (pagoCred > 0) {
        // Lock the chosen credit row to avoid concurrent updates that could cause double-application of payments.
        // Using FOR UPDATE ensures that concurrent transactions attempting to modify the same credit will serialize.
        const credRes = await client.query(`SELECT id, saldo_capital FROM creditos WHERE socio_id = $1 AND estado <> 'pagado' ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, [socioId]);
        const credito = credRes.rows[0];
        if (credito) {
          const saldoActual = Number(credito.saldo_capital || 0);
          const aplicado = Math.min(saldoActual, pagoCred);
          const nuevoSaldo = Math.max(0, saldoActual - aplicado);
          const nuevoEstado = nuevoSaldo <= 0 ? 'pagado' : 'activo';
          await client.query(`UPDATE creditos SET saldo_capital = $1, estado = $2 WHERE id = $3`, [nuevoSaldo, nuevoEstado, credito.id]);
        }
      }

      // Actualizar ahorro acumulado: solo sumar la porción correspondiente al ahorro
      if (estado === 'pagado') {
        const sumaAhorro = Math.max(0, Number(monto) - pagoSolid - pagoCred);
        if (sumaAhorro > 0) {
          await client.query(`
            UPDATE socios
            SET ahorro_acumulado = ahorro_acumulado + $1
            WHERE id = $2
          `, [sumaAhorro, socioId]);
        }
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
