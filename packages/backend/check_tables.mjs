import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const r = await p.$queryRawUnsafe("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='pago_cuotas')");
  console.log('pago_cuotas:', r[0].exists ? 'EXISTE' : 'NO EXISTE');
  const t = await p.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('Tablas:', t.map(x => x.table_name).join(', '));
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await p.$disconnect();
}
