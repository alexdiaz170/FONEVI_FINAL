/* ============================================================
   FONEVI — data.js
   Datos simulados del sistema (reemplazar con API real)
   ============================================================ */

const DB = {

  /* ── Configuración del fondo ──────────────────────────────── */
  config: {
    nombre: "FONEVI",
    nombre_completo: "Fondo de Empleados Docentes FONEVI",
    nit: "800.123.456-7",
    representante: "Carlos Alberto Muñoz",
    aporte_minimo: 120000,
    tasa_credito_mensual: 1.5,        // %
    tasa_mora_diaria: 0.1,            // %
    aporte_solidaridad: 30000,
    max_credito_multiplicador: 3,     // veces el ahorro acumulado
    periodo_actual: "Marzo 2026"
  },

  /* ── Usuarios del sistema ─────────────────────────────────── */
  usuarios: [
    {
      id: "U001", nombre: "Carlos Muñoz", email: "admin@fonevi.edu.co",
      password: "Admin2026!", rol: "administrador",
      estado: "activo", avatar: "CM"
    },
    {
      id: "U002", nombre: "Laura Jiménez", email: "tesorero@fonevi.edu.co",
      password: "Tesorero2026!", rol: "tesorero",
      estado: "activo", avatar: "LJ"
    },
    {
      id: "U003", nombre: "Ana Torres", email: "ana.torres@fonevi.edu.co",
      password: "Socio2026!", rol: "socio",
      estado: "activo", avatar: "AT"
    }
  ],

  /* ── Socios ───────────────────────────────────────────────── */
  socios: [
    {
      id: "S001", nombre: "Ana María Torres", documento: "12345678",
      email: "ana.torres@fonevi.edu.co", telefono: "3001234567",
      fecha_ingreso: "2020-01-15", aporte_mensual: 120000,
      ahorro_acumulado: 3600000, estado: "activo",
      cargo: "Docente de Matemáticas", sede: "Sede Central"
    },
    {
      id: "S002", nombre: "Luis Felipe Mora", documento: "23456789",
      email: "luis.mora@edu.co", telefono: "3112345678",
      fecha_ingreso: "2019-03-10", aporte_mensual: 150000,
      ahorro_acumulado: 5100000, estado: "activo",
      cargo: "Docente de Ciencias", sede: "Sede Norte"
    },
    {
      id: "S003", nombre: "Claudia Ríos Salazar", documento: "34567890",
      email: "claudia.rios@edu.co", telefono: "3223456789",
      fecha_ingreso: "2021-06-01", aporte_mensual: 120000,
      ahorro_acumulado: 1800000, estado: "mora",
      cargo: "Docente de Español", sede: "Sede Sur"
    },
    {
      id: "S004", nombre: "Pedro Salcedo Villa", documento: "45678901",
      email: "pedro.salcedo@edu.co", telefono: "3134567890",
      fecha_ingreso: "2018-08-20", aporte_mensual: 200000,
      ahorro_acumulado: 4200000, estado: "activo",
      cargo: "Rector", sede: "Sede Central"
    },
    {
      id: "S005", nombre: "Jorge Erazo Pinto", documento: "56789012",
      email: "jorge.erazo@edu.co", telefono: "3145678901",
      fecha_ingreso: "2022-02-14", aporte_mensual: 120000,
      ahorro_acumulado: 2900000, estado: "pendiente",
      cargo: "Docente de Historia", sede: "Sede Norte"
    },
    {
      id: "S006", nombre: "Patricia Velasco", documento: "67890123",
      email: "patricia.velasco@edu.co", telefono: "3056789012",
      fecha_ingreso: "2020-09-05", aporte_mensual: 120000,
      ahorro_acumulado: 2100000, estado: "activo",
      cargo: "Docente de Inglés", sede: "Sede Sur"
    },
    {
      id: "S007", nombre: "Mariana López Castro", documento: "78901234",
      email: "mariana.lopez@edu.co", telefono: "3167890123",
      fecha_ingreso: "2021-11-20", aporte_mensual: 120000,
      ahorro_acumulado: 1500000, estado: "activo",
      cargo: "Psicóloga", sede: "Sede Central"
    }
  ],

  /* ── Aportes ──────────────────────────────────────────────── */
  aportes: [
    { id: "A001", socio_id: "S001", periodo: "Enero 2026",   monto: 120000, fecha_pago: "2026-01-05", estado: "pagado", metodo: "nomina" },
    { id: "A002", socio_id: "S001", periodo: "Febrero 2026", monto: 120000, fecha_pago: "2026-02-05", estado: "pagado", metodo: "nomina" },
    { id: "A003", socio_id: "S001", periodo: "Marzo 2026",   monto: 120000, fecha_pago: "2026-03-05", estado: "pagado", metodo: "nomina" },
    { id: "A004", socio_id: "S002", periodo: "Enero 2026",   monto: 150000, fecha_pago: "2026-01-05", estado: "pagado", metodo: "nomina" },
    { id: "A005", socio_id: "S002", periodo: "Febrero 2026", monto: 150000, fecha_pago: "2026-02-05", estado: "pagado", metodo: "nomina" },
    { id: "A006", socio_id: "S002", periodo: "Marzo 2026",   monto: 150000, fecha_pago: null,          estado: "pendiente", metodo: null },
    { id: "A007", socio_id: "S003", periodo: "Enero 2026",   monto: 120000, fecha_pago: null,          estado: "vencido",  metodo: null },
    { id: "A008", socio_id: "S003", periodo: "Febrero 2026", monto: 120000, fecha_pago: null,          estado: "vencido",  metodo: null },
    { id: "A009", socio_id: "S003", periodo: "Marzo 2026",   monto: 120000, fecha_pago: null,          estado: "mora",     metodo: null },
    { id: "A010", socio_id: "S004", periodo: "Enero 2026",   monto: 200000, fecha_pago: "2026-01-05", estado: "pagado", metodo: "nomina" },
    { id: "A011", socio_id: "S004", periodo: "Febrero 2026", monto: 200000, fecha_pago: "2026-02-05", estado: "pagado", metodo: "nomina" },
    { id: "A012", socio_id: "S004", periodo: "Marzo 2026",   monto: 200000, fecha_pago: "2026-03-05", estado: "pagado", metodo: "nomina" },
    { id: "A013", socio_id: "S005", periodo: "Enero 2026",   monto: 120000, fecha_pago: "2026-01-10", estado: "pagado", metodo: "transferencia" },
    { id: "A014", socio_id: "S005", periodo: "Febrero 2026", monto: 120000, fecha_pago: null,          estado: "pendiente", metodo: null },
    { id: "A015", socio_id: "S006", periodo: "Enero 2026",   monto: 120000, fecha_pago: "2026-01-05", estado: "pagado", metodo: "nomina" },
    { id: "A016", socio_id: "S006", periodo: "Febrero 2026", monto: 120000, fecha_pago: "2026-02-05", estado: "pagado", metodo: "nomina" },
    { id: "A017", socio_id: "S006", periodo: "Marzo 2026",   monto: 120000, fecha_pago: "2026-03-19", estado: "pagado", metodo: "nomina" },
    { id: "A018", socio_id: "S007", periodo: "Enero 2026",   monto: 120000, fecha_pago: "2026-01-05", estado: "pagado", metodo: "nomina" },
    { id: "A019", socio_id: "S007", periodo: "Febrero 2026", monto: 120000, fecha_pago: "2026-02-05", estado: "pagado", metodo: "nomina" },
    { id: "A020", socio_id: "S007", periodo: "Marzo 2026",   monto: 120000, fecha_pago: null,          estado: "pendiente", metodo: null }
  ],

  /* ── Créditos ─────────────────────────────────────────────── */
  creditos: [
    {
      id: "C031", socio_id: "S001", monto: 3000000, tasa_mensual: 1.5,
      cuotas: 24, cuotas_pagadas: 18, fecha_desembolso: "2024-01-10",
      estado: "activo", proposito: "Estudio de posgrado",
      aprobado_por: "U001", saldo_capital: 750000
    },
    {
      id: "C034", socio_id: "S002", monto: 2000000, tasa_mensual: 1.5,
      cuotas: 12, cuotas_pagadas: 7,  fecha_desembolso: "2025-08-15",
      estado: "activo", proposito: "Remodelación",
      aprobado_por: "U001", saldo_capital: 1100000
    },
    {
      id: "C037", socio_id: "S005", monto: 1500000, tasa_mensual: 1.5,
      cuotas: 18, cuotas_pagadas: 3,  fecha_desembolso: "2025-12-01",
      estado: "mora", proposito: "Gastos médicos",
      aprobado_por: "U001", saldo_capital: 1300000
    },
    {
      id: "C039", socio_id: "S004", monto: 2500000, tasa_mensual: 1.5,
      cuotas: 24, cuotas_pagadas: 1,  fecha_desembolso: "2026-02-20",
      estado: "activo", proposito: "Vehículo",
      aprobado_por: "U001", saldo_capital: 2400000
    }
  ],

  /* ── Fondo de Solidaridad ─────────────────────────────────── */
  solidaridad: {
    saldo_actual: 8750000,
    movimientos: [
      { id: "FS001", tipo: "ingreso",  descripcion: "Aportes mensuales Feb 2026", monto: 3810000, fecha: "2026-02-28" },
      { id: "FS002", tipo: "egreso",   descripcion: "Ayuda médica — Patricia Velasco", monto: 500000, fecha: "2026-03-10", beneficiario: "S006" },
      { id: "FS003", tipo: "egreso",   descripcion: "Auxilio funerario — Familia Guerrero", monto: 800000, fecha: "2026-02-28" },
      { id: "FS004", tipo: "egreso",   descripcion: "Apoyo educativo — Camilo Ortega", monto: 300000, fecha: "2026-02-14" },
      { id: "FS005", tipo: "ingreso",  descripcion: "Aportes mensuales Mar 2026", monto: 3810000, fecha: "2026-03-05" }
    ]
  },

  /* ── Dividendos ───────────────────────────────────────────── */
  dividendos: [
    {
      id: "D2025", anio: 2025, total_utilidades: 12500000,
      porcentaje_distribuido: 80, total_distribuido: 10000000,
      fecha_distribucion: "2026-01-20", estado: "distribuido",
      detalle: [
        { socio_id: "S001", monto: 720000 },
        { socio_id: "S002", monto: 1020000 },
        { socio_id: "S004", monto: 840000 }
      ]
    }
  ],

  /* ── Notificaciones ───────────────────────────────────────── */
  notificaciones: [
    { id: "N001", tipo: "mora",     titulo: "Mora: Claudia Ríos",       mensaje: "2 meses sin aporte. Saldo pendiente: $240.000",      fecha: "2026-03-21", leida: false, urgente: true },
    { id: "N002", tipo: "mora",     titulo: "Mora: Jorge Erazo",        mensaje: "Cuota crédito #C-037 vencida hace 45 días",           fecha: "2026-03-21", leida: false, urgente: true },
    { id: "N003", tipo: "credito",  titulo: "Crédito próximo a vencer", mensaje: "Pedro Salcedo — última cuota el 31 de marzo",         fecha: "2026-03-20", leida: false, urgente: false },
    { id: "N004", tipo: "aporte",   titulo: "109 aportes confirmados",  mensaje: "Cierre de nómina marzo 2026 procesado correctamente", fecha: "2026-03-19", leida: true,  urgente: false },
    { id: "N005", tipo: "solicitud",titulo: "Solicitud de crédito",     mensaje: "Mariana López solicita crédito por $1.800.000 — pendiente de aprobación", fecha: "2026-03-18", leida: false, urgente: false }
  ],

  /* ── Movimientos contables ────────────────────────────────── */
  movimientos: [
    { id: "M001", tipo: "ingreso", categoria: "Aportes",     descripcion: "Aportes nómina Marzo 2026",      monto: 13080000, fecha: "2026-03-05" },
    { id: "M002", tipo: "ingreso", categoria: "Intereses",   descripcion: "Intereses créditos activos",     monto:   980000, fecha: "2026-03-05" },
    { id: "M003", tipo: "egreso",  categoria: "Crédito",     descripcion: "Desembolso crédito C039 Pedro Salcedo", monto: 2500000, fecha: "2026-02-20" },
    { id: "M004", tipo: "egreso",  categoria: "Solidaridad", descripcion: "Ayuda médica Patricia Velasco",  monto:   500000, fecha: "2026-03-10" },
    { id: "M005", tipo: "ingreso", categoria: "Aportes",     descripcion: "Aportes nómina Febrero 2026",   monto: 12900000, fecha: "2026-02-05" },
    { id: "M006", tipo: "ingreso", categoria: "Intereses",   descripcion: "Intereses créditos Feb 2026",   monto:   920000, fecha: "2026-02-05" },
    { id: "M007", tipo: "egreso",  categoria: "Administrativo", descripcion: "Gastos de papelería y administración", monto: 150000, fecha: "2026-02-28" }
  ]
};

/* ── Helpers de acceso a datos ────────────────────────────── */
const DataHelper = {

  getSocio(id) {
    return DB.socios.find(s => s.id === id);
  },

  getSocioNombre(id) {
    const s = this.getSocio(id);
    return s ? s.nombre : "—";
  },

  getAportesSocio(socio_id) {
    return DB.aportes.filter(a => a.socio_id === socio_id);
  },

  getCreditosSocio(socio_id) {
    return DB.creditos.filter(c => c.socio_id === socio_id);
  },

  getCreditosActivos() {
    return DB.creditos.filter(c => c.estado !== "pagado");
  },

  getSociosMora() {
    return DB.socios.filter(s => s.estado === "mora");
  },

  getTotalAhorros() {
    return DB.socios.reduce((t, s) => t + Number(s.ahorro_acumulado || 0), 0);
  },

  getTotalCartera() {
    return DB.creditos.filter(c => c.estado !== "pagado")
                      .reduce((t, c) => t + Number(c.saldo_capital || 0), 0);
  },

  getNotificacionesNoLeidas() {
    return DB.notificaciones.filter(n => !n.leida).length;
  },

  /* Calcula cuota mensual de un crédito */
  calcularCuota(monto, tasaMensual, cuotas) {
    const r = tasaMensual / 100;
    if (r === 0) return monto / cuotas;
    return monto * (r * Math.pow(1 + r, cuotas)) / (Math.pow(1 + r, cuotas) - 1);
  },

  /* Formatea como moneda COP */
  formatCOP(valor) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency", currency: "COP",
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(valor);
  },

  /* Formatea fecha */
  formatFecha(fechaStr) {
    if (!fechaStr) return "—";
    const d = new Date(fechaStr + "T00:00:00");
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  },

  /* Estado a pill HTML */
  estadoPill(estado) {
    const map = {
      activo:      { cls: "pill-green",  label: "Activo" },
      mora:        { cls: "pill-red",    label: "En mora" },
      pendiente:   { cls: "pill-amber",  label: "Pendiente" },
      retirado:    { cls: "pill-navy",   label: "Retirado" },
      pagado:      { cls: "pill-green",  label: "Pagado" },
      vencido:     { cls: "pill-red",    label: "Vencido" },
      aprobado:    { cls: "pill-green",  label: "Aprobado" },
      rechazado:   { cls: "pill-red",    label: "Rechazado" },
      "al dia":    { cls: "pill-green",  label: "Al día" },
    };
    const s = map[estado] || { cls: "pill-navy", label: estado };
    return `<span class="pill ${s.cls}">${s.label}</span>`;
  }
};

/* ═══════════════════════════════════════════════════════
   DATA SYNC (MIGRACIÓN A BACKEND)
   Sincroniza los arrays locales (DB) con la API real
═══════════════════════════════════════════════════════ */
window.DataSync = {
  async init() {
    if (!window.API) return;
    
    // Verificar conexión
    try { await API.ping(); } catch(e) {}
    if (API.MODO_OFFLINE) return;

    console.log("DataSync: Iniciando sincronización robusta...");

    // Sincronizar cada entidad de forma independiente para evitar bloqueos
    const syncTasks = [
      { name: "socios",         task: API.socios.listar(),         update: (d) => DB.socios = d },
      { name: "aportes",        task: API.aportes.listar(),        update: (d) => DB.aportes = d },
      { name: "creditos",       task: API.creditos.listar(),       update: (d) => DB.creditos = d },
      { name: "config",         task: API.config.obtener(),        update: (d) => DB.config = d },
      { name: "solidaridad",    task: API.solidaridad.listar(),    update: (d) => DB.solidaridad.movimientos = d },
      { name: "movimientos",    task: API.movimientos.listar(),    update: (d) => DB.movimientos = d },
      { name: "notificaciones", task: API.notificaciones.listar(), update: (d) => DB.notificaciones = d }
    ];

    for (const item of syncTasks) {
      try {
        const res = await item.task;
        if (res && res.ok) {
          item.update(res.datos);
          console.log(`DataSync: ${item.name} sincronizado.`);
        }
      } catch (e) {
        console.warn(`DataSync: Error al sincronizar ${item.name}:`, e);
      }
    }

    // Caso especial: Saldo de solidaridad
    try {
      const res = await API.solidaridad.saldo();
      if (res && res.ok) DB.solidaridad.saldo_actual = res.saldo_actual || 0;
    } catch(e) {}
  },

  async syncAportes() {
    if (API.MODO_OFFLINE) return;
    const res = await API.aportes.listar();
    if (res.ok) DB.aportes = res.datos;
  },
  async syncCreditos() {
    if (API.MODO_OFFLINE) return;
    const res = await API.creditos.listar();
    if (res.ok) DB.creditos = res.datos;
  },
  async syncSolidaridad() {
    if (API.MODO_OFFLINE) return;
    const res = await API.solidaridad.listar();
    if (res.ok) DB.solidaridad.movimientos = res.datos;
    const saldoRes = await API.solidaridad.saldo();
    DB.solidaridad.saldo_actual = saldoRes.saldo_actual || 0;
  },
  async syncSocios() {
    if (API.MODO_OFFLINE) return;
    const res = await API.socios.listar();
    if (res.ok) DB.socios = res.datos;
  },
  async syncMovimientos() {
    if (API.MODO_OFFLINE) return;
    const res = await API.movimientos.listar();
    if (res.ok) DB.movimientos = res.datos;
  }
};
