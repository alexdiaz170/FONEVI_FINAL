const db = require('../db');
const bcrypt = require('bcryptjs');
const aporteService = require('./aporteService');
const creditoService = require('./creditoService');

function generarPasswordInicial(documento) {
  const texto = String(documento || '').trim();
  if (!texto) return 'fono1234';
  return texto.length > 4 ? texto.slice(-4) : texto;
}

async function generarCodigoSocio(db) {
  // Busca el mayor sufijo numérico en codigo_socio con formato SOC-####
  const q = `SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_socio FROM 5) AS INTEGER)), 0) AS maxn FROM socios WHERE codigo_socio ~ '^SOC-\\d{4}$'`;
  const r = await db.query(q);
  const maxn = (r.rows && r.rows[0] && r.rows[0].maxn) ? Number(r.rows[0].maxn) : 0;
  const next = (maxn + 1).toString().padStart(4, '0');
  return 'SOC-' + next;
}

class SocioService {
  async listAll() {
    const res = await db.query(`
      SELECT
             s.id,
             s.codigo,
             s.codigo_socio,
             s.nombre,
             s.documento,
             s.email,
             s.telefono,
             s.fecha_ingreso as "fechaIngreso",
             s.aporte_mensual as "aporteMensual",
             s.ahorro_acumulado as "ahorroAcumulado",
             CASE
               WHEN EXISTS (
                 SELECT 1
                 FROM aportes a
                 WHERE a.socio_id = s.id
                 AND a.estado IN ('mora','vencido')
               )
               THEN 'mora'
               ELSE 'activo'
             END as estado,
             s.cargo,
             s.sede,
             s.created_at as "createdAt"
      FROM socios s
      ORDER BY s.nombre ASC
    `);
    return res.rows;
  }

  async findByIdOrCodigo(idOrCodigo) {
    const res = await db.query(`
      SELECT id, codigo, codigo_socio, nombre, documento, email, telefono, 
             fecha_ingreso as "fechaIngreso", 
             aporte_mensual as "aporteMensual", 
             ahorro_acumulado as "ahorroAcumulado", 
             estado, cargo, sede, created_at as "createdAt"
      FROM socios
      WHERE id = $1 OR codigo = $1 OR codigo_socio = $1
    `, [idOrCodigo]);
    return res.rows[0] || null;
  }

  async findByDocumento(doc) {
    const res = await db.query('SELECT id FROM socios WHERE documento = $1', [doc]);
    return res.rows[0] || null;
  }

  async findByEmailOrDocumento(identifier) {
    const valor = String(identifier || '').trim();
    const res = await db.query(`
      SELECT id, codigo, nombre, documento, email, telefono, 
             fecha_ingreso as "fechaIngreso", 
             aporte_mensual as "aporteMensual", 
             ahorro_acumulado as "ahorroAcumulado", 
             estado, cargo, sede, password, acceso_activo as "accesoActivo", ultimo_login as "ultimoLogin"
      FROM socios
      WHERE LOWER(email) = LOWER($1)
         OR documento = $2
      LIMIT 1
    `, [valor, valor]);
    return res.rows[0] || null;
  }

  async estadoCuenta(idOrCodigo, { page = 1, limit = 10 } = {}) {
    const socio = await this.findByIdOrCodigo(idOrCodigo);
    if (!socio) return null;

    const aportes = await aporteService.listAll({ socioId: socio.id, page, limit });
    const creditos = await creditoService.listAll({ socioId: socio.id });
    const pagosCreditoRes = await db.query(
      `SELECT a.id, a.pago_credito AS "monto", a.fecha_pago AS "fechaPago", a.estado, a.metodo, a.notas, a.created_at AS "createdAt"
       FROM aportes a
       WHERE a.socio_id = $1 AND a.pago_credito > 0
       ORDER BY a.fecha_pago DESC NULLS LAST, a.created_at DESC`,
      [socio.id]
    );
    const solidaridadRes = await db.query(
      `SELECT id, tipo, descripcion, monto, fecha, beneficiario, created_at AS "createdAt"
       FROM solidaridad_movimientos
       WHERE beneficiario = $1
       ORDER BY fecha DESC NULLS LAST, created_at DESC`,
      [socio.id]
    );
    const totalsRes = await db.query(
      `SELECT
         COALESCE(SUM(CASE WHEN estado = 'pagado' THEN monto END), 0) AS total_aportado,
         COALESCE((SELECT SUM(monto) FROM creditos WHERE socio_id = $1), 0) AS total_creditos,
         COALESCE((SELECT SUM(pago_credito) FROM aportes WHERE socio_id = $1), 0) AS total_pagado,
         COALESCE((SELECT SUM(saldo_capital) FROM creditos WHERE socio_id = $1 AND estado <> 'pagado'), 0) AS saldo_pendiente
       FROM aportes
       WHERE socio_id = $1`,
      [socio.id]
    );
    const totals = totalsRes.rows[0] || {};

    return {
      socio,
      resumen: {
        totalAportado: Number(totals.total_aportado || 0),
        totalCreditos: Number(totals.total_creditos || 0),
        totalPagado: Number(totals.total_pagado || 0),
        saldoPendiente: Number(totals.saldo_pendiente || 0),
        ahorroAcumulado: Number(socio.ahorroAcumulado || 0),
      },
      aportes,
      creditos,
      pagosCredito: pagosCreditoRes.rows.map(function(r){ return r; }),
      solidaridad: solidaridadRes.rows.map(function(r){ return r; }),
    };
  }

  async create({ id, codigo, nombre, documento, email = null, telefono = null, fechaIngreso = new Date(), aporteMensual = 0, ahorroAcumulado = 0, estado = 'activo', cargo = null, sede = null, codigo_socio = null }) {
    const rawPassword = generarPasswordInicial(documento);
    const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
    const passwordHash = await bcrypt.hash(rawPassword, rounds);

    // Generar codigo_socio si no fue provisto
    let codigoSocioFinal = codigo_socio;
    if (!codigoSocioFinal) {
      codigoSocioFinal = await generarCodigoSocio(db);
    }

    const query = `
      INSERT INTO socios (id, codigo, codigo_socio, nombre, documento, email, telefono, fecha_ingreso, aporte_mensual, ahorro_acumulado, estado, password, acceso_activo, ultimo_login, cargo, sede, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING id, codigo, codigo_socio, nombre, documento, email, telefono, 
                fecha_ingreso as "fechaIngreso", 
                aporte_mensual as "aporteMensual", 
                ahorro_acumulado as "ahorroAcumulado", 
                estado, cargo, sede, created_at as "createdAt"
    `;
    const res = await db.query(query, [
      id,
      codigo,
      codigoSocioFinal,
      nombre,
      documento,
      email,
      telefono,
      fechaIngreso,
      aporteMensual,
      ahorroAcumulado,
      estado,
      passwordHash,
      true,
      null,
      cargo,
      sede
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
