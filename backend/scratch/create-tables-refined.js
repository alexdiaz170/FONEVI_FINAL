const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sqlBlocks = [
    `CREATE TABLE IF NOT EXISTS "usuarios" (
        "id" TEXT NOT NULL,
        "nombre" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "rol" TEXT NOT NULL DEFAULT 'socio',
        "estado" TEXT NOT NULL DEFAULT 'activo',
        "avatar" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_email_key" ON "usuarios"("email")`,
    `CREATE TABLE IF NOT EXISTS "socios" (
        "id" TEXT NOT NULL,
        "codigo" TEXT NOT NULL,
        "nombre" TEXT NOT NULL,
        "documento" TEXT NOT NULL,
        "email" TEXT,
        "telefono" TEXT,
        "fecha_ingreso" TIMESTAMP(3) NOT NULL,
        "aporte_mensual" DECIMAL(15,2) NOT NULL,
        "ahorro_acumulado" DECIMAL(15,2) NOT NULL DEFAULT 0,
        "estado" TEXT NOT NULL DEFAULT 'activo',
        "cargo" TEXT,
        "sede" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "socios_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "socios_codigo_key" ON "socios"("codigo")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "socios_documento_key" ON "socios"("documento")`,
    `CREATE TABLE IF NOT EXISTS "periodos" (
        "id" SERIAL NOT NULL,
        "nombre" TEXT NOT NULL,
        "anio" INTEGER NOT NULL,
        "mes" INTEGER NOT NULL,
        "activo" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "periodos_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "periodos_nombre_key" ON "periodos"("nombre")`,
    `CREATE TABLE IF NOT EXISTS "aportes" (
        "id" TEXT NOT NULL,
        "socio_id" TEXT NOT NULL,
        "periodo_id" INTEGER NOT NULL,
        "monto" DECIMAL(15,2) NOT NULL,
        "fecha_pago" TIMESTAMP(3),
        "estado" TEXT NOT NULL DEFAULT 'pendiente',
        "metodo" TEXT,
        "notas" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "aportes_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "creditos" (
        "id" TEXT NOT NULL,
        "socio_id" TEXT NOT NULL,
        "monto" DECIMAL(15,2) NOT NULL,
        "tasa_mensual" DECIMAL(5,2) NOT NULL,
        "cuotas" INTEGER NOT NULL,
        "cuotas_pagadas" INTEGER NOT NULL DEFAULT 0,
        "saldo_capital" DECIMAL(15,2) NOT NULL,
        "fecha_desembolso" TIMESTAMP(3) NOT NULL,
        "estado" TEXT NOT NULL DEFAULT 'activo',
        "proposito" TEXT,
        "aprobado_por" TEXT,
        "notas" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "creditos_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "notificaciones" (
        "id" TEXT NOT NULL,
        "tipo" TEXT NOT NULL,
        "titulo" TEXT NOT NULL,
        "mensaje" TEXT NOT NULL,
        "leida" BOOLEAN NOT NULL DEFAULT false,
        "urgente" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "configuracion" (
        "clave" TEXT NOT NULL,
        "valor" TEXT NOT NULL,
        "updated_at" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "configuracion_pkey" PRIMARY KEY ("clave")
    )`,
    `CREATE TABLE IF NOT EXISTS "movimientos" (
        "id" TEXT NOT NULL,
        "tipo" TEXT NOT NULL,
        "categoria" TEXT NOT NULL,
        "descripcion" TEXT NOT NULL,
        "monto" DECIMAL(15,2) NOT NULL,
        "fecha" TIMESTAMP(3) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "solidaridad_movimientos" (
        "id" TEXT NOT NULL,
        "tipo" TEXT NOT NULL,
        "descripcion" TEXT NOT NULL,
        "monto" DECIMAL(15,2) NOT NULL,
        "fecha" TIMESTAMP(3) NOT NULL,
        "beneficiario" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "solidaridad_movimientos_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "auditoria" (
        "id" TEXT NOT NULL,
        "usuario_id" TEXT,
        "accion" TEXT NOT NULL,
        "tabla" TEXT,
        "registro_id" TEXT,
        "detalle" TEXT,
        "ip" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "wa_logs" (
        "id" TEXT NOT NULL,
        "numero" TEXT NOT NULL,
        "template" TEXT NOT NULL,
        "estado" TEXT NOT NULL,
        "message_id" TEXT,
        "enviado_en" TIMESTAMP(3) NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "wa_logs_pkey" PRIMARY KEY ("id")
    )`
];

async function main() {
  for (const sql of sqlBlocks) {
    try {
      console.log(`Executing: ${sql.substring(0, 50)}...`);
      await prisma.$executeRawUnsafe(sql);
    } catch (e) {
      console.error('Error executing block:', e.message);
    }
  }
  console.log('All blocks processed.');
  await prisma.$disconnect();
}

main();
