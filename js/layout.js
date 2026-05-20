/* ── doLogout ── */
function doLogout() {
  if (window._loggingOut) return;
  if (!confirm("¿Deseas cerrar sesión?")) return;
  
  window._loggingOut = true;
  if (typeof API !== "undefined") API.clearSession();
  
  if (typeof Auth !== "undefined" && Auth.logout) {
    Auth.logout();
  } else {
    sessionStorage.clear();
    const enPages = window.location.pathname.includes("/pages/") || window.location.pathname.includes("/app/");
    window.location.href = enPages ? "../index.html" : "index.html";
  }
}

/* ============================================================
   FONEVI — js/layout.js
   Inyecta sidebar + topbar. Todas las páginas viven en /pages/
   ============================================================ */
function buildLayout(titulo, subtitulo, accionHTML) {
  const s = Auth.getSession();
  if (!s) return;

  // Construir nav según el rol del usuario
  // Buscar Roles en scope local o en window (compatibilidad con const/var)
  var _Roles = (typeof Roles !== "undefined") ? Roles
             : (typeof window !== "undefined" && window.Roles) ? window.Roles
             : null;
  const navHTML = _Roles ? _Roles.buildSidebar(s) : _navFallback();
  function _navFallback() {
    return `<div class="nav-section"><span class="nav-section-label">Principal</span>
      <a href="dashboard.html" class="nav-link" data-page="dashboard"><span class="nav-icon">⊞</span> Dashboard</a></div>`;
  }

  document.getElementById("app-layout").insertAdjacentHTML("afterbegin", `
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">F</div>
        <div><div class="logo-text-main">FONEVI</div><div class="logo-text-sub">Fondo de Empleados</div></div>
      </div>
      <div class="nav-wrapper" id="sidebarNav">
        ${navHTML}
      </div>
      <div class="sidebar-user">
        <div class="user-avatar" id="sidebarUserAvatar">${s.avatar||"U"}</div>
        <div>
          <div class="user-name" id="sidebarUserName">${s.nombre}</div>
          <div class="user-role" id="sidebarUserRole">${s.rol}</div>
        </div>
        <button class="user-logout" id="logoutBtn" title="Cerrar sesión" onclick="doLogout()">⏻</button>
      </div>
    </nav>
    <div class="overlay-backdrop" id="sidebarBackdrop"></div>
  `);

  document.querySelector(".main-content").insertAdjacentHTML("afterbegin", `
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="mobile-menu-btn" id="menuBtn">☰</button>
        <div>
          <div class="topbar-title">${titulo}</div>
          <div class="topbar-sub">${subtitulo||""}</div>
        </div>
      </div>
      <div class="topbar-actions">
        <button class="btn-icon" onclick="window.location.href='notificaciones.html'" title="Notificaciones">
          🔔<span class="dot" id="topNotifDot" style="display:none"></span>
        </button>
        ${accionHTML||""}
      </div>
    </div>
  `);

  // Marcar activo
  const page = window.location.pathname.split("/").pop().replace(".html","");
  document.querySelectorAll(".nav-link[data-page]").forEach(a => {
    if (a.dataset.page === page) a.classList.add("active");
  });

  // Inyectar toggle de modo oscuro en el topbar
  if (typeof DarkMode !== "undefined") {
    DarkMode.injectToggle();
  }

  // Inicializar el sidebar (menuBtn y backdrop) — debe llamarse
  // DESPUÉS de que buildLayout inyecte el HTML del sidebar
  if (typeof Sidebar !== "undefined") {
    Sidebar.init();
  } else {
    // Fallback: registrar el click del menú hamburguesa directamente
    var menuBtn = document.getElementById("menuBtn");
    var backdrop = document.getElementById("sidebarBackdrop");
    var sidebar  = document.getElementById("sidebar");
    if (menuBtn && sidebar) {
      menuBtn.addEventListener("click", function() {
        sidebar.classList.toggle("open");
        if (backdrop) backdrop.classList.toggle("show");
      });
    }
    if (backdrop && sidebar) {
      backdrop.addEventListener("click", function() {
        sidebar.classList.remove("open");
        backdrop.classList.remove("show");
      });
    }
  }
}
