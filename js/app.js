
window.DB = {
  socios: [],
  aportes: [],
  creditos: [],
  movimientos: [],
  solidaridad: { saldo_actual: 0, movimientos: [] },
  config: {
    nombre: "FONEVI",
    nombre_completo: "Fondo de Empleados Docentes FONEVI",
    nit: "800.123.456-7",
    representante: "Carlos Alberto Muñoz",
    periodo_actual: "Marzo 2026",
    aporte_minimo: 130000,
    aporte_solidaridad: 5000,
    tasa_credito_mensual: 1,
    tasa_mora_diaria: 0.1,
    max_credito_multiplicador: 4
  },
  dividendos: [],
  notificaciones: []
};

window.DataHelper = {
  getSocio(id) {
    return window.DB?.socios?.find(s => s.id === id) || null;
  },
  getSocioNombre(id) {
    const s = this.getSocio(id);
    return s ? s.nombre : id;
  },
  getAportesSocio(socio_id) {
    return window.DB?.aportes?.filter(a => a.socio_id === socio_id) || [];
  },
  getCreditosSocio(socio_id) {
    return window.DB?.creditos?.filter(c => c.socio_id === socio_id) || [];
  },
  getCreditosActivos() {
    return window.DB?.creditos?.filter(c => c.estado !== 'pagado') || [];
  },
  getSociosMora() {
    return window.DB?.socios?.filter(s => s.estado === 'mora') || [];
  },
  getTotalAhorros() {
    return window.DB?.socios?.reduce((t, s) => t + (s.ahorro_acumulado || 0), 0) || 0;
  },
  getTotalCartera() {
    return window.DB?.creditos?.reduce((t, c) => t + (c.saldo_capital || 0), 0) || 0;
  },
  getNotificacionesNoLeidas() {
    return window.DB?.notificaciones?.filter(n => !n.leida).length || 0;
  },
  calcularCuota(monto, tasaMensual, cuotas) {
    const cuotasNum = Number(cuotas) || 0;
    if (cuotasNum <= 0) return 0;
    if (!tasaMensual) return Number(monto || 0) / cuotasNum;
    const i = tasaMensual / 100;
    const montoNum = Number(monto || 0);
    return (montoNum * i) / (1 - Math.pow(1 + i, -cuotasNum));
  },
  formatCOP(v) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0
    }).format(v);
  },
  formatFecha(fechaStr) {
    if (!fechaStr) return "—";
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return fechaStr;
    return d.toLocaleDateString("es-CO");
  },
  estadoPill(estado) {
    const map = {
      activo:    '<span class="pill pill-green">🟢 Activo</span>',
      inactivo:  '<span class="pill pill-red">🔴 Inactivo</span>',
      mora:      '<span class="pill pill-red">🔴 Mora</span>',
      vencido:   '<span class="pill pill-amber">🟡 Vencido</span>',
      pendiente: '<span class="pill pill-blue">🔵 Pendiente</span>',
      pagado:    '<span class="pill pill-green">🟢 Pagado</span>',
      aprobado:  '<span class="pill pill-green">🟢 Aprobado</span>',
      rechazado: '<span class="pill pill-red">🔴 Rechazado</span>',
    };
    return map[estado] || `<span class="pill pill-muted">${estado}</span>`;
  }
};

const Sidebar = {
  init() {
    document.getElementById("menuBtn")?.addEventListener("click", () => this.toggle());
    document.getElementById("sidebarBackdrop")?.addEventListener("click", () => this.close());
    // Marcar enlace activo
    const page = window.location.pathname.split("/").pop().replace(".html","");
    document.querySelectorAll(".nav-link[data-page]").forEach(a => {
      if (a.dataset.page === page) a.classList.add("active");
    });
    // Rellenar datos usuario
    const s = Auth.getSession();
    if (s) {
      const n = document.getElementById("sidebarUserName");
      const r = document.getElementById("sidebarUserRole");
      const a = document.getElementById("sidebarUserAvatar");
      if (n) n.textContent = s.nombre;
      if (r) r.textContent = s.rol.charAt(0).toUpperCase() + s.rol.slice(1);
      if (a) a.textContent = s.avatar || "U";
    }
  },
  toggle() {
    document.getElementById("sidebar")?.classList.toggle("open");
    document.getElementById("sidebarBackdrop")?.classList.toggle("show");
  },
  close() {
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("sidebarBackdrop")?.classList.remove("show");
  }
};

const Toast = {
  _c: null,
  _init() {
    if (!this._c) {
      this._c = document.getElementById("toastContainer") || document.createElement("div");
      this._c.className = "toast-container";
      this._c.id = "toastContainer";
      if (!document.getElementById("toastContainer")) document.body.appendChild(this._c);
    }
  },
  show(msg, tipo = "default", ms = 3800) {
    this._init();
    const icons = { success:"✓", error:"✕", warn:"⚠", default:"ℹ" };
    const t = document.createElement("div");
    t.className = `toast ${tipo}`;
    t.innerHTML = `<div class="toast-icon">${icons[tipo]||"ℹ"}</div><span>${msg}</span>`;
    this._c.appendChild(t);
    setTimeout(() => { t.style.animation="toastOut .3s ease forwards"; setTimeout(()=>t.remove(),300); }, ms);
  },
  success(m) { this.show(m,"success"); },
  error(m)   { this.show(m,"error");   },
  warn(m)    { this.show(m,"warn");    }
};

const Modal = {
  open(id)   { document.getElementById(id)?.classList.add("open");    },
  close(id)  { document.getElementById(id)?.classList.remove("open"); },
  closeAll() { document.querySelectorAll(".modal-overlay.open").forEach(m=>m.classList.remove("open")); }
};

document.addEventListener("click", e => {
  if (e.target.classList.contains("modal-overlay")) e.target.classList.remove("open");
});

function initTabs(barId, onChange) {
  const bar = document.getElementById(barId);
  if (!bar) return;
  bar.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      bar.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (onChange) onChange(btn.dataset.tab || btn.textContent.trim());
    });
  });
}

function filterTable(inputId, tableId) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);
  if (!input || !table) return;
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase();
    table.querySelectorAll("tbody tr").forEach(r => {
      r.style.display = r.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });
}

function confirmar(msg, cb) { if (confirm(msg)) cb(); }

/* ── Logout global — funciona desde onclick o desde listener ── */
function doLogout() {
  if (confirm("¿Deseas cerrar sesión?")) {
    // Limpiar sesión
    try { API.clearSession(); } catch(e) {}
    try {
      sessionStorage.removeItem("fonevi_token");
      sessionStorage.removeItem("fonevi_session");
      sessionStorage.removeItem("fonevi_theme");
    } catch(e) {}
    // Resetear flag de navegación si transitions.js está cargado
    if (typeof PageTransition !== "undefined") {
      PageTransition._navigating = false;
    }
    // Navegar al login
    var enPages = window.location.pathname.includes("/pages/") ||
                  window.location.pathname.includes("/app/");
    window.location.href = enPages ? "../index.html" : "index.html";
  }
}

function fmtCOP(v) {
  return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0}).format(v);
}

function fmtMillones(v) {
  if (v >= 1000000) return "$" + (v/1000000).toFixed(1) + "M";
  if (v >= 1000)    return "$" + Math.round(v/1000) + "k";
  return "$" + v;
}

function renderBarChart(id, data, maxVal) {
  const c = document.getElementById(id);
  if (!c) return;
  const max = maxVal || Math.max(...data.map(d=>Math.max(d.a||0,d.b||0)));
  c.style.cssText = "display:flex;align-items:flex-end;gap:10px;height:160px;padding-top:20px;";
  c.innerHTML = data.map(d=>`
    <div class="bar-group">
      <div class="bar-stack">
        <div class="bar bar-primary" style="height:${Math.round(((d.a||0)/max)*140)}px" title="${d.labelA||""}: ${fmtCOP(d.a||0)}"></div>
        ${d.b!==undefined?`<div class="bar bar-accent" style="height:${Math.round(((d.b||0)/max)*140)}px" title="${d.labelB||""}: ${fmtCOP(d.b||0)}"></div>`:""}
      </div>
      <span class="bar-month-label">${d.label}</span>
    </div>`).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname.split("/").pop();
  if (page !== "index.html" && page !== "") {
    if (!Auth.requireAuth()) return;
  }
  // Sidebar.init() ahora se llama desde buildLayout() en layout.js
  // para garantizar que el DOM del sidebar ya existe cuando se registran
  // los listeners del menuBtn y del backdrop.
  // Solo llamar aquí si buildLayout no fue invocado (páginas sin sidebar).
  if (!document.getElementById("sidebar")) {
    Sidebar.init();
  }
  Auth.applyRoleUI();

  // Pre-cargar datos del backend en DB si no estamos en login
  if (page !== "index.html" && page !== "") {
    (async () => {
      try {
        const [configRes, sociosRes, aportesRes, creditosRes, movimientosRes, notifRes, solSaldoRes] = await Promise.allSettled([
          API.config.obtener(),
          API.socios.listar(),
          API.aportes.listar(),
          API.creditos.listar(),
          API.movimientos.listar(),
          API.notificaciones.listar(),
          API.solidaridad.saldo()
        ]);

        if (configRes.status === "fulfilled" && configRes.value?.ok) {
          window.DB.config = { ...window.DB.config, ...configRes.value.datos };
        }
        if (sociosRes.status === "fulfilled" && sociosRes.value?.ok) {
          window.DB.socios = sociosRes.value.datos;
        }
        if (aportesRes.status === "fulfilled" && aportesRes.value?.ok) {
          window.DB.aportes = aportesRes.value.datos;
        }
        if (creditosRes.status === "fulfilled" && creditosRes.value?.ok) {
          window.DB.creditos = creditosRes.value.datos;
        }
        if (movimientosRes.status === "fulfilled" && movimientosRes.value?.ok) {
          window.DB.movimientos = movimientosRes.value.datos;
        }
        if (notifRes.status === "fulfilled" && notifRes.value?.ok) {
          window.DB.notificaciones = notifRes.value.datos;
        }
        if (solSaldoRes.status === "fulfilled" && solSaldoRes.value?.ok) {
          window.DB.solidaridad.saldo_actual = solSaldoRes.value.saldo_actual || 0;
        }

        // Actualizar badges
        const badge = document.getElementById("notifBadge");
        if (badge) {
          const n = DataHelper.getNotificacionesNoLeidas();
          badge.textContent = n;
          badge.style.display = n > 0 ? "inline-block" : "none";
        }
        const dot = document.getElementById("topNotifDot");
        if (dot) dot.style.display = DataHelper.getNotificacionesNoLeidas() > 0 ? "block" : "none";

        // Re-renderizadores específicos si existen
        if (typeof window.refreshUI === "function") {
          window.refreshUI();
        } else {
          if (typeof renderKPIs === "function") renderKPIs();
          if (typeof renderSidebar === "function") renderSidebar();
          if (typeof renderMorosos === "function") renderMorosos("todos");
          if (typeof renderLibro === "function") renderLibro();
          if (typeof renderCategorias === "function" && typeof tabActual !== "undefined" && tabActual === "categorias") renderCategorias();
          if (typeof renderBalance === "function" && typeof tabActual !== "undefined" && tabActual === "balance") renderBalance();
          if (typeof renderGrafico === "function" && typeof tabActual !== "undefined" && tabActual === "grafico") renderGrafico();
          if (typeof renderSocios === "function") renderSocios();
          if (typeof renderCreditos === "function") renderCreditos();
          if (typeof renderAportes === "function") renderAportes();
          if (typeof renderMovimientos === "function") renderMovimientos();
          if (typeof cargarFormularios === "function") cargarFormularios();
          if (typeof previsualizarTasa === "function") previsualizarTasa();
          if (typeof renderImpactoCartera === "function") renderImpactoCartera();
          if (typeof renderUsuarios === "function") renderUsuarios();
        }
      } catch (e) {
        console.error("Error pre-cargando base de datos real:", e);
      }
    })();
  }

  // Listener directo en el botón (si ya existe en el DOM)
  const logoutBtnEl = document.getElementById("logoutBtn");
  if (logoutBtnEl && !logoutBtnEl.dataset.listenerAdded) {
    logoutBtnEl.addEventListener("click", doLogout);
    logoutBtnEl.dataset.listenerAdded = "1";
  }

  // Event delegation como respaldo — captura clics aunque el botón
  // se haya creado después del DOMContentLoaded
  document.addEventListener("click", function(e) {
    if (e.target && (e.target.id === "logoutBtn" ||
        e.target.closest("#logoutBtn"))) {
      doLogout();
    }
  }, { once: false });
});

