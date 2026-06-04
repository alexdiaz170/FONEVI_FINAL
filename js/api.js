/* ============================================================
   FONEVI — js/api.js
   Cliente HTTP completo: JWT, refresh, errores

   MODO DE OPERACIÓN:
   - Backend REST + PostgreSQL en tiempo real (NO offline)
   - Todas las peticiones requieren JWT válido
   ============================================================ */

const API = {

  /* ── Configuración ────────────────────────────────────── */
  // URL base según entorno (desde config.js)
  get BASE_URL() {
    return CONFIG.getBackendURL();
  },

  TIMEOUT_MS:  CONFIG.APP.TIMEOUT_MS,
  TOKEN_KEY:   CONFIG.APP.TOKEN_KEY,
  SESSION_KEY: CONFIG.APP.SESSION_KEY,
  _cleanQueryParams(params = {}) {
    const cleaned = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || value === 'undefined' || value === 'null') return;
      cleaned[key] = value;
    });
    return cleaned;
  },
  getToken()        { return sessionStorage.getItem(this.TOKEN_KEY) || null; },
  setToken(t)       { sessionStorage.setItem(this.TOKEN_KEY, t); },
  removeToken()     { sessionStorage.removeItem(this.TOKEN_KEY); },
  getSession()      {
    try {
      const r = sessionStorage.getItem(this.SESSION_KEY);
      return r ? JSON.parse(r) : null;
    } catch(e) { return null; }
  },
  setSession(s)     { sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(s)); },
  clearSession()    {
    this.removeToken();
    sessionStorage.removeItem(this.SESSION_KEY);
  },

  /* ── Headers base ─────────────────────────────────────── */
  _headers() {
    const h = { "Content-Type": "application/json" };
    const tok = this.getToken();
    if (tok) h["Authorization"] = `Bearer ${tok}`;
    return h;
  },

  /* ── Petición base con timeout + manejo de errores ───── */
  async _request(method, endpoint, body = null) {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000); // 8 segundos

    try {
      const res = await fetch(this.BASE_URL + endpoint, {
        method,
        headers: this._headers(),
        body: body ? JSON.stringify(body) : null,
        signal: ctrl.signal
      });

      clearTimeout(timer);

      const data = await res.json();

      if (res.status === 401) {
        console.error("API: 401 Unauthorized en " + endpoint, data);
        // NO redirigir de inmediato si es una petición de GUARDAR
        if (method === "POST" || method === "PUT") {
            const err = new Error(data.mensaje || "Sesión inválida");
            err.status = 401;
            throw err;
        }
        this.clearSession();
        var enPages = window.location.pathname.includes("/pages/") ||
                      window.location.pathname.includes("/app/");
        window.location.href = enPages ? "../index.html?error=session" : "index.html?error=session";
        return null;
      }

      if (!res.ok) {
        const err = new Error(data.mensaje || `Error ${res.status}`);
        err.status = res.status;
        err.data   = data;
        throw err;
      }

      return data;

    } catch(err) {
      clearTimeout(timer);
      
      // Errores de red (fetch falló antes de recibir respuesta)
      if (err.name === "AbortError" || err.message === "Failed to fetch" || 
          err.message.includes("NetworkError") || err.message.includes("net::")) {

        // No usar fallback local: fallar rápido y evidente.
        console.error("API: Error de conexión. Modo offline deshabilitado.", err.message);
        const errNet = new Error("No se pudo conectar al servidor. Modo offline está deshabilitado.");
        errNet.status = 503;
        throw errNet;
      }

      throw err;
    }
  },

  /* Atajos */
  get:    (ep)       => API._request("GET",    ep),
  post:   (ep, body) => API._request("POST",   ep, body),
  put:    (ep, body) => API._request("PUT",    ep, body),
  delete: (ep)       => API._request("DELETE", ep),
  ping:   ()         => API._request("GET",    "/health"),

  /* ── Verificar si el servidor está disponible ─────────── */
  async ping() {
    try {
      const ctrl = new AbortController();
      // Timeout reducido para ping: queremos respuesta rápida en la UI
      setTimeout(() => ctrl.abort(), 5000); 
      const res = await fetch(this.BASE_URL + "/health?t=" + Date.now(),
                              { signal: ctrl.signal });
      const data = await res.json();
      
      // Accept both `db` and `database` keys from different backend health implementations
      const dbState = data.db || data.database || data.db_state || null;
      if (data.ok && dbState === 'connected') {
        return true;
      }
      
      return false;
    } catch(e) {
      return false;
    }
  },

  /* ═══════════════════════════════════════════════════════
     MÓDULOS — API pública del cliente
  ═══════════════════════════════════════════════════════ */

  auth: {
    async login(email, password) {
      const data = await API.post("/auth/login", { email, password });
      if (data?.ok) {
        API.setToken(data.token);
        API.setSession(data.usuario);
      }
      return data;
    },
    logout() {
      API.clearSession();
      const enPages = window.location.pathname.includes("/pages/") ||
                      window.location.pathname.includes("/app/");
      window.location.href = enPages ? "../index.html" : "index.html";
    },
    perfil:          ()     => API.get("/auth/perfil"),
    cambiarPassword: (body) => API.put("/auth/cambiar-password", body),
  },

  dashboard: {
    resumen:      ()     => API.get("/dashboard/resumen"),
    graficoAnual: (anio) => API.get(`/dashboard/grafico-anual?anio=${anio||new Date().getFullYear()}`),
  },

  socios: {
    listar:       (p={})  => API.get("/socios?" + new URLSearchParams(API._cleanQueryParams(p))),
    obtener:      (id)    => API.get(`/socios/${id}`),
    estadoCuenta: (id, p={}) => API.get(`/socios/${id}/estado-cuenta?` + new URLSearchParams(API._cleanQueryParams(p))),
    crear:        (body)  => API.post("/socios", body),
    actualizar:   (id,b)  => API.put(`/socios/${id}`, b),
    eliminar:     (id)    => API.delete(`/socios/${id}`),
  },

  aportes: {
    listar:          (p={})        => API.get("/aportes?" + new URLSearchParams(API._cleanQueryParams(p))),
    registrar:       (body)        => API.post("/aportes", body),
    resumenPeriodo:  (periodo_id)  => API.get(`/aportes/resumen/${periodo_id}`),
    actualizarEstado:(id, estado)  => API.put(`/aportes/${id}/estado`, { estado }),
  },

  creditos: {
    listar:        (p={})  => API.get("/creditos?" + new URLSearchParams(p)),
    obtener:       (id)    => API.get(`/creditos/${id}`),
    simular:       (p)     => API.get("/creditos/simular?" + new URLSearchParams(p)),
    crear:         (body)  => API.post("/creditos", body),
    pagarCuota:    (id, n) => API.post(`/creditos/${id}/pagar-cuota`, { numero_cuota: n }),
    actualizarEstado: (id, estado) => API.put(`/creditos/${id}`, { estado }),
  },

  notificaciones: {
    listar:      (soloNL=false) => API.get(`/notificaciones?solo_no_leidas=${soloNL}`),
    marcarLeida: (id)           => API.put(`/notificaciones/${id}/leer`),
    marcarTodas: ()             => API.put("/notificaciones/leer-todas"),
  },

  config: {
    obtener:    ()          => API.get("/configuracion"),
    actualizar: (clave, v)  => API.put(`/configuracion/${clave}`, { valor: v }),
  },

  auditoria: {
    listar:  (p={})  => API.get("/auditoria?" + new URLSearchParams(p)),
    limpiar: (dias)  => API._request("DELETE", `/auditoria/limpiar?dias=${dias || 90}`),
  },

  whatsapp: {
    estado:        ()     => API.get("/whatsapp/estado"),
    logs:          (n=50) => API.get(`/whatsapp/logs?limit=${n}`),
    test:          (b)    => API.post("/whatsapp/test", b),
    recordatorios: ()     => API.post("/whatsapp/recordatorios", {}),
    alertasMora:   ()     => API.post("/whatsapp/alertas-mora", {}),
    individual:    (b)    => API.post("/whatsapp/individual", b),
  },

  solidaridad: {
    listar: (params={}) => API.get("/solidaridad/movimientos?" + new URLSearchParams(API._cleanQueryParams(params))),
    saldo:  ()          => API.get("/solidaridad/saldo"),
    crear:  (body)      => API.post("/solidaridad/movimientos", body),
  },

  movimientos: {
    listar:   (p={}) => API.get("/movimientos?" + new URLSearchParams(p)),
    crear:    (body) => API.post("/movimientos", body),
    eliminar: (id)   => API.delete(`/movimientos/${id}`),
  },
};

