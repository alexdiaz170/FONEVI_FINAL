/* ============================================================
   FONEVI — js/api.js
   Cliente HTTP completo: JWT, refresh, errores, offline fallback
   
   MODO DE OPERACIÓN:
   - Si el servidor está corriendo → usa datos reales (PostgreSQL)
   - Si no hay servidor → usa DB local (data.js) automáticamente
   ============================================================ */

const API = {

  /* ── Configuración ────────────────────────────────────── */
  BASE_URL:    "http://localhost:3000/api",
  TIMEOUT_MS:  8000,   // 8 segundos antes de timeout
  TOKEN_KEY:   "fonevi_token",
  SESSION_KEY: "fonevi_session",
  MODO_OFFLINE: false,  // se activa automáticamente si el servidor no responde

  /* ── Token JWT ────────────────────────────────────────── */
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

    // Si ya sabemos que estamos offline → usar fallback directo
    if (this.MODO_OFFLINE) {
      return this._fallback(method, endpoint, body);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    const opts = {
      method,
      headers: this._headers(),
      signal: controller.signal,
    };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res  = await fetch(this.BASE_URL + endpoint, opts);
      clearTimeout(timer);
      const data = await res.json();

      // Token expirado → limpiar sesión y redirigir
      if (res.status === 401) {
        this.clearSession();
        const enPages = window.location.pathname.includes("/pages/") ||
                        window.location.pathname.includes("/app/");
        window.location.href = enPages ? "../index.html" : "index.html";
        return null;
      }

      if (!res.ok) {
        const err = new Error(data.mensaje || `Error ${res.status}`);
        err.status = res.status;
        err.data   = data;
        throw err;
      }

      // Servidor respondió → asegurarse de no estar en modo offline
      this.MODO_OFFLINE = false;
      return data;

    } catch(err) {
      clearTimeout(timer);

      // Timeout o sin conexión → activar modo offline
      if (err.name === "AbortError" || err.message === "Failed to fetch" ||
          err.message.includes("NetworkError") || err.message.includes("net::")) {

        console.warn("API: servidor no disponible → modo offline (data.js)");
        this.MODO_OFFLINE = true;

        // Mostrar banner si existe
        const banner = document.getElementById("offlineBanner");
        if (banner) banner.classList.add("show");

        return this._fallback(method, endpoint, body);
      }

      throw err;
    }
  },

  /* Atajos */
  get:    (ep)       => API._request("GET",    ep),
  post:   (ep, body) => API._request("POST",   ep, body),
  put:    (ep, body) => API._request("PUT",    ep, body),
  delete: (ep)       => API._request("DELETE", ep),

  /* ── FALLBACK LOCAL (usa data.js cuando no hay servidor) ── */
  async _fallback(method, endpoint, body) {
    console.log(`[Offline] ${method} ${endpoint}`);

    // ── GET /auth/perfil ───────────────────────────────────
    if (endpoint === "/auth/perfil") {
      const s = this.getSession();
      return s ? { ok: true, datos: s } : { ok: false };
    }

    // ── POST /auth/login ───────────────────────────────────
    if (endpoint === "/auth/login" && method === "POST") {
      const { email, password } = body;
      const u = DB.usuarios.find(
        u => u.email === email.trim().toLowerCase() &&
             u.password === password && u.estado === "activo"
      );
      if (!u) return { ok: false, mensaje: "Credenciales incorrectas" };
      const session = { id: u.id, nombre: u.nombre, email: u.email,
                        rol: u.rol, avatar: u.avatar };
      const fakeToken = btoa(JSON.stringify(session) + ":offline:" + Date.now());
      this.setToken(fakeToken);
      this.setSession(session);
      return { ok: true, token: fakeToken, usuario: session };
    }

    // ── GET /dashboard/resumen ─────────────────────────────
    if (endpoint === "/dashboard/resumen") {
      const socios   = DB.socios;
      const creditos = DB.creditos;
      return { ok: true, datos: {
        socios:     { total: socios.length, activos: socios.filter(s=>s.estado==="activo").length,
                      en_mora: socios.filter(s=>s.estado==="mora").length },
        ahorros:    { total: DataHelper.getTotalAhorros() },
        creditos:   { activos: DataHelper.getCreditosActivos().length,
                      cartera: DataHelper.getTotalCartera() },
        mora:       { socios: DataHelper.getSociosMora().length },
        aportes_mes:{ pagados: DB.aportes.filter(a=>a.estado==="pagado").length,
                      pendientes: DB.aportes.filter(a=>a.estado==="pendiente").length,
                      en_mora: DB.aportes.filter(a=>["mora","vencido"].includes(a.estado)).length,
                      total_recaudado: DB.aportes.filter(a=>a.estado==="pagado").reduce((t,a)=>t+a.monto,0) }
      }};
    }

    // ── GET /socios ────────────────────────────────────────
    if (endpoint.startsWith("/socios") && method === "GET") {
      const match = endpoint.match(/\/socios\/([^?/]+)/);
      if (match && match[1] && !match[1].includes("estado-cuenta")) {
        const s = DataHelper.getSocio(match[1]);
        return s ? { ok: true, datos: s } : { ok: false, mensaje: "No encontrado" };
      }
      if (endpoint.includes("estado-cuenta")) {
        const id = endpoint.match(/\/socios\/([^/]+)\/estado-cuenta/)[1];
        return { ok: true, datos: {
          socio:   DataHelper.getSocio(id),
          aportes: DataHelper.getAportesSocio(id),
          creditos: DataHelper.getCreditosSocio(id)
        }};
      }
      return { ok: true, datos: DB.socios, total: DB.socios.length };
    }

    // ── POST /socios ───────────────────────────────────────
    if (endpoint === "/socios" && method === "POST") {
      const last = DB.socios.length;
      const nuevo = { ...body, id: "S" + String(last+1).padStart(3,"0"),
                      codigo: "S" + String(last+1).padStart(3,"0"),
                      ahorro_acumulado: 0, estado: "activo",
                      created_at: new Date().toISOString() };
      DB.socios.push(nuevo);
      return { ok: true, datos: nuevo, mensaje: "Socio creado (modo offline)" };
    }

    // ── PUT /socios/:id ────────────────────────────────────
    if (endpoint.match(/\/socios\/.+/) && method === "PUT") {
      const id = endpoint.split("/socios/")[1];
      const idx = DB.socios.findIndex(s => s.id === id);
      if (idx >= 0) { Object.assign(DB.socios[idx], body); }
      return { ok: true, datos: DB.socios[idx], mensaje: "Actualizado (offline)" };
    }

    // ── GET /aportes ───────────────────────────────────────
    if (endpoint.startsWith("/aportes") && method === "GET") {
      if (endpoint.includes("resumen/")) {
        const pid = parseInt(endpoint.split("resumen/")[1]);
        const ap  = DB.aportes.filter(a => a.periodo_id === pid);
        return { ok: true, datos: {
          pagados: ap.filter(a=>a.estado==="pagado").length,
          pendientes: ap.filter(a=>a.estado==="pendiente").length,
          en_mora: ap.filter(a=>["mora","vencido"].includes(a.estado)).length,
          total_recaudado: ap.filter(a=>a.estado==="pagado").reduce((t,a)=>t+a.monto,0)
        }};
      }
      const params = new URLSearchParams(endpoint.split("?")[1] || "");
      let ap = DB.aportes;
      if (params.get("socio_id"))  ap = ap.filter(a => a.socio_id  === params.get("socio_id"));
      if (params.get("estado"))    ap = ap.filter(a => a.estado    === params.get("estado"));
      return { ok: true, datos: ap.map(a => ({
        ...a,
        socio_nombre: DataHelper.getSocioNombre(a.socio_id),
        periodo_nombre: a.periodo
      })) };
    }

    // ── POST /aportes ──────────────────────────────────────
    if (endpoint === "/aportes" && method === "POST") {
      const nuevo = { ...body, id: "A" + String(DB.aportes.length+1).padStart(3,"0"),
                      estado: "pagado", created_at: new Date().toISOString() };
      DB.aportes.push(nuevo);
      const s = DataHelper.getSocio(body.socio_id);
      if (s) s.ahorro_acumulado += body.monto;
      return { ok: true, datos: nuevo, mensaje: "Aporte registrado (offline)" };
    }

    // ── GET /creditos ──────────────────────────────────────
    if (endpoint.startsWith("/creditos") && method === "GET") {
      if (endpoint.includes("simular")) {
        const params = new URLSearchParams(endpoint.split("?")[1] || "");
        const monto  = parseFloat(params.get("monto"))  || 0;
        const cuotas = parseInt(params.get("cuotas"))   || 12;
        const tasa   = parseFloat(params.get("tasa"))   || DB.config.tasa_credito_mensual;
        const r      = tasa / 100;
        const cuota  = r === 0 ? monto/cuotas : monto*(r*Math.pow(1+r,cuotas))/(Math.pow(1+r,cuotas)-1);
        return { ok: true, datos: { monto, tasa_mensual: tasa, num_cuotas: cuotas,
          cuota_mensual: Math.round(cuota*100)/100,
          total_pagar: Math.round(cuota*cuotas*100)/100,
          total_intereses: Math.round((cuota*cuotas-monto)*100)/100 }};
      }
      const match = endpoint.match(/\/creditos\/([^?/]+)/);
      if (match) {
        const c = DB.creditos.find(x => x.id === match[1]);
        return c ? { ok: true, datos: c } : { ok: false };
      }
      const params = new URLSearchParams(endpoint.split("?")[1] || "");
      let cr = DB.creditos;
      if (params.get("socio_id")) cr = cr.filter(c => c.socio_id === params.get("socio_id"));
      if (params.get("estado"))   cr = cr.filter(c => c.estado   === params.get("estado"));
      return { ok: true, datos: cr.map(c => ({ ...c,
        socio_nombre: DataHelper.getSocioNombre(c.socio_id) })) };
    }

    // ── GET /notificaciones ────────────────────────────────
    if (endpoint.startsWith("/notificaciones") && method === "GET") {
      return { ok: true, datos: DB.notificaciones };
    }
    if (endpoint.includes("/leer") && method === "PUT") {
      if (endpoint === "/notificaciones/leer-todas") {
        DB.notificaciones.forEach(n => n.leida = true);
      } else {
        const id = endpoint.match(/\/notificaciones\/(.+)\/leer/)[1];
        const n  = DB.notificaciones.find(x => x.id === id);
        if (n) n.leida = true;
      }
      return { ok: true, mensaje: "Actualizado (offline)" };
    }

    // ── GET /configuracion ─────────────────────────────────
    if (endpoint === "/configuracion" && method === "GET") {
      return { ok: true, datos: DB.config };
    }

    // ── GET /whatsapp/estado ──────────────────────────────
    if (endpoint === "/whatsapp/estado" && method === "GET") {
      return { ok: true, habilitado: false,
        mensaje: "Modo offline — mensajes simulados. Configura WA_TOKEN en el servidor." };
    }

    // ── GET /whatsapp/logs ─────────────────────────────────
    if (endpoint.startsWith("/whatsapp/logs") && method === "GET") {
      var logs = DB._waLogs || [];
      return { ok: true, datos: logs, total: logs.length };
    }

    // ── POST /whatsapp/test ────────────────────────────────
    if (endpoint === "/whatsapp/test" && method === "POST") {
      var tel  = (body.telefono || "").replace(/\D/g,"");
      var nom  = body.nombre || "Socio";
      if (!tel || tel.length < 10) {
        return { ok: false, mensaje: "Número inválido. Usa 10 dígitos sin +57." };
      }
      var log = { id: "WL"+Date.now(), numero: "57"+tel,
        template: "fonevi_bienvenida", estado: "simulado",
        message_id: null, enviado_en: new Date().toISOString() };
      if (!DB._waLogs) DB._waLogs = [];
      DB._waLogs.unshift(log);
      console.log("[WA Simulado] → +57"+tel+" | Hola "+nom+", este es un mensaje de prueba de FONEVI.");
      return { ok: true, resultado: { simulado: true, numero: "57"+tel,
        mensaje: "Hola "+nom+", este es un mensaje de prueba de FONEVI." } };
    }

    // ── POST /whatsapp/recordatorios ───────────────────────
    if (endpoint === "/whatsapp/recordatorios" && method === "POST") {
      var pendientes = DB.aportes.filter(function(a){
        return a.estado === "pendiente" && a.periodo === DB.config.periodo_actual;
      });
      var enviados = 0; var sinTel = 0; var detalle = [];
      if (!DB._waLogs) DB._waLogs = [];
      pendientes.forEach(function(a) {
        var s = DataHelper.getSocio(a.socio_id);
        if (!s) return;
        var tel = (s.telefono||"").replace(/\D/g,"");
        if (!tel || tel.length < 10) { sinTel++; detalle.push({socio:s.nombre,ok:false,razon:"sin_telefono"}); return; }
        enviados++;
        var log = { id: "WL"+Date.now()+enviados, numero: "57"+tel,
          template: "fonevi_recordatorio_pago", estado: "simulado",
          message_id: null, enviado_en: new Date().toISOString() };
        DB._waLogs.unshift(log);
        console.log("[WA Simulado] Recordatorio → +57"+tel+" | "+s.nombre+" — "+a.periodo);
        detalle.push({socio:s.nombre, ok:true, simulado:true});
      });
      return { ok: true, resultado: { enviados, sinTelefono:sinTel, fallidos:0, detalle } };
    }

    // ── POST /whatsapp/alertas-mora ────────────────────────
    if (endpoint === "/whatsapp/alertas-mora" && method === "POST") {
      var morosos = DB.aportes.filter(function(a){
        return ["mora","vencido"].includes(a.estado);
      });
      var enviados = 0; var sinTel = 0; var detalle = [];
      if (!DB._waLogs) DB._waLogs = [];
      morosos.forEach(function(a) {
        var s = DataHelper.getSocio(a.socio_id);
        if (!s) return;
        var tel = (s.telefono||"").replace(/\D/g,"");
        if (!tel || tel.length < 10) { sinTel++; detalle.push({socio:s.nombre,ok:false,razon:"sin_telefono"}); return; }
        enviados++;
        var log = { id: "WL"+Date.now()+enviados, numero: "57"+tel,
          template: "fonevi_mora_alerta", estado: "simulado",
          message_id: null, enviado_en: new Date().toISOString() };
        DB._waLogs.unshift(log);
        console.log("[WA Simulado] Mora → +57"+tel+" | "+s.nombre+" — "+a.periodo);
        detalle.push({socio:s.nombre, ok:true, simulado:true});
      });
      return { ok: true, resultado: { enviados, sinTelefono:sinTel, fallidos:0, detalle } };
    }

    // ── POST /whatsapp/individual ──────────────────────────
    if (endpoint === "/whatsapp/individual" && method === "POST") {
      var socioId  = body.socio_id;
      var template = body.template || "fonevi_recordatorio_pago";
      var s = DataHelper.getSocio(socioId);
      if (!s) return { ok: false, mensaje: "Socio no encontrado" };
      var tel = (s.telefono||"").replace(/\D/g,"");
      if (!tel || tel.length < 10) return { ok: false, mensaje: "El socio no tiene teléfono registrado" };
      if (!DB._waLogs) DB._waLogs = [];
      var log = { id: "WL"+Date.now(), numero: "57"+tel,
        template: template, estado: "simulado",
        message_id: null, enviado_en: new Date().toISOString() };
      DB._waLogs.unshift(log);
      console.log("[WA Simulado] Individual → +57"+tel+" | "+s.nombre+" | "+template);
      return { ok: true, resultado: { simulado: true, numero: "57"+tel, socio: s.nombre } };
    }

    // Endpoint no mapeado
    console.warn("[Offline] Endpoint no mapeado:", method, endpoint);
    return { ok: true, datos: [], mensaje: "Modo offline — datos locales" };
  },

  /* ── Verificar si el servidor está disponible ─────────── */
  async ping() {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 1500);
      const res = await fetch(this.BASE_URL.replace("/api","") + "/api/health",
                              { signal: ctrl.signal });
      const data = await res.json();
      this.MODO_OFFLINE = !data.ok;
      return data.ok;
    } catch(e) {
      this.MODO_OFFLINE = true;
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
    listar:       (p={})  => API.get("/socios?" + new URLSearchParams(p)),
    obtener:      (id)    => API.get(`/socios/${id}`),
    estadoCuenta: (id)    => API.get(`/socios/${id}/estado-cuenta`),
    crear:        (body)  => API.post("/socios", body),
    actualizar:   (id,b)  => API.put(`/socios/${id}`, b),
    eliminar:     (id)    => API.delete(`/socios/${id}`),
  },

  aportes: {
    listar:          (p={})        => API.get("/aportes?" + new URLSearchParams(p)),
    registrar:       (body)        => API.post("/aportes", body),
    resumenPeriodo:  (periodo_id)  => API.get(`/aportes/resumen/${periodo_id}`),
    actualizarEstado:(id, estado)  => API.put(`/aportes/${id}/estado`, { estado }),
  },

  creditos: {
    listar:     (p={})  => API.get("/creditos?" + new URLSearchParams(p)),
    obtener:    (id)    => API.get(`/creditos/${id}`),
    simular:    (p)     => API.get("/creditos/simular?" + new URLSearchParams(p)),
    crear:      (body)  => API.post("/creditos", body),
    pagarCuota: (id, n) => API.post(`/creditos/${id}/pagar-cuota`, { numero_cuota: n }),
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
    listar: (p={}) => API.get("/auditoria?" + new URLSearchParams(p)),
  },

  whatsapp: {
    estado:        ()     => API.get("/whatsapp/estado"),
    logs:          (n=50) => API.get(`/whatsapp/logs?limit=${n}`),
    test:          (b)    => API.post("/whatsapp/test", b),
    recordatorios: ()     => API.post("/whatsapp/recordatorios", {}),
    alertasMora:   ()     => API.post("/whatsapp/alertas-mora", {}),
    individual:    (b)    => API.post("/whatsapp/individual", b),
  },
};
