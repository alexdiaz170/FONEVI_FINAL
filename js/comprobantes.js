/* ============================================================
   FONEVI — js/comprobantes.js
   Genera los 3 tipos de comprobantes imprimibles

   COMPROBANTES:
   1. imprimirAporte(aporteId)       — comprobante individual de pago
   2. imprimirPazYSalvo(socioId)     — estado al día o deuda pendiente
   3. imprimirEstadoCredito(creditoId) — estado del crédito con tabla de amortización
   4. imprimirEstadoCuentaSocio(socioId) — resumen completo del socio
   ============================================================ */

var Comprobantes = {

  /* ── Fecha actual formateada ─────────────────────────── */
  _hoy() {
    return new Date().toLocaleDateString("es-CO", {
      day: "2-digit", month: "long", year: "numeric"
    });
  },

  /* ── Número de comprobante ───────────────────────────── */
  _numComp(prefijo) {
    var d   = new Date();
    var pad = function(n) { return String(n).padStart(2,"0"); };
    return prefijo + "-" +
      d.getFullYear() +
      pad(d.getMonth()+1) +
      pad(d.getDate()) + "-" +
      pad(d.getHours()) + pad(d.getMinutes());
  },

  /* ── Avatar HTML ─────────────────────────────────────── */
  _avatarLetras(nombre) {
    return (nombre || "??").split(" ")
      .filter(Boolean).slice(0,2)
      .map(function(p){ return p[0].toUpperCase(); })
      .join("");
  },

  /* ── Pie con firmas ──────────────────────────────────── */
  _pieFirmas(tipo) {
    var hoy = this._hoy();
    return '<div class="comp-footer">' +
      '<div class="comp-footer-grid">' +
        '<div class="comp-firma-block">' +
          '<div class="comp-firma-linea"></div>' +
          '<div class="comp-firma-nombre">' + (DB.config.representante || "Representante Legal") + '</div>' +
          '<div class="comp-firma-cargo">Representante Legal / Presidente</div>' +
        '</div>' +
        '<div class="comp-firma-block">' +
          '<div class="comp-firma-linea"></div>' +
          '<div class="comp-firma-nombre">Tesorero(a)</div>' +
          '<div class="comp-firma-cargo">Tesorero del Fondo</div>' +
        '</div>' +
        '<div class="comp-firma-block">' +
          '<div class="comp-firma-linea"></div>' +
          '<div class="comp-firma-nombre">Socio(a)</div>' +
          '<div class="comp-firma-cargo">Firma de recibido</div>' +
        '</div>' +
      '</div>' +
      '<div class="comp-legal">' +
        DB.config.nombre_completo + ' &nbsp;|&nbsp; NIT: ' + DB.config.nit + ' &nbsp;|&nbsp; ' +
        'Documento generado el ' + hoy + ' &nbsp;|&nbsp; ' +
        'Este ' + tipo + ' es un documento oficial del fondo.' +
      '</div>' +
    '</div>';
  },

  /* ── Encabezado común ────────────────────────────────── */
  _encabezado(tipo, numero) {
    return '<div class="comp-header">' +
      '<div class="comp-logo-block">' +
        '<div class="comp-logo-icon">F</div>' +
        '<div>' +
          '<div class="comp-logo-nombre">FONEVI</div>' +
          '<div class="comp-logo-sub">' + (DB.config.nombre_completo || "Fondo de Empleados Docentes") + '</div>' +
          '<div class="comp-logo-sub">NIT: ' + (DB.config.nit || "") + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="comp-header-right">' +
        '<div class="comp-tipo">' + tipo + '</div>' +
        '<div class="comp-num">No. ' + numero + '</div>' +
        '<div class="comp-fecha-emision">Emitido: ' + this._hoy() + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="comp-gold-line"></div>';
  },

  /* ── Banda del socio ─────────────────────────────────── */
  _bandaSocio(s) {
    return '<div class="comp-socio-band">' +
      '<div class="comp-socio-avatar">' + this._avatarLetras(s.nombre) + '</div>' +
      '<div>' +
        '<div class="comp-socio-nombre">' + s.nombre + '</div>' +
        '<div class="comp-socio-cargo">' + (s.cargo || "") +
          (s.sede ? " &nbsp;·&nbsp; " + s.sede : "") + '</div>' +
      '</div>' +
      '<div class="comp-socio-codigo">' +
        '<div style="font-size:9pt;color:#6b7280;">Código de socio</div>' +
        '<div style="font-size:12pt;font-weight:700;">' + (s.codigo_socio || s.codigo || s.id) + '</div>' +
        '<div style="font-size:8.5pt;color:#6b7280;">Desde: ' +
          (s.fecha_ingreso
            ? new Date(s.fecha_ingreso+"T00:00:00").toLocaleDateString("es-CO",{month:"short",year:"numeric"})
            : "—") +
        '</div>' +
      '</div>' +
    '</div>';
  },

  /* ════════════════════════════════════════════════════════
     1. COMPROBANTE DE APORTE
  ════════════════════════════════════════════════════════ */
  generarAporte(aporteId) {
    var a = DB.aportes.find(function(x){ return x.id === aporteId; });
    if (!a) return '<p>Aporte no encontrado.</p>';

    var s = DataHelper.getSocio(a.socio_id);
    if (!s) return '<p>Socio no encontrado.</p>';

    var num   = this._numComp("APC");
    var monto = DataHelper.formatCOP(a.monto);
    var fecha = a.fecha_pago
      ? new Date(a.fecha_pago+"T00:00:00").toLocaleDateString("es-CO",
          {weekday:"long", day:"2-digit", month:"long", year:"numeric"})
      : "Pendiente";

    var estadoBadge = a.estado === "pagado"
      ? '<span class="comp-badge comp-badge-ok">✓ PAGADO</span>'
      : a.estado === "mora" || a.estado === "vencido"
        ? '<span class="comp-badge comp-badge-mora">⚠ EN MORA</span>'
        : '<span class="comp-badge comp-badge-pend">PENDIENTE</span>';

    return '<div class="comprobante">' +
      this._encabezado("Comprobante de Aporte", num) +
      '<div class="comp-body">' +
        this._bandaSocio(s) +

        '<table class="comp-tabla">' +
          '<thead><tr><th colspan="2">Detalle del Aporte</th></tr></thead>' +
          '<tbody>' +
            '<tr><td class="td-label">Período</td><td class="td-value">' + a.periodo + '</td></tr>' +
            '<tr><td class="td-label">Monto del aporte</td><td class="td-monto">' + monto + '</td></tr>' +
            '<tr><td class="td-label">Fecha de pago</td><td class="td-value">' + fecha + '</td></tr>' +
            '<tr><td class="td-label">Método de pago</td><td class="td-value">' +
              (a.metodo
                ? a.metodo.charAt(0).toUpperCase() + a.metodo.slice(1)
                : "—") +
            '</td></tr>' +
            '<tr><td class="td-label">Número de registro</td><td class="td-value mono">' + a.id + '</td></tr>' +
            '<tr class="tr-total">' +
              '<td class="td-label">Estado</td>' +
              '<td>' + estadoBadge + '</td>' +
            '</tr>' +
          '</tbody>' +
        '</table>' +

        '<table class="comp-tabla" style="margin-top:10pt;">' +
          '<thead><tr><th colspan="2">Acumulado del Socio</th></tr></thead>' +
          '<tbody>' +
            '<tr><td class="td-label">Ahorro acumulado total</td>' +
              '<td class="td-monto">' + DataHelper.formatCOP(s.ahorro_acumulado) + '</td></tr>' +
            '<tr><td class="td-label">Aporte mensual vigente</td>' +
              '<td class="td-value">' + DataHelper.formatCOP(s.aporte_mensual) + '</td></tr>' +
            '<tr><td class="td-label">Estado del socio</td>' +
              '<td class="td-value">' +
                '<span class="comp-badge comp-badge-ok">' +
                  (s.estado === "activo" ? "✓ AL DÍA" : s.estado.toUpperCase()) +
                '</span>' +
              '</td></tr>' +
          '</tbody>' +
        '</table>' +

      '</div>' +
      this._pieFirmas("comprobante de aporte") +
    '</div>';
  },

  /* ════════════════════════════════════════════════════════
     2. PAZ Y SALVO
  ════════════════════════════════════════════════════════ */
  generarPazYSalvo(socioId) {
    var s = DataHelper.getSocio(socioId);
    if (!s) return '<p>Socio no encontrado.</p>';

    var num      = this._numComp("PYS");
    var aportes  = DataHelper.getAportesSocio(socioId);
    var creditos = DataHelper.getCreditosSocio(socioId)
      .filter(function(c){ return c.estado === "activo" || c.estado === "mora"; });

    var pendientes = aportes.filter(function(a){
      return a.estado === "pendiente" || a.estado === "mora" || a.estado === "vencido";
    });
    var pagados = aportes.filter(function(a){ return a.estado === "pagado"; });
    var totalPagado = pagados.reduce(function(t,a){ return t + a.monto; }, 0);
    var saldoCredito = creditos.reduce(function(t,c){ return t + c.saldo_capital; }, 0);

    var estaAlDia = pendientes.length === 0 && saldoCredito === 0;
    var tieneMora = pendientes.some(function(a){ return a.estado === "mora" || a.estado === "vencido"; });

    var mensajeHTML = estaAlDia
      ? '<div class="comp-mensaje-ok">✓ El/la señor/a <strong>' + s.nombre + '</strong> se encuentra al día con todas sus obligaciones financieras con el Fondo de Empleados Docentes FONEVI al ' + this._hoy() + '.</div>'
      : '<div class="comp-mensaje-mora">⚠ El/la señor/a <strong>' + s.nombre + '</strong> presenta obligaciones financieras pendientes con FONEVI al ' + this._hoy() + '. No se expide paz y salvo total.</div>';

    return '<div class="comprobante">' +
      this._encabezado("Paz y Salvo", num) +
      '<div class="comp-body">' +
        this._bandaSocio(s) +
        mensajeHTML +

        '<table class="comp-tabla">' +
          '<thead><tr><th colspan="2">Estado de Aportes</th></tr></thead>' +
          '<tbody>' +
            '<tr><td class="td-label">Total de períodos</td><td class="td-value">' + aportes.length + '</td></tr>' +
            '<tr><td class="td-label">Períodos pagados</td><td class="td-value">' + pagados.length + '</td></tr>' +
            '<tr><td class="td-label">Períodos pendientes / mora</td><td class="td-value">' +
              (pendientes.length > 0
                ? '<span class="comp-badge comp-badge-mora">' + pendientes.length + ' período(s)</span>'
                : '<span class="comp-badge comp-badge-ok">Ninguno</span>') +
            '</td></tr>' +
            '<tr class="tr-total"><td class="td-label">Total aportado</td>' +
              '<td class="td-monto">' + DataHelper.formatCOP(totalPagado) + '</td></tr>' +
          '</tbody>' +
        '</table>' +

        '<table class="comp-tabla" style="margin-top:10pt;">' +
          '<thead><tr><th colspan="2">Estado de Créditos</th></tr></thead>' +
          '<tbody>' +
            (creditos.length > 0
              ? creditos.map(function(c){
                  return '<tr><td class="td-label">' + c.id + ' — ' + (c.proposito||"Crédito") + '</td>' +
                    '<td class="td-value">' +
                      DataHelper.formatCOP(c.saldo_capital) + ' pendiente' +
                      (c.estado === "mora" ? ' <span class="comp-badge comp-badge-mora">EN MORA</span>' : '') +
                    '</td></tr>';
                }).join("") +
                '<tr class="tr-total"><td class="td-label">Saldo total en créditos</td>' +
                  '<td class="td-monto">' + DataHelper.formatCOP(saldoCredito) + '</td></tr>'
              : '<tr><td colspan="2" class="td-label" style="text-align:center;">' +
                  '<span class="comp-badge comp-badge-ok">Sin créditos activos</span>' +
                '</td></tr>') +
          '</tbody>' +
        '</table>' +

        '<table class="comp-tabla" style="margin-top:10pt;">' +
          '<thead><tr><th colspan="2">Resumen General</th></tr></thead>' +
          '<tbody>' +
            '<tr><td class="td-label">Ahorro acumulado</td>' +
              '<td class="td-monto">' + DataHelper.formatCOP(s.ahorro_acumulado) + '</td></tr>' +
            '<tr class="tr-total"><td class="td-label">Estado general</td>' +
              '<td><span class="comp-badge ' +
                (estaAlDia ? 'comp-badge-ok">✓ PAZ Y SALVO' : tieneMora ? 'comp-badge-mora">⚠ EN MORA' : 'comp-badge-pend">PENDIENTE') +
              '</span></td></tr>' +
          '</tbody>' +
        '</table>' +

      '</div>' +
      this._pieFirmas("paz y salvo") +
    '</div>';
  },

  /* ════════════════════════════════════════════════════════
     3. ESTADO DE CRÉDITO
  ════════════════════════════════════════════════════════ */
  generarEstadoCredito(creditoId) {
    var c = DB.creditos.find(function(x){ return x.id === creditoId; });
    if (!c) return '<p>Crédito no encontrado.</p>';

    var s   = DataHelper.getSocio(c.socio_id);
    if (!s) return '<p>Socio no encontrado.</p>';

    var num        = this._numComp("CRD");
    var cuotaMens  = Math.round(DataHelper.calcularCuota(c.monto, c.tasa_mensual, c.cuotas));
    var pct        = Math.round((c.cuotas_pagadas / c.cuotas) * 100);
    var cuotasRest = c.cuotas - c.cuotas_pagadas;

    var estadoBadge = c.estado === "activo"
      ? '<span class="comp-badge comp-badge-ok">ACTIVO</span>'
      : c.estado === "mora"
        ? '<span class="comp-badge comp-badge-mora">EN MORA</span>'
        : '<span class="comp-badge comp-badge-ok">PAGADO</span>';

    return '<div class="comprobante">' +
      this._encabezado("Estado de Crédito", num) +
      '<div class="comp-body">' +
        this._bandaSocio(s) +

        '<table class="comp-tabla">' +
          '<thead><tr><th colspan="2">Datos del Crédito</th></tr></thead>' +
          '<tbody>' +
            '<tr><td class="td-label">Número de crédito</td><td class="td-value mono">' + c.id + '</td></tr>' +
            '<tr><td class="td-label">Propósito</td><td class="td-value">' + (c.proposito||"—") + '</td></tr>' +
            '<tr><td class="td-label">Monto original</td><td class="td-monto">' + DataHelper.formatCOP(c.monto) + '</td></tr>' +
            '<tr><td class="td-label">Saldo capital pendiente</td>' +
              '<td class="td-monto" style="color:#991b1b;">' + DataHelper.formatCOP(c.saldo_capital) + '</td></tr>' +
            '<tr><td class="td-label">Fecha de desembolso</td><td class="td-value">' +
              (c.fecha_desembolso
                ? new Date(c.fecha_desembolso+"T00:00:00").toLocaleDateString("es-CO",
                    {day:"2-digit",month:"long",year:"numeric"})
                : "—") +
            '</td></tr>' +
            '<tr><td class="td-label">Tasa mensual</td><td class="td-value">' + c.tasa_mensual + '% m.e.a.</td></tr>' +
            '<tr><td class="td-label">Cuota mensual</td><td class="td-monto">' + DataHelper.formatCOP(cuotaMens) + '</td></tr>' +
            '<tr class="tr-total"><td class="td-label">Estado</td><td>' + estadoBadge + '</td></tr>' +
          '</tbody>' +
        '</table>' +

        '<table class="comp-tabla" style="margin-top:10pt;">' +
          '<thead><tr><th colspan="2">Progreso de Pago</th></tr></thead>' +
          '<tbody>' +
            '<tr><td class="td-label">Cuotas totales</td><td class="td-value">' + c.cuotas + '</td></tr>' +
            '<tr><td class="td-label">Cuotas pagadas</td><td class="td-value">' + c.cuotas_pagadas + '</td></tr>' +
            '<tr><td class="td-label">Cuotas restantes</td><td class="td-value">' + cuotasRest + '</td></tr>' +
            '<tr><td class="td-label">Avance</td><td>' +
              '<div class="comp-progreso-wrap">' +
                '<div class="comp-progreso-bar">' +
                  '<div class="comp-progreso-fill" style="width:' + pct + '%;"></div>' +
                '</div>' +
                '<div class="comp-progreso-label">' + pct + '% completado</div>' +
              '</div>' +
            '</td></tr>' +
            '<tr class="tr-total"><td class="td-label">Valor total a pagar (restante)</td>' +
              '<td class="td-monto">' + DataHelper.formatCOP(cuotaMens * cuotasRest) + '</td></tr>' +
          '</tbody>' +
        '</table>' +

      '</div>' +
      this._pieFirmas("estado de crédito") +
    '</div>';
  },

  /* ════════════════════════════════════════════════════════
     4. ESTADO DE CUENTA COMPLETO (para mi-cuenta)
  ════════════════════════════════════════════════════════ */
  generarEstadoCuenta(socioId) {
    var s = DataHelper.getSocio(socioId);
    if (!s) return '<p>Socio no encontrado.</p>';

    var aportes  = DataHelper.getAportesSocio(socioId);
    var creditos = DataHelper.getCreditosSocio(socioId);
    var num      = this._numComp("EDC");
    var pagados  = aportes.filter(function(a){ return a.estado === "pagado"; });
    var totalAp  = pagados.reduce(function(t,a){ return t+a.monto; }, 0);
    var credActivos = creditos.filter(function(c){
      return c.estado === "activo" || c.estado === "mora";
    });
    var totalDeuda = credActivos.reduce(function(t,c){ return t+c.saldo_capital; }, 0);

    var self = this;

    return '<div class="comprobante">' +
      this._encabezado("Estado de Cuenta", num) +
      '<div class="comp-body">' +
        this._bandaSocio(s) +

        '<table class="comp-tabla">' +
          '<thead><tr><th colspan="2">Resumen Financiero</th></tr></thead>' +
          '<tbody>' +
            '<tr><td class="td-label">Ahorro acumulado</td>' +
              '<td class="td-monto">' + DataHelper.formatCOP(s.ahorro_acumulado) + '</td></tr>' +
            '<tr><td class="td-label">Aporte mensual</td>' +
              '<td class="td-value">' + DataHelper.formatCOP(s.aporte_mensual) + '</td></tr>' +
            '<tr><td class="td-label">Total aportado histórico</td>' +
              '<td class="td-value">' + DataHelper.formatCOP(totalAp) + '</td></tr>' +
            '<tr><td class="td-label">Saldo en créditos</td>' +
              '<td class="td-value">' +
                (totalDeuda > 0
                  ? DataHelper.formatCOP(totalDeuda)
                  : '<span class="comp-badge comp-badge-ok">Sin deuda</span>') +
              '</td></tr>' +
            '<tr class="tr-total"><td class="td-label">Capacidad de crédito disponible</td>' +
              '<td class="td-monto">' +
                DataHelper.formatCOP(
                  Math.max(0, s.ahorro_acumulado * (DB.config.max_credito_multiplicador||3) - totalDeuda)
                ) +
              '</td></tr>' +
          '</tbody>' +
        '</table>' +

        '<table class="comp-tabla" style="margin-top:10pt;">' +
          '<thead><tr>' +
            '<th>Período</th><th>Monto</th><th>Fecha pago</th><th>Estado</th>' +
          '</tr></thead>' +
          '<tbody>' +
            aportes.slice().reverse().slice(0,12).map(function(a, i) {
              var estadoLabel = a.estado === "pagado" ? "Pagado"
                : a.estado === "mora" || a.estado === "vencido" ? "Mora"
                : "Pendiente";
              var estadoCls = a.estado === "pagado" ? "comp-badge-ok"
                : a.estado === "mora" || a.estado === "vencido" ? "comp-badge-mora"
                : "comp-badge-pend";
              return '<tr>' +
                '<td>' + a.periodo + '</td>' +
                '<td>' + DataHelper.formatCOP(a.monto) + '</td>' +
                '<td>' + (a.fecha_pago ? DataHelper.formatFecha(a.fecha_pago) : "—") + '</td>' +
                '<td><span class="comp-badge ' + estadoCls + '">' + estadoLabel + '</span></td>' +
              '</tr>';
            }).join("") +
          '</tbody>' +
        '</table>' +

        (credActivos.length > 0
          ? '<table class="comp-tabla" style="margin-top:10pt;">' +
              '<thead><tr>' +
                '<th>Crédito</th><th>Monto orig.</th><th>Saldo pend.</th><th>Cuotas pend.</th><th>Estado</th>' +
              '</tr></thead>' +
              '<tbody>' +
                credActivos.map(function(c) {
                  var estadoCls = c.estado === "mora" ? "comp-badge-mora" : "comp-badge-ok";
                  var estadoLabel = c.estado === "mora" ? "Mora" : "Al día";
                  return '<tr>' +
                    '<td>' + c.id + ' — ' + (c.proposito||"Crédito") + '</td>' +
                    '<td>' + DataHelper.formatCOP(c.monto) + '</td>' +
                    '<td>' + DataHelper.formatCOP(c.saldo_capital) + '</td>' +
                    '<td>' + (c.cuotas - c.cuotas_pagadas) + ' de ' + c.cuotas + '</td>' +
                    '<td><span class="comp-badge ' + estadoCls + '">' + estadoLabel + '</span></td>' +
                  '</tr>';
                }).join("") +
              '</tbody>' +
            '</table>'
          : '') +

      '</div>' +
      this._pieFirmas("estado de cuenta") +
    '</div>';
  },

  /* ════════════════════════════════════════════════════════
     MOTOR DE IMPRESIÓN
  ════════════════════════════════════════════════════════ */

  /* ── Inyectar HTML y disparar window.print() ─────────── */
  _imprimir(html, tituloDocumento) {
    var wrapper = document.getElementById("comprobante-print-area");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "comprobante-print-area";
      wrapper.className = "comprobante-wrapper";
      document.body.appendChild(wrapper);
    }
    wrapper.innerHTML = html;

    var oldTitle = document.title;
    document.title = tituloDocumento || "Comprobante FONEVI";
    window.print();
    document.title = oldTitle;
  },

  /* ── API pública ─────────────────────────────────────── */
  imprimirAporte(aporteId) {
    var html = this.generarAporte(aporteId);
    var a    = DB.aportes.find(function(x){ return x.id === aporteId; });
    var nom  = a ? DataHelper.getSocioNombre(a.socio_id) : "";
    this._imprimir(html, "Comprobante Aporte " + aporteId + " — " + nom);
  },

  imprimirPazYSalvo(socioId) {
    var html = this.generarPazYSalvo(socioId);
    var s    = DataHelper.getSocio(socioId);
    this._imprimir(html, "Paz y Salvo — " + (s ? s.nombre : socioId));
  },

  imprimirEstadoCredito(creditoId) {
    var html = this.generarEstadoCredito(creditoId);
    this._imprimir(html, "Estado Crédito " + creditoId);
  },

  imprimirEstadoCuenta(socioId) {
    var html = this.generarEstadoCuenta(socioId);
    var s    = DataHelper.getSocio(socioId);
    this._imprimir(html, "Estado de Cuenta — " + (s ? s.nombre : socioId));
  },

};
