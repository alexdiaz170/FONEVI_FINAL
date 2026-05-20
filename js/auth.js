/* ============================================================
   FONEVI — js/auth.js
   ============================================================ */
const Auth = {
  KEY: "fonevi_session",

  async login(email, password) {
    try {
      const res = await API.auth.login(email, password);
      if (res && res.ok) {
        // API.auth.login already sets token and session via API.setToken/session
        const session = res.usuario || res.usuario;
        sessionStorage.setItem(this.KEY, JSON.stringify(res.usuario || res.usuario));
        return { ok: true, usuario: res.usuario };
      }
      return { ok: false, mensaje: res?.mensaje || 'Credenciales incorrectas' };
    } catch (e) {
      return { ok: false, mensaje: e.message || 'Error de conexión' };
    }
  },

  logout() {
    sessionStorage.removeItem(this.KEY);
    // Detectar nivel de carpeta y redirigir correctamente
    const enPages = window.location.pathname.includes("/pages/");
    window.location.href = enPages ? "../index.html" : "index.html";
  },

  getSession() {
    try {
      const raw = sessionStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  },

  requireAuth() {
    const s = this.getSession();
    if (!s) {
      const enPages = window.location.pathname.includes("/pages/");
      window.location.href = enPages ? "../index.html" : "index.html";
      return null;
    }
    return s;
  },

  applyRoleUI() {
    const s = this.getSession();
    if (!s) return;
    document.querySelectorAll("[data-role-admin]").forEach(el => {
      el.style.display = s.rol === "administrador" ? "" : "none";
    });
    document.querySelectorAll("[data-role-staff]").forEach(el => {
      el.style.display = ["administrador","tesorero"].includes(s.rol) ? "" : "none";
    });
  }
};
