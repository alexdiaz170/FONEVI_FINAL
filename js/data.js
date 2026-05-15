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
      id: "12345678", nombre: "Ana María Torres", documento: "12345678",
      email: "ana.torres@fonevi.edu.co", telefono: "3001234567",
      fecha_ingreso: "2020-01-15", aporte_mensual: 120000,
      ahorro_acumulado: 3600000, estado: "activo",
      cargo: "Docente de Matemáticas", sede: "Sede Central"
    }
  ],

  /* ── Aportes ──────────────────────────────────────────────── */
  aportes: [],

  /* ── Créditos ─────────────────────────────────────────────── */
  creditos: [],

  /* ── Fondo de Solidaridad ─────────────────────────────────── */
  solidaridad: {
    saldo_actual: 0,
    movimientos: []
  },

  /* ── Dividendos ───────────────────────────────────────────── */
  dividendos: [],

  /* ── Notificaciones ───────────────────────────────────────── */
  notificaciones: [
    { id: "N001", tipo: "sistema", titulo: "Sistema Reiniciado", mensaje: "Se han borrado los datos locales y sincronizado con la base de datos real.", fecha: "2026-05-15", leida: false, urgente: false }
  ],

  /* ── Movimientos contables ────────────────────────────────── */
  movimientos: []
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
    console.log("DataSync: Iniciando sincronización con el servidor...");
    
    // Verificar conexión
    try { await API.ping(); } catch(e) {}
    if (API.MODO_OFFLINE) {
      console.warn("DataSync: Servidor no disponible. Usando datos locales.");
      if (window.Toast) Toast.warn("Modo offline: usando datos locales");
      return;
    }

    console.log("DataSync: Iniciando sincronización por lotes (Batch)...");

    try {
      const res = await API.sync.all();
      if (res && res.ok) {
        const d = res.datos;
        
        // LIMPIEZA DE DATOS DE PRUEBA
        // Si el servidor responde con datos, vaciamos los locales para evitar mezclas
        DB.socios = [];
        DB.aportes = [];
        DB.creditos = [];
        DB.movimientos = [];
        DB.notificaciones = [];

        // Sobrescribir DB local con datos reales
        if (d.socios)         DB.socios = d.socios;
        if (d.aportes)        DB.aportes = d.aportes;
        if (d.creditos)       DB.creditos = d.creditos;
        if (d.config)         DB.config = { ...DB.config, ...d.config };
        if (d.solidaridad)    DB.solidaridad = d.solidaridad;
        if (d.movimientos)    DB.movimientos = d.movimientos;
        if (d.notificaciones) DB.notificaciones = d.notificaciones;
        
        console.log("DataSync: Sincronización completa desde Supabase.");
        if (window.Toast) Toast.success("Sincronización con la nube exitosa");
      } else {
        console.warn("DataSync: Error en la respuesta del servidor:", res?.mensaje);
      }
    } catch (error) {
      const msg = error.data?.mensaje || error.message || "Error al sincronizar datos";
      Toast.error(msg);
      console.error("DataSync: Error crítico en sincronización:", error);
    }

    // Caso especial: Saldo de solidaridad
    try {
      const res = await API.solidaridad.saldo();
      if (res && res.ok) DB.solidaridad.saldo_actual = res.saldo_actual || 0;
    } catch(e) {}

    console.log("DataSync: Sincronización completada.");
    
    // Disparar evento global
    document.dispatchEvent(new CustomEvent('fonevi_data_ready'));
    
    // Si la página tiene una función refreshUI, llamarla
    if (typeof window.refreshUI === 'function') {
      window.refreshUI();
    }
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
