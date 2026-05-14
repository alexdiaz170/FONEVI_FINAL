const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log("🔍 Iniciando diagnóstico de conexión a Supabase...");
  try {
    const sociosCount = await prisma.socio.count();
    const aportesCount = await prisma.aporte.count();
    
    console.log("✅ Conexión EXITOSA.");
    console.log(`📊 Datos encontrados en Supabase:`);
    console.log(`   - Socios: ${sociosCount}`);
    console.log(`   - Aportes: ${aportesCount}`);
    
    if (sociosCount === 0) {
      console.warn("⚠ ATENCIÓN: La base de datos está VACÍA. Es posible que no se haya ejecutado el SEED.");
    }
  } catch (err) {
    console.error("❌ ERROR de conexión a la base de datos:");
    console.error(err.message);
    if (err.message.includes("Can't reach database server")) {
      console.error("👉 Posible causa: El firewall de Supabase bloquea tu IP o la URL en .env es incorrecta.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

test();
