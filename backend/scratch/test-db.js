const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Intentando conectar...');
    await prisma.$connect();
    console.log('Conexión exitosa');
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Query exitosa:', result);
  } catch (e) {
    console.error('Error de conexión:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
