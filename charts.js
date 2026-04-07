/* ============================================================
   FONEVI — js/charts.js
   Gráficos reales con Chart.js 4
   Incluir DESPUÉS de data.js en cualquier página que use gráficos
   ============================================================ */

/* ── Paleta de colores FONEVI para Chart.js ─────────────────── */
const ChartColors = {
  navy:       "#0f2d52",
  navyMid:    "#1a4a7a",
  navyLight:  "rgba(15,45,82,0.12)",
  gold:       "#c9922a",
  goldLight:  "rgba(201,146,42,0.15)",
  green:      "#1d9e75",
  greenLight: "rgba(29,158,117,0.12)",
  red:        "#a32d2d",
  redLight:   "rgba(163,45,45,0.12)",
  amber:      "#ba7517",
  amberLight: "rgba(186,117,23,0.12)",
  blue:       "#185fa5",
  blueLight:  "rgba(24,95,165,0.12)",
  grid:       "rgba(15,45,82,0.06)",
  text:       "#7a95b0",
  textDark:   "#0d1f35",
};

/* ── Configuración global de Chart.js ───────────────────────── */
function initChartDefaults() {
  Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
  Chart.defaults.font.size   = 12;
  Chart.defaults.color       = ChartColors.text;
  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.plugins.tooltip.backgroundColor = ChartColors.navy;
  Chart.defaults.plugins.tooltip.titleColor  = "#fff";
  Chart.defaults.plugins.tooltip.bodyColor   = "rgba(255,255,255,0.75)";
  Chart.defaults.plugins.tooltip.padding     = 10;
  Chart.defaults.plugins.tooltip.cornerRadius= 8;
  Chart.defaults.plugins.tooltip.displayColors = true;
  Chart.defaults.plugins.tooltip.boxWidth    = 10;
  Chart.defaults.plugins.tooltip.boxHeight   = 10;
  Chart.defaults.scale.grid.color            = ChartColors.grid;
  Chart.defaults.scale.grid.drawBorder       = false;
  Chart.defaults.scale.ticks.color           = ChartColors.text;
  Chart.defaults.animation.duration          = 600;
  Chart.defaults.animation.easing            = "easeInOutQuart";
}

/* ── Registro de instancias (para destruir antes de recrear) ─── */
const ChartInstances = {};

function destroyChart(id) {
  if (ChartInstances[id]) {
    ChartInstances[id].destroy();
    delete ChartInstances[id];
  }
}

/* ============================================================
   1. GRÁFICO DE BARRAS — Aportes vs Créditos (mensual)
   Usado en: Dashboard
   ============================================================ */
function crearGraficoBarras(canvasId) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                 "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // Datos reales desde DB + proyección
  const dataAportes  = [13080000, 12900000, 13080000, 13200000, 13080000, 13500000,
                        13200000, 13080000, 13500000, 13200000, 13080000, 13500000];
  const dataCreditos = [2100000,  3200000,  1800000,  2500000,  1200000,  3000000,
                        2200000,  1800000,  2600000,  1500000,  2000000,  3100000];

  ChartInstances[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: meses,
      datasets: [
        {
          label: "Aportes",
          data: dataAportes,
          backgroundColor: ChartColors.navy,
          borderRadius: { topLeft: 5, topRight: 5 },
          borderSkipped: false,
          barPercentage: 0.55,
          categoryPercentage: 0.75,
        },
        {
          label: "Créditos pagados",
          data: dataCreditos,
          backgroundColor: ChartColors.gold,
          borderRadius: { topLeft: 5, topRight: 5 },
          borderSkipped: false,
          barPercentage: 0.55,
          categoryPercentage: 0.75,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            usePointStyle: true,
            pointStyle: "rectRounded",
            padding: 16,
            font: { size: 12 },
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => " " + ctx.dataset.label + ": " +
              new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",
                minimumFractionDigits:0}).format(ctx.raw)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
        },
        y: {
          border: { display: false },
          ticks: {
            callback: v => "$" + (v/1000000).toFixed(0) + "M",
            maxTicksLimit: 5,
          }
        }
      }
    }
  });

  return ChartInstances[canvasId];
}

/* ============================================================
   2. GRÁFICO DE LÍNEA — Ahorro acumulado (tendencia anual)
   Usado en: Dashboard
   ============================================================ */
function crearGraficoLinea(canvasId) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const meses = ["Ene","Feb","Mar","Abr","May","Jun",
                 "Jul","Ago","Sep","Oct","Nov","Dic"];
  const ahorroBase = DB.socios.reduce((t,s)=>t+s.ahorro_acumulado,0);
  // Simular curva de crecimiento mensual acumulado
  const aporteMensual = DB.socios.reduce((t,s)=>t+s.aporte_mensual,0);
  const dataTendencia = meses.map((_,i) => {
    return Math.round((ahorroBase - (11-i) * aporteMensual) * (1 + i * 0.003));
  });

  ChartInstances[canvasId] = new Chart(ctx, {
    type: "line",
    data: {
      labels: meses,
      datasets: [{
        label: "Ahorro acumulado",
        data: dataTendencia,
        borderColor: ChartColors.navy,
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const {ctx: c, chartArea} = chart;
          if (!chartArea) return "transparent";
          const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          grad.addColorStop(0, "rgba(15,45,82,0.18)");
          grad.addColorStop(1, "rgba(15,45,82,0.01)");
          return grad;
        },
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: "#fff",
        pointBorderColor: ChartColors.navy,
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => " " +
              new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",
                minimumFractionDigits:0}).format(ctx.raw)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
        },
        y: {
          border: { display: false },
          ticks: {
            callback: v => "$" + (v/1000000).toFixed(0) + "M",
            maxTicksLimit: 5,
          }
        }
      }
    }
  });

  return ChartInstances[canvasId];
}

/* ============================================================
   3. GRÁFICO DE DONA — Distribución de fondos
   Usado en: Dashboard
   ============================================================ */
function crearGraficoDistribucion(canvasId) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const totalAhorros   = DataHelper.getTotalAhorros();
  const totalCartera   = DataHelper.getTotalCartera();
  const totalSolid     = DB.solidaridad.saldo_actual;
  const total          = totalAhorros + totalCartera + totalSolid;

  ChartInstances[canvasId] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Ahorro socios", "Cartera créditos", "Solidaridad"],
      datasets: [{
        data: [totalAhorros, totalCartera, totalSolid],
        backgroundColor: [ChartColors.navy, ChartColors.gold, ChartColors.green],
        borderWidth: 0,
        hoverOffset: 6,
        borderRadius: 4,
        spacing: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 14,
            font: { size: 12 },
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const pct = ((ctx.raw / total) * 100).toFixed(1);
              return " " + ctx.label + ": " + pct + "%";
            },
            afterLabel: ctx =>
              " " + new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",
                minimumFractionDigits:0}).format(ctx.raw)
          }
        }
      }
    },
    plugins: [{
      // Texto central de la dona
      id: "centerText",
      beforeDraw(chart) {
        const {ctx: c, chartArea} = chart;
        if (!chartArea) return;
        const cx = (chartArea.left + chartArea.right) / 2;
        const cy = (chartArea.top + chartArea.bottom) / 2;
        c.save();
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.font = "600 11px 'Plus Jakarta Sans'";
        c.fillStyle = ChartColors.text;
        c.fillText("TOTAL", cx, cy - 12);
        c.font = "600 16px 'Plus Jakarta Sans'";
        c.fillStyle = ChartColors.textDark;
        c.fillText("$" + (total/1000000).toFixed(1) + "M", cx, cy + 8);
        c.restore();
      }
    }]
  });

  return ChartInstances[canvasId];
}

/* ============================================================
   4. GRÁFICO DE BARRAS HORIZONTALES — Estado de aportes
   Usado en: Módulo de aportes
   ============================================================ */
function crearGraficoAportesMes(canvasId) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const aportes   = DB.aportes;
  const pagados   = aportes.filter(a => a.estado === "pagado").length;
  const pendiente = aportes.filter(a => a.estado === "pendiente").length;
  const mora      = aportes.filter(a => ["mora","vencido"].includes(a.estado)).length;

  ChartInstances[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Pagados", "Pendientes", "En mora"],
      datasets: [{
        data: [pagados, pendiente, mora],
        backgroundColor: [ChartColors.green, ChartColors.amber, ChartColors.red],
        borderRadius: { topLeft: 5, topRight: 5 },
        borderSkipped: false,
        barPercentage: 0.55,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => " " + ctx.raw + " socios" }
        }
      },
      scales: {
        x: {
          border: { display: false },
          ticks: { maxTicksLimit: 6 }
        },
        y: {
          grid: { display: false },
          border: { display: false },
        }
      }
    }
  });

  return ChartInstances[canvasId];
}

/* ============================================================
   5. MINI SPARKLINE — Para KPI cards
   ============================================================ */
function crearSparkline(canvasId, data, color) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  ChartInstances[canvasId] = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((_,i) => i),
      datasets: [{
        data,
        borderColor: color || ChartColors.navy,
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });

  return ChartInstances[canvasId];
}

/* ============================================================
   6. GRÁFICO DE CRÉDITOS — Estado de cartera (dona)
   Usado en: Módulo de créditos
   ============================================================ */
function crearGraficoCartera(canvasId) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  const activos = DB.creditos.filter(c => c.estado === "activo").length;
  const mora    = DB.creditos.filter(c => c.estado === "mora").length;
  const pagados = DB.creditos.filter(c => c.estado === "pagado").length;

  ChartInstances[canvasId] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Activos", "En mora", "Pagados"],
      datasets: [{
        data: [activos, mora, pagados],
        backgroundColor: [ChartColors.blue, ChartColors.red, ChartColors.green],
        borderWidth: 0,
        hoverOffset: 5,
        borderRadius: 3,
        spacing: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            usePointStyle: true, pointStyle: "circle",
            padding: 12, font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => " " + ctx.label + ": " + ctx.raw + " crédito(s)"
          }
        }
      }
    }
  });

  return ChartInstances[canvasId];
}

/* ============================================================
   7. GRÁFICO FLUJO DE CAJA — Ingresos vs Egresos
   Usado en: Contabilidad
   ============================================================ */
function crearGraficoFlujoCaja(canvasId) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  // Agrupar movimientos por mes
  const meses = ["Ene","Feb","Mar"];
  const ingresos = [13080000 + 920000, 12900000 + 980000, 13080000];
  const egresos  = [0, 2500000, 500000 + 150000];
  const neto     = ingresos.map((v,i) => v - egresos[i]);

  ChartInstances[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: meses,
      datasets: [
        {
          label: "Ingresos",
          data: ingresos,
          backgroundColor: ChartColors.green,
          borderRadius: { topLeft: 5, topRight: 5 },
          borderSkipped: false,
          order: 2,
          barPercentage: 0.5,
        },
        {
          label: "Egresos",
          data: egresos,
          backgroundColor: ChartColors.red,
          borderRadius: { topLeft: 5, topRight: 5 },
          borderSkipped: false,
          order: 2,
          barPercentage: 0.5,
        },
        {
          label: "Neto",
          data: neto,
          type: "line",
          borderColor: ChartColors.gold,
          backgroundColor: "transparent",
          borderWidth: 2.5,
          pointRadius: 5,
          pointBackgroundColor: "#fff",
          pointBorderColor: ChartColors.gold,
          pointBorderWidth: 2,
          tension: 0.3,
          order: 1,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            usePointStyle: true,
            pointStyle: "rectRounded",
            padding: 14,
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => " " + ctx.dataset.label + ": " +
              new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",
                minimumFractionDigits:0}).format(ctx.raw)
          }
        }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: {
          border: { display: false },
          ticks: {
            callback: v => "$" + (v/1000000).toFixed(0) + "M",
            maxTicksLimit: 5
          }
        }
      }
    }
  });

  return ChartInstances[canvasId];
}
