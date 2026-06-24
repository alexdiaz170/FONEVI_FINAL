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

export async function apiCambiarPassword(currentPassword: string, newPassword: string) {
  return api<{ message: string }>('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
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

export async function apiListarSocios(
  page = 1,
  limit = 10,
  includeDeleted = false,
  buscar?: string,
) {
  let url = `/api/socios?page=${page}&limit=${limit}&includeDeleted=${includeDeleted}`;
  if (buscar) url += `&buscar=${encodeURIComponent(buscar)}`;
  return apiPaginated<SocioDTO>(url);
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

export interface AporteDetalleDTO {
  id: string;
  solidaridad: number;
  interes: number;
  seguro: number;
  capital: number;
  ahorro: number;
}

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
  detalle: AporteDetalleDTO | null;
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
    q?: string;
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

export interface ResumenCreditos {
  totalMontoPrestado: number;
  totalSociosConCredito: number;
  saldoPorCobrar: number;
  creditosActivos: number;
  creditosPagados: number;
  creditosPendientes: number;
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
  seguro: number;
  saldoRestante: number;
}

export interface EstadoCuentaDTO {
  credito: CreditoDTO & { cuotasRestantes: number };
  pagos: PagoCuotaDTO[];
  tablaAmortizacion: CuotaCalculadaDTO[];
  totalPagado: number;
  totalPendiente: number;
}

export interface CrearCreditoDTO {
  socioId: string;
  monto: number;
  tasaInteresMensual: number;
  numeroCuotas: number;
  fechaDesembolso: string;
  proposito: string;
  notas: string;
}

export interface AmortizacionDTO {
  id: string;
  numeroCuota: number;
  fechaVencimiento: string;
  saldoInicial: number;
  interes: number;
  cuota: number;
  amortizacion: number;
  saldoFinal: number;
  estado: string;
}

export interface PagoCreditoDTO {
  id: string;
  fecha: string;
  monto: number;
  metodoPago: string;
  referencia: string;
  notas: string;
}

export async function apiGetCredito(id: string) {
  const res = await fetchApi(`/api/creditos/${id}`, { method: 'GET' });
  const json = await res.json();
  return json.data.credito as CreditoDTO & {
    tasaInteresMensual?: number;
    nombreSocio: string;
    cuotasRestantes: number;
  };
}

export async function apiGetAmortizacion(id: string) {
  const res = await fetchApi(`/api/creditos/${id}/amortizacion`, { method: 'GET' });
  const json = await res.json();
  return { data: json.data as AmortizacionDTO[] };
}

export async function apiGetPagosCredito(id: string) {
  const res = await fetchApi(`/api/creditos/${id}/pagos`, { method: 'GET' });
  const json = await res.json();
  return json.data as PagoCreditoDTO[];
}

export async function apiCalcularCapacidad(socioId: string) {
  return api<{ capacidadMaxima: number }>(`/api/creditos/capacidad/${socioId}`);
}

export async function apiResumenCreditos() {
  return api<ResumenCreditos>('/api/creditos/resumen');
}

export async function apiListarCreditos(
  params: {
    socioId?: string;
    estado?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    page?: number;
    limit?: number;
  } = {},
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

export interface AmortizacionPreviewDTO {
  cuotaFija: number;
  totalIntereses: number;
  totalSeguro: number;
  totalPagar: number;
  tabla: Array<{
    numero: number;
    cuota: number;
    capital: number;
    interes: number;
    seguro: number;
    saldo: number;
  }>;
}

export async function apiCalcularCredito(monto: number, tasaMensual: number, cuotas: number) {
  const qs = new URLSearchParams({
    monto: String(monto),
    tasaMensual: String(tasaMensual),
    cuotas: String(cuotas),
  });
  return api<AmortizacionPreviewDTO>(`/api/creditos/calcular?${qs.toString()}`);
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

export async function apiRechazarCredito(creditoId: string) {
  return api<{ mensaje: string }>(`/api/creditos/${creditoId}/rechazar`, { method: 'POST' });
}

export async function apiPagarCuota(creditoId: string, data: { fechaPago?: string } = {}) {
  return api<PagoCuotaDTO>(`/api/creditos/${creditoId}/pagar`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiEliminarPagoCuota(creditoId: string, pagoId: string) {
  return api(`/api/creditos/${creditoId}/pagos/${pagoId}`, { method: 'DELETE' });
}

// ─── Dashboard ─────────────────────────────

export interface ResumenDashboard {
  socios: { activos: number; enMora: number; total: number };
  ahorros: { totalAcumulado: number };
  creditos: { activos: number; montoPrestado: number; saldoPorCobrar: number; pagados: number };
  aportes: { delMes: number; totalRecibido: number };
  solidaridad: { totalRecibido: number };
  movimientos: { ingresos: number; egresos: number };
}

export interface BalanceGeneral {
  activos: {
    ahorros: number;
    creditosPorCobrar: number;
    solidaridad: number;
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

// ─── Mi Dashboard (Socio) ─────────────────
export interface MiDashboardSocio {
  id: string;
  codigo: string;
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email: string | null;
  telefono: string | null;
  ahorroAcumulado: number;
  estado: string;
}

export interface MiDashboardCredito {
  id: string;
  monto: number;
  saldoCapital: number;
  cuotas: number;
  cuotasPagadas: number;
  cuotasRestantes: number;
  cuotaMensual: number;
  estado: string;
}

export interface MiDashboardAporte {
  id: string;
  periodoId: number;
  monto: number;
  estado: string;
  createdAt: string;
}

export interface MiDashboardResult {
  socio: MiDashboardSocio;
  creditos: MiDashboardCredito[];
  ultimosAportes: MiDashboardAporte[];
  config: {
    tasaInteresMensual: number;
    multiplicadorMaximoCredito: number;
    porcentajeSeguro: number;
  };
}

export async function apiMiDashboard() {
  return api<MiDashboardResult>('/auth/mi-dashboard');
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
  }>(`/api/mora/acuerdos?page=${page}&limit=${limit}`);
}

export async function apiCrearAcuerdo(data: {
  socioId: string;
  montoTotal: number;
  cuotas: number;
  fechaInicio?: string;
  notas?: string | null;
}) {
  return api<AcuerdoPagoDTO>('/api/mora/acuerdos', { method: 'POST', body: JSON.stringify(data) });
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
    q?: string;
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
  referenciaId: string | null;
  referenciaTipo: string | null;
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
  referenciaId?: string;
  referenciaTipo?: string;
}) {
  return api<NotificacionDTO>('/api/notificaciones', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiMarcarNotificacionLeida(id: string) {
  return api<NotificacionDTO>(`/api/notificaciones/${id}/leer`, { method: 'PATCH' });
}

export async function apiEliminarNotificacion(id: string) {
  return api<{ mensaje: string }>(`/api/notificaciones/${id}`, { method: 'DELETE' });
}

// ─── Auditoría ───────────────────────────

export interface AuditoriaDTO {
  id: string;
  usuarioId: string | null;
  usuarioNombre: string | null;
  accion: string;
  tabla: string | null;
  registroId: string | null;
  detalle: string | null;
  ip: string | null;
  createdAt: string;
}

export async function apiListarAuditoria(
  params: { usuarioId?: string; tabla?: string; page?: number; limit?: number } = {},
) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) qs.set(k, String(v));
  });
  return apiPaginated<AuditoriaDTO>(`/api/auditoria?${qs.toString()}`);
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
  params: { tipo?: string; desde?: string; hasta?: string; page?: number; limit?: number } = {},
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
  socioId?: string;
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

// ─── Usuarios (admin) ──────────────────────

export interface UsuarioDTO {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  estado: string;
  createdAt: string;
}

export async function apiListarUsuarios() {
  return api<UsuarioDTO[]>('/api/usuarios');
}

export async function apiCrearUsuario(data: {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}) {
  return api<UsuarioDTO>('/api/usuarios', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiActualizarUsuario(
  id: string,
  data: { nombre?: string; email?: string; password?: string; rol?: string; estado?: string },
) {
  return api<UsuarioDTO>(`/api/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function apiEliminarUsuario(id: string) {
  return api<{ mensaje: string }>(`/api/usuarios/${id}`, { method: 'DELETE' });
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
    periodoNombre: string;
    monto: number;
    fechaPago: string | null;
    estado: string;
    tipoOperacion: string;
    pagoSolidaridad: number;
    pagoCredito: number;
    ahorro: number;
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

export async function apiEliminarPeriodo(id: number) {
  return api<{ mensaje: string }>(`/api/periodos/${id}`, { method: 'DELETE' });
}

// ─── Cierre de Período ─────────────────────

export interface ValidacionCierre {
  valido: boolean;
  periodo: { id: number; nombre: string; anio: number; mes: number } | null;
  errores: string[];
  advertencias: string[];
}

export interface SimulacionCierre {
  periodo: { id: number; nombre: string; anio: number; mes: number };
  totalSociosActivos: number;
  totalAportes: number;
  totalRecaudado: number;
  totalSolidaridad: number;
  totalAhorro: number;
  totalAplicadoCreditos: number;
  sociosEnMora: number;
  sociosAlDia: number;
  creditosActivos: number;
  saldoPorCobrar: number;
}

export interface ResultadoCierre {
  exitoso: boolean;
  periodo: { id: number; nombre: string; anio: number; mes: number };
  totalRecaudado: number;
  totalSolidaridad: number;
  totalAhorro: number;
  totalAplicadoCreditos: number;
  movimientosCreados: number;
  mensaje: string;
}

export async function apiValidarCierre() {
  return api<ValidacionCierre>('/api/cierre-periodo/validar', { method: 'POST' });
}

export async function apiSimularCierre() {
  return api<SimulacionCierre>('/api/cierre-periodo/simular', { method: 'POST' });
}

export async function apiEjecutarCierre() {
  return api<ResultadoCierre>('/api/cierre-periodo/ejecutar', { method: 'POST' });
}

// ─── Dividendos ─────────────────────────────

export interface DividendoDTO {
  id: string;
  periodo: string;
  montoTotal: number;
  distribuido: boolean;
  fechaCalculo: string;
  fechaPago: string | null;
  createdAt: string;
}

export interface DividendoSocioDTO {
  id: string;
  socioId: string;
  socioNombre: string;
  monto: number;
  pagado: boolean;
  fechaPago: string | null;
  createdAt: string;
}

export interface DividendoDetalleDTO extends DividendoDTO {
  socios: DividendoSocioDTO[];
}

export async function apiListarDividendos(page = 1, limit = 10) {
  return apiPaginated<DividendoDTO>(`/api/dividendos?page=${page}&limit=${limit}`);
}

export async function apiGetDividendo(id: string) {
  return api<DividendoDetalleDTO>(`/api/dividendos/${id}`);
}

export async function apiCrearDividendo(data: { periodo: string; montoTotal: number }) {
  return api<DividendoDTO>('/api/dividendos', { method: 'POST', body: JSON.stringify(data) });
}

export async function apiDistribuirDividendo(id: string, socioIds: string[]) {
  return api<{ id: string; socioId: string; monto: number }[]>(`/api/dividendos/${id}/distribuir`, {
    method: 'POST',
    body: JSON.stringify({ socioIds }),
  });
}

// ─── WhatsApp ─────────────────────────────

export interface WhatsAppEstado {
  configurado: boolean;
  apiUrl: string | null;
  estado: string;
}

export interface WhatsAppEnviarResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WaLogEntry {
  id: string;
  numero: string;
  template: string;
  estado: string;
  messageId: string | null;
  enviadoEn: string;
  createdAt: string;
}

export async function apiGenerarBackup(): Promise<void> {
  const token = useAuthStore.getState().token;
  const res = await fetch('/api/backup/generar', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.mensaje ?? 'Error al generar respaldo');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ??
    `fonevi-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function apiWhatsAppEstado() {
  return api<WhatsAppEstado>('/api/whatsapp/estado');
}

export async function apiWhatsAppEnviar(data: {
  numero: string;
  template: string;
  variables?: Record<string, string>;
}) {
  return api<WhatsAppEnviarResult>('/api/whatsapp/enviar', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiWhatsAppLogs(
  params: { estado?: string; numero?: string; page?: number; limit?: number } = {},
) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) qs.set(k, String(v));
  });
  return apiPaginated<WaLogEntry>(`/api/whatsapp/logs?${qs.toString()}`);
}
