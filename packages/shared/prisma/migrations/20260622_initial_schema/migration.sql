-- CreateTable
CREATE TABLE "usuarios" (
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
);

-- CreateTable
CREATE TABLE "socios" (
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
    "departamento" TEXT,
    "municipio" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "password" TEXT,
    "acceso_activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login" TIMESTAMP(6),
    "codigo_socio" TEXT,

    CONSTRAINT "socios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "periodos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aportes" (
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
    "pago_solidaridad" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pago_credito" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "aportes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aporte_detalles" (
    "id" TEXT NOT NULL,
    "aporte_id" TEXT NOT NULL,
    "solidaridad" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interes" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "seguro" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "capital" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ahorro" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "aporte_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creditos" (
    "id" TEXT NOT NULL,
    "socio_id" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "tasa_mensual" DECIMAL(5,2) NOT NULL,
    "cuotas" INTEGER NOT NULL,
    "cuotas_pagadas" INTEGER NOT NULL DEFAULT 0,
    "saldo_capital" DECIMAL(15,2) NOT NULL,
    "fecha_desembolso" TIMESTAMP(3) NOT NULL,
    "fecha_ultimo_pago" TIMESTAMP(3),
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "proposito" TEXT,
    "aprobado_por" TEXT,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "creditos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago_cuotas" (
    "id" TEXT NOT NULL,
    "credito_id" TEXT NOT NULL,
    "numero_cuota" INTEGER NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "monto_capital" DECIMAL(15,2) NOT NULL,
    "monto_interes" DECIMAL(15,2) NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pago_cuotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "urgente" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "movimientos" (
    "id" TEXT NOT NULL,
    "socio_id" TEXT,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solidaridad_movimientos" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "beneficiario" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solidaridad_movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "accion" TEXT NOT NULL,
    "tabla" TEXT,
    "registro_id" TEXT,
    "detalle" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wa_logs" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "message_id" TEXT,
    "enviado_en" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wa_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acuerdos_pago" (
    "id" TEXT NOT NULL,
    "socio_id" TEXT NOT NULL,
    "monto_total" DECIMAL(15,2) NOT NULL,
    "cuotas" INTEGER NOT NULL,
    "monto_cuota" DECIMAL(15,2) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acuerdos_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dividendos" (
    "id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "monto_total" DECIMAL(15,2) NOT NULL,
    "distribuido" BOOLEAN NOT NULL DEFAULT false,
    "fecha_calculo" TIMESTAMP(3) NOT NULL,
    "fecha_pago" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dividendos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dividendos_socios" (
    "id" TEXT NOT NULL,
    "dividendo_id" TEXT NOT NULL,
    "socio_id" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_pago" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dividendos_socios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "socios_codigo_key" ON "socios"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "socios_documento_key" ON "socios"("documento");

-- CreateIndex
CREATE INDEX "socios_estado_idx" ON "socios"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_nombre_key" ON "periodos"("nombre");

-- CreateIndex
CREATE INDEX "aportes_socio_id_idx" ON "aportes"("socio_id");

-- CreateIndex
CREATE INDEX "aportes_periodo_id_idx" ON "aportes"("periodo_id");

-- CreateIndex
CREATE INDEX "aportes_estado_idx" ON "aportes"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "aporte_detalles_aporte_id_key" ON "aporte_detalles"("aporte_id");

-- CreateIndex
CREATE INDEX "creditos_socio_id_idx" ON "creditos"("socio_id");

-- CreateIndex
CREATE INDEX "creditos_estado_idx" ON "creditos"("estado");

-- CreateIndex
CREATE INDEX "pago_cuotas_credito_id_idx" ON "pago_cuotas"("credito_id");

-- CreateIndex
CREATE INDEX "movimientos_tipo_idx" ON "movimientos"("tipo");

-- CreateIndex
CREATE INDEX "movimientos_fecha_idx" ON "movimientos"("fecha");

-- CreateIndex
CREATE INDEX "solidaridad_movimientos_tipo_idx" ON "solidaridad_movimientos"("tipo");

-- CreateIndex
CREATE INDEX "solidaridad_movimientos_fecha_idx" ON "solidaridad_movimientos"("fecha");

-- CreateIndex
CREATE INDEX "auditoria_usuario_id_idx" ON "auditoria"("usuario_id");

-- CreateIndex
CREATE INDEX "auditoria_created_at_idx" ON "auditoria"("created_at");

-- CreateIndex
CREATE INDEX "wa_logs_numero_idx" ON "wa_logs"("numero");

-- CreateIndex
CREATE INDEX "wa_logs_enviado_en_idx" ON "wa_logs"("enviado_en");

-- CreateIndex
CREATE INDEX "acuerdos_pago_socio_id_idx" ON "acuerdos_pago"("socio_id");

-- CreateIndex
CREATE INDEX "acuerdos_pago_estado_idx" ON "acuerdos_pago"("estado");

-- CreateIndex
CREATE INDEX "dividendos_socios_dividendo_id_idx" ON "dividendos_socios"("dividendo_id");

-- CreateIndex
CREATE INDEX "dividendos_socios_socio_id_idx" ON "dividendos_socios"("socio_id");

-- AddForeignKey
ALTER TABLE "aportes" ADD CONSTRAINT "aportes_periodo_id_fkey" FOREIGN KEY ("periodo_id") REFERENCES "periodos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aportes" ADD CONSTRAINT "aportes_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aporte_detalles" ADD CONSTRAINT "aporte_detalles_aporte_id_fkey" FOREIGN KEY ("aporte_id") REFERENCES "aportes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditos" ADD CONSTRAINT "creditos_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago_cuotas" ADD CONSTRAINT "pago_cuotas_credito_id_fkey" FOREIGN KEY ("credito_id") REFERENCES "creditos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acuerdos_pago" ADD CONSTRAINT "acuerdos_pago_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dividendos_socios" ADD CONSTRAINT "dividendos_socios_dividendo_id_fkey" FOREIGN KEY ("dividendo_id") REFERENCES "dividendos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dividendos_socios" ADD CONSTRAINT "dividendos_socios_socio_id_fkey" FOREIGN KEY ("socio_id") REFERENCES "socios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
