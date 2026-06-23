import { getPrismaClient } from './prismaClient.js';
import {
  IDashboardRepository,
  DashboardResumen,
} from '../../domain/repositories/IDashboardRepository.js';

const DASHBOARD_SQL = `
  SELECT
    COALESCE((SELECT COUNT(*) FROM socios WHERE deleted_at IS NULL), 0)::int AS "totalSocios",
    COALESCE((SELECT COUNT(*) FROM socios WHERE estado = 'activo' AND deleted_at IS NULL), 0)::int AS "sociosActivos",
    COALESCE((SELECT COUNT(*) FROM socios WHERE estado = 'mora' AND deleted_at IS NULL), 0)::int AS "sociosMora",
    COALESCE((SELECT COUNT(*) FROM creditos WHERE estado = 'activo' AND deleted_at IS NULL), 0)::int AS "creditosActivos",
    COALESCE((SELECT COUNT(*) FROM creditos WHERE estado = 'pagado' AND deleted_at IS NULL), 0)::int AS "creditosPagados",
    COALESCE((SELECT SUM(monto::numeric) FROM creditos WHERE estado IN ('activo', 'pagado') AND deleted_at IS NULL), 0)::float8 AS "montoPrestado",
    COALESCE((SELECT SUM(saldo_capital::numeric) FROM creditos WHERE estado = 'activo' AND deleted_at IS NULL), 0)::float8 AS "saldoPorCobrar",
    COALESCE((SELECT SUM(monto::numeric) FROM aportes WHERE estado = 'pagado'), 0)::float8 AS "totalAportes",
    COALESCE((SELECT SUM(monto::numeric) FROM aportes WHERE estado = 'pagado' AND fecha_pago >= $1::timestamp), 0)::float8 AS "aportesMes",
    COALESCE(
      (SELECT SUM(monto::numeric) FROM solidaridad_movimientos WHERE tipo = 'ingreso'), 0
    )::float8 - COALESCE(
      (SELECT SUM(monto::numeric) FROM solidaridad_movimientos WHERE tipo = 'egreso'), 0
    )::float8 AS "solidaridadTotal",
    COALESCE((SELECT SUM(monto::numeric) FROM movimientos WHERE tipo = 'ingreso'), 0)::float8 AS "ingresos",
    COALESCE((SELECT SUM(monto::numeric) FROM movimientos WHERE tipo = 'egreso'), 0)::float8 AS "egresos",
    COALESCE((SELECT SUM(ahorro_acumulado::numeric) FROM socios WHERE deleted_at IS NULL), 0)::float8 AS "totalAhorros",
    COALESCE((SELECT valor::numeric FROM configuracion WHERE clave = 'reservas'), 2500000)::float8 AS "reservas"
`;

export class PrismaDashboardRepository implements IDashboardRepository {
  private readonly prisma = getPrismaClient();

  async getResumen(inicioMes: Date): Promise<DashboardResumen> {
    const rows = await this.prisma.$queryRawUnsafe<DashboardResumen[]>(DASHBOARD_SQL, inicioMes);
    return rows[0]!;
  }
}
