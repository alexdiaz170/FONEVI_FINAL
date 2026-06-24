CREATE TABLE "configuracion_historial" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor_anterior" TEXT,
    "valor_nuevo" TEXT NOT NULL,
    "usuario_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_historial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "configuracion_historial_clave_idx" ON "configuracion_historial"("clave");
CREATE INDEX "configuracion_historial_created_at_idx" ON "configuracion_historial"("created_at");
