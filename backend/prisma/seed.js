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

async function main() {
  console.log('🌱 Iniciando seed de FONEVI...\n');

  // ── Configuración ──────────────────────────────────────────
  console.log('⚙️  Configurando parámetros del fondo...');
  const configs = [
    { clave: 'nombre',                  valor: 'FONEVI' },
    { clave: 'nombre_completo',         valor: 'Fondo de Empleados Docentes FONEVI' },
    { clave: 'nit',                     valor: '800.123.456-7' },
    { clave: 'representante',           valor: 'Carlos Alberto Muñoz' },
    { clave: 'aporte_minimo',           valor: '120000' },
    { clave: 'tasa_credito_mensual',    valor: '1.5' },
    { clave: 'tasa_mora_diaria',        valor: '0.1' },
    { clave: 'aporte_solidaridad',      valor: '30000' },
    { clave: 'max_credito_multiplicador', valor: '3' },
  ];
  for (const c of configs) {
    await prisma.configuracion.upsert({ where: { clave: c.clave }, update: { valor: c.valor }, create: c });
  }

  // ── Usuarios ──────────────────────────────────────────────
  console.log('👤 Creando usuarios...');
  const usuarios = [
    { nombre: 'Carlos Muñoz',    email: 'admin@fonevi.edu.co',      password: 'Admin2026!',   rol: 'administrador', avatar: 'CM' },
    { nombre: 'Laura Jiménez',   email: 'tesorero@fonevi.edu.co',   password: 'Tesorero2026!', rol: 'tesorero',     avatar: 'LJ' },
    { nombre: 'Ana Torres',      email: 'ana.torres@fonevi.edu.co', password: 'Socio2026!',   rol: 'socio',         avatar: 'AT' },
  ];
  for (const u of usuarios) {
    const hash = await bcrypt.hash(u.password, ROUNDS);
    await prisma.usuario.upsert({
      where:  { email: u.email },
      update: {},
      create: { nombre: u.nombre, email: u.email, password: hash, rol: u.rol, avatar: u.avatar, estado: 'activo' },
    });
    console.log(`   ✓ ${u.email} (${u.rol}) — password: ${u.password}`);
  }

  // ── Períodos ──────────────────────────────────────────────
  console.log('\n📅 Creando períodos...');
  const periodos = [
    { nombre: 'Enero 2026',    anio: 2026, mes: 1, activo: false },
    { nombre: 'Febrero 2026',  anio: 2026, mes: 2, activo: false },
    { nombre: 'Marzo 2026',    anio: 2026, mes: 3, activo: true  },
  ];
  const periodoMap = {};
  for (const p of periodos) {
    const created = await prisma.periodo.upsert({
      where:  { nombre: p.nombre },
      update: { activo: p.activo },
      create: p,
    });
    periodoMap[p.nombre] = created.id;
    console.log(`   ✓ ${p.nombre}${p.activo ? ' ← ACTIVO' : ''}`);
  }

  // ── Socios ────────────────────────────────────────────────
  console.log('\n👥 Creando socios...');
  const sociosData = [
    { codigo:'S001', nombre:'Ana María Torres',   documento:'12345678', email:'ana.torres@fonevi.edu.co', telefono:'3001234567', fechaIngreso:'2020-01-15', aporteMensual:120000, ahorroAcumulado:3600000, estado:'activo',   cargo:'Docente de Matemáticas', sede:'Sede Central' },
    { codigo:'S002', nombre:'Luis Felipe Mora',   documento:'23456789', email:'luis.mora@edu.co',         telefono:'3112345678', fechaIngreso:'2019-03-10', aporteMensual:150000, ahorroAcumulado:5100000, estado:'activo',   cargo:'Docente de Ciencias',    sede:'Sede Norte'   },
    { codigo:'S003', nombre:'Claudia Ríos Salazar',documento:'34567890', email:'claudia.rios@edu.co',     telefono:'3223456789', fechaIngreso:'2021-06-01', aporteMensual:120000, ahorroAcumulado:1800000, estado:'mora',     cargo:'Docente de Español',     sede:'Sede Sur'     },
    { codigo:'S004', nombre:'Pedro Salcedo Villa', documento:'45678901', email:'pedro.salcedo@edu.co',    telefono:'3134567890', fechaIngreso:'2018-08-20', aporteMensual:200000, ahorroAcumulado:4200000, estado:'activo',   cargo:'Rector',                 sede:'Sede Central' },
    { codigo:'S005', nombre:'Jorge Erazo Pinto',   documento:'56789012', email:'jorge.erazo@edu.co',      telefono:'3145678901', fechaIngreso:'2022-02-14', aporteMensual:120000, ahorroAcumulado:2900000, estado:'pendiente',cargo:'Docente de Historia',    sede:'Sede Norte'   },
    { codigo:'S006', nombre:'Patricia Velasco',    documento:'67890123', email:'patricia.velasco@edu.co', telefono:'3056789012', fechaIngreso:'2020-09-05', aporteMensual:120000, ahorroAcumulado:2100000, estado:'activo',   cargo:'Docente de Inglés',      sede:'Sede Sur'     },
    { codigo:'S007', nombre:'Mariana López Castro',documento:'78901234', email:'mariana.lopez@edu.co',    telefono:'3167890123', fechaIngreso:'2021-11-20', aporteMensual:120000, ahorroAcumulado:1500000, estado:'activo',   cargo:'Psicóloga',              sede:'Sede Central' },
  ];
  const socioMap = {};
  for (const s of sociosData) {
    const created = await prisma.socio.upsert({
      where:  { documento: s.documento },
      update: {},
      create: { ...s, fechaIngreso: new Date(s.fechaIngreso) },
    });
    socioMap[s.codigo] = created.id;
    console.log(`   ✓ ${s.nombre} (${s.estado})`);
  }

  // ── Aportes ───────────────────────────────────────────────
  console.log('\n💰 Creando aportes...');
  const aportesData = [
    { socio:'S001', periodo:'Enero 2026',    monto:120000, estado:'pagado',   metodo:'nomina', fecha:'2026-01-05' },
    { socio:'S001', periodo:'Febrero 2026',  monto:120000, estado:'pagado',   metodo:'nomina', fecha:'2026-02-05' },
    { socio:'S001', periodo:'Marzo 2026',    monto:120000, estado:'pagado',   metodo:'nomina', fecha:'2026-03-05' },
    { socio:'S002', periodo:'Enero 2026',    monto:150000, estado:'pagado',   metodo:'nomina', fecha:'2026-01-05' },
    { socio:'S002', periodo:'Febrero 2026',  monto:150000, estado:'pagado',   metodo:'nomina', fecha:'2026-02-05' },
    { socio:'S002', periodo:'Marzo 2026',    monto:150000, estado:'pendiente',metodo:null,     fecha:null         },
    { socio:'S003', periodo:'Enero 2026',    monto:120000, estado:'vencido',  metodo:null,     fecha:null         },
    { socio:'S003', periodo:'Febrero 2026',  monto:120000, estado:'vencido',  metodo:null,     fecha:null         },
    { socio:'S003', periodo:'Marzo 2026',    monto:120000, estado:'mora',     metodo:null,     fecha:null         },
    { socio:'S004', periodo:'Enero 2026',    monto:200000, estado:'pagado',   metodo:'nomina', fecha:'2026-01-05' },
    { socio:'S004', periodo:'Febrero 2026',  monto:200000, estado:'pagado',   metodo:'nomina', fecha:'2026-02-05' },
    { socio:'S004', periodo:'Marzo 2026',    monto:200000, estado:'pagado',   metodo:'nomina', fecha:'2026-03-05' },
    { socio:'S005', periodo:'Enero 2026',    monto:120000, estado:'pagado',   metodo:'transferencia', fecha:'2026-01-10' },
    { socio:'S005', periodo:'Febrero 2026',  monto:120000, estado:'pendiente',metodo:null,     fecha:null         },
    { socio:'S006', periodo:'Enero 2026',    monto:120000, estado:'pagado',   metodo:'nomina', fecha:'2026-01-05' },
    { socio:'S006', periodo:'Febrero 2026',  monto:120000, estado:'pagado',   metodo:'nomina', fecha:'2026-02-05' },
    { socio:'S006', periodo:'Marzo 2026',    monto:120000, estado:'pagado',   metodo:'nomina', fecha:'2026-03-19' },
    { socio:'S007', periodo:'Enero 2026',    monto:120000, estado:'pagado',   metodo:'nomina', fecha:'2026-01-05' },
    { socio:'S007', periodo:'Febrero 2026',  monto:120000, estado:'pagado',   metodo:'nomina', fecha:'2026-02-05' },
    { socio:'S007', periodo:'Marzo 2026',    monto:120000, estado:'pendiente',metodo:null,     fecha:null         },
  ];
  for (const a of aportesData) {
    await prisma.aporte.create({
      data: {
        socioId:   socioMap[a.socio],
        periodoId: periodoMap[a.periodo],
        monto:     a.monto,
        estado:    a.estado,
        metodo:    a.metodo,
        fechaPago: a.fecha ? new Date(a.fecha) : null,
      }
    });
  }
  console.log(`   ✓ ${aportesData.length} aportes creados`);

  // ── Créditos ──────────────────────────────────────────────
  console.log('\n🏦 Creando créditos...');
  const creditosData = [
    { socio:'S001', monto:3000000, tasa:1.5, cuotas:24, pagadas:18, saldo:750000,  fecha:'2024-01-10', estado:'activo', proposito:'Estudio de posgrado' },
    { socio:'S002', monto:2000000, tasa:1.5, cuotas:12, pagadas:7,  saldo:1100000, fecha:'2025-08-15', estado:'activo', proposito:'Remodelación'         },
    { socio:'S005', monto:1500000, tasa:1.5, cuotas:18, pagadas:3,  saldo:1300000, fecha:'2025-12-01', estado:'mora',   proposito:'Gastos médicos'       },
    { socio:'S004', monto:2500000, tasa:1.5, cuotas:24, pagadas:1,  saldo:2400000, fecha:'2026-02-20', estado:'activo', proposito:'Vehículo'             },
  ];
  for (const c of creditosData) {
    await prisma.credito.create({
      data: {
        socioId:         socioMap[c.socio],
        monto:           c.monto,
        tasaMensual:     c.tasa,
        cuotas:          c.cuotas,
        cuotasPagadas:   c.pagadas,
        saldoCapital:    c.saldo,
        fechaDesembolso: new Date(c.fecha),
        estado:          c.estado,
        proposito:       c.proposito,
      }
    });
  }
  console.log(`   ✓ ${creditosData.length} créditos creados`);

  // ── Notificaciones ────────────────────────────────────────
  console.log('\n🔔 Creando notificaciones...');
  await prisma.notificacion.createMany({
    data: [
      { tipo:'mora',     titulo:'Mora: Claudia Ríos',        mensaje:'2 meses sin aporte. Saldo pendiente: $240.000',     leida:false, urgente:true  },
      { tipo:'mora',     titulo:'Mora: Jorge Erazo',         mensaje:'Cuota crédito vencida hace 45 días',                leida:false, urgente:true  },
      { tipo:'credito',  titulo:'Crédito próximo a vencer',  mensaje:'Pedro Salcedo — última cuota el 31 de marzo',       leida:false, urgente:false },
      { tipo:'aporte',   titulo:'109 aportes confirmados',   mensaje:'Cierre de nómina marzo 2026 procesado correctamente',leida:true,  urgente:false },
      { tipo:'solicitud',titulo:'Solicitud de crédito',      mensaje:'Mariana López solicita crédito por $1.800.000',     leida:false, urgente:false },
    ]
  });
  console.log('   ✓ 5 notificaciones creadas');

  console.log('\n✅ Seed completado exitosamente!\n');
  console.log('─'.repeat(50));
  console.log('CREDENCIALES DE ACCESO:');
  console.log('  Admin:    admin@fonevi.edu.co     / Admin2026!');
  console.log('  Tesorero: tesorero@fonevi.edu.co  / Tesorero2026!');
  console.log('  Socio:    ana.torres@fonevi.edu.co / Socio2026!');
  console.log('─'.repeat(50));
}

main()
  .catch(e => { console.error('❌ Error en seed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
