CREATE TABLE "credito_movimientos" (
    "id" TEXT NOT NULL,
    "credito_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DECIMAL(15,2) NOT NULL,
    "monto_capital" DECIMAL(15,2),
    "monto_interes" DECIMAL(15,2),
    "seguro" DECIMAL(15,2),
    "saldo_capital_anterior" DECIMAL(15,2) NOT NULL,
    "saldo_capital_posterior" DECIMAL(15,2) NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "credito_movimientos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "credito_movimientos_credito_id_idx" ON "credito_movimientos"("credito_id");
CREATE INDEX "credito_movimientos_tipo_idx" ON "credito_movimientos"("tipo");
CREATE INDEX "credito_movimientos_created_at_idx" ON "credito_movimientos"("created_at");
