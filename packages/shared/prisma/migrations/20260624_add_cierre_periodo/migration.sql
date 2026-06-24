CREATE TABLE "cierres_periodo" (
    "id" TEXT NOT NULL,
    "periodo_id" INTEGER NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "total_recaudado" DECIMAL(15,2) NOT NULL,
    "total_solidaridad" DECIMAL(15,2) NOT NULL,
    "total_ahorro" DECIMAL(15,2) NOT NULL,
    "total_aplicado_creditos" DECIMAL(15,2) NOT NULL,
    "total_socios_aportaron" INTEGER NOT NULL,
    "total_aportes" INTEGER NOT NULL,
    "fecha_cierre" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cierres_periodo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cierres_periodo_periodo_id_idx" ON "cierres_periodo"("periodo_id");
CREATE INDEX "cierres_periodo_usuario_id_idx" ON "cierres_periodo"("usuario_id");
CREATE INDEX "cierres_periodo_fecha_cierre_idx" ON "cierres_periodo"("fecha_cierre");
