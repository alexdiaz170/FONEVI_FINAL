import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(import.meta.dirname, '..', '..', '..', '.env') });

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@fonevi.edu.co';
const ADMIN_PASSWORD = 'Admin2026!';
const BCRYPT_ROUNDS = 12;

async function main() {
  console.log('⏳ Iniciando seed...');

  const existing = await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`✓ Usuario ${ADMIN_EMAIL} ya existe — saltando creación`);
  } else {
    const hash = bcrypt.hashSync(ADMIN_PASSWORD, BCRYPT_ROUNDS);
    await prisma.usuario.create({
      data: {
        nombre: 'Administrador',
        email: ADMIN_EMAIL,
        password: hash,
        rol: 'superadmin',
        estado: 'activo',
      },
    });
    console.log(`✓ Usuario ${ADMIN_EMAIL} creado como superadmin`);
  }

  const sociosCount = await prisma.socio.count();
  console.log(`ℹ Socios en DB: ${sociosCount}`);

  const aportesCount = await prisma.aporte.count();
  console.log(`ℹ Aportes en DB: ${aportesCount}`);

  const creditosCount = await prisma.credito.count();
  console.log(`ℹ Créditos en DB: ${creditosCount}`);

  const configDefaults = [
    { clave: 'tasa_interes_mensual', valor: '1' },
    { clave: 'tasa_mora_mensual', valor: '0' },
    { clave: 'porcentaje_seguro', valor: '0.5' },
    { clave: 'valor_solidaridad', valor: '5000' },
    { clave: 'valor_minimo_aporte', valor: '125000' },
    { clave: 'multiplicador_maximo_credito', valor: '4' },
    { clave: 'nombre_institucion', valor: 'Fondo de Empleados Docentes FONEVI' },
    { clave: 'nit_institucion', valor: '800.123.456-7' },
  ];

  for (const cfg of configDefaults) {
    await prisma.configuracion.upsert({
      where: { clave: cfg.clave },
      create: { clave: cfg.clave, valor: cfg.valor },
      update: { valor: cfg.valor },
    });
  }
  console.log(`✓ ${configDefaults.length} configuraciones por defecto insertadas`);

  console.log('✅ Seed completado');
}

main()
  .catch((e) => {
    console.error('❌ Seed falló:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
