const prisma = require("../lib/prisma");

/**
 * Obtiene una configuración por clave.
 * @param {string} clave
 * @param {*} valorPorDefecto
 */
async function obtener(clave, valorPorDefecto = null) {
  const config = await prisma.configuracion.findUnique({
    where: { clave },
  });

  if (!config) {
    return valorPorDefecto;
  }

  return config.valor;
}

/**
 * Obtiene una configuración como número.
 * @param {string} clave
 * @param {number} valorPorDefecto
 */
async function obtenerNumero(clave, valorPorDefecto = 0) {
  const valor = await obtener(clave, valorPorDefecto);
  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : valorPorDefecto;
}

/**
 * Obtiene múltiples configuraciones en un solo llamado.
 * @param {string[]} claves
 */
async function obtenerMultiples(claves = []) {
  const registros = await prisma.configuracion.findMany({
    where: {
      clave: {
        in: claves,
      },
    },
  });

  const resultado = {};

  for (const item of registros) {
    resultado[item.clave] = item.valor;
  }

  return resultado;
}

module.exports = {
  obtener,
  obtenerNumero,
  obtenerMultiples,
};