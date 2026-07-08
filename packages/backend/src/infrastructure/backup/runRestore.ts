import { resolve, isAbsolute } from 'path';
import { restoreBackup } from './BackupService.js';
import { disconnectPrisma } from '../persistence/prismaClient.js';

async function run() {
  const fileArg = process.argv[2];

  if (!fileArg) {
    console.error('✗ Error: Debes especificar la ruta del archivo de copia de seguridad (.json).');
    console.log('Uso: npm run restore <ruta-al-archivo-backup.json>');
    process.exit(1);
  }

  const filepath = isAbsolute(fileArg) ? fileArg : resolve(process.cwd(), fileArg);

  try {
    const counts = await restoreBackup(filepath);
    console.log('\n=========================================');
    console.log('✓ RESTAURACIÓN EXITOSA DE BASE DE DATOS');
    console.log('=========================================');
    for (const [table, count] of Object.entries(counts)) {
      if (count > 0) {
        console.log(`- ${table}: ${count} registros restaurados`);
      }
    }
    console.log('=========================================\n');
  } catch (err) {
    console.error('\n✗ ERROR CRÍTICO EN RESTAURACIÓN:', err);
    process.exit(1);
  } finally {
    await disconnectPrisma();
  }
}

run();
