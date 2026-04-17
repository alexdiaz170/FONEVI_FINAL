/* ============================================================
   FONEVI — js/roles.js
   Sistema completo de control de acceso por rol (RBAC)

   ROLES:
   • administrador — acceso total
   • tesorero      — gestión financiera, sin configuración del sistema
   • socio         — solo su información personal

   USO:
   1. Cargar DESPUÉS de auth.js en cada página
   2. Llamar Roles.proteger("nombrePagina") al inicio del DOMContentLoaded
   ============================================================ */

const ROLES = {

  /* ── Mapa de permisos por página ──────────────────────── */
  PAGINAS: {
    // Solo administrador
    "configuracion":     ["administrador"],
    "auditoria":         ["administrador"],

    // Administrador + Tesorero
    "socios":            ["administrador", "tesorero"],
    "aportes":           ["administrador", "tesorero"],
    "creditos":          ["administrador", "tesorero"],
    "contabilidad":      ["administrador", "tesorero"],
    "reportes":          ["administrador", "tesorero"],
    "dividendos":        ["administrador", "tesorero"],
    "solidaridad":       ["administrador", "tesorero"],
    "notificaciones":    ["administrador", "tesorero"],
    "whatsapp-panel":    ["administrador", "tesorero"],

    // Solo socio
    "mi-cuenta":         ["socio"],
    "cambiar-password":  ["socio"],

    // Todos los roles autenticados
    "dashboard":         ["administrador", "tesorero", "socio"],
    "perfil":            ["administrador", "tesorero", "socio"],
  },

  /* ── Sidebar por rol ────────────────────────────────────── */
  SIDEBAR: {
    administrador: [
      { sec: "Principal",
        items: [
          { href:"../pages/dashboard.html",     page:"dashboard",     icon:"⊞", label:"Dashboard" },
          { href:"../pages/socios.html",        page:"socios",        icon:"👥", label:"Socios" },
        ]
      },
      { sec: "Finanzas",
        items: [
          { href:"../pages/aportes.html",       page:"aportes",       icon:"💰", label:"Aportes", badge:true },
          { href:"../pages/creditos.html",      page:"creditos",      icon:"💳", label:"Créditos" },
          { href:"../pages/solidaridad.html",   page:"solidaridad",   icon:"🤝", label:"Solidaridad" },
          { href:"../pages/dividendos.html",    page:"dividendos",    icon:"🎁", label:"Dividendos" },
        ]
      },
      { sec: "Gestión",
        items: [
          { href:"../pages/contabilidad.html",   page:"contabilidad",  icon:"📊", label:"Contabilidad" },
          { href:"../pages/reportes.html",       page:"reportes",      icon:"📈", label:"Reportes" },
          { href:"../pages/notificaciones.html", page:"notificaciones",icon:"🔔", label:"Notificaciones" },
        ]
      },
      { sec: "Sistema",
        items: [
          { href:"../pages/auditoria.html",      page:"auditoria",     icon:"🔐", label:"Auditoría" },
          { href:"../pages/configuracion.html",  page:"configuracion", icon:"⚙️",  label:"Configuración" },
        ]
      },
    ],

    tesorero: [
      { sec: "Principal",
        items: [
          { href:"../pages/dashboard.html",     page:"dashboard",     icon:"⊞", label:"Dashboard" },
          { href:"../pages/socios.html",        page:"socios",        icon:"👥", label:"Socios" },
        ]
      },
      { sec: "Finanzas",
        items: [
          { href:"../pages/aportes.html",       page:"aportes",       icon:"💰", label:"Aportes", badge:true },
          { href:"../pages/creditos.html",      page:"creditos",      icon:"💳", label:"Créditos" },
          { href:"../pages/solidaridad.html",   page:"solidaridad",   icon:"🤝", label:"Solidaridad" },
          { href:"../pages/dividendos.html",    page:"dividendos",    icon:"🎁", label:"Dividendos" },
        ]
      },
      { sec: "Gestión",
        items: [
          { href:"../pages/contabilidad.html",   page:"contabilidad",  icon:"📊", label:"Contabilidad" },
          { href:"../pages/reportes.html",       page:"reportes",      icon:"📈", label:"Reportes" },
          { href:"../pages/notificaciones.html", page:"notificaciones",icon:"🔔", label:"Notificaciones" },
        ]
      },
    ],

    socio: [
      { sec: "Mi cuenta",
        items: [
          { href:"../pages/mi-cuenta.html",         page:"mi-cuenta",         icon:"👤", label:"Mi estado de cuenta" },
          { href:"../pages/cambiar-password.html",  page:"cambiar-password",  icon:"🔑", label:"Cambiar contraseña" },
        ]
      },
    ],
  },

  /* ── Verificar si el rol actual tiene acceso a la página ── */
  tieneAcceso(pagina, rol) {
    const permitidos = this.PAGINAS[pagina];
    if (!permitidos) return true; // página no mapeada = pública
    return permitidos.includes(rol.toLowerCase());
  },

  /* ── Proteger una página — redirigir si no tiene acceso ─── */
  proteger(pagina) {
    const session = Auth.getSession();
    if (!session) {
      Auth.requireAuth();
      return false;
    }

    const rol = (session.rol || "").toLowerCase().trim();

    // Socio intenta entrar a página restringida
    if (!this.tieneAcceso(pagina, rol)) {
      this._redirigirSinAcceso(rol, pagina);
      return false;
    }

    return true;
  },

  _redirigirSinAcceso(rol, paginaIntentada) {
    sessionStorage.setItem("fonevi_access_denied",
      "No tienes permisos para acceder a \"" + paginaIntentada + "\".");
    if (rol === "socio") {
      window.location.href = "../pages/mi-cuenta.html";
    } else {
      window.location.href = "../pages/dashboard.html";
    }
  },

  /* ── Construir sidebar según rol ────────────────────────── */
  buildSidebar(session) {
    const rol = this.normalizarRol(session.rol);

    const seccionesRol = this.SIDEBAR[session.rol] || this.SIDEBAR.socio;
    const notifsNoLeidas = typeof DataHelper !== "undefined"
      ? DataHelper.getNotificacionesNoLeidas()
      : 0;

    return seccionesRol.map(sec => {
      const items = sec.items.map(item => {
        const badge = item.badge && notifsNoLeidas > 0
          ? `<span class="nav-badge" id="notifBadge">${notifsNoLeidas}</span>`
          : '';
        return `<a href="${item.href}" class="nav-link" data-page="${item.page}">
          <span class="nav-icon">${item.icon}</span> ${item.label}${badge}
        </a>`;
      }).join("");

      return `<div class="nav-section">
        <span class="nav-section-label">${sec.sec}</span>
        ${items}
      </div>`;
    }).join("");
  },

  /* ── Mostrar mensaje de acceso denegado si viene redirigido ─ */
  checkDeniedMessage() {
    const msg = sessionStorage.getItem("fonevi_access_denied");
    if (msg) {
      sessionStorage.removeItem("fonevi_access_denied");
      if (typeof Toast !== "undefined") {
        setTimeout(() => Toast.warn("⚠ " + msg), 600);
      }
    }
  },
};
