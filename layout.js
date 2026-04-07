/* ============================================================
   FONEVI — js/layout.js
   Inyecta sidebar + topbar. Todas las páginas viven en /pages/
   ============================================================ */
function buildLayout(titulo, subtitulo, accionHTML) {
  const s = Auth.getSession();
  if (!s) return;

  document.getElementById("app-layout").insertAdjacentHTML("afterbegin", `
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">F</div>
        <div><div class="logo-text-main">FONEVI</div><div class="logo-text-sub">Fondo de Empleados</div></div>
      </div>
      <div class="nav-wrapper">
        <div class="nav-section">
          <span class="nav-section-label">Principal</span>
          <a href="dashboard.html"     class="nav-link" data-page="dashboard"    ><span class="nav-icon">⊞</span> Dashboard</a>
          <a href="socios.html"        class="nav-link" data-page="socios"       ><span class="nav-icon">👥</span> Socios</a>
        </div>
        <div class="nav-section">
          <span class="nav-section-label">Finanzas</span>
          <a href="aportes.html"       class="nav-link" data-page="aportes"      ><span class="nav-icon">💰</span> Aportes <span class="nav-badge" id="notifBadge" style="display:none">!</span></a>
          <a href="creditos.html"      class="nav-link" data-page="creditos"     ><span class="nav-icon">💳</span> Créditos</a>
          <a href="solidaridad.html"   class="nav-link" data-page="solidaridad"  ><span class="nav-icon">🤝</span> Solidaridad</a>
          <a href="dividendos.html"    class="nav-link" data-page="dividendos"   ><span class="nav-icon">🎁</span> Dividendos</a>
        </div>
        <div class="nav-section">
          <span class="nav-section-label">Gestión</span>
          <a href="contabilidad.html"   class="nav-link" data-page="contabilidad" ><span class="nav-icon">📊</span> Contabilidad</a>
          <a href="reportes.html"       class="nav-link" data-page="reportes"     ><span class="nav-icon">📈</span> Reportes</a>
          <a href="notificaciones.html" class="nav-link" data-page="notificaciones"><span class="nav-icon">🔔</span> Notificaciones</a>
        </div>
        <div class="nav-section" data-role-admin>
          <span class="nav-section-label">Sistema</span>
          <a href="auditoria.html"      class="nav-link" data-page="auditoria"    ><span class="nav-icon">🔐</span> Auditoría</a>
          <a href="configuracion.html"  class="nav-link" data-page="configuracion"><span class="nav-icon">⚙️</span> Configuración</a>
        </div>
      </div>
      <div class="sidebar-user">
        <div class="user-avatar" id="sidebarUserAvatar">${s.avatar||"U"}</div>
        <div>
          <div class="user-name" id="sidebarUserName">${s.nombre}</div>
          <div class="user-role" id="sidebarUserRole">${s.rol}</div>
        </div>
        <button class="user-logout" id="logoutBtn" title="Cerrar sesión">⏻</button>
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
}
