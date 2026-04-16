/* ============================================================
   FONEVI — js/auth.js
   ============================================================ */
const Auth = {
  KEY: "fonevi_session",

  login(email, password) {
    const u = DB.usuarios.find(
      u => u.email === email.trim().toLowerCase() &&
           u.password === password &&
           u.estado === "activo"
    );
    if (!u) return { ok: false };
    const session = { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, avatar: u.avatar };
    sessionStorage.setItem(this.KEY, JSON.stringify(session));
    return { ok: true, usuario: session };
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
