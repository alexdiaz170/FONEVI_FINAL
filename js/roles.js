/* ============================================================
   FONEVI — js/roles.js
   Control de acceso por rol (RBAC)

   VARIABLE: Roles  (con R mayúscula — así la usan layout.js y todas las páginas)

   ROLES:
   • administrador — acceso total (14 módulos)
   • tesorero      — gestión financiera (sin auditoría ni configuración)
   • socio         — solo su información personal
   ============================================================ */

var Roles = {

  /* ── Permisos por página ──────────────────────────────── */
  PAGINAS: {
    // Solo administrador
    "configuracion":    ["administrador"],
    "auditoria":        ["administrador"],

    // Administrador + Tesorero
    "socios":           ["administrador", "tesorero"],
    "aportes":          ["administrador", "tesorero"],
    "cierre-periodo":   ["administrador", "tesorero"],
    "panel-mora":       ["administrador", "tesorero"],
    "creditos":         ["administrador", "tesorero"],
    "contabilidad":     ["administrador", "tesorero"],
    "reportes":         ["administrador", "tesorero"],
    "dividendos":       ["administrador", "tesorero"],
    "solidaridad":      ["administrador", "tesorero"],
    "notificaciones":   ["administrador", "tesorero"],
    "whatsapp-panel":   ["administrador", "tesorero"],

    // Solo socio
    "mi-cuenta":        ["socio"],
    "cambiar-password": ["socio"],

    // Todos los roles autenticados
    "dashboard":        ["administrador", "tesorero", "socio"],
    "perfil":           ["administrador", "tesorero", "socio"],
  },

  /* ── Sidebar por rol ────────────────────────────────────── */
  SIDEBAR: {

    administrador: [
      {
        sec: "Principal",
        items: [
          { href: "dashboard.html",    page: "dashboard",    icon: "⊞", label: "Dashboard" },
          { href: "socios.html",       page: "socios",       icon: "👥", label: "Socios" },
        ]
      },
      {
        sec: "Finanzas",
        items: [
          { href: "aportes.html",      page: "aportes",      icon: "💰", label: "Aportes",      badge: true },
          { href: "creditos.html",     page: "creditos",     icon: "💳", label: "Créditos" },
          { href: "solidaridad.html",  page: "solidaridad",  icon: "🤝", label: "Solidaridad" },
          { href: "dividendos.html",   page: "dividendos",   icon: "🎁", label: "Dividendos" },
          { href: "panel-mora.html",     page: "panel-mora",   icon: "⚠️",  label: "Panel de mora" },
          { href: "cierre-periodo.html", page: "cierre-periodo",icon: "📅", label: "Cierre de período" },
        ]
      },
      {
        sec: "Gestión",
        items: [
          { href: "contabilidad.html",   page: "contabilidad",  icon: "📊", label: "Contabilidad" },
          { href: "reportes.html",       page: "reportes",      icon: "📈", label: "Reportes" },
          { href: "notificaciones.html", page: "notificaciones",icon: "🔔", label: "Notificaciones" },
          { href: "whatsapp-panel.html", page: "whatsapp-panel",icon: "💬", label: "WhatsApp" },
        ]
      },
      {
        sec: "Sistema",
        items: [
          { href: "auditoria.html",     page: "auditoria",     icon: "🔐", label: "Auditoría" },
          { href: "configuracion.html", page: "configuracion", icon: "⚙️",  label: "Configuración" },
        ]
      },
    ],

    tesorero: [
      {
        sec: "Principal",
        items: [
          { href: "dashboard.html",    page: "dashboard",    icon: "⊞", label: "Dashboard" },
          { href: "socios.html",       page: "socios",       icon: "👥", label: "Socios" },
        ]
      },
      {
        sec: "Finanzas",
        items: [
          { href: "aportes.html",      page: "aportes",      icon: "💰", label: "Aportes",      badge: true },
          { href: "creditos.html",     page: "creditos",     icon: "💳", label: "Créditos" },
          { href: "solidaridad.html",  page: "solidaridad",  icon: "🤝", label: "Solidaridad" },
          { href: "dividendos.html",   page: "dividendos",   icon: "🎁", label: "Dividendos" },
          { href: "panel-mora.html",     page: "panel-mora",   icon: "⚠️",  label: "Panel de mora" },
          { href: "cierre-periodo.html", page: "cierre-periodo",icon: "📅", label: "Cierre de período" },
        ]
      },
      {
        sec: "Gestión",
        items: [
          { href: "contabilidad.html",   page: "contabilidad",  icon: "📊", label: "Contabilidad" },
          { href: "reportes.html",       page: "reportes",      icon: "📈", label: "Reportes" },
          { href: "notificaciones.html", page: "notificaciones",icon: "🔔", label: "Notificaciones" },
          { href: "whatsapp-panel.html", page: "whatsapp-panel",icon: "💬", label: "WhatsApp" },
        ]
      },
    ],

    socio: [
      {
        sec: "Mi cuenta",
        items: [
          { href: "mi-cuenta.html",        page: "mi-cuenta",        icon: "👤", label: "Mi estado de cuenta" },
          { href: "cambiar-password.html", page: "cambiar-password", icon: "🔑", label: "Cambiar contraseña" },
        ]
      },
    ],

  },

  /* ── Verificar acceso ─────────────────────────────────── */
  tieneAcceso(pagina, rol) {
    const permitidos = this.PAGINAS[pagina];
    if (!permitidos) return true; // página no mapeada = acceso libre
    return permitidos.includes(rol);
  },

  /* ── Proteger página — redirige si no tiene permiso ────── */
  proteger(pagina) {
    const session = Auth.getSession();
    if (!session) {
      Auth.requireAuth();
      return false;
    }
    if (!this.tieneAcceso(pagina, session.rol)) {
      sessionStorage.setItem("fonevi_access_denied",
        "No tienes permisos para acceder a \"" + pagina + "\".");
      window.location.href = session.rol === "socio"
        ? "mi-cuenta.html"
        : "dashboard.html";
      return false;
    }
    return true;
  },

  /* ── Construir HTML del sidebar según rol ───────────────── */
  buildSidebar(session) {
    const secciones = this.SIDEBAR[session.rol];

    if (!secciones) {
      // Rol desconocido — mostrar solo Dashboard como fallback
      return '<div class="nav-section">' +
        '<span class="nav-section-label">Principal</span>' +
        '<a href="dashboard.html" class="nav-link" data-page="dashboard">' +
        '<span class="nav-icon">⊞</span> Dashboard</a></div>';
    }

    const notifs = (typeof DataHelper !== "undefined")
      ? DataHelper.getNotificacionesNoLeidas()
      : 0;

    return secciones.map(function(sec) {
      var items = sec.items.map(function(item) {
        var badge = (item.badge && notifs > 0)
          ? '<span class="nav-badge">' + notifs + '</span>'
          : '';
        return '<a href="' + item.href + '" class="nav-link" data-page="' + item.page + '">' +
          '<span class="nav-icon">' + item.icon + '</span>' +
          '<span>' + item.label + '</span>' + badge +
          '</a>';
      }).join('');

      return '<div class="nav-section">' +
        '<span class="nav-section-label">' + sec.sec + '</span>' +
        items +
        '</div>';
    }).join('');
  },

  /* ── Mostrar aviso de acceso denegado ───────────────────── */
  checkDeniedMessage() {
    const msg = sessionStorage.getItem("fonevi_access_denied");
    if (msg) {
      sessionStorage.removeItem("fonevi_access_denied");
      if (typeof Toast !== "undefined") {
        setTimeout(function() { Toast.warn("⚠ " + msg); }, 600);
      }
    }
  },

};

// Garantizar acceso global en todos los navegadores
if (typeof window !== "undefined") { window.Roles = Roles; }
