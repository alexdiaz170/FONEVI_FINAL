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
    socio_nombre: s.nombre,
  };
}

function mapAporte(a) {
  if (!a) return null;
  // periodo can be a string (flat JOIN result) or an object with .nombre
  const periodoNombre = (a.periodo && typeof a.periodo === 'object')
    ? a.periodo.nombre
    : (a.periodo || a.periodoNombre || '');
  return {
    id: a.id,
    socio_id: (a.socio && a.socio.documento) ? a.socio.documento : a.socioId,
    periodo_id: a.periodoId,
    periodo: periodoNombre,
    periodo_nombre: periodoNombre,
    monto: Number(a.monto),
    fecha_pago: a.fechaPago || a.fecha_pago || null,
    estado: a.estado,
    metodo: a.metodo,
    notas: a.notas,
    // Prefer nested object, fallback to flat JOIN column
    socio_nombre: (a.socio && a.socio.nombre) ? a.socio.nombre : (a.socioNombre || null),
    created_at: a.createdAt,
  };
}

function mapCredito(c) {
  if (!c) return null;
  return {
    id: c.id,
    socio_id: (c.socio && c.socio.documento) ? c.socio.documento : c.socioId,
    monto: Number(c.monto),
    tasa_mensual: Number(c.tasaMensual),
    cuotas: c.cuotas,
    cuotas_pagadas: c.cuotasPagadas,
    saldo_capital: Number(c.saldoCapital),
    fecha_desembolso: c.fechaDesembolso,
    estado: c.estado,
    proposito: c.proposito,
    aprobado_por: c.aprobadoPor,
    socio_nombre: (c.socio && c.socio.nombre) ? c.socio.nombre : (c.socioNombre || null),
    created_at: c.createdAt,
  };
}

module.exports = { mapSocio, mapAporte, mapCredito };

