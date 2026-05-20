-- FONEVI Production Migration: Database Indexes & Optimization
-- Date: 2026-05-19
-- Target Database: PostgreSQL (Supabase)

-- 1. Indexes for Socios table
CREATE INDEX IF NOT EXISTS "socios_estado_idx" ON "public"."socios"("estado");

-- 2. Indexes for Aportes table
CREATE INDEX IF NOT EXISTS "aportes_socio_id_idx" ON "public"."aportes"("socio_id");
CREATE INDEX IF NOT EXISTS "aportes_periodo_id_idx" ON "public"."aportes"("periodo_id");
CREATE INDEX IF NOT EXISTS "aportes_estado_idx" ON "public"."aportes"("estado");

-- 3. Indexes for Creditos table
CREATE INDEX IF NOT EXISTS "creditos_socio_id_idx" ON "public"."creditos"("socio_id");
CREATE INDEX IF NOT EXISTS "creditos_estado_idx" ON "public"."creditos"("estado");

-- 4. Indexes for Movimientos table
CREATE INDEX IF NOT EXISTS "movimientos_tipo_idx" ON "public"."movimientos"("tipo");
CREATE INDEX IF NOT EXISTS "movimientos_fecha_idx" ON "public"."movimientos"("fecha");

-- 5. Indexes for Solidaridad Movimientos table
CREATE INDEX IF NOT EXISTS "solidaridad_movimientos_tipo_idx" ON "public"."solidaridad_movimientos"("tipo");
CREATE INDEX IF NOT EXISTS "solidaridad_movimientos_fecha_idx" ON "public"."solidaridad_movimientos"("fecha");

-- 6. Indexes for Auditoria table
CREATE INDEX IF NOT EXISTS "auditoria_usuario_id_idx" ON "public"."auditoria"("usuario_id");
CREATE INDEX IF NOT EXISTS "auditoria_created_at_idx" ON "public"."auditoria"("created_at");

-- 7. Indexes for WhatsApp Logs table
CREATE INDEX IF NOT EXISTS "wa_logs_numero_idx" ON "public"."wa_logs"("numero");
CREATE INDEX IF NOT EXISTS "wa_logs_enviado_en_idx" ON "public"."wa_logs"("enviado_en");
