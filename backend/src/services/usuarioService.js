const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class UsuarioService {
  async findByEmail(email) {
    const sql = `
      SELECT u.*, s.id AS "socioId"
      FROM usuarios u
      LEFT JOIN socios s ON LOWER(u.email) = LOWER(s.email)
      WHERE LOWER(u.email) = $1
    `;
    const res = await db.query(sql, [email.trim().toLowerCase()]);
    return res.rows[0] || null;
  }

  async findById(id) {
    const sql = `
      SELECT u.id, u.nombre, u.email, u.rol, u.estado, u.avatar, u.created_at as "createdAt", s.id AS "socioId"
      FROM usuarios u
      LEFT JOIN socios s ON LOWER(u.email) = LOWER(s.email)
      WHERE u.id = $1
    `;
    const res = await db.query(sql, [id]);
    return res.rows[0] || null;
  }

  async listAll() {
    const res = await db.query('SELECT id, nombre, email, rol, estado, avatar, created_at as "createdAt" FROM usuarios ORDER BY nombre ASC');
    return res.rows;
  }

  async create({ nombre, email, password, rol = 'socio', estado = 'activo', avatar = null }) {
    const id = uuidv4();
    const query = `
      INSERT INTO usuarios (id, nombre, email, password, rol, estado, avatar, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, nombre, email, rol, estado, avatar, created_at as "createdAt"
    `;
    const res = await db.query(query, [id, nombre, email.trim().toLowerCase(), password, rol, estado, avatar]);
    return res.rows[0];
  }

  async update(id, { nombre, email, rol, estado, avatar }) {
    const query = `
      UPDATE usuarios
      SET nombre = COALESCE($1, nombre),
          email = COALESCE($2, email),
          rol = COALESCE($3, rol),
          estado = COALESCE($4, estado),
          avatar = COALESCE($5, avatar),
          updated_at = NOW()
      WHERE id = $6
      RETURNING id, nombre, email, rol, estado, avatar, created_at as "createdAt"
    `;
    const res = await db.query(query, [nombre, email?.trim().toLowerCase(), rol, estado, avatar, id]);
    return res.rows[0] || null;
  }

  async delete(id) {
    const res = await db.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  }

  async updatePassword(id, hash) {
    const res = await db.query('UPDATE usuarios SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING id', [hash, id]);
    return res.rowCount > 0;
  }
}

module.exports = new UsuarioService();
