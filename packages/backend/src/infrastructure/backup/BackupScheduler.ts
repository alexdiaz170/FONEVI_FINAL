import cron from 'node-cron';
import { existsSync, mkdirSync, readdirSync, unlinkSync, statSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { config } from '../../config/index.js';
import { logger } from '../logging/logger.js';
import { generateBackupStream } from './BackupService.js';
import { getStorage } from '../storage/StorageFactory.js';

async function generateBackup(): Promise<string> {
  if (!existsSync(config.backupDir)) {
    mkdirSync(config.backupDir, { recursive: true });
  }

  const filename = `fonevi-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const filepath = join(config.backupDir, filename);

  await generateBackupStream(filepath);
  return filepath;
}

async function uploadBackup(filepath: string): Promise<void> {
  try {
    const storage = getStorage();
    const content = readFileSync(filepath, 'utf-8');
    const key = `backups/${basename(filepath)}`;
    const url = await storage.upload(key, content, 'application/json');
    logger.info(`Backup subido a storage remoto: ${url}`);
  } catch (err) {
    logger.error('Error al subir backup al storage', { error: String(err) });
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
