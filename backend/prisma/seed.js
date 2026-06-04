// ─────────────────────────────────────────────────────────────
// FONEVI — Seed inicial de base de datos (prisma/seed.js)
// Crea usuarios, socios, periodos, aportes y configuración base
// Ejecutar: npm run db:seed
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// Safety checks: prevent accidental execution in production and require explicit env var
if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to run seed in production (NODE_ENV=production). Aborting.');
  process.exit(1);
}
if (process.env.REQUIRED_RUN_SEED !== 'true') {
  console.error('REQUIRED_RUN_SEED != "true" — To run the seed set REQUIRED_RUN_SEED=true in your environment. Aborting.');
  process.exit(1);
}

async function main() {
  console.log('🌱 Iniciando seed de FONEVI...\n');

  // ── Configuración ──────────────────────────────────────────
  console.log('⚙️  Configurando parámetros del fondo...');
  const configs = [
    { clave: 'nombre', valor: 'FONEVI' },
    { clave: 'nombre_completo', valor: 'Fondo de Empleados Docentes FONEVI' },
    { clave: 'nit', valor: '800.123.456-7' },
    { clave: 'representante', valor: 'Carlos Alberto Muñoz' },
    { clave: 'aporte_minimo', valor: '120000' },
    { clave: 'tasa_credito_mensual', valor: '1' },
    { clave: 'tasa_mora_diaria', valor: '0.1' },
    { clave: 'aporte_solidaridad', valor: '5000' },
    { clave: 'max_credito_multiplicador', valor: '3' },
    { clave: 'periodo_actual', valor: 'Marzo 2026' },
  ];
  for (const c of configs) {
    await prisma.configuracion.upsert({ where: { clave: c.clave }, update: { valor: c.valor }, create: c });
  }

  // ── Usuarios ──────────────────────────────────────────────
  console.log('👤 Creando usuarios...');
  const usuarios = [
    { nombre: 'Carlos Muñoz', email: 'admin@fonevi.edu.co', password: 'Admin2026!', rol: 'administrador', avatar: 'CM' },
    { nombre: 'Laura Jiménez', email: 'tesorero@fonevi.edu.co', password: 'Tesorero2026!', rol: 'tesorero', avatar: 'LJ' },
    { nombre: 'Ana Torres', email: 'ana.torres@fonevi.edu.co', password: 'Socio2026!', rol: 'socio', avatar: 'AT' },
  ];
  for (const u of usuarios) {
    const hash = await bcrypt.hash(u.password, ROUNDS);
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {},
      create: { nombre: u.nombre, email: u.email, password: hash, rol: u.rol, avatar: u.avatar, estado: 'activo' },
    });
    console.log(`   ✓ ${u.email} (${u.rol})`);
  }

  // ── Períodos ──────────────────────────────────────────────
  console.log('\n📅 Creando períodos...');
  const periodos = [
    { nombre: 'Enero 2026', anio: 2026, mes: 1, activo: false },
    { nombre: 'Febrero 2026', anio: 2026, mes: 2, activo: false },
    { nombre: 'Marzo 2026', anio: 2026, mes: 3, activo: true },
    { nombre: 'Abril 2026', anio: 2026, mes: 4, activo: true },
    { nombre: 'Mayo 2026', anio: 2026, mes: 5, activo: true },
    { nombre: 'Junio 2026', anio: 2026, mes: 6, activo: true },
    { nombre: 'Julio 2026', anio: 2026, mes: 7, activo: true },
    { nombre: 'Agosto 2026', anio: 2026, mes: 8, activo: true },
    { nombre: 'Septiembre 2026', anio: 2026, mes: 9, activo: true },
    { nombre: 'Octubre 2026', anio: 2026, mes: 10, activo: true },
    { nombre: 'Noviembre 2026', anio: 2026, mes: 11, activo: true },
    { nombre: 'Diciembre 2026', anio: 2026, mes: 12, activo: true },
  ];
  const periodoMap = {};
  for (const p of periodos) {
    const created = await prisma.periodo.upsert({
      where: { nombre: p.nombre },
      update: { activo: p.activo },
      create: p,
    });
    periodoMap[p.nombre] = created.id;
    console.log(`   ✓ ${p.nombre}${p.activo ? ' ← ACTIVO' : ''}`);
  }

  // ── Socios ────────────────────────────────────────────────
  console.log('\n👥 Creando socios base...');
  const sociosData = [
    { codigo: 'S001', nombre: 'Ana María Torres', documento: '12345678', email: 'ana.torres@fonevi.edu.co', telefono: '3001234567', fechaIngreso: '2020-01-15', aporteMensual: 120000, ahorroAcumulado: 3600000, estado: 'activo', cargo: 'Docente de Matemáticas', sede: 'Sede Central' },
  ];
  
  for (const s of sociosData) {
    await prisma.socio.upsert({
      where: { documento: s.documento },
      update: {},
      create: { 
        id: s.documento, // El ID es el documento
        ...s, 
        fechaIngreso: new Date(s.fechaIngreso) 
      },
    });
    console.log(`   ✓ Socio: ${s.nombre} (${s.documento})`);
  }

  // ── Aportes (Vacío para inicio limpio) ──────────────────────
  console.log('\n💰 Limpiando aportes...');
  await prisma.aporte.deleteMany({});

  // ── Créditos (Vacío para inicio limpio) ──────────────────────
  console.log('\n🏦 Limpiando créditos...');
  await prisma.credito.deleteMany({});

  // ── Notificaciones ────────────────────────────────────────
  console.log('\n🔔 Creando notificaciones iniciales...');
  await prisma.notificacion.deleteMany({});
  await prisma.notificacion.create({
    data: { tipo: 'sistema', titulo: 'Sistema Inicializado', mensaje: 'El sistema ha sido reiniciado con los datos base.', leida: false, urgente: false }
  });

  console.log('\n✅ Seed completado exitosamente!\n');
  console.log('─'.repeat(50));
  console.log('NOTE: Default credentials are NOT printed. Use your secrets manager or check the seed configuration in a secure environment.');
  console.log('If you need to run this seed locally, set REQUIRED_RUN_SEED=true and NODE_ENV!=production.');
  console.log('─'.repeat(50));
}

main()
  .catch(e => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
