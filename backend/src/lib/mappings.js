// FONEVI — Data mappings for frontend-backend compatibility
// Ensures frontend receives expected identifiers and name fields.

function mapSocio(s) {
  if (!s) return null;
  return {
    id: s.documento, // Primary ID for frontend
    codigo: s.codigo,
    nombre: s.nombre,
    documento: s.documento,
    email: s.email,
    telefono: s.telefono,
    fecha_ingreso: s.fechaIngreso,
    aporte_mensual: Number(s.aporteMensual),
    ahorro_acumulado: Number(s.ahorroAcumulado),
    estado: s.estado,
    cargo: s.cargo,
    sede: s.sede,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
    // flat name fallback for legacy rows
    socio_nombre: s.nombre,
  };
}

function mapAporte(a) {
  if (!a) return null;
  return {
    id: a.id,
    socio_id: a.socio?.documento || a.socioId,
    periodo_id: a.periodoId,
    // Prefer nested name, fallback to flat columns
    periodoNombre: a.periodo?.nombre || a.periodoNombre,
    monto: Number(a.monto),
    fecha_pago: a.fechaPago,
    estado: a.estado,
    metodo: a.metodo,
    notas: a.notas,
    socio_nombre: a.socio?.nombre || a.socioNombre,
    created_at: a.createdAt,
  };
}

function mapCredito(c) {
  if (!c) return null;
  return {
    id: c.id,
    socio_id: c.socio?.documento || c.socioId,
    monto: Number(c.monto),
    tasa_mensual: Number(c.tasaMensual),
    cuotas: c.cuotas,
    cuotas_pagadas: c.cuotasPagadas,
    saldo_capital: Number(c.saldoCapital),
    fecha_desembolso: c.fechaDesembolso,
    estado: c.estado,
    proposito: c.proposito,
    aprobado_por: c.aprobadoPor,
    socio_nombre: c.socio?.nombre || c.socioNombre,
    created_at: c.createdAt,
  };
}

module.exports = { mapSocio, mapAporte, mapCredito };
// Duplicate legacy mapping definitions removed

function mapSocio(s) {
  if (!s) return null;
  return {
    id: s.documento, // El ID principal para el frontend es el documento
    codigo: s.codigo,
    nombre: s.nombre,
    documento: s.documento,
    email: s.email,
    telefono: s.telefono,
    fecha_ingreso: s.fechaIngreso,
    aporte_mensual: Number(s.aporteMensual),
    ahorro_acumulado: Number(s.ahorroAcumulado),
    estado: s.estado,
    cargo: s.cargo,
    sede: s.sede,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

function mapAporte(a) {
  if (!a) return null;
  const periodoNombre = a.periodo?.nombre || a.periodo || a.periodoNombre;
  return {
    id: a.id,
    socio_id: a.socio?.documento || a.socioId, // Usar documento como referencia
    periodo_id: a.periodoId,
    periodo: periodoNombre,
    periodo_nombre: periodoNombre,
    monto: Number(a.monto),
    fecha_pago: a.fechaPago,
    estado: a.estado,
    metodo: a.metodo,
    notas: a.notas,
    socio_nombre: a.socio?.nombre,
    created_at: a.createdAt,
  };
}

function mapCredito(c) {
  if (!c) return null;
  return {
    id: c.id,
    socio_id: c.socio?.documento || c.socioId, // Usar documento como referencia
    monto: Number(c.monto),
    tasa_mensual: Number(c.tasaMensual),
    cuotas: c.cuotas,
    cuotas_pagadas: c.cuotasPagadas,
    saldo_capital: Number(c.saldoCapital),
    fecha_desembolso: c.fechaDesembolso,
    estado: c.estado,
    proposito: c.proposito,
    aprobado_por: c.aprobadoPor,
    socio_nombre: c.socio?.nombre,
    created_at: c.createdAt,
  };
}

module.exports = { mapSocio, mapAporte, mapCredito };
