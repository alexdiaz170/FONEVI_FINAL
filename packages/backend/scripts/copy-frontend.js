import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDist = resolve(__dirname, '..', '..', 'frontend', 'dist');
const publicDir = resolve(__dirname, '..', 'public');

if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}
cpSync(frontendDist, publicDir, { recursive: true });
console.log('✓ Frontend copiado a packages/backend/public/');
