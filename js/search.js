/* ============================================================
   FONEVI — js/search.js
   Búsqueda global Ctrl+K
   
   Auto-contenido: inyecta su propio HTML y CSS.
   Carga después de data.js y layout.js.
   ============================================================ */

const Search = (() => {

  /* ── Estado interno ──────────────────────────────────────── */
  let abierto       = false;
  let indiceSel     = -1;
  let resultados    = [];
  let timer         = null;

  /* ── Inyectar CSS ────────────────────────────────────────── */
  function inyectarCSS() {
    if (document.getElementById("search-styles")) return;
    const s = document.createElement("style");
    s.id = "search-styles";
    s.textContent = `
      /* Overlay */
      #foneviSearchOverlay {
        position: fixed; inset: 0; z-index: 9000;
        background: rgba(5,15,30,.62);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        display: flex; align-items: flex-start; justify-content: center;
        padding-top: clamp(60px, 10vh, 130px);
        opacity: 0; transition: opacity .18s ease;
        pointer-events: none;
      }
      #foneviSearchOverlay.open {
        opacity: 1; pointer-events: all;
      }

      /* Panel */
      #foneviSearchPanel {
        width: min(620px, calc(100vw - 32px));
        background: var(--bg-surface);
        border: 1px solid var(--border-light);
        border-radius: 18px;
        box-shadow: 0 24px 72px rgba(5,15,30,.28), 0 0 0 1px rgba(255,255,255,.06);
        overflow: hidden;
        transform: translateY(-12px) scale(.97);
        transition: transform .2s cubic-bezier(0.16,1,0.3,1);
        max-height: min(520px, 80vh);
        display: flex; flex-direction: column;
      }
      #foneviSearchOverlay.open #foneviSearchPanel {
        transform: translateY(0) scale(1);
      }

      /* Barra de búsqueda */
      #foneviSearchBar {
        display: flex; align-items: center; gap: 10px;
        padding: 14px 18px;
        border-bottom: 1px solid var(--border-faint);
        flex-shrink: 0;
      }
      #foneviSearchIcon {
        font-size: 16px; opacity: .4; flex-shrink: 0; user-select: none;
      }
      #foneviSearchInput {
        flex: 1; border: none; outline: none; background: transparent;
        font-size: 16px; font-family: var(--font-body);
        color: var(--text-primary);
        caret-color: var(--gold-500);
      }
      #foneviSearchInput::placeholder { color: var(--text-faint); }
      #foneviSearchClear {
        width: 22px; height: 22px; border-radius: 50%;
        background: var(--bg-muted); border: none; cursor: pointer;
        display: none; align-items: center; justify-content: center;
        font-size: 12px; color: var(--text-muted);
        flex-shrink: 0; transition: background .15s;
      }
      #foneviSearchClear.visible { display: flex; }
      #foneviSearchClear:hover { background: var(--border-light); color: var(--text-primary); }

      /* Atajo en la barra */
      #foneviSearchKbd {
        font-size: 10px; color: var(--text-faint);
        background: var(--bg-muted); border: 1px solid var(--border-light);
        border-radius: 5px; padding: 2px 6px; font-family: var(--font-mono);
        white-space: nowrap; flex-shrink: 0;
      }

      /* Área de resultados */
      #foneviSearchResults {
        overflow-y: auto; flex: 1;
        padding: 6px 0 8px;
      }
      #foneviSearchResults:empty { display: none; }

      /* Categoría */
      .sr-cat-label {
        font-size: 9.5px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 1.2px; color: var(--text-faint);
        padding: 8px 18px 4px; user-select: none;
      }

      /* Ítem de resultado */
      .sr-item {
        display: flex; align-items: center; gap: 12px;
        padding: 9px 18px; cursor: pointer;
        border-radius: 0; transition: background .08s;
        text-decoration: none;
        position: relative;
      }
      .sr-item:hover,
      .sr-item.sel {
        background: var(--bg-subtle);
      }
      .sr-item.sel::before {
        content: ''; position: absolute; left: 0; top: 4px; bottom: 4px;
        width: 3px; background: var(--gold-500); border-radius: 0 2px 2px 0;
      }

      /* Ícono del ítem */
      .sr-ico {
        width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px;
      }
      .sr-ico.socio   { background: var(--navy-50);  }
      .sr-ico.aporte  { background: var(--green-50); }
      .sr-ico.credito { background: var(--gold-50);  }
      .sr-ico.pagina  { background: var(--bg-muted); }
      .sr-ico.mora    { background: var(--red-50);   }

      /* Texto del ítem */
      .sr-texto { flex: 1; min-width: 0; }
      .sr-titulo {
        font-size: 13.5px; font-weight: 500; color: var(--text-primary);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .sr-titulo mark {
        background: var(--gold-100); color: var(--gold-800);
        border-radius: 2px; padding: 0 1px; font-style: normal;
      }
      .sr-sub {
        font-size: 11.5px; color: var(--text-muted);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        margin-top: 1px;
      }

      /* Badge derecho */
      .sr-badge {
        font-size: 10.5px; font-weight: 600; padding: 2px 8px;
        border-radius: var(--r-full); white-space: nowrap; flex-shrink: 0;
      }
      .sr-badge.green { background: var(--green-50);  color: var(--green-700); }
      .sr-badge.red   { background: var(--red-50);    color: var(--red-700); }
      .sr-badge.amber { background: var(--amber-50);  color: var(--amber-700); }
      .sr-badge.navy  { background: var(--navy-50);   color: var(--navy-700); }
      .sr-badge.gold  { background: var(--gold-50);   color: var(--gold-700); }
      .sr-badge.gray  { background: var(--bg-muted);  color: var(--text-muted); }

      /* Atajo Enter */
      .sr-enter {
        font-size: 10px; color: var(--text-faint);
        border: 1px solid var(--border-faint);
        border-radius: 4px; padding: 1px 5px;
        font-family: var(--font-mono); flex-shrink: 0;
        display: none;
      }
      .sr-item.sel .sr-enter { display: block; }

      /* Footer de atajos */
      #foneviSearchFooter {
        border-top: 1px solid var(--border-faint);
        padding: 8px 18px;
        display: flex; align-items: center; gap: 16px;
        flex-shrink: 0;
      }
      .sf-key {
        display: inline-flex; align-items: center; gap: 5px;
        font-size: 11px; color: var(--text-muted);
      }
      .sf-kbd {
        font-size: 10px; font-family: var(--font-mono);
        background: var(--bg-muted); border: 1px solid var(--border-light);
        border-radius: 4px; padding: 1px 5px;
      }

      /* Estado vacío */
      #foneviSearchEmpty {
        padding: 32px 20px; text-align: center; display: none;
      }
      #foneviSearchEmpty .se-icon { font-size: 28px; margin-bottom: 8px; }
      #foneviSearchEmpty .se-txt  {
        font-size: 13px; color: var(--text-muted); line-height: 1.6;
      }

      /* Estado inicial (sin query) */
      #foneviSearchTips {
        padding: 14px 18px 8px;
      }
      .tip-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
        margin-top: 4px;
      }
      .tip-item {
        display: flex; align-items: center; gap: 8px;
        padding: 9px 12px; border-radius: 10px;
        background: var(--bg-subtle); border: 1px solid var(--border-faint);
        cursor: pointer; transition: all .12s;
        text-decoration: none;
      }
      .tip-item:hover { border-color: var(--border-medium); background: var(--bg-muted); }
      .tip-ico  { font-size: 16px; }
      .tip-lbl  { font-size: 12.5px; color: var(--text-secondary); font-weight: 500; }

      /* Botón en topbar */
      #searchTriggerBtn {
        display: flex; align-items: center; gap: 7px;
        padding: 6px 12px 6px 10px;
        border: 1px solid var(--border-light);
        border-radius: var(--r-md);
        background: var(--bg-subtle);
        color: var(--text-muted);
        font-size: 12.5px; font-family: var(--font-body);
        cursor: pointer; transition: all .15s ease;
        white-space: nowrap;
      }
      #searchTriggerBtn:hover {
        border-color: var(--border-medium);
        color: var(--text-primary); background: var(--bg-surface);
        box-shadow: var(--shadow-xs);
      }
      #searchTriggerBtn .stb-icon { font-size: 14px; }
      #searchTriggerBtn .stb-kbd  {
        font-size: 10px; font-family: var(--font-mono);
        background: var(--bg-muted); border: 1px solid var(--border-light);
        border-radius: 4px; padding: 1px 5px; margin-left: 2px;
        color: var(--text-faint);
      }

      @media (max-width: 640px) {
        #searchTriggerBtn .stb-label,
        #searchTriggerBtn .stb-kbd { display: none; }
        #searchTriggerBtn { padding: 7px; }
        #foneviSearchPanel { border-radius: 14px; }
      }
    `;
    document.head.appendChild(s);
  }

  /* ── Inyectar HTML ───────────────────────────────────────── */
  function inyectarHTML() {
    if (document.getElementById("foneviSearchOverlay")) return;

    const html = `
    <div id="foneviSearchOverlay" role="dialog" aria-modal="true"
      aria-label="Búsqueda global" onclick="Search._clickOverlay(event)">
      <div id="foneviSearchPanel">

        <!-- Barra -->
        <div id="foneviSearchBar">
          <span id="foneviSearchIcon">🔍</span>
          <input id="foneviSearchInput"
            type="text"
            placeholder="Buscar socios, aportes, créditos..."
            autocomplete="off"
            spellcheck="false"
            aria-label="Campo de búsqueda"
          />
          <button id="foneviSearchClear" onclick="Search._limpiar()"
            aria-label="Limpiar búsqueda">✕</button>
          <span id="foneviSearchKbd">Esc para cerrar</span>
        </div>

        <!-- Tips iniciales -->
        <div id="foneviSearchTips">
          <div class="sr-cat-label">Acceso rápido</div>
          <div class="tip-grid">
            <a class="tip-item" href="socios.html">
              <span class="tip-ico">👥</span>
              <span class="tip-lbl">Socios</span>
            </a>
            <a class="tip-item" href="aportes.html">
              <span class="tip-ico">💰</span>
              <span class="tip-lbl">Aportes</span>
            </a>
            <a class="tip-item" href="creditos.html">
              <span class="tip-ico">💳</span>
              <span class="tip-lbl">Créditos</span>
            </a>
            <a class="tip-item" href="dashboard.html">
              <span class="tip-ico">⊞</span>
              <span class="tip-lbl">Dashboard</span>
            </a>
          </div>
        </div>

        <!-- Resultados -->
        <div id="foneviSearchResults" role="listbox"></div>

        <!-- Vacío -->
        <div id="foneviSearchEmpty">
          <div class="se-icon">🔎</div>
          <div class="se-txt">Sin resultados para esta búsqueda.<br>
            Prueba con nombre, código, período o propósito.</div>
        </div>

        <!-- Footer -->
        <div id="foneviSearchFooter">
          <span class="sf-key">
            <kbd class="sf-kbd">↑↓</kbd> Navegar
          </span>
          <span class="sf-key">
            <kbd class="sf-kbd">↵</kbd> Abrir
          </span>
          <span class="sf-key">
            <kbd class="sf-kbd">Esc</kbd> Cerrar
          </span>
        </div>

      </div>
    </div>`;

    document.body.insertAdjacentHTML("beforeend", html);

    document.getElementById("foneviSearchInput")
      .addEventListener("input", e => Search._onInput(e));
  }

  /* ── Inyectar botón en el topbar ────────────────────────── */
  function inyectarBotonTopbar() {
    if (document.getElementById("searchTriggerBtn")) return;
    const actions = document.querySelector(".topbar-actions");
    if (!actions) return;

    const btn = document.createElement("button");
    btn.id        = "searchTriggerBtn";
    btn.title     = "Búsqueda global (Ctrl+K)";
    btn.onclick   = () => Search.abrir();
    btn.innerHTML =
      '<span class="stb-icon">🔍</span>' +
      '<span class="stb-label">Buscar</span>' +
      '<kbd class="stb-kbd">Ctrl K</kbd>';

    // Insertar al inicio de las acciones
    actions.insertBefore(btn, actions.firstChild);
  }

  /* ── Highlight de texto ──────────────────────────────────── */
  function highlight(text, query) {
    if (!query || !text) return text || "";
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return String(text).replace(re, "<mark>$1</mark>");
  }

  /* ── Ejecutar búsqueda ───────────────────────────────────── */
  function buscar(q) {
    if (!q || q.length < 1) return [];
    const ql  = q.toLowerCase().trim();
    const res = [];

    // ── SOCIOS ─────────────────────────────────────────────
    const sociosEncontrados = DB.socios.filter(s =>
      s.nombre?.toLowerCase().includes(ql)  ||
      s.codigo?.toLowerCase().includes(ql)  ||
      s.documento?.toLowerCase().includes(ql) ||
      s.email?.toLowerCase().includes(ql)   ||
      s.cargo?.toLowerCase().includes(ql)   ||
      s.sede?.toLowerCase().includes(ql)
    ).slice(0, 5);

    if (sociosEncontrados.length) {
      res.push({ tipo: "categoria", label: "Socios" });
      sociosEncontrados.forEach(s => {
        const estadoMap = {
          activo:   { cls:"green", lbl:"Activo" },
          mora:     { cls:"red",   lbl:"En mora" },
          pendiente:{ cls:"amber", lbl:"Pendiente" },
          inactivo: { cls:"gray",  lbl:"Inactivo" },
        };
        const est = estadoMap[s.estado] || { cls:"gray", lbl:s.estado };
        res.push({
          tipo:     "socio",
          id:       s.id,
          titulo:   s.nombre,
          sub:      s.cargo + " · " + s.sede + " · " + (s.codigo_socio || s.codigo),
          badge:    est.lbl,
          badgeCls: est.cls,
          ico:      "👤",
          icoCls:   s.estado === "mora" ? "mora" : "socio",
          url:      "perfil.html?id=" + s.id,
          q,
        });
      });
    }

    // ── CRÉDITOS ───────────────────────────────────────────
    const credEncontrados = DB.creditos.filter(c => {
      const nombre = DataHelper.getSocioNombre(c.socio_id).toLowerCase();
      return nombre.includes(ql)              ||
             c.id?.toLowerCase().includes(ql) ||
             c.proposito?.toLowerCase().includes(ql);
    }).slice(0, 4);

    if (credEncontrados.length) {
      res.push({ tipo: "categoria", label: "Créditos" });
      credEncontrados.forEach(c => {
        const pct    = Math.round(c.cuotas_pagadas / c.cuotas * 100);
        const nombre = DataHelper.getSocioNombre(c.socio_id);
        const estMap = {
          activo: { cls:"green", lbl:"Activo " + pct + "%" },
          mora:   { cls:"red",   lbl:"En mora" },
          pagado: { cls:"navy",  lbl:"Liquidado" },
        };
        const est = estMap[c.estado] || { cls:"gray", lbl:c.estado };
        res.push({
          tipo:     "credito",
          id:       c.id,
          titulo:   nombre,
          sub:      "Crédito #" + c.id + " · " + DataHelper.formatCOP(c.monto) +
                    " · " + (c.proposito || "sin propósito"),
          badge:    est.lbl,
          badgeCls: c.estado === "mora" ? "red" : est.cls,
          ico:      "💳",
          icoCls:   c.estado === "mora" ? "mora" : "credito",
          url:      "creditos.html",
          q,
        });
      });
    }

    // ── APORTES ───────────────────────────────────────────
    const aportesEncontrados = DB.aportes.filter(a => {
      const nombre = DataHelper.getSocioNombre(a.socio_id).toLowerCase();
      return nombre.includes(ql) ||
             a.periodo?.toLowerCase().includes(ql) ||
             a.id?.toLowerCase().includes(ql);
    }).slice(0, 4);

    if (aportesEncontrados.length) {
      res.push({ tipo: "categoria", label: "Aportes" });
      aportesEncontrados.forEach(a => {
        const nombre = DataHelper.getSocioNombre(a.socio_id);
        const estMap = {
          pagado:    { cls:"green", lbl:"Pagado" },
          pendiente: { cls:"amber", lbl:"Pendiente" },
          mora:      { cls:"red",   lbl:"En mora" },
          vencido:   { cls:"red",   lbl:"Vencido" },
        };
        const est = estMap[a.estado] || { cls:"gray", lbl:a.estado };
        res.push({
          tipo:     "aporte",
          id:       a.id,
          titulo:   nombre + " — " + a.periodo,
          sub:      DataHelper.formatCOP(a.monto) +
                    (a.fecha_pago ? " · Pagado " + DataHelper.formatFecha(a.fecha_pago) : ""),
          badge:    est.lbl,
          badgeCls: est.cls,
          ico:      a.estado === "pagado" ? "✅" : a.estado === "mora" ? "⚠️" : "💰",
          icoCls:   a.estado === "mora" ? "mora" : "aporte",
          url:      "aportes.html",
          q,
        });
      });
    }

    // ── PÁGINAS DEL SISTEMA ────────────────────────────────
    const paginas = [
      { lbl:"Dashboard",      sub:"Panel principal y KPIs",                url:"dashboard.html",    ico:"⊞" },
      { lbl:"Socios",         sub:"Gestión de socios del fondo",           url:"socios.html",       ico:"👥" },
      { lbl:"Aportes",        sub:"Control de aportes mensuales",          url:"aportes.html",      ico:"💰" },
      { lbl:"Créditos",       sub:"Cartera activa y simulador",            url:"creditos.html",     ico:"💳" },
      { lbl:"Contabilidad",   sub:"Movimientos del fondo",                 url:"contabilidad.html", ico:"📊" },
      { lbl:"Dividendos",     sub:"Distribución de utilidades",            url:"dividendos.html",   ico:"🎁" },
      { lbl:"Solidaridad",    sub:"Fondo de ayuda a socios",               url:"solidaridad.html",  ico:"🤝" },
      { lbl:"Reportes",       sub:"Exportar PDF y Excel",                  url:"reportes.html",     ico:"📈" },
      { lbl:"Notificaciones", sub:"Avisos del sistema",                    url:"notificaciones.html",ico:"🔔" },
      { lbl:"WhatsApp",       sub:"Panel de notificaciones WhatsApp",      url:"whatsapp-panel.html",ico:"💬" },
      { lbl:"Auditoría",      sub:"Registro de acciones del sistema",      url:"auditoria.html",    ico:"🔐" },
      { lbl:"Configuración",  sub:"Parámetros del fondo",                  url:"configuracion.html",ico:"⚙️" },
    ];

    const paginasEncontradas = paginas.filter(p =>
      p.lbl.toLowerCase().includes(ql) || p.sub.toLowerCase().includes(ql)
    ).slice(0, 3);

    if (paginasEncontradas.length) {
      res.push({ tipo: "categoria", label: "Módulos" });
      paginasEncontradas.forEach(p => {
        res.push({
          tipo:     "pagina",
          titulo:   p.lbl,
          sub:      p.sub,
          badge:    null,
          ico:      p.ico,
          icoCls:   "pagina",
          url:      p.url,
          q,
        });
      });
    }

    return res;
  }

  /* ── Renderizar resultados ───────────────────────────────── */
  function renderResultados(items, q) {
    const lista    = document.getElementById("foneviSearchResults");
    const empty    = document.getElementById("foneviSearchEmpty");
    const tips     = document.getElementById("foneviSearchTips");
    const footer   = document.getElementById("foneviSearchFooter");

    tips.style.display = "none";

    // Solo items reales (sin categorías)
    const reales = items.filter(r => r.tipo !== "categoria");
    resultados   = reales;
    indiceSel    = reales.length ? 0 : -1;

    if (!reales.length) {
      lista.innerHTML    = "";
      empty.style.display = "block";
      footer.style.display = "none";
      return;
    }

    empty.style.display  = "none";
    footer.style.display = "flex";

    lista.innerHTML = items.map((item, idx) => {
      if (item.tipo === "categoria") {
        return `<div class="sr-cat-label">${item.label}</div>`;
      }

      // Índice real del ítem dentro de `reales`
      const ri = reales.indexOf(item);

      return `<div class="sr-item ${ri === 0 ? "sel" : ""}"
        role="option"
        aria-selected="${ri === 0}"
        data-ri="${ri}"
        onclick="Search._irA('${item.url}')"
        onmouseenter="Search._hover(${ri})">
        <div class="sr-ico ${item.icoCls}">${item.ico}</div>
        <div class="sr-texto">
          <div class="sr-titulo">${highlight(item.titulo, q)}</div>
          <div class="sr-sub">${item.sub || ""}</div>
        </div>
        ${item.badge
          ? `<span class="sr-badge ${item.badgeCls}">${item.badge}</span>`
          : ""}
        <span class="sr-enter" aria-hidden="true">↵</span>
      </div>`;
    }).join("");
  }

  /* ── Actualizar ítem seleccionado ─────────────────────────── */
  function actualizarSel(nuevoIdx) {
    const items = document.querySelectorAll("#foneviSearchResults .sr-item");
    if (!items.length) return;

    // Quitar sel del anterior
    if (indiceSel >= 0 && items[indiceSel]) {
      items[indiceSel].classList.remove("sel");
      items[indiceSel].setAttribute("aria-selected","false");
    }

    // Clamping
    indiceSel = Math.max(0, Math.min(nuevoIdx, items.length - 1));

    if (items[indiceSel]) {
      items[indiceSel].classList.add("sel");
      items[indiceSel].setAttribute("aria-selected","true");
      items[indiceSel].scrollIntoView({ block:"nearest" });
    }
  }

  /* ── API pública ────────────────────────────────────────── */
  return {

    init() {
      inyectarCSS();
      inyectarHTML();

      // Ctrl+K / Cmd+K global
      document.addEventListener("keydown", e => {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
          e.preventDefault();
          abierto ? this.cerrar() : this.abrir();
          return;
        }
        if (!abierto) return;

        switch (e.key) {
          case "Escape":
            e.preventDefault();
            this.cerrar();
            break;
          case "ArrowDown":
            e.preventDefault();
            actualizarSel(indiceSel + 1);
            break;
          case "ArrowUp":
            e.preventDefault();
            actualizarSel(indiceSel - 1);
            break;
          case "Enter":
            e.preventDefault();
            if (indiceSel >= 0 && resultados[indiceSel]) {
              this._irA(resultados[indiceSel].url);
            }
            break;
        }
      });

      // Inyectar botón en topbar cuando buildLayout lo cree
      this._waitTopbar();
    },

    // Esperar a que el topbar exista (buildLayout lo inyecta dinámicamente)
    _waitTopbar() {
      const intentar = () => {
        if (document.querySelector(".topbar-actions")) {
          inyectarBotonTopbar();
        } else {
          setTimeout(intentar, 80);
        }
      };
      intentar();
    },

    abrir() {
      const overlay = document.getElementById("foneviSearchOverlay");
      const input   = document.getElementById("foneviSearchInput");
      if (!overlay) return;

      abierto = true;
      overlay.classList.add("open");
      input.value = "";
      input.focus();

      // Mostrar tips, ocultar resultados
      document.getElementById("foneviSearchTips").style.display    = "block";
      document.getElementById("foneviSearchResults").innerHTML      = "";
      document.getElementById("foneviSearchEmpty").style.display    = "none";
      document.getElementById("foneviSearchFooter").style.display   = "none";
      document.getElementById("foneviSearchClear").classList.remove("visible");

      resultados = []; indiceSel = -1;
      document.body.style.overflow = "hidden";
    },

    cerrar() {
      const overlay = document.getElementById("foneviSearchOverlay");
      if (!overlay) return;

      abierto = false;
      overlay.classList.remove("open");
      document.body.style.overflow = "";
    },

    _clickOverlay(e) {
      if (e.target === document.getElementById("foneviSearchOverlay")) {
        this.cerrar();
      }
    },

    _limpiar() {
      const input = document.getElementById("foneviSearchInput");
      if (!input) return;
      input.value = "";
      input.focus();
      document.getElementById("foneviSearchClear").classList.remove("visible");
      document.getElementById("foneviSearchResults").innerHTML   = "";
      document.getElementById("foneviSearchEmpty").style.display = "none";
      document.getElementById("foneviSearchTips").style.display  = "block";
      document.getElementById("foneviSearchFooter").style.display= "none";
      resultados = []; indiceSel = -1;
    },

    _onInput(e) {
      const q   = e.target.value.trim();
      const btn = document.getElementById("foneviSearchClear");

      btn.classList.toggle("visible", q.length > 0);

      if (!q) {
        this._limpiar();
        return;
      }

      // Debounce 120ms
      clearTimeout(timer);
      timer = setTimeout(() => {
        const items = buscar(q);
        renderResultados(items, q);
      }, 120);
    },

    _hover(ri) {
      actualizarSel(ri);
    },

    _irA(url) {
      if (!url) return;
      this.cerrar();
      // Si ya estamos en la página, no navegar
      const actual = window.location.pathname.split("/").pop();
      if (url === actual) return;
      window.location.href = url;
    },
  };
})();

/* ── Auto-inicializar cuando el DOM esté listo ─────────────── */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => Search.init());
} else {
  Search.init();
}
