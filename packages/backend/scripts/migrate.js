import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('FATAL: DATABASE_URL no está definida');
  process.exit(1);
}

const migrationsDir = resolve(__dirname, '..', '..', 'shared', 'prisma', 'migrations');

async function migrate() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    const { rows: applied } = await client.query('SELECT id FROM _migrations ORDER BY id');
    const appliedSet = new Set(applied.map((r) => r.id));

    const entries = readdirSync(migrationsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name !== 'migration_lock.toml')
      .map((e) => e.name)
      .sort();

    for (const entry of entries) {
      if (appliedSet.has(entry)) {
        console.log(`  [SKIP] ${entry} — ya aplicada`);
        continue;
      }

      const sqlPath = resolve(migrationsDir, entry, 'migration.sql');
      if (!existsSync(sqlPath)) {
        console.warn(`  [WARN] ${entry}: no se encontró migration.sql`);
        continue;
      }

      const sql = readFileSync(sqlPath, 'utf-8');
      console.log(`  [APLICANDO] ${entry}...`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (id) VALUES ($1)', [entry]);
        await client.query('COMMIT');
        console.log(`  [OK] ${entry}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  [ERROR] ${entry}:`, err);
        throw err;
      }
    }

    console.log('✓ Migraciones aplicadas correctamente');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('FATAL: Error al aplicar migraciones:', err);
  process.exit(1);
});
