export interface DashboardResumen {
  totalSocios: number;
  sociosActivos: number;
  sociosMora: number;
  creditosActivos: number;
  creditosPagados: number;
  montoPrestado: number;
  saldoPorCobrar: number;
  totalAportes: number;
  aportesMes: number;
  solidaridadTotal: number;
  ingresos: number;
  egresos: number;
  totalAhorros: number;
}

export interface IDashboardRepository {
  getResumen(inicioMes: Date): Promise<DashboardResumen>;
}
