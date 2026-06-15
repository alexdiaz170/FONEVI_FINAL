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

  const meses = [
    "Ene","Feb","Mar","Abr","May","Jun",
    "Jul","Ago","Sep","Oct","Nov","Dic"
  ];

  const dataAportes = Array(12).fill(0);
  const dataCreditos = Array(12).fill(0);

  (window.pageAportes || []).forEach(a => {

    if (a.estado !== "pagado") return;

    const fecha =
      a.fecha_pago ||
      a.fechaPago ||
      a.fecha ||
      a.created_at ||
      a.createdAt;

    if (!fecha) return;

    const f = new Date(fecha);

    if (isNaN(f.getTime())) return;

    dataAportes[f.getMonth()] += Number(a.monto || 0);

  });

  (window.pageCreditos || []).forEach(c => {

    const fecha =
      c.fecha_desembolso ||
      c.fechaDesembolso ||
      c.fecha ||
      c.created_at ||
      c.createdAt;

    if (!fecha) return;

    const f = new Date(fecha);

    if (isNaN(f.getTime())) return;

    dataCreditos[f.getMonth()] += Number(c.monto || 0);

  });

  ChartInstances[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: meses,
      datasets: [
        {
          label: "Aportes Recaudados",
          data: dataAportes,
          backgroundColor: ChartColors.navy,
          borderRadius: { topLeft: 5, topRight: 5 },
          borderSkipped: false,
          barPercentage: 0.55,
          categoryPercentage: 0.75
        },
        {
          label: "Créditos Desembolsados",
          data: dataCreditos,
          backgroundColor: ChartColors.gold,
          borderRadius: { topLeft: 5, topRight: 5 },
          borderSkipped: false,
          barPercentage: 0.55,
          categoryPercentage: 0.75
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
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: ctx =>
              " " +
              ctx.dataset.label +
              ": " +
              new Intl.NumberFormat("es-CO", {
                style: "currency",
                currency: "COP",
                minimumFractionDigits: 0
              }).format(ctx.raw)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false }
        },
        y: {
          border: { display: false },
          ticks: {
            callback: v => "$" + (v / 1000000).toFixed(0) + "M",
            maxTicksLimit: 5
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

  const meses = [
    "Ene","Feb","Mar","Abr","May","Jun",
    "Jul","Ago","Sep","Oct","Nov","Dic"
  ];

  const dataTendencia = Array(12).fill(0);

  let acumulado = 0;

  const aportesOrdenados = (window.pageAportes || [])
    .filter(a => a.estado === "pagado")
    .sort((a,b) => {

      const fa = new Date(
        a.fecha_pago ||
        a.fechaPago ||
        a.fecha ||
        a.created_at ||
        a.createdAt
      );

      const fb = new Date(
        b.fecha_pago ||
        b.fechaPago ||
        b.fecha ||
        b.created_at ||
        b.createdAt
      );

      return fa - fb;
    });

  aportesOrdenados.forEach(a => {

    const fecha =
      a.fecha_pago ||
      a.fechaPago ||
      a.fecha ||
      a.created_at ||
      a.createdAt;

    if (!fecha) return;

    const f = new Date(fecha);

    if (isNaN(f.getTime())) return;

    acumulado += Number(a.monto || 0);

    dataTendencia[f.getMonth()] += Number(a.monto || 0);

  });

  let suma = 0;

  for (let i = 0; i < dataTendencia.length; i++) {
    suma += dataTendencia[i];
    dataTendencia[i] = suma;
  }

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
          const { ctx:c, chartArea } = chart;

          if (!chartArea) return "transparent";

          const grad = c.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom
          );

          grad.addColorStop(0,"rgba(15,45,82,0.18)");
          grad.addColorStop(1,"rgba(15,45,82,0.01)");

          return grad;
        },
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: "#fff",
        pointBorderColor: ChartColors.navy,
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display:false },
        tooltip: {
          callbacks: {
            label: ctx =>
              " " +
              new Intl.NumberFormat("es-CO",{
                style:"currency",
                currency:"COP",
                minimumFractionDigits:0
              }).format(ctx.raw)
          }
        }
      },
      scales: {
        x: {
          grid: { display:false },
          border: { display:false }
        },
        y: {
          border: { display:false },
          ticks: {
            callback:v =>
              "$" + (v/1000000).toFixed(0) + "M",
            maxTicksLimit:5
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

  const totalAhorros =
    (window.DB?.socios || []).reduce(
      (t, s) => t + Number(s.ahorro_acumulado || s.ahorroAcumulado || 0),
      0
    );

  const totalCartera =
    (window.DB?.creditos || []).reduce(
      (t, c) => t + Number(c.saldo_capital || c.saldoCapital || c.monto || 0),
      0
    );

  const fondoSolidaridad =
    Number(window.DB?.solidaridad?.saldo_actual || 0);

  ChartInstances[canvasId] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [
        "Ahorros",
        "Cartera",
        "Solidaridad"
      ],
      datasets: [{
        data: [
          totalAhorros,
          totalCartera,
          fondoSolidaridad
        ],
        backgroundColor: [
          ChartColors.navy,
          ChartColors.gold,
          ChartColors.green
        ],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            padding: 12
          }
        },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              return (
                " " +
                ctx.label +
                ": " +
                new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                  minimumFractionDigits: 0
                }).format(ctx.raw)
              );
            }
          }
        }
      }
    }
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

  const aportes = window.DB?.aportes || [];
  const pagados = aportes.filter(
  a => (a.estado || "").toLowerCase() === "pagado"
).length;

const pendiente = aportes.filter(
  a => (a.estado || "").toLowerCase() === "pendiente"
).length;

const mora = aportes.filter(
  a => ["mora","vencido"].includes(
    (a.estado || "").toLowerCase()
  )
).length;

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
      labels: data.map((_, i) => i + 1),
      datasets: [{
        data: data,
        borderColor: color,
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      },
      scales: {
        x: { display: false },
        y: { display: false }
      },
      elements: {
        line: {
          capBezierPoints: true
        }
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

  const activos = (window.DB?.creditos || []).filter(
    c => (c.estado || "").toLowerCase() === "activo"
  ).length;

  const mora = (window.DB?.creditos || []).filter(
    c => (c.estado || "").toLowerCase() === "mora"
  ).length;

  const pagados = (window.DB?.creditos || []).filter(
    c => (c.estado || "").toLowerCase() === "pagado"
  ).length;

  ChartInstances[canvasId] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [
        "Activos",
        "En mora",
        "Pagados"
      ],
      datasets: [{
        data: [
          activos,
          mora,
          pagados
        ],
        backgroundColor: [
          ChartColors.blue,
          ChartColors.red,
          ChartColors.green
        ],
        borderWidth: 0,
        hoverOffset: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            usePointStyle: true,
            pointStyle: "circle"
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

  const meses = [
    "Ene","Feb","Mar","Abr","May","Jun",
    "Jul","Ago","Sep","Oct","Nov","Dic"
  ];

  const ingresos = Array(12).fill(0);
  const egresos  = Array(12).fill(0);

  (window.DB.movimientos || []).forEach(m => {

    const fecha =
      m.fecha ||
      m.created_at ||
      m.createdAt;

    if (!fecha) return;

    const f = new Date(fecha);

    if (isNaN(f.getTime())) return;

    const mes = f.getMonth();

    const monto = Number(m.monto || 0);

    if (
      (m.tipo || "").toLowerCase() === "ingreso"
    ) {
      ingresos[mes] += monto;
    } else {
      egresos[mes] += monto;
    }

  });

  const neto = ingresos.map((v,i) => v - egresos[i]);

  ChartInstances[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: meses,
      datasets: [
        {
          label: "Ingresos",
          data: ingresos,
          backgroundColor: ChartColors.green,
          borderRadius: 5,
          borderSkipped: false
        },
        {
          label: "Egresos",
          data: egresos,
          backgroundColor: ChartColors.red,
          borderRadius: 5,
          borderSkipped: false
        },
        {
          label: "Neto",
          data: neto,
          type: "line",
          borderColor: ChartColors.gold,
          backgroundColor: "transparent",
          borderWidth: 3,
          pointRadius: 4,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          align: "end"
        },
        tooltip: {
          callbacks: {
            label: function(c){
              return (
                " " +
                c.dataset.label +
                ": " +
                new Intl.NumberFormat("es-CO",{
                  style:"currency",
                  currency:"COP",
                  minimumFractionDigits:0
                }).format(c.raw)
              );
            }
          }
        }
      },
      scales: {
        x: {
          grid:{display:false},
          border:{display:false}
        },
        y: {
          border:{display:false},
          ticks:{
            callback:v =>
              "$" + (v/1000000).toFixed(0) + "M"
          }
        }
      }
    }
  });

  return ChartInstances[canvasId];
}
