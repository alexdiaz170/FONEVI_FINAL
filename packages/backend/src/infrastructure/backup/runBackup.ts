import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..', '..', '..', '..');
const BACKUP_DIR = join(root, 'backups');

async function run() {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

  const prisma = new PrismaClient();

  try {
    const [
      usuarios,
      socios,
      periodos,
      aportes,
      aporteDetalles,
      creditos,
      pagoCuotas,
      notificaciones,
      configuraciones,
      movimientos,
      solidaridadMovimientos,
      auditorias,
      waLogs,
      acuerdosPago,
      dividendos,
      dividendosSocios,
    ] = await Promise.all([
      prisma.usuario.findMany(),
      prisma.socio.findMany(),
      prisma.periodo.findMany(),
      prisma.aporte.findMany(),
      prisma.aporteDetalle.findMany(),
      prisma.credito.findMany(),
      prisma.pagoCuota.findMany(),
      prisma.notificacion.findMany(),
      prisma.configuracion.findMany(),
      prisma.movimiento.findMany(),
      prisma.solidaridadMovimiento.findMany(),
      prisma.auditoria.findMany(),
      prisma.waLog.findMany(),
      prisma.acuerdoPago.findMany(),
      prisma.dividendo.findMany(),
      prisma.dividendoSocio.findMany(),
    ]);

    const backup = {
      metadata: {
        fecha: new Date().toISOString(),
        version: '1.0',
        totalRegistros: {
          usuarios: usuarios.length,
          socios: socios.length,
          periodos: periodos.length,
          aportes: aportes.length,
          aporteDetalles: aporteDetalles.length,
          creditos: creditos.length,
          pagoCuotas: pagoCuotas.length,
          notificaciones: notificaciones.length,
          configuraciones: configuraciones.length,
          movimientos: movimientos.length,
          solidaridadMovimientos: solidaridadMovimientos.length,
          auditorias: auditorias.length,
          waLogs: waLogs.length,
          acuerdosPago: acuerdosPago.length,
          dividendos: dividendos.length,
          dividendosSocios: dividendosSocios.length,
        },
      },
      data: {
        usuarios,
        socios,
        periodos,
        aportes,
        aporteDetalles,
        creditos,
        pagoCuotas,
        notificaciones,
        configuraciones,
        movimientos,
        solidaridadMovimientos,
        auditorias,
        waLogs,
        acuerdosPago,
        dividendos,
        dividendosSocios,
      },
    };

    const filename = `fonevi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const filepath = join(BACKUP_DIR, filename);
    writeFileSync(filepath, JSON.stringify(backup, null, 2));
    console.log(`✓ Backup creado: ${filepath}`);
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((err) => {
  console.error('✗ Error en backup:', err);
  process.exit(1);
});
