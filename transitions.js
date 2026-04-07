/* ============================================================
   FONEVI — js/transitions.js
   Motor de transiciones: intercepta navegación, anima entrada/salida,
   barra de progreso, ripples, scroll reveal y contadores animados.
   
   Cargar ANTES de app.js en todas las páginas.
   ============================================================ */

/* ══════════════════════════════════════════════════════════
   NAVEGACIÓN CON TRANSICIÓN
   Intercepta TODOS los links internos .html y window.location
══════════════════════════════════════════════════════════ */
const PageTransition = {

  /* Duración de la animación de salida (debe coincidir con CSS) */
  EXIT_MS: 220,

  /* Inicializar — llamar una vez en DOMContentLoaded */
  init() {
    // Detectar si es la página de login (no tiene sidebar/main-content)
    const isLoginPage = document.body.classList.contains("login-page") ||
                        (!document.querySelector(".main-content") &&
                         !document.querySelector(".app-shell"));

    this._insertProgressBar();
    this._interceptLinks();
    this._interceptWindowLocation();

    // Solo en páginas internas hacer scroll reveal y ripples
    if (!isLoginPage) {
      this._playEnterAnimation();
      this._initScrollReveal();
      this._initRipples();
    }
  },

  /* ── Barra de progreso superior ─────────────────────── */
  _insertProgressBar() {
    if (document.getElementById("navProgress")) return;
    const bar = document.createElement("div");
    bar.id        = "navProgress";
    bar.className = "nav-progress";
    document.body.prepend(bar);
  },

  _progressStart() {
    const b = document.getElementById("navProgress");
    if (!b) return;
    b.classList.remove("done");
    b.style.width   = "0%";
    b.style.opacity = "1";
    // Avanzar rápido al principio, luego lento
    setTimeout(() => { b.style.width = "30%"; b.classList.add("running"); }, 10);
    setTimeout(() => { b.style.width = "65%"; }, 80);
    setTimeout(() => { b.style.width = "85%"; }, 160);
  },

  _progressDone() {
    const b = document.getElementById("navProgress");
    if (!b) return;
    b.classList.remove("running");
    b.classList.add("done");
    setTimeout(() => {
      b.style.width   = "0%";
      b.style.opacity = "0";
      b.classList.remove("done");
    }, 600);
  },

  /* ── Interceptar <a href> internos ──────────────────── */
  _interceptLinks() {
    document.addEventListener("click", (e) => {
      const link = e.target.closest("a[href]");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      // Solo links internos .html, sin # y sin target="_blank"
      if (!href.endsWith(".html") && !href.includes(".html?")) return;
      if (href.startsWith("http") || href.startsWith("//")) return;
      if (link.target === "_blank") return;

      e.preventDefault();
      this.navigateTo(href);
    });
  },

  /* ── Interceptar window.location.href = "..." ────────── */
  _interceptWindowLocation() {
    const self = this;
    const origDescriptor = Object.getOwnPropertyDescriptor(window.location, "href");

    // Proxy de window.location (solo funciona en algunos navegadores)
    // Alternativa más robusta: sobreescribir el método navigate global
    window._navigateTo = (url) => self.navigateTo(url);

    // Parchar todos los onclick con window.location.href en el DOM
    // después de que el layout esté listo
    setTimeout(() => {
      document.querySelectorAll("[onclick]").forEach(el => {
        const oc = el.getAttribute("onclick") || "";
        if (oc.includes("window.location.href") && oc.includes(".html")) {
          const match = oc.match(/window\.location\.href\s*=\s*['"]([^'"]+\.html[^'"]*)['"]/);
          if (match) {
            const url = match[1];
            el.removeAttribute("onclick");
            el.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              self.navigateTo(url);
            });
          }
        }
      });
    }, 0);
  },

  /* ── Navegar con animación de salida ─────────────────── */
  navigateTo(href) {
    if (this._navigating) return;

    // No animar en la página de login (no tiene contenido animable)
    const isLogin = !document.querySelector(".main-content") &&
                    !document.querySelector(".app-shell");
    if (isLogin) {
      window.location.href = href;
      return;
    }

    this._navigating = true;
    this._progressStart();

    // Guardar la dirección de navegación para la entrada
    const currentPage = this._getPageName(window.location.pathname);
    const targetPage  = this._getPageName(href);
    const dir         = this._getDirection(currentPage, targetPage);
    try {
      sessionStorage.setItem("tx_direction", dir);
      sessionStorage.setItem("tx_from", currentPage);
    } catch(e) {}

    // Animar contenido saliente
    const content = document.querySelector(".main-content") ||
                    document.querySelector(".page-content")  ||
                    document.querySelector(".app-shell")     ||
                    document.body;

    content.classList.add("page-exit");

    setTimeout(() => {
      window.location.href = href;
    }, this.EXIT_MS);
  },

  /* ── Animación de entrada al cargar la página ────────── */
  _playEnterAnimation() {
    let dir = "up";
    try {
      dir = sessionStorage.getItem("tx_direction") || "up";
      sessionStorage.removeItem("tx_direction");
    } catch(e) {}

    const content = document.querySelector(".main-content") ||
                    document.querySelector(".page-content")  ||
                    document.querySelector(".app-shell")     ||
                    document.body;

    // Quitar clase de salida si quedó
    content.classList.remove("page-exit");

    // Elegir clase de entrada según dirección
    const enterClass = dir === "right" ? "page-enter-right"
                     : dir === "left"  ? "page-enter-left"
                     : "page-enter";

    content.classList.add(enterClass);
    content.addEventListener("animationend", () => {
      content.classList.remove(enterClass);
      this._progressDone();
      this._navigating = false;
    }, { once: true });

    // Animar KPIs si existen
    const kpiGrid = document.getElementById("kpiGrid");
    if (kpiGrid) kpiGrid.classList.add("kpi-animated");

    // Animar tablas
    document.querySelectorAll(".data-table").forEach(t => {
      t.classList.add("table-animated");
    });

    // Stagger en grids
    document.querySelectorAll(
      ".grid-2, .grid-3, .grid-4, .kpi-grid, .grid-main-aside"
    ).forEach(g => g.classList.add("stagger-enter"));
  },

  /* ── Determinar dirección según orden del menú ────────── */
  _ORDER: [
    "dashboard","socios","aportes","creditos","solidaridad",
    "dividendos","contabilidad","reportes","notificaciones",
    "auditoria","configuracion","perfil"
  ],

  _getPageName(path) {
    return path.split("/").pop().replace(".html","").split("?")[0];
  },

  _getDirection(from, to) {
    const fi = this._ORDER.indexOf(from);
    const ti = this._ORDER.indexOf(to);
    if (fi === -1 || ti === -1) return "up";
    return ti > fi ? "right" : "left";
  },

  /* ── Scroll Reveal ────────────────────────────────────── */
  _initScrollReveal() {
    if (!("IntersectionObserver" in window)) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    // Observar cards y secciones relevantes
    document.querySelectorAll(
      ".card, .kpi-card, .m-card, .credito-card, .stat-box, .module-card"
    ).forEach(el => {
      if (!el.closest(".kpi-grid")) {  // KPIs ya tienen su propio anim
        el.classList.add("reveal");
        obs.observe(el);
      }
    });
  },

  /* ── Efecto Ripple en botones ─────────────────────────── */
  _initRipples() {
    document.querySelectorAll(".btn-primary, .btn-gold, .btn-danger, .btn-success")
      .forEach(btn => {
        btn.classList.add("btn-ripple");
        btn.addEventListener("click", function(e) {
          const r    = this.getBoundingClientRect();
          const size = Math.max(r.width, r.height) * 2;
          const x    = e.clientX - r.left - size / 2;
          const y    = e.clientY - r.top  - size / 2;
          const wave = document.createElement("span");
          wave.className = "ripple-wave";
          wave.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
          this.appendChild(wave);
          setTimeout(() => wave.remove(), 500);
        });
      });
  }
};

/* ══════════════════════════════════════════════════════════
   ANIMADOR DE NÚMEROS (contador animado)
   Uso: AnimCounter.run("miElemento", 0, 127, 600)
══════════════════════════════════════════════════════════ */
const AnimCounter = {
  run(elementId, from, to, durationMs = 700, formatter) {
    const el = document.getElementById(elementId);
    if (!el) return;

    // Respetar prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = formatter ? formatter(to) : to;
      return;
    }

    const start   = performance.now();
    const range   = to - from;
    const ease    = (t) => t < 0.5 ? 2*t*t : -1+(4-2*t)*t; // ease-in-out

    el.classList.add("count-up");

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const value    = Math.round(from + range * ease(progress));
      el.textContent = formatter ? formatter(value) : value;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  },

  /* Formatear como moneda COP */
  runCOP(elementId, from, to, durationMs = 800) {
    this.run(elementId, from, to, durationMs, (v) =>
      new Intl.NumberFormat("es-CO",{
        style:"currency", currency:"COP", minimumFractionDigits:0
      }).format(v)
    );
  },

  /* Formatear como millones */
  runMillones(elementId, from, to, durationMs = 800) {
    this.run(elementId, from, to, durationMs, (v) =>
      "$" + (v / 1000000).toFixed(1) + "M"
    );
  }
};

/* ══════════════════════════════════════════════════════════
   MICRO-ANIMACIONES UTILITARIAS
══════════════════════════════════════════════════════════ */
const MicroAnim = {

  /* Agitar un elemento (para errores) */
  shake(el) {
    if (typeof el === "string") el = document.getElementById(el);
    if (!el) return;
    el.style.animation = "none";
    el.offsetHeight; // reflow
    el.style.animation = "shake 0.4s ease";
    el.addEventListener("animationend", () => el.style.animation = "", { once:true });
  },

  /* Flash verde de éxito */
  success(el) {
    if (typeof el === "string") el = document.getElementById(el);
    if (!el) return;
    const orig = el.style.background;
    el.style.transition = "background 0.2s ease";
    el.style.background = "rgba(29,158,117,0.12)";
    setTimeout(() => { el.style.background = orig; }, 600);
  },

  /* Flash rojo de error */
  error(el) {
    if (typeof el === "string") el = document.getElementById(el);
    if (!el) return;
    const orig = el.style.background;
    el.style.transition = "background 0.2s ease";
    el.style.background = "rgba(163,45,45,0.10)";
    setTimeout(() => { el.style.background = orig; }, 600);
  },

  /* Pop: aparece con escala */
  pop(el, delay = 0) {
    if (typeof el === "string") el = document.getElementById(el);
    if (!el) return;
    el.style.animation = "none";
    setTimeout(() => {
      el.style.animation = "countPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both";
    }, delay);
  },

  /* Resaltar fila de tabla al actualizar */
  highlightRow(rowEl, color = "rgba(29,158,117,0.10)") {
    if (!rowEl) return;
    const cells = rowEl.querySelectorAll("td");
    cells.forEach(td => {
      td.style.transition = "background 0.15s ease";
      td.style.background = color;
    });
    setTimeout(() => {
      cells.forEach(td => { td.style.background = ""; });
    }, 1200);
  },

  /* Transición suave de altura (para acordeones / expandir) */
  expand(el) {
    if (!el) return;
    el.style.overflow   = "hidden";
    el.style.maxHeight  = "0";
    el.style.opacity    = "0";
    el.style.transition = "max-height 0.35s ease, opacity 0.3s ease";
    el.style.display    = "block";
    // Necesitamos el scrollHeight real
    requestAnimationFrame(() => {
      el.style.maxHeight = el.scrollHeight + "px";
      el.style.opacity   = "1";
    });
  },

  collapse(el) {
    if (!el) return;
    el.style.overflow   = "hidden";
    el.style.maxHeight  = el.scrollHeight + "px";
    el.style.transition = "max-height 0.3s ease, opacity 0.25s ease";
    requestAnimationFrame(() => {
      el.style.maxHeight = "0";
      el.style.opacity   = "0";
    });
    setTimeout(() => { el.style.display = "none"; }, 320);
  }
};

/* ══════════════════════════════════════════════════════════
   INICIALIZACIÓN AUTOMÁTICA
══════════════════════════════════════════════════════════ */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => PageTransition.init());
} else {
  PageTransition.init();
}

/* Agregar keyframe de shake al CSS dinámicamente */
(function() {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%,60%  { transform: translateX(-6px); }
      40%,80%  { transform: translateX(6px); }
    }
    @keyframes countPop {
      0%   { transform: scale(0.85); opacity: 0; }
      60%  { transform: scale(1.06); }
      100% { transform: scale(1);    opacity: 1; }
    }
  `;
  document.head.appendChild(style);
})();
