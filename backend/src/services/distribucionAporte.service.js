const db = require('../db');

class DistribucionAporteService {

async obtenerConfiguracion() {
const res = await db.query(`
  SELECT clave, valor
  FROM configuracion
`);

const cfg = {};

for (const row of res.rows) {
  cfg[row.clave] = row.valor;
}
return cfg;
}
async obtenerCreditosActivos(socioId) {

const res = await db.query(`
  SELECT *
  FROM creditos
  WHERE socio_id = $1
  AND estado <> 'pagado'
  ORDER BY created_at ASC
`,[socioId]);
return res.rows;
}

async calcular(socioId,montoPagado) {
const config = await this.obtenerConfiguracion();
const solidaridad =
  Number(config.aporte_solidaridad || 5000);
const seguroPorMil =
  Number(config.seguro_credito_por_mil || 5);
const creditos =
  await this.obtenerCreditosActivos(socioId);
let restante =
  Number(montoPagado);
const resultado = {
  solidaridad: 0,
  intereses: 0,
  seguro: 0,
  capital: 0,
  ahorro: 0,
  excedente: 0,
  creditos: []
};

// Solidaridad

if (restante >= solidaridad) {
  resultado.solidaridad = solidaridad;
  restante -= solidaridad;
}

// Créditos

for (const credito of creditos) {

  if (restante <= 0)
    break;

  const saldo =
    Number(credito.saldo_capital);
  const tasa =
    Number(credito.tasa_mensual) / 100;
  const interes =
    Number((saldo * tasa).toFixed(2));
  const seguro =
    Number(
      ((saldo * seguroPorMil) / 1000)
      .toFixed(2)
    );

  let pagoCredito =
    restante - interes - seguro;

  if (pagoCredito < 0)
    pagoCredito = 0;

  const capital =
    Math.min(
      saldo,
      pagoCredito
    );

  resultado.intereses += interes;
  resultado.seguro += seguro;
  resultado.capital += capital;
  resultado.creditos.push({
    creditoId: credito.id,
    interes,
    seguro,
    capital
  });

  restante -= (
    interes +
    seguro +
    capital
  );
}

// Lo que sobra → ahorro

if (restante > 0) {
  resultado.ahorro = restante;
  restante = 0;
}
resultado.excedente = restante;
return resultado;
}
}

module.exports =
new DistribucionAporteService();
