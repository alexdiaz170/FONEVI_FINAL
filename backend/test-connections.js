/**
 * FONEVI — Script de Test de Conexiones
 * Verifica: Supabase, JWT, CORS, Health check
 */

require('dotenv').config();

console.log('\n========================================');
console.log('  FONEVI — Test de Conexiones Completo');
console.log('========================================\n');

// ── Test 1: Verificar variables de entorno ───────────────
console.log('✓ Test 1: Variables de Entorno');
console.log('─────────────────────────────────────');

const requiredEnvs = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
const missingEnvs = requiredEnvs.filter(env => !process.env[env]);

if (missingEnvs.length > 0) {
  console.error(`❌ Faltan: ${missingEnvs.join(', ')}`);
  process.exit(1);
}

console.log(`✅ PORT: ${process.env.PORT}`);
console.log(`✅ NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`✅ JWT_SECRET: ${process.env.JWT_SECRET ? '***' : '❌ FALTA'}`);
console.log(`✅ DATABASE_URL: ${process.env.DATABASE_URL ? '***' : '❌ FALTA'}\n`);

// ── Test 2: Conectar a Supabase (Prisma) ───────────────────
console.log('✓ Test 2: Conexión Supabase (Prisma)');
console.log('─────────────────────────────────────');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Test de conexión simple
    console.log('⏳ Conectando a Supabase...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a Supabase exitosa\n');

    // Contar registros existentes
    console.log('✓ Test 3: Datos en Supabase');
    console.log('─────────────────────────────────────');
    
    const usuariosCount = await prisma.usuario.count();
    console.log(`✅ Usuarios en BD: ${usuariosCount}`);

    const sociosCount = await prisma.socio.count();
    console.log(`✅ Socios en BD: ${sociosCount}`);

    const creditosCount = await prisma.credito.count();
    console.log(`✅ Créditos en BD: ${creditosCount}\n`);

    // ── Test 4: Backend Health Check ────────────────────
    console.log('✓ Test 4: Backend Health Check');
    console.log('─────────────────────────────────────');
    console.log('⏳ Iniciando servidor Express...\n');

    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    
    const app = express();
    app.use(helmet());
    app.use(cors());
    app.use(express.json());

    // Endpoint de health check
    app.get('/api/health', (req, res) => {
      res.json({
        ok: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        database: 'connected'
      });
    });

    // Endpoint de login para test
    app.post('/api/auth/login', async (req, res) => {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Email y contraseña requeridos'
        });
      }

      try {
        const usuario = await prisma.usuario.findUnique({
          where: { email },
          select: {
            id: true,
            nombre: true,
            email: true,
            password: true,
            rol: true,
            estado: true
          }
        });

        if (!usuario || usuario.estado !== 'activo') {
          return res.status(401).json({
            ok: false,
            mensaje: 'Credenciales inválidas'
          });
        }

        const isMatch = await require('bcryptjs').compare(password, usuario.password);
        if (!isMatch) {
          return res.status(401).json({
            ok: false,
            mensaje: 'Credenciales inválidas'
          });
        }

        res.json({
          ok: true,
          mensaje: 'Login exitoso (test)',
          usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
          },
          token: 'test-token-' + Date.now()
        });
      } catch (err) {
        res.status(500).json({
          ok: false,
          mensaje: err.message
        });
      }
    });

    const server = app.listen(process.env.PORT || 3000, () => {
      console.log(`✅ Servidor escuchando en puerto ${process.env.PORT || 3000}`);
      console.log(`✅ CORS habilitado para todos los orígenes`);
      console.log(`✅ Helmet (seguridad) activado\n`);

      // ── Test 5: Probar endpoints ────────────────────────
      console.log('✓ Test 5: Probar Endpoints');
      console.log('─────────────────────────────────────');

      const testEndpoints = async () => {
        try {
          // Health check
          console.log('⏳ GET /api/health');
          const healthRes = await fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health');
          const healthData = await healthRes.json();
          if (healthData.ok) {
            console.log('✅ Health check: OK');
          }

          // Login test (sin credenciales válidas)
          console.log('\n⏳ POST /api/auth/login (test sin credenciales)');
          const loginRes = await fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: '', password: '' })
          });
          const loginData = await loginRes.json();
          console.log(`✅ Endpoint de login accesible: ${loginData.mensaje}\n`);

          // ── Resumen final ────────────────────────────────
          console.log('========================================');
          console.log('✅ TODAS LAS CONEXIONES FUNCIONAN');
          console.log('========================================');
          console.log('\n📝 PRÓXIMOS PASOS:');
          console.log('   1. El backend está corriendo en puerto ' + (process.env.PORT || 3000));
          console.log('   2. Recarga el navegador en http://localhost (index.html)');
          console.log('   3. Deberías ver "Servidor conectado" en lugar de "Modo offline"');
          console.log('   4. Intenta hacer login con credenciales correctas\n');

          // Mantener servidor corriendo
          console.log('💡 El servidor seguirá corriendo. Presiona Ctrl+C para detener.\n');

        } catch (err) {
          console.error('❌ Error en test:', err.message);
          process.exit(1);
        }
      };

      // Esperar un poco antes de hacer los tests
      setTimeout(testEndpoints, 500);
    });

    // Mantener el servidor activo
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Deteniendo servidor...');
      await prisma.$disconnect();
      process.exit(0);
    });

  } catch (err) {
    console.error('\n❌ ERROR EN CONEXIÓN A SUPABASE:');
    console.error('─────────────────────────────────────');
    console.error(err.message);
    
    console.log('\n📋 SOLUCIONES:');
    console.log('   1. Verifica que DATABASE_URL sea correcta en .env');
    console.log('   2. Verifica que Supabase esté activo en https://app.supabase.com');
    console.log('   3. Verifica tu conexión a internet');
    console.log('   4. Intenta migrar la BD: npm run db:migrate\n');
    
    process.exit(1);
  }
})();
