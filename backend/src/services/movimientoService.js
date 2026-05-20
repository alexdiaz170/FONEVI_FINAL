const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class MovimientoService {
  async listAll({ tipo, categoria } = {}) {
    let sql = `
      SELECT id, tipo, categoria, descripcion, monto, fecha, created_at as "createdAt"
      FROM movimientos
      WHERE 1=1
    `;
    const params = [];
    if (tipo) {
      params.push(tipo);
      sql += ` AND tipo = $${params.length}`;
    }
    if (categoria) {
      params.push(categoria);
      sql += ` AND categoria = $${params.length}`;
    }
    sql += ` ORDER BY fecha DESC`;

    const res = await db.query(sql, params);
    return res.rows;
  }

  async findById(id) {
    const res = await db.query(`
      SELECT id, tipo, categoria, descripcion, monto, fecha, created_at as "createdAt"
      FROM movimientos
      WHERE id = $1
    `, [id]);
    return res.rows[0] || null;
  }

  async create({ tipo, categoria, descripcion, monto, fecha = new Date() }) {
    const id = uuidv4();
    const query = `
      INSERT INTO movimientos (id, tipo, categoria, descripcion, monto, fecha, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, tipo, categoria, descripcion, monto, fecha, created_at as "createdAt"
    `;
    const res = await db.query(query, [id, tipo, categoria, descripcion, monto, fecha]);
    return res.rows[0];
  }

  async update(id, { tipo, categoria, descripcion, monto, fecha }) {
    const query = `
      UPDATE movimientos
      SET tipo = COALESCE($1, tipo),
          categoria = COALESCE($2, categoria),
          descripcion = COALESCE($3, descripcion),
          monto = COALESCE($4, monto),
          fecha = COALESCE($5, fecha)
      WHERE id = $6
      RETURNING id, tipo, categoria, descripcion, monto, fecha, created_at as "createdAt"
    `;
    const res = await db.query(query, [tipo, categoria, descripcion, monto, fecha, id]);
    return res.rows[0] || null;
  }

  async delete(id) {
    const res = await db.query('DELETE FROM movimientos WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  }
}

module.exports = new MovimientoService();
