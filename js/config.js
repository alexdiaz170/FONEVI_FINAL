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

    // Si estamos en un servidor (HTTP/HTTPS)
    if (window.location.protocol !== 'file:') {
      // Si estamos ejecutando en desarrollo local (localhost o similar) pero en un puerto diferente del backend (3000),
      // redirigir las peticiones al backend local real para evitar fallos de conexión (ej. Live Server).
      const hostname = window.location.hostname;
      const port = window.location.port;
      if ((hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) && port !== '3000' && port !== '') {
        const fallback = `http://${hostname}:3000`;
        console.log(`CONFIG: Detectado puerto alternativo (${port}) en desarrollo local, usando backend en:`, fallback);
        return this.normalizeApiURL(fallback);
      }

      console.log("CONFIG: Ejecutando en servidor web, aplicando Same-Origin '/api'");
      return "/api";
    }

    // Si estamos abriendo localmente desde archivo (file://), usar puerto local del backend
    const fallback = "http://localhost:3000";
    console.log("CONFIG: Local filesystem (file://), usando fallback en:", fallback);
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
