/* ============================================================
   FONEVI — js/darkmode.js
   Gestor completo de modo oscuro:
   • Lee preferencia guardada en localStorage
   • Respeta prefers-color-scheme del sistema si no hay preferencia
   • Toggle instantáneo con transición suave
   • Actualiza el ícono del botón en el topbar
   • Expone DarkMode.toggle(), .enable(), .disable(), .isActive()
   ============================================================ */

const DarkMode = {

  STORAGE_KEY: "fonevi_theme",
  ATTR:        "data-theme",

  /* ── Inicializar — llamar lo antes posible (antes del render) ── */
  init() {
    const saved  = this._getSaved();
    const prefer = this._prefersSystem();
    const active = saved !== null ? saved === "dark" : prefer;
    this._apply(active, false);   // false = sin transición al cargar
  },

  /* ── Toggle público ─────────────────────────────────────── */
  toggle() {
    const active = !this.isActive();
    this._apply(active, true);
    this._save(active ? "dark" : "light");
    this._updateBtn(active);
    this._announce(active);
  },

  enable()    { this._apply(true,  true); this._save("dark");  this._updateBtn(true);  },
  disable()   { this._apply(false, true); this._save("light"); this._updateBtn(false); },
  isActive()  { return document.documentElement.getAttribute(this.ATTR) === "dark"; },

  /* ── Aplicar tema ───────────────────────────────────────── */
  _apply(dark, animate) {
    const html = document.documentElement;

    if (!animate) {
      /* Bloquear transición para la carga inicial — evita flash */
      html.style.transition = "none";
      html.style.colorScheme = dark ? "dark" : "light";
      html.setAttribute(this.ATTR, dark ? "dark" : "light");
      /* Forzar reflow y restaurar transición */
      html.offsetHeight;
      html.style.transition = "";
    } else {
      html.style.colorScheme = dark ? "dark" : "light";
      html.setAttribute(this.ATTR, dark ? "dark" : "light");
    }

    /* Actualizar meta theme-color del navegador */
    const metaTheme = document.querySelector("meta[name='theme-color']");
    if (metaTheme) {
      metaTheme.setAttribute("content", dark ? "#0e1117" : "#0f2d52");
    }
  },

  /* ── Actualizar botón toggle ────────────────────────────── */
  _updateBtn(dark) {
    const btn = document.getElementById("darkToggleBtn");
    if (!btn) return;
    btn.title = dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    btn.setAttribute("aria-label", btn.title);
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
  },

  /* ── Inyectar botón toggle en el topbar ─────────────────── */
  injectToggle() {
    /* Evitar doble inyección */
    if (document.getElementById("darkToggleBtn")) return;

    const actions = document.querySelector(".topbar-actions");
    if (!actions) return;

    const btn = document.createElement("button");
    btn.id          = "darkToggleBtn";
    btn.className   = "dark-toggle";
    btn.title       = this.isActive() ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    btn.setAttribute("aria-label", btn.title);
    btn.setAttribute("aria-pressed", this.isActive() ? "true" : "false");
    btn.innerHTML   = `
      <span class="icon-sun"  aria-hidden="true">☀️</span>
      <span class="icon-moon" aria-hidden="true">🌙</span>`;
    btn.addEventListener("click", () => DarkMode.toggle());

    /* Insertar como primer hijo de .topbar-actions */
    actions.insertBefore(btn, actions.firstChild);
  },

  /* ── Toast de confirmación ──────────────────────────────── */
  _announce(dark) {
    if (typeof Toast !== "undefined") {
      Toast.show(
        dark ? "🌙 Modo oscuro activado" : "☀️ Modo claro activado",
        "default",
        2000
      );
    }
  },

  /* ── Persistencia ───────────────────────────────────────── */
  _save(value)  { try { localStorage.setItem(this.STORAGE_KEY, value); } catch(e) {} },
  _getSaved()   { try { return localStorage.getItem(this.STORAGE_KEY); } catch(e) { return null; } },
  _prefersSystem() {
    return window.matchMedia &&
           window.matchMedia("(prefers-color-scheme: dark)").matches;
  },

  /* Escuchar cambios del sistema en tiempo real */
  watchSystem() {
    if (!window.matchMedia) return;
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
      /* Solo actualizar si el usuario NO ha guardado preferencia propia */
      if (this._getSaved() === null) {
        this._apply(e.matches, true);
        this._updateBtn(e.matches);
      }
    });
  }
};

/* ── Aplicar tema inmediatamente al cargar el script ───── */
/* Esto previene el "flash of white content" (FOWC) */
DarkMode.init();
DarkMode.watchSystem();
