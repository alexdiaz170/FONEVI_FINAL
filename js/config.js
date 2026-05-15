/* ============================================================
   FONEVI — js/config.js
   Configuración de entornos y URLs del sistema
   ============================================================ */

const CONFIG = {

  /* ── Entornos ─────────────────────────────────────────── */
  isProduction() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return protocol !== 'file:' &&
           hostname !== '' &&
           hostname !== 'localhost' &&
           hostname !== '127.0.0.1' &&
           !hostname.includes('.local') &&
           !hostname.includes('192.168.') &&
           !hostname.includes('10.0.');
  },

  isDevelopment() {
    return !this.isProduction();
  },

  /* ── URLs del Backend ─────────────────────────────────── */
  normalizeApiURL(url) {
    if (!url) return "";
    const clean = String(url).trim().replace(/\/+$/, "");
    return clean.endsWith("/api") ? clean : `${clean}/api`;
  },

  getBackendURL() {
    const runtimeURL = window.FONEVI_API_URL ||
      document.querySelector('meta[name="fonevi-api-url"]')?.content;

    if (runtimeURL) {
      console.log("CONFIG: Usando URL de runtime:", runtimeURL);
      return this.normalizeApiURL(runtimeURL);
    }

    // Si estamos en un servidor (no file://)
    if (window.location.protocol !== 'file:') {
      // Si el puerto es el del backend (3000), o si estamos en producción, usar el mismo origen
      if (window.location.port === '3000' || this.isProduction()) {
        const url = window.location.origin;
        console.log("CONFIG: Usando URL de origen actual:", url);
        return this.normalizeApiURL(url);
      }
    }

    if (this.isProduction()) {
      console.log("CONFIG: Modo producción activo.");
      return "https://tu-backend-produccion.herokuapp.com/api";
    }

    // Desarrollo local (fallback): Siempre apuntar al backend de Node en el puerto 3000
    const fallback = "http://localhost:3000";
    console.log("CONFIG: Desarrollo local, usando backend en:", fallback);
    return this.normalizeApiURL(fallback);
  },

  /* ── Configuración de la aplicación ───────────────────── */
  APP: {
    NAME: "FONEVI",
    VERSION: "1.0.0",
    TIMEOUT_MS: 8000,
    TOKEN_KEY: "fonevi_token",
    SESSION_KEY: "fonevi_session"
  },

  /* ── Características por entorno ──────────────────────── */
  FEATURES: {
    OFFLINE_MODE: false, // OBLIGAR a usar el servidor real
    DEBUG_MODE: true,    // Mostrar logs detallados para depuración
    AUTO_REDIRECT: true  // Redirigir automáticamente en errores 401
  },

  /* ── Mensajes de configuración ────────────────────────── */
  getConfigMessage() {
    if (this.isProduction() && this.getBackendURL().includes("tu-backend-produccion")) {
      console.warn("⚠️ CONFIGURACIÓN PENDIENTE:");
      console.warn("   El frontend está en modo producción pero la URL del backend no está configurada.");
      console.warn("   Edita js/config.js y cambia la URL en getBackendURL() para producción.");
      console.warn("   URL actual:", this.getBackendURL());
    }
  }

};

// Mostrar mensaje de configuración al cargar
CONFIG.getConfigMessage();
