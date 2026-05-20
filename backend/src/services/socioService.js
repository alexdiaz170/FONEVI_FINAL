const db = require('../db');

class SocioService {
  async listAll() {
    const res = await db.query(`
      SELECT id, codigo, nombre, documento, email, telefono, 
             fecha_ingreso as "fechaIngreso", 
             aporte_mensual as "aporteMensual", 
             ahorro_acumulado as "ahorroAcumulado", 
             estado, cargo, sede, created_at as "createdAt"
      FROM socios
      ORDER BY nombre ASC
    `);
    return res.rows;
  }

  async findByIdOrCodigo(idOrCodigo) {
    const res = await db.query(`
      SELECT id, codigo, nombre, documento, email, telefono, 
             fecha_ingreso as "fechaIngreso", 
             aporte_mensual as "aporteMensual", 
             ahorro_acumulado as "ahorroAcumulado", 
             estado, cargo, sede, created_at as "createdAt"
      FROM socios
      WHERE id = $1 OR codigo = $1
    `, [idOrCodigo]);
    return res.rows[0] || null;
  }

  async findByDocumento(doc) {
    const res = await db.query('SELECT id FROM socios WHERE documento = $1', [doc]);
    return res.rows[0] || null;
  }

  async create({ id, codigo, nombre, documento, email = null, telefono = null, fechaIngreso = new Date(), aporteMensual = 0, ahorroAcumulado = 0, estado = 'activo', cargo = null, sede = null }) {
    const query = `
      INSERT INTO socios (id, codigo, nombre, documento, email, telefono, fecha_ingreso, aporte_mensual, ahorro_acumulado, estado, cargo, sede, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING id, codigo, nombre, documento, email, telefono, 
                fecha_ingreso as "fechaIngreso", 
                aporte_mensual as "aporteMensual", 
                ahorro_acumulado as "ahorroAcumulado", 
                estado, cargo, sede, created_at as "createdAt"
    `;
    const res = await db.query(query, [
      id, codigo, nombre, documento, email, telefono, fechaIngreso, aporteMensual, ahorroAcumulado, estado, cargo, sede
    ]);
    return res.rows[0];
  }

  async update(id, { nombre, email, telefono, fechaIngreso, aporteMensual, ahorroAcumulado, estado, cargo, sede }) {
    const query = `
      UPDATE socios
      SET nombre = COALESCE($1, nombre),
          email = COALESCE($2, email),
          telefono = COALESCE($3, telefono),
          fecha_ingreso = COALESCE($4, fecha_ingreso),
          aporte_mensual = COALESCE($5, aporte_mensual),
          ahorro_acumulado = COALESCE($6, ahorro_acumulado),
          estado = COALESCE($7, estado),
          cargo = COALESCE($8, cargo),
          sede = COALESCE($9, sede),
          updated_at = NOW()
      WHERE id = $10
      RETURNING id, codigo, nombre, documento, email, telefono, 
                fecha_ingreso as "fechaIngreso", 
                aporte_mensual as "aporteMensual", 
                ahorro_acumulado as "ahorroAcumulado", 
                estado, cargo, sede, created_at as "createdAt"
    `;
    const res = await db.query(query, [
      nombre, email, telefono, fechaIngreso, aporteMensual, ahorroAcumulado, estado, cargo, sede, id
    ]);
    return res.rows[0] || null;
  }

  async delete(id) {
    const res = await db.query('DELETE FROM socios WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  }
}

module.exports = new SocioService();
