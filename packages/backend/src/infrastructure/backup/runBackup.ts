import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateBackupStream } from './BackupService.js';
import { disconnectPrisma } from '../persistence/prismaClient.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..', '..', '..', '..', '..');
const BACKUP_DIR = join(root, 'backups');

async function run() {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

  try {
    const filename = `fonevi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const filepath = join(BACKUP_DIR, filename);
    await generateBackupStream(filepath);
    console.log(`✓ Backup creado: ${filepath}`);
  } catch (err) {
    console.error('✗ Error en backup:', err);
    process.exit(1);
  } finally {
    await disconnectPrisma();
  }
}

run();
