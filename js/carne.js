/* ============================================================
   FONEVI — js/carne.js
   Carné digital del socio con código QR

   Genera un carné visual en canvas, lo muestra en un modal,
   permite descargarlo como PNG e imprimirlo.

   Dependencia: qrcode.min.js (cargado desde CDN jsDelivr)
   ============================================================ */

var Carne = (function() {

  /* ── Paleta del carné ─────────────────────────────────── */
  var COLOR_NAVY_DARK  = "#0a1f3c";
  var COLOR_NAVY       = "#0f2d52";
  var COLOR_NAVY_MED   = "#153d6e";
  var COLOR_GOLD       = "#c9922a";
  var COLOR_GOLD_LIGHT = "#e0af50";
  var COLOR_WHITE      = "#ffffff";
  var COLOR_TEXT_MED   = "rgba(255,255,255,0.62)";
  var COLOR_TEXT_FAINT = "rgba(255,255,255,0.35)";

  /* ── Dimensiones del carné (proporción tarjeta de crédito) ─ */
  var W = 560;  // ancho px @2x
  var H = 340;  // alto px @2x

  /* ── Inyectar CSS del modal ──────────────────────────────── */
  function inyectarCSS() {
    if (document.getElementById("carne-styles")) return;
    var s = document.createElement("style");
    s.id = "carne-styles";
    s.textContent =
      "#carneModal{position:fixed;inset:0;z-index:9500;background:rgba(5,15,30,.72);" +
      "backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;" +
      "padding:20px;opacity:0;pointer-events:none;transition:opacity .2s ease;}" +
      "#carneModal.open{opacity:1;pointer-events:all;}" +
      "#carneBox{background:var(--bg-surface,#fff);border-radius:20px;padding:28px 28px 20px;" +
      "max-width:600px;width:100%;box-shadow:0 24px 72px rgba(5,15,30,.3);" +
      "transform:translateY(-10px) scale(.97);transition:transform .22s cubic-bezier(.16,1,.3,1);}" +
      "#carneModal.open #carneBox{transform:translateY(0) scale(1);}" +
      "#carneTitle{font-size:15px;font-weight:600;color:var(--color-text-primary,#111);margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;}" +
      "#carneCanvas{display:block;width:100%;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.18);}" +
      "#carneBtns{display:flex;gap:8px;margin-top:16px;}" +
      "#carneBtns button{flex:1;padding:10px;border-radius:10px;font-size:13px;font-weight:600;" +
      "cursor:pointer;font-family:inherit;border:none;transition:all .15s;}" +
      ".carne-btn-dl{background:var(--navy,#0f2d52)!important;color:#fff!important;}" +
      ".carne-btn-dl:hover{background:#153d6e!important;}" +
      ".carne-btn-pr{background:var(--bg-subtle,#f5f5f3)!important;color:var(--color-text-primary,#111)!important;border:1.5px solid var(--color-border-tertiary,rgba(0,0,0,.15))!important;}" +
      ".carne-btn-pr:hover{background:var(--bg-muted,#eae9e3)!important;}" +
      ".carne-btn-cl{background:var(--bg-subtle,#f5f5f3)!important;color:var(--color-text-secondary,#555)!important;border:1.5px solid var(--color-border-tertiary,rgba(0,0,0,.15))!important;}" +
      ".carne-btn-cl:hover{background:var(--bg-muted,#eae9e3)!important;}" +
      "@media print{" +
        "#carneModal{position:static;background:none;backdrop-filter:none;display:block;padding:0;opacity:1;pointer-events:all;}" +
        "#carneBox{box-shadow:none;padding:0;border-radius:0;}" +
        "#carneBtns,#carneTitle{display:none!important;}" +
        "#carneCanvas{width:100%;max-width:100%;}" +
        ".sidebar,.topbar,.main-content>:not(#carneModal){display:none!important;}" +
      "}";
    document.head.appendChild(s);
  }

  /* ── Inyectar HTML del modal ─────────────────────────────── */
  function inyectarModal() {
    if (document.getElementById("carneModal")) return;
    var div = document.createElement("div");
    div.id = "carneModal";
    div.innerHTML =
      '<div id="carneBox">' +
        '<div id="carneTitle">' +
          '<span>💳 Carné digital</span>' +
          '<button onclick="Carne.cerrar()" style="background:none;border:none;cursor:pointer;' +
            'font-size:20px;color:var(--color-text-secondary,#666);padding:0;line-height:1;">×</button>' +
        '</div>' +
        '<canvas id="carneCanvas" width="' + W + '" height="' + H + '"></canvas>' +
        '<div id="carneBtns">' +
          '<button class="carne-btn-dl" onclick="Carne.descargar()">⬇ Descargar PNG</button>' +
          '<button class="carne-btn-pr" onclick="Carne.imprimir()">🖨 Imprimir</button>' +
          '<button class="carne-btn-cl" onclick="Carne.cerrar()">Cerrar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(div);

    // Clic en fondo cierra
    div.addEventListener("click", function(e) {
      if (e.target === div) Carne.cerrar();
    });
  }

  /* ── Cargar QRCode.js desde CDN ──────────────────────────── */
  function cargarQR(callback) {
    if (window.QRCode) { callback(); return; }
    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";
    s.onload  = callback;
    s.onerror = function() {
      console.warn("FONEVI: No se pudo cargar QRCode.js — el carné se dibujará sin QR");
      window.QRCode = null;
      callback();
    };
    document.head.appendChild(s);
  }

  /* ── Texto largo con wrap manual ─────────────────────────── */
  function truncar(txt, max) {
    if (!txt) return "";
    return txt.length > max ? txt.substring(0, max - 1) + "…" : txt;
  }

  /* ── Dibujar el carné en canvas ──────────────────────────── */
  function dibujar(socio, qrDataUrl) {
    var canvas = document.getElementById("carneCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");

    // Fondo principal (degradado navy)
    var grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0,   COLOR_NAVY_DARK);
    grad.addColorStop(0.55,COLOR_NAVY);
    grad.addColorStop(1,   COLOR_NAVY_MED);
    ctx.fillStyle = grad;
    roundRect(ctx, 0, 0, W, H, 18);
    ctx.fill();

    // Patrón de puntos sutil
    ctx.fillStyle = "rgba(255,255,255,0.022)";
    for (var x = 12; x < W; x += 22) {
      for (var y = 12; y < H; y += 22) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI*2);
        ctx.fill();
      }
    }

    // Orbe dorado decorativo (esquina inferior derecha)
    var radGold = ctx.createRadialGradient(W-30, H+20, 0, W-30, H+20, 200);
    radGold.addColorStop(0, "rgba(201,146,42,0.22)");
    radGold.addColorStop(1, "rgba(201,146,42,0)");
    ctx.fillStyle = radGold;
    ctx.fillRect(0, 0, W, H);

    // Línea dorada superior
    ctx.fillStyle = COLOR_GOLD;
    ctx.fillRect(0, 0, W, 5);

    // ── LOGOTIPO (izquierda) ──────────────────────────────
    var logoX = 26, logoY = 24, logoS = 48;
    // Cuadrado dorado redondeado
    ctx.fillStyle = COLOR_GOLD;
    roundRect(ctx, logoX, logoY, logoS, logoS, 10);
    ctx.fill();
    // Letra F
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = "bold 26px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("F", logoX + logoS/2, logoY + logoS/2 + 1);

    // Nombre del fondo
    ctx.textAlign = "left";
    ctx.fillStyle = COLOR_WHITE;
    ctx.font = "bold 20px Arial";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("FONEVI", logoX + logoS + 12, logoY + 20);
    ctx.fillStyle = COLOR_TEXT_MED;
    ctx.font = "11px Arial";
    ctx.fillText(truncar(DB.config.nombre_completo || "Fondo de Empleados Docentes", 42), logoX + logoS + 12, logoY + 36);

    // Etiqueta CARNÉ DIGITAL
    ctx.textAlign = "right";
    ctx.fillStyle = COLOR_GOLD_LIGHT;
    ctx.font      = "bold 10px Arial";
    ctx.letterSpacing = "2px";
    ctx.fillText("CARNÉ DIGITAL", W - 24, logoY + 18);
    ctx.letterSpacing = "0";
    ctx.fillStyle = COLOR_TEXT_FAINT;
    ctx.font = "9.5px Arial";
    ctx.fillText(DB.config.nit || "", W - 24, logoY + 32);

    // ── SEPARADOR ────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(26, 88); ctx.lineTo(W - 24, 88);
    ctx.stroke();

    // ── AVATAR CON INICIALES ──────────────────────────────
    var avX = 38, avY = 108, avR = 44;
    // Sombra difusa
    ctx.shadowColor   = "rgba(0,0,0,0.35)";
    ctx.shadowBlur    = 16;
    ctx.shadowOffsetY = 4;
    // Círculo fondo degradado
    var avGrad = ctx.createLinearGradient(avX-avR, avY-avR, avX+avR, avY+avR);
    avGrad.addColorStop(0, COLOR_GOLD_LIGHT);
    avGrad.addColorStop(1, COLOR_GOLD);
    ctx.fillStyle = avGrad;
    ctx.beginPath();
    ctx.arc(avX, avY, avR, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    // Borde blanco
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth   = 3;
    ctx.stroke();
    // Iniciales
    var ini = (socio.nombre || "??").split(" ")
      .filter(Boolean).slice(0, 2)
      .map(function(p){ return p[0].toUpperCase(); }).join("");
    ctx.fillStyle     = COLOR_WHITE;
    ctx.font          = "bold 26px Arial";
    ctx.textAlign     = "center";
    ctx.textBaseline  = "middle";
    ctx.fillText(ini, avX, avY);

    // ── DATOS DEL SOCIO ───────────────────────────────────
    var tx = avX + avR + 20;
    var ty = 104;

    // Nombre completo
    ctx.textAlign    = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle    = COLOR_WHITE;
    ctx.font         = "bold 19px Arial";
    ctx.fillText(truncar(socio.nombre || "—", 30), tx, ty);

    // Cargo
    ty += 22;
    ctx.fillStyle = COLOR_TEXT_MED;
    ctx.font      = "13px Arial";
    ctx.fillText(truncar(socio.cargo || "—", 36), tx, ty);

    // Sede
    ty += 18;
    ctx.fillStyle = COLOR_GOLD_LIGHT;
    ctx.font      = "bold 11px Arial";
    ctx.fillText("📍 " + truncar(socio.sede || "—", 32), tx, ty);

    // ── CHIPS DE DATOS ────────────────────────────────────
    ty += 26;
    var chipData = [
      { label:"Código",   value: socio.id || socio.codigo || "—" },
      { label:"Ingreso",  value: socio.fecha_ingreso
          ? new Date(socio.fecha_ingreso+"T00:00:00")
              .toLocaleDateString("es-CO",{month:"short",year:"numeric"})
          : "—" },
      { label:"Estado",   value: (socio.estado||"activo").toUpperCase() },
    ];
    var cx = tx;
    chipData.forEach(function(chip) {
      // Fondo chip
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      roundRect(ctx, cx, ty - 14, 118, 28, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Label
      ctx.fillStyle    = COLOR_TEXT_FAINT;
      ctx.font         = "9px Arial";
      ctx.textAlign    = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(chip.label.toUpperCase(), cx + 8, ty - 2);
      // Valor
      ctx.fillStyle = COLOR_WHITE;
      ctx.font      = "bold 11px Arial";
      ctx.fillText(truncar(chip.value, 14), cx + 8, ty + 11);
      cx += 126;
    });

    // ── QR CODE ───────────────────────────────────────────
    if (qrDataUrl) {
      var qrSize = 90;
      var qrX    = W - qrSize - 22;
      var qrY    = 100;
      // Fondo blanco para el QR
      ctx.fillStyle = COLOR_WHITE;
      roundRect(ctx, qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 10);
      ctx.fill();
      // Imagen QR
      var img = new Image();
      img.onload = function() {
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
        // Texto debajo del QR
        ctx.fillStyle    = COLOR_TEXT_FAINT;
        ctx.font         = "8.5px Arial";
        ctx.textAlign    = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("Escanear para verificar", qrX + qrSize/2, qrY + qrSize + 18);
      };
      img.src = qrDataUrl;
    }

    // ── STRIP INFERIOR ────────────────────────────────────
    // Línea separadora
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(26, H - 48); ctx.lineTo(W - 24, H - 48);
    ctx.stroke();

    // Texto de validez
    ctx.fillStyle    = COLOR_TEXT_FAINT;
    ctx.font         = "9px Arial";
    ctx.textAlign    = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(
      "Documento de identificación exclusivo de socios activos del fondo.",
      28, H - 30
    );
    ctx.textAlign = "right";
    ctx.fillText(
      "Período: " + (DB.config.periodo_actual || "2026"),
      W - 26, H - 30
    );

    // NIT / Fondo
    ctx.fillStyle = COLOR_TEXT_FAINT;
    ctx.font      = "8.5px Arial";
    ctx.textAlign = "left";
    ctx.fillText(
      DB.config.nombre_completo + "  |  NIT: " + DB.config.nit,
      28, H - 16
    );
  }

  /* ── Helper: rect redondeado ──────────────────────────────── */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y,         x + r, y);
    ctx.closePath();
  }

  /* ── Generar datos QR ─────────────────────────────────────── */
  function datosQR(socio) {
    return [
      "FONEVI",
      "Socio: "    + (socio.nombre    || ""),
      "ID: "       + (socio.id        || ""),
      "Doc: "      + (socio.documento || ""),
      "Cargo: "    + (socio.cargo     || ""),
      "Sede: "     + (socio.sede      || ""),
      "Ingreso: "  + (socio.fecha_ingreso || ""),
      "Estado: "   + (socio.estado    || "activo"),
    ].join("\n");
  }

  /* ── API pública ──────────────────────────────────────────── */
  var _socioActual = null;

  return {

    /* Mostrar carné del socio */
    mostrar: function(socioId) {
      inyectarCSS();
      inyectarModal();

      var socio = DataHelper.getSocio(socioId);
      if (!socio) { if (typeof Toast!=="undefined") Toast.warn("Socio no encontrado."); return; }
      _socioActual = socio;

      cargarQR(function() {
        var qrTxt = datosQR(socio);

        if (window.QRCode) {
          // Generar QR como Data URL
          QRCode.toDataURL(qrTxt, {
            width: 180,
            margin: 1,
            color: { dark:"#0f2d52", light:"#ffffff" },
            errorCorrectionLevel: "M",
          }, function(err, url) {
            dibujar(socio, err ? null : url);
          });
        } else {
          dibujar(socio, null);
        }

        // Abrir modal
        document.getElementById("carneModal").classList.add("open");
        document.body.style.overflow = "hidden";
      });
    },

    cerrar: function() {
      var m = document.getElementById("carneModal");
      if (m) m.classList.remove("open");
      document.body.style.overflow = "";
    },

    descargar: function() {
      var canvas = document.getElementById("carneCanvas");
      if (!canvas) return;
      var link   = document.createElement("a");
      var nombre = _socioActual ? _socioActual.nombre.replace(/\s+/g,"_") : "socio";
      link.download = "FONEVI_Carne_" + nombre + ".png";
      link.href      = canvas.toDataURL("image/png", 1.0);
      link.click();
      if (typeof Toast !== "undefined") Toast.success("✓ Carné descargado como PNG.");
    },

    imprimir: function() {
      window.print();
    },

  };

})();
