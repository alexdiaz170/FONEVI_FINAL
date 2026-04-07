/* ============================================================
   FONEVI — js/loading.js
   Sistema de skeletons, spinners y estados de carga
   Usar en cualquier página que necesite feedback visual
   ============================================================ */

const Skeleton = {

  /* ── Generadores de HTML skeleton ──────────────────────── */

  /* 4 KPI cards */
  kpis() {
    return `<div class="sk-kpi-grid">` +
      Array(4).fill(0).map(() => `
        <div class="sk-kpi-card">
          <div class="sk sk-kpi-label"></div>
          <div class="sk sk-kpi-value"></div>
          <div class="sk sk-kpi-footer"></div>
        </div>`).join("") +
    `</div>`;
  },

  /* Gráfico de barras */
  chartBar(height = 220) {
    return `<div class="sk-chart" style="height:${height}px;">` +
      Array(12).fill(0).map(() => `<div class="sk-chart-bar"></div>`).join("") +
    `</div>`;
  },

  /* Gráfico de línea */
  chartLine(height = 220) {
    return `<div class="sk sk-slow sk-chart-line" style="height:${height}px;"></div>`;
  },

  /* Gráfico de dona */
  chartDona() {
    return `<div class="sk-chart-dona"><div class="sk-dona-ring"></div></div>`;
  },

  /* Filas de tabla */
  tableRows(rows = 5, cols = 4) {
    const colStr = `repeat(${cols}, 1fr)`;
    return `
      <div class="sk-table-header" style="--sk-cols:${colStr};">
        ${Array(cols).fill(0).map(() => `<div class="sk sk-table-th"></div>`).join("")}
      </div>` +
      Array(rows).fill(0).map((_, i) => `
        <div class="sk-table-row" style="--sk-cols:${colStr};animation-delay:${i * 0.06}s;">
          ${Array(cols).fill(0).map(() => `<div class="sk sk-table-cell"></div>`).join("")}
        </div>`).join("");
  },

  /* Filas con avatar (tipo actividad) */
  activityRows(rows = 5) {
    return Array(rows).fill(0).map((_, i) => `
      <div class="sk-row-avatar" style="animation-delay:${i * 0.07}s;">
        <div class="sk sk-avatar"></div>
        <div class="sk-row-avatar-info">
          <div class="sk sk-row-avatar-name"></div>
          <div class="sk sk-row-avatar-sub"></div>
        </div>
        <div class="sk sk-row-avatar-right"></div>
      </div>`).join("");
  },

  /* Hero del perfil de socio */
  hero() {
    return `
      <div class="sk-hero">
        <div class="sk-hero-avatar"></div>
        <div class="sk-hero-info">
          <div class="sk-hero-name"></div>
          <div class="sk-hero-cargo"></div>
          <div class="sk-hero-badges">
            <div class="sk-hero-badge"></div>
            <div class="sk-hero-badge"></div>
            <div class="sk-hero-badge"></div>
          </div>
        </div>
        <div class="sk-hero-stats">
          <div class="sk-hero-stat">
            <div class="sk-hero-stat-num"></div>
            <div class="sk-hero-stat-lbl"></div>
          </div>
          <div class="sk-hero-stat">
            <div class="sk-hero-stat-num"></div>
            <div class="sk-hero-stat-lbl"></div>
          </div>
          <div class="sk-hero-stat">
            <div class="sk-hero-stat-num"></div>
            <div class="sk-hero-stat-lbl"></div>
          </div>
        </div>
      </div>`;
  },

  /* Métricas en grid (N tarjetas) */
  metrics(n = 4) {
    return `<div class="sk-kpi-grid" style="grid-template-columns:repeat(${n},1fr);">` +
      Array(n).fill(0).map(() => `
        <div class="sk-kpi-card">
          <div class="sk sk-kpi-label"></div>
          <div class="sk sk-kpi-value" style="height:20px;"></div>
        </div>`).join("") +
    `</div>`;
  },

  /* Timeline de aportes */
  timeline(rows = 6) {
    return Array(rows).fill(0).map((_, i) => `
      <div class="sk-timeline-item" style="animation-delay:${i * 0.07}s;">
        <div class="sk sk-tl-dot"></div>
        <div class="sk sk-tl-name"></div>
        <div class="sk sk-tl-monto"></div>
        <div class="sk sk-tl-fecha"></div>
      </div>`).join("");
  },

  /* Card genérica con body height */
  card(bodyHeight = 120) {
    return `
      <div class="sk-card">
        <div class="sk-card-header">
          <div class="sk sk-card-title"></div>
          <div class="sk sk-card-action"></div>
        </div>
        <div class="sk-card-body">
          <div class="sk sk-slow" style="height:${bodyHeight}px;border-radius:var(--r-md);"></div>
        </div>
      </div>`;
  },

  /* Texto en párrafos */
  text(lines = 3) {
    const widths = ["90%","75%","85%","60%","80%","70%"];
    return Array(lines).fill(0).map((_, i) => `
      <div class="sk" style="height:13px;width:${widths[i % widths.length]};margin-bottom:10px;animation-delay:${i*0.06}s;"></div>`
    ).join("");
  },

  /* ── Aplicar skeleton a un elemento ─────────────────────── */
  show(elementId, tipo, ...args) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const html = typeof tipo === "string" && this[tipo]
      ? this[tipo](...args)
      : tipo; // si es string HTML directo
    el.innerHTML = html;
    el.classList.add("sk-active");
  },

  /* ── Quitar skeleton y mostrar contenido con fade ────────── */
  hide(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.classList.remove("sk-active");
    el.classList.add("content-loaded");
    setTimeout(() => el.classList.remove("content-loaded"), 600);
  }
};

/* ═══════════════════════════════════════════════════════════
   SPINNER — crear y controlar spinners
═══════════════════════════════════════════════════════════ */
const Spinner = {

  /* Spinner HTML inline */
  html(size = "", color = "") {
    return `<div class="spinner ${size} ${color}"></div>`;
  },

  /* Tres puntos */
  dots(color = "") {
    return `<div class="spinner-dots ${color}">
      <span></span><span></span><span></span>
    </div>`;
  },

  /* Barra de progreso indeterminada */
  bar(color = "") {
    return `<div class="progress-indeterminate ${color}"></div>`;
  },

  /* Mostrar overlay de carga sobre un elemento con position:relative */
  overlay(parentId, mensaje = "Cargando...") {
    const parent = document.getElementById(parentId);
    if (!parent) return;
    // Asegurar position relative
    if (getComputedStyle(parent).position === "static") {
      parent.style.position = "relative";
    }
    // Eliminar overlay anterior si existe
    this.removeOverlay(parentId);

    const overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    overlay.id = "overlay_" + parentId;
    overlay.innerHTML = `
      <div class="spinner"></div>
      <span class="loading-overlay-msg">${mensaje}</span>`;
    parent.appendChild(overlay);
    // Forzar reflow para que la transición funcione
    overlay.offsetHeight;
    overlay.classList.add("show");
  },

  removeOverlay(parentId) {
    const existing = document.getElementById("overlay_" + parentId);
    if (existing) {
      existing.classList.remove("show");
      setTimeout(() => existing.remove(), 200);
    }
  },

  /* Estado loading en un botón */
  btnStart(btnId, texto = "") {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="btn-text">${texto || btn.textContent}</span>`;
    btn.classList.add("loading");
  },

  btnStop(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.classList.remove("loading");
  }
};

/* ═══════════════════════════════════════════════════════════
   PAGE LOADING — pantalla de inicio
═══════════════════════════════════════════════════════════ */
const PageLoader = {

  show(mensaje = "Cargando FONEVI...") {
    // No crear si ya existe
    if (document.getElementById("pageLoader")) return;
    const el = document.createElement("div");
    el.id = "pageLoader";
    el.className = "page-loading";
    el.innerHTML = `
      <div class="page-loading-logo">F</div>
      <div class="progress-indeterminate" style="width:180px;"></div>
      <span class="page-loading-text">${mensaje}</span>`;
    document.body.appendChild(el);
  },

  hide() {
    const el = document.getElementById("pageLoader");
    if (el) {
      el.classList.add("hidden");
      setTimeout(() => el.remove(), 400);
    }
  }
};

/* ═══════════════════════════════════════════════════════════
   FUNCIÓN HELPER — simular carga con delay (para demos)
   En producción reemplazar con fetch() real
═══════════════════════════════════════════════════════════ */
function simularCarga(ms = 800) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ═══════════════════════════════════════════════════════════
   FUNCIÓN HELPER — cargar sección con skeleton + datos
   
   Uso:
   await cargarSeccion("kpiGrid", "kpis", function() {
     renderKPIs();
   });
═══════════════════════════════════════════════════════════ */
async function cargarSeccion(elementId, skeletonTipo, renderFn, delay = 600) {
  // 1. Mostrar skeleton
  Skeleton.show(elementId, skeletonTipo);

  // 2. Simular delay de carga (en producción: await fetch(...))
  await simularCarga(delay);

  // 3. Renderizar datos reales
  if (typeof renderFn === "function") renderFn();

  // 4. Animación de entrada
  Skeleton.hide(elementId);
}
