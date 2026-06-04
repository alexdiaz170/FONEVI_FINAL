const { v4: uuidv4 } = require('uuid');

async function createPeriodo(pool, nombre = `TestPeriodo ${Date.now()}`) {
  const res = await pool.query('INSERT INTO periodos (nombre, anio, mes, activo, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id', [nombre, 2026, 1, false]);
  return res.rows[0].id;
}

async function createSocio(pool, overrides = {}) {
  const id = overrides.id || uuidv4();
  const codigo = overrides.codigo || `T-${Date.now()}`;
  const nombre = overrides.nombre || 'Test Socio';
  const documento = overrides.documento || id.slice(0,10);
  await pool.query('INSERT INTO socios (id, codigo, nombre, documento, fecha_ingreso, aporte_mensual, ahorro_acumulado, estado, created_at, updated_at) VALUES ($1,$2,$3,$4,NOW(),$5,$6,$7,NOW(),NOW()) ON CONFLICT (id) DO NOTHING', [id, codigo, nombre, documento, overrides.aporte_mensual || 100000, overrides.ahorro_acumulado || 0, overrides.estado || 'activo']);
  return id;
}

async function createCredito(pool, socioId, saldo = 1000) {
  const id = uuidv4();
  await pool.query('INSERT INTO creditos (id, socio_id, monto, tasa_mensual, cuotas, cuotas_pagadas, saldo_capital, fecha_desembolso, estado, created_at, updated_at) VALUES ($1,$2,$3,1,12,0,$4,NOW(),$5,NOW(),NOW())', [id, socioId, saldo, saldo, 'activo']);
  return id;
}

module.exports = { createPeriodo, createSocio, createCredito };
