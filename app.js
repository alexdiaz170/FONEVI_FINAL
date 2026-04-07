/* ============================================================
   FONEVI — js/app.js
   ============================================================ */

const Sidebar = {
  init() {
    document.getElementById("menuBtn")?.addEventListener("click", () => this.toggle());
    document.getElementById("sidebarBackdrop")?.addEventListener("click", () => this.close());
    // Marcar enlace activo
    const page = window.location.pathname.split("/").pop().replace(".html","");
    document.querySelectorAll(".nav-link[data-page]").forEach(a => {
      if (a.dataset.page === page) a.classList.add("active");
    });
    // Rellenar datos usuario
    const s = Auth.getSession();
    if (s) {
      const n = document.getElementById("sidebarUserName");
      const r = document.getElementById("sidebarUserRole");
      const a = document.getElementById("sidebarUserAvatar");
      if (n) n.textContent = s.nombre;
      if (r) r.textContent = s.rol.charAt(0).toUpperCase() + s.rol.slice(1);
      if (a) a.textContent = s.avatar || "U";
    }
  },
  toggle() {
    document.getElementById("sidebar")?.classList.toggle("open");
    document.getElementById("sidebarBackdrop")?.classList.toggle("show");
  },
  close() {
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("sidebarBackdrop")?.classList.remove("show");
  }
};

const Toast = {
  _c: null,
  _init() {
    if (!this._c) {
      this._c = document.getElementById("toastContainer") || document.createElement("div");
      this._c.className = "toast-container";
      this._c.id = "toastContainer";
      if (!document.getElementById("toastContainer")) document.body.appendChild(this._c);
    }
  },
  show(msg, tipo = "default", ms = 3800) {
    this._init();
    const icons = { success:"✓", error:"✕", warn:"⚠", default:"ℹ" };
    const t = document.createElement("div");
    t.className = `toast ${tipo}`;
    t.innerHTML = `<div class="toast-icon">${icons[tipo]||"ℹ"}</div><span>${msg}</span>`;
    this._c.appendChild(t);
    setTimeout(() => { t.style.animation="toastOut .3s ease forwards"; setTimeout(()=>t.remove(),300); }, ms);
  },
  success(m) { this.show(m,"success"); },
  error(m)   { this.show(m,"error");   },
  warn(m)    { this.show(m,"warn");    }
};

const Modal = {
  open(id)   { document.getElementById(id)?.classList.add("open");    },
  close(id)  { document.getElementById(id)?.classList.remove("open"); },
  closeAll() { document.querySelectorAll(".modal-overlay.open").forEach(m=>m.classList.remove("open")); }
};

document.addEventListener("click", e => {
  if (e.target.classList.contains("modal-overlay")) e.target.classList.remove("open");
});

function initTabs(barId, onChange) {
  const bar = document.getElementById(barId);
  if (!bar) return;
  bar.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      bar.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (onChange) onChange(btn.dataset.tab || btn.textContent.trim());
    });
  });
}

function filterTable(inputId, tableId) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);
  if (!input || !table) return;
  input.addEventListener("input", () => {
    const q = input.value.toLowerCase();
    table.querySelectorAll("tbody tr").forEach(r => {
      r.style.display = r.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });
}

function confirmar(msg, cb) { if (confirm(msg)) cb(); }

function fmtCOP(v) {
  return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:0}).format(v);
}

function fmtMillones(v) {
  if (v >= 1000000) return "$" + (v/1000000).toFixed(1) + "M";
  if (v >= 1000)    return "$" + Math.round(v/1000) + "k";
  return "$" + v;
}

function renderBarChart(id, data, maxVal) {
  const c = document.getElementById(id);
  if (!c) return;
  const max = maxVal || Math.max(...data.map(d=>Math.max(d.a||0,d.b||0)));
  c.style.cssText = "display:flex;align-items:flex-end;gap:10px;height:160px;padding-top:20px;";
  c.innerHTML = data.map(d=>`
    <div class="bar-group">
      <div class="bar-stack">
        <div class="bar bar-primary" style="height:${Math.round(((d.a||0)/max)*140)}px" title="${d.labelA||""}: ${fmtCOP(d.a||0)}"></div>
        ${d.b!==undefined?`<div class="bar bar-accent" style="height:${Math.round(((d.b||0)/max)*140)}px" title="${d.labelB||""}: ${fmtCOP(d.b||0)}"></div>`:""}
      </div>
      <span class="bar-month-label">${d.label}</span>
    </div>`).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname.split("/").pop();
  if (page !== "index.html" && page !== "") {
    if (!Auth.requireAuth()) return;
  }
  Sidebar.init();
  Auth.applyRoleUI();

  const badge = document.getElementById("notifBadge");
  if (badge) {
    const n = DataHelper.getNotificacionesNoLeidas();
    badge.textContent = n;
    badge.style.display = n > 0 ? "inline-block" : "none";
  }
  const dot = document.getElementById("topNotifDot");
  if (dot) dot.style.display = DataHelper.getNotificacionesNoLeidas() > 0 ? "block" : "none";

  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    confirmar("¿Deseas cerrar sesión?", () => Auth.logout());
  });
});
