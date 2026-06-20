import { useAuthStore } from '../stores/authStore';

interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  mensaje?: string;
  codigo?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function tryRefresh(): Promise<boolean> {
  const currentRefresh = useAuthStore.getState().refreshToken;
  if (!currentRefresh) return false;

  try {
    const res = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefresh }),
    });
    if (!res.ok) {
      useAuthStore.getState().logout();
      return false;
    }

    const json = (await res.json()) as ApiResponse<{ token: string; refreshToken: string }>;
    if (!json.ok || !json.data) {
      useAuthStore.getState().logout();
      return false;
    }

    useAuthStore.getState().setTokens(json.data.token, json.data.refreshToken);
    return true;
  } catch {
    useAuthStore.getState().logout();
    return false;
  }
}

async function fetchApi(path: string, options: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(path, { ...options, headers });

  if (res.status === 401 && token) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${useAuthStore.getState().token}`;
      res = await fetch(path, { ...options, headers });
    }
  }

  if (!res.ok) {
    let body: ApiResponse;
    try {
      body = (await res.json()) as ApiResponse;
    } catch {
      body = { ok: false, mensaje: res.statusText };
    }
    throw new ApiError(res.status, body.mensaje ?? 'Error de conexión', body.codigo, body.detalles);
  }

  return res;
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetchApi(path, options);
  const json = await res.json();
  return json.data as T;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function apiPaginated<T>(
  path: string,
  options: RequestInit = {},
): Promise<PaginatedResult<T>> {
  const res = await fetchApi(path, options);
  const json = await res.json();
  const meta = json.meta ?? {
    total: json.data.length,
    page: 1,
    limit: json.data.length,
    totalPages: 1,
  };
  return {
    data: json.data as T[],
    total: meta.total,
    page: meta.page,
    limit: meta.limit,
    totalPages: meta.totalPages,
  };
}

export async function apiLogin(email: string, password: string) {
  return api<{
    token: string;
    refreshToken: string;
    usuario: { id: string; nombre: string; email: string; rol: string };
  }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function apiGetProfile() {
  return api<{
    id: string;
    nombre: string;
    email: string;
    rol: string;
    estado: string;
    avatar: string | null;
  }>('/auth/profile');
}

export interface SocioDTO {
  id: string;
  codigo: string;
  codigoSocio: string | null;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email: string | null;
  telefono: string | null;
  fechaIngreso: string;
  aporteMensual: number;
  ahorroAcumulado: number;
  estado: string;
  cargo: string | null;
  sede: string | null;
  departamento: string | null;
  municipio: string | null;
  eliminado: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function apiListarSocios(page = 1, limit = 10, includeDeleted = false) {
  return apiPaginated<SocioDTO>(
    `/api/socios?page=${page}&limit=${limit}&includeDeleted=${includeDeleted}`,
  );
}

export async function apiObtenerSocio(id: string) {
  return api<SocioDTO>(`/api/socios/${id}`);
}

export async function apiCrearSocio(data: Record<string, unknown>) {
  return api<{ socio: SocioDTO; passwordInicial: string }>('/api/socios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiActualizarSocio(id: string, data: Record<string, unknown>) {
  return api<SocioDTO>(`/api/socios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiEliminarSocio(id: string) {
  return api<{ mensaje: string }>(`/api/socios/${id}`, { method: 'DELETE' });
}

// ─── Aportes ────────────────────────────────

export interface AporteDTO {
  id: string;
  socioId: string;
  periodoId: number;
  monto: number;
  fechaPago: string | null;
  estado: string;
  metodo: string | null;
  notas: string | null;
  pagoSolidaridad: number;
  pagoCredito: number;
  createdAt: string;
  updatedAt: string;
  nombreSocio?: string | null;
}

export interface PeriodoDTO {
  id: number;
  nombre: string;
  anio: number;
  mes: number;
  activo: boolean;
}

export async function apiListarAportes(
  params: {
    socioId?: string;
    periodoId?: number;
    estado?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) qs.set(k, String(v));
  });
  return apiPaginated<AporteDTO>(`/api/aportes?${qs.toString()}`);
}

export async function apiObtenerAporte(id: string) {
  return api<AporteDTO>(`/api/aportes/${id}`);
}

export async function apiCrearAporte(data: {
  socioId: string;
  periodoId: number;
  monto: number;
  fechaPago?: string | null;
  estado?: string;
  tipoOperacion?: string;
  metodo?: string | null;
  notas?: string | null;
}) {
  return api<AporteDTO>('/api/aportes', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiActualizarAporte(id: string, data: Record<string, unknown>) {
  return api<AporteDTO>(`/api/aportes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function apiEliminarAporte(id: string) {
  return api<{ mensaje: string }>(`/api/aportes/${id}`, { method: 'DELETE' });
}

export async function apiListarPeriodos() {
  return api<PeriodoDTO[]>('/api/periodos');
}

// ─── Créditos ──────────────────────────────

export interface CreditoDTO {
  id: string;
  socioId: string;
  monto: number;
  tasaMensual: number;
  cuotas: number;
  cuotasPagadas: number;
  saldoCapital: number;
  cuotaMensual: number;
  fechaDesembolso: string;
  estado: string;
  proposito: string | null;
  aprobadoPor: string | null;
  notas: string | null;
  eliminado: boolean;
  createdAt: string;
  updatedAt: string;
  nombreSocio?: string | null;
}

export interface PagoCuotaDTO {
  id: string;
  creditoId: string;
  numeroCuota: number;
  monto: number;
  montoCapital: number;
  montoInteres: number;
  fechaPago: string;
}

export interface CuotaCalculadaDTO {
  numeroCuota: number;
  monto: number;
  montoCapital: number;
  montoInteres: number;
  saldoRestante: number;
}

export interface EstadoCuentaDTO {
  credito: CreditoDTO & { cuotasRestantes: number };
  pagos: PagoCuotaDTO[];
  tablaAmortizacion: CuotaCalculadaDTO[];
  totalPagado: number;
  totalPendiente: number;
}

export async function apiListarCreditos(
  params: { socioId?: string; estado?: string; page?: number; limit?: number } = {},
) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) qs.set(k, String(v));
  });
  return apiPaginated<CreditoDTO>(`/api/creditos?${qs.toString()}`);
}

export async function apiObtenerCredito(id: string) {
  return api<EstadoCuentaDTO>(`/api/creditos/${id}`);
}

export async function apiCrearCredito(data: {
  socioId: string;
  monto: number;
  tasaMensual: number;
  cuotas: number;
  fechaDesembolso?: string;
  proposito?: string | null;
  notas?: string | null;
}) {
  return api<CreditoDTO>('/api/creditos', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiAprobarCredito(creditoId: string) {
  return api<{ mensaje: string }>(`/api/creditos/${creditoId}/aprobar`, { method: 'POST' });
}

export async function apiPagarCuota(creditoId: string, data: { fechaPago?: string } = {}) {
  return api<PagoCuotaDTO>(`/api/creditos/${creditoId}/pagar`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Dashboard ─────────────────────────────

export interface ResumenDashboard {
  socios: { activos: number; enMora: number; total: number };
  ahorros: { totalAcumulado: number };
  creditos: { activos: number; montoPrestado: number; saldoPorCobrar: number; pagados: number };
  aportes: { delMes: number; totalRecibido: number };
  solidaridad: { totalRecibido: number };
  movimientos: { ingresos: number; egresos: number };
  reservas: number;
}

export interface BalanceGeneral {
  activos: {
    ahorros: number;
    creditosPorCobrar: number;
    solidaridad: number;
    reservas: number;
    total: number;
  };
  pasivos: { capitalSocial: number; total: number };
  patrimonio: { resultadosAcumulados: number; total: number };
}

export async function apiGetDashboardResumen() {
  return api<ResumenDashboard>('/api/dashboard/resumen');
}

export async function apiGetDashboardBalance() {
  return api<BalanceGeneral>('/api/dashboard/balance');
}

// ─── Mora ──────────────────────────────────

export interface MoraCalculada {
  socioId: string;
  socioNombre: string;
  aportesVencidos: number;
  totalAdeudado: number;
  diasMora: number;
  interesMora: number;
}

export interface AcuerdoPagoDTO {
  id: string;
  socioId: string;
  montoTotal: number | { _valor: number };
  cuotas: number;
  montoCuota: number | { _valor: number };
  estado: string;
  fechaInicio: string;
  fechaFin: string | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function apiCalcularMora(socioId?: string) {
  const qs = socioId ? `?socioId=${socioId}` : '';
  return api<MoraCalculada[]>(`/api/mora${qs}`);
}

export async function apiListarAcuerdos(page = 1, limit = 10) {
  return api<{
    data: AcuerdoPagoDTO[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/api/acuerdos?page=${page}&limit=${limit}`);
}

export async function apiCrearAcuerdo(data: {
  socioId: string;
  montoTotal: number;
  cuotas: number;
  fechaInicio?: string;
  notas?: string | null;
}) {
  return api<AcuerdoPagoDTO>('/api/acuerdos', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Movimientos ────────────────────────────

export interface MovimientoDTO {
  id: string;
  socioId: string | null;
  socioNombre: string | null;
  tipo: string;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string;
  createdAt: string;
}

export async function apiListarMovimientos(
  params: {
    tipo?: string;
    categoria?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) qs.set(k, String(v));
  });
  return apiPaginated<MovimientoDTO>(`/api/movimientos?${qs.toString()}`);
}

export async function apiCrearMovimiento(data: {
  tipo: 'ingreso' | 'egreso';
  categoria: string;
  descripcion: string;
  monto: number;
  fecha?: string;
}) {
  return api<MovimientoDTO>('/api/movimientos', { method: 'POST', body: JSON.stringify(data) });
}

// ─── Notificaciones ───────────────────────

export interface NotificacionDTO {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  urgente: boolean;
  createdAt: string;
}

export async function apiListarNotificaciones(
  params: { leida?: boolean; tipo?: string; page?: number; limit?: number } = {},
) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) qs.set(k, String(v));
  });
  return apiPaginated<NotificacionDTO>(`/api/notificaciones?${qs.toString()}`);
}

export async function apiCrearNotificacion(data: {
  tipo: string;
  titulo: string;
  mensaje: string;
  urgente?: boolean;
}) {
  return api<NotificacionDTO>('/api/notificaciones', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiMarcarNotificacionLeida(id: string) {
  return api<NotificacionDTO>(`/api/notificaciones/${id}/leer`, { method: 'PATCH' });
}

// ─── Solidaridad ──────────────────────────

export interface SolidaridadMovimientoDTO {
  id: string;
  tipo: string;
  descripcion: string;
  monto: number;
  fecha: string;
  beneficiario: string | null;
  createdAt: string;
}

export async function apiListarSolidaridad(
  params: { tipo?: string; page?: number; limit?: number } = {},
) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) qs.set(k, String(v));
  });
  return apiPaginated<SolidaridadMovimientoDTO>(`/api/solidaridad?${qs.toString()}`);
}

export async function apiCrearMovimientoSolidaridad(data: {
  tipo: 'ingreso' | 'egreso';
  descripcion: string;
  monto: number;
  fecha?: string;
  beneficiario?: string | null;
}) {
  return api<SolidaridadMovimientoDTO>('/api/solidaridad', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Configuración ─────────────────────────

export interface ConfiguracionDTO {
  clave: string;
  valor: string;
  updatedAt: string;
}

export async function apiGetConfiguraciones() {
  return api<ConfiguracionDTO[]>('/api/configuracion');
}

export async function apiUpdateConfiguracion(clave: string, valor: string) {
  return api<ConfiguracionDTO>(`/api/configuracion/${clave}`, {
    method: 'PUT',
    body: JSON.stringify({ valor }),
  });
}

// ─── Reportes ─────────────────────────────

export interface CarteraItem {
  socioId: string;
  socioNombre: string;
  creditoId: string;
  monto: number;
  saldoCapital: number;
  cuotas: number;
  cuotasPagadas: number;
  cuotasRestantes: number;
  cuotaMensual: number;
  tasaMensual: number;
  fechaDesembolso: string;
  estado: string;
  totalPagado: number;
}

export interface FlujoCajaItem {
  fecha: string;
  tipo: string;
  categoria: string;
  descripcion: string;
  monto: number;
}

export interface FlujoCajaResumen {
  ingresos: number;
  egresos: number;
  saldo: number;
  movimientos: FlujoCajaItem[];
}

export interface EstadoCuentaSocioResult {
  socio: {
    id: string;
    nombre: string;
    documento: string;
    email: string | null;
    telefono: string | null;
    fechaIngreso: string;
    estado: string;
    ahorroAcumulado: number;
  };
  creditos: Array<{
    id: string;
    monto: number;
    saldoCapital: number;
    cuotas: number;
    cuotasPagadas: number;
    cuotaMensual: number;
    tasaMensual: number;
    fechaDesembolso: string;
    estado: string;
    proposito: string | null;
    totalPagado: number;
    pagos: Array<{
      numeroCuota: number;
      monto: number;
      montoCapital: number;
      montoInteres: number;
      fechaPago: string;
    }>;
  }>;
  aportes: Array<{
    id: string;
    periodoId: number;
    monto: number;
    fechaPago: string | null;
    estado: string;
    pagoSolidaridad: number;
    pagoCredito: number;
  }>;
  totalAportado: number;
}

export async function apiGetReporteBalance() {
  return api<BalanceGeneral>('/api/reportes/balance-general');
}

export async function apiGetReporteCartera() {
  return api<CarteraItem[]>('/api/reportes/cartera');
}

export async function apiGetReporteFlujoCaja(desde?: string, hasta?: string) {
  const qs = new URLSearchParams();
  if (desde) qs.set('desde', desde);
  if (hasta) qs.set('hasta', hasta);
  return api<FlujoCajaResumen>(`/api/reportes/flujo-caja?${qs.toString()}`);
}

export async function apiGetReporteEstadoCuentaSocio(socioId: string) {
  return api<EstadoCuentaSocioResult>(`/api/reportes/estado-cuenta/${socioId}`);
}

// ─── Períodos ─────────────────────────────

export async function apiGetPeriodoActivo() {
  return api<PeriodoDTO | null>('/api/periodos/activo');
}

export async function apiCrearPeriodo(data: { nombre: string; anio: number; mes: number }) {
  return api<PeriodoDTO>('/api/periodos', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiActivarPeriodo(id: number) {
  return api<{ mensaje: string }>(`/api/periodos/${id}/activar`, { method: 'POST' });
}
