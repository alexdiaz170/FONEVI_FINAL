import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const socios = await prisma.socio.findMany({
    take: 10,
    select: { id: true, nombre: true, documento: true },
  });
  if (!socios.length) {
    console.log('No hay socios');
    return;
  }
  console.log('Socios encontrados:', socios.length);
  for (const s of socios) {
    console.log(`  ID: ${s.id}, Nombre: ${s.nombre}, Documento: ${s.documento}`);
  }

  const creditos = await prisma.credito.findMany({
    where: { socioId: socios[0].id },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Créditos:');
  for (const c of creditos) {
    console.log(`  ID: ${c.id}, Monto: ${Number(c.monto)}, Saldo: ${Number(c.saldoCapital)}, Estado: ${c.estado}, Cuotas: ${c.cuotasPagadas}/${c.cuotas}`);
  }

  const pagoCuotas = await prisma.pagoCuota.count({
    where: { creditoId: { in: creditos.map(c => c.id) } },
  });
  console.log('PagoCuotas relacionados:', pagoCuotas);

  await prisma.$disconnect();
}

main().catch(console.error);
