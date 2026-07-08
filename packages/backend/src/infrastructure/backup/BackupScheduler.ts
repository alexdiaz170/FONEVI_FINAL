import cron from 'node-cron';
import { writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';
import { config } from '../../config/index.js';
import { getPrismaClient, disconnectPrisma } from '../persistence/prismaClient.js';
import { logger } from '../logging/logger.js';

async function generateBackup(): Promise<string> {
  const prisma = getPrismaClient();

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

  if (!existsSync(config.backupDir)) {
    mkdirSync(config.backupDir, { recursive: true });
  }

  const filename = `fonevi-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const filepath = join(config.backupDir, filename);
  writeFileSync(filepath, JSON.stringify(backup, null, 2));
  return filepath;
}

async function uploadBackup(filepath: string): Promise<void> {
  if (!config.backupUploadUrl) return;

  try {
    const { readFileSync } = await import('fs');
    const body = readFileSync(filepath, 'utf-8');
    const response = await fetch(config.backupUploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(config.backupUploadToken
          ? { Authorization: `Bearer ${config.backupUploadToken}` }
          : {}),
      },
      body,
    });
    if (!response.ok) {
      logger.error('Error al subir backup a almacenamiento externo', {
        status: response.status,
        url: config.backupUploadUrl,
      });
    } else {
      logger.info('Backup subido a almacenamiento externo');
    }
  } catch (err) {
    logger.error('Error al subir backup', { error: String(err) });
  }
}

function cleanOldBackups(): void {
  if (!existsSync(config.backupDir)) return;

  const cutoff = Date.now() - config.backupRetentionDays * 24 * 60 * 60 * 1000;
  const files = readdirSync(config.backupDir).filter((f) => f.startsWith('fonevi-backup-'));

  for (const file of files) {
    const filepath = join(config.backupDir, file);
    const stats = existsSync(filepath) ? statSync(filepath) : null;
    if (stats && stats.mtimeMs < cutoff) {
      unlinkSync(filepath);
      logger.info(`Backup antiguo eliminado: ${file}`);
    }
  }
}

export function startBackupScheduler(): void {
  if (!cron.validate(config.backupCronSchedule)) {
    logger.error(`Cron schedule inválido: ${config.backupCronSchedule}`);
    return;
  }

  logger.info(`Programador de backups iniciado (schedule: ${config.backupCronSchedule})`);

  cron.schedule(config.backupCronSchedule, async () => {
    logger.info('Iniciando backup automático...');
    try {
      const filepath = await generateBackup();
      logger.info(`Backup creado: ${filepath}`);
      await uploadBackup(filepath);
      cleanOldBackups();
    } catch (err) {
      logger.error('Error en backup automático', { error: String(err) });
    }
  });
}
