import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  FileText,
  Wallet,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  apiListarAportes,
  apiEliminarAporte,
  apiListarPeriodos,
  type AporteDTO,
  type PeriodoDTO,
} from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ApiError, downloadExport } from '../../lib/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuthStore } from '../../stores/authStore';
import {
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  AnimatedButton,
  AnimatedTableRow,
  AnimatedFadeIn,
} from '../../components/ui';

const ESTADOS = ['', 'pendiente', 'pagado', 'mora', 'vencido', 'anulado'];

const estadoColor: Record<string, string> = {
  pagado: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  pendiente: 'bg-amber-50 text-amber-700 border border-amber-200',
  mora: 'bg-red-50 text-red-700 border border-red-200',
  vencido: 'bg-orange-50 text-orange-700 border border-orange-200',
  anulado: 'bg-gray-50 text-gray-600 border border-gray-200',
};

const estadoDot: Record<string, string> = {
  pagado: 'bg-emerald-500',
  pendiente: 'bg-amber-500',
  mora: 'bg-red-500',
  vencido: 'bg-orange-500',
  anulado: 'bg-gray-400',
};

const handleExportExcel = () => downloadExport('aportes', 'xlsx');
const handleExportPDF = () => downloadExport('aportes', 'pdf');

export default function AportesLista() {
  const usuario = useAuthStore((s) => s.usuario);
  const esSocio = usuario?.rol === 'socio';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['aportes', page, search, estadoFilter, periodoFilter],
    queryFn: () =>
      apiListarAportes({
        page,
        limit: 10,
        estado: estadoFilter || undefined,
        periodoId: periodoFilter ? Number(periodoFilter) : undefined,
        q: search || undefined,
      }),
  });

  const { data: periodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => apiListarPeriodos(),
  });

  const handleDelete = async (id: string) => {
    try {
      await apiEliminarAporte(id);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Error al eliminar');
    } finally {
      setConfirmDelete(null);
    }
  };

  const periodoMap = new Map(periodos?.map((p) => [p.id, p.nombre]) ?? []);

  const aportesList = data?.data ?? [];
  const pagados = aportesList.filter((a) => a.estado === 'pagado').length;
  const pendientes = aportesList.filter((a) => a.estado === 'pendiente').length;
  const enMora = aportesList.filter((a) => a.estado === 'mora' || a.estado === 'vencido').length;

  return (
    <div>
      <AnimatedStaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: 'Total Aportes',
            value: data?.total ?? 0,
            sub: 'Registrados',
            icon: Wallet,
            gradient: 'from-blue-600 to-blue-500',
          },
          {
            label: 'Pagados',
            value: pagados,
            sub: 'Completados',
            icon: CheckCircle,
            gradient: 'from-emerald-600 to-green-500',
          },
          {
            label: 'Pendientes / Mora',
            value: pendientes + enMora,
            sub: `${pendientes} pendientes · ${enMora} en mora`,
            icon: AlertTriangle,
            gradient: 'from-amber-500 to-orange-500',
          },
        ].map((k) => (
          <AnimatedStaggerItem key={k.label}>
            <div
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${k.gradient} p-4 text-white shadow-lg`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-12 h-12 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/3" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    {k.label}
                  </span>
                  <k.icon size={18} className="opacity-50" />
                </div>
                <div className="text-2xl font-bold">{k.value}</div>
                <div className="text-xs mt-1 opacity-70">{k.sub}</div>
              </div>
            </div>
          </AnimatedStaggerItem>
        ))}
      </AnimatedStaggerContainer>

      <AnimatedFadeIn>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Buscar por nombre o documento..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  aria-label="Buscar aportes"
                />
              </div>
              {aportesList.length > 0 && (
                <div className="flex items-center gap-2">
                  <AnimatedButton
                    onClick={handleExportExcel}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100"
                  >
                    <FileSpreadsheet size={14} /> Excel
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100"
                  >
                    <FileText size={14} /> PDF
                  </AnimatedButton>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Filter size={16} className="text-gray-400 shrink-0" />
              <select
                value={estadoFilter}
                onChange={(e) => {
                  setEstadoFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              >
                <option value="">Todos los estados</option>
                {ESTADOS.filter(Boolean).map((e) => (
                  <option key={e} value={e}>
                    {e.charAt(0).toUpperCase() + e.slice(1)}
                  </option>
                ))}
              </select>
              <select
                value={periodoFilter}
                onChange={(e) => {
                  setPeriodoFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              >
                <option value="">Todos los periodos</option>
                {periodos?.map((p: PeriodoDTO) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading && (
            <div className="p-12 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Cargando aportes...
            </div>
          )}
          {error && (
            <div className="p-8 text-center text-red-500">Error: {(error as ApiError).message}</div>
          )}

          {aportesList && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                      <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Socio
                      </th>
                      <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Periodo
                      </th>
                      <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Fecha Pago
                      </th>
                      <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Solidaridad
                      </th>
                      {!esSocio && (
                        <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {aportesList.map((aporte: AporteDTO, idx: number) => (
                      <AnimatedTableRow key={aporte.id} index={idx}>
                        <td className="p-3.5 font-medium text-gray-900">
                          {aporte.nombreSocio ?? aporte.socioId.slice(0, 8)}
                        </td>
                        <td className="p-3.5 text-gray-600">
                          {periodoMap.get(aporte.periodoId) ?? aporte.periodoId}
                        </td>
                        <td className="p-3.5 text-right font-mono text-sm font-semibold text-navy-700">
                          {formatCurrency(aporte.monto)}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColor[aporte.estado] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${estadoDot[aporte.estado] ?? 'bg-gray-400'}`}
                            />
                            {aporte.estado}
                          </span>
                        </td>
                        <td className="p-3.5 text-gray-500 text-xs">
                          {aporte.fechaPago ? formatDate(aporte.fechaPago) : '—'}
                        </td>
                        <td className="p-3.5 text-right font-mono text-sm text-amber-600">
                          {formatCurrency(aporte.pagoSolidaridad)}
                        </td>
                        {!esSocio && (
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Link
                                to={`/aportes/${aporte.id}`}
                                className="p-2 text-navy-500 hover:bg-navy-50 rounded-lg transition-colors"
                              >
                                <Eye size={15} />
                              </Link>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete(aporte.id)}
                                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        )}
                      </AnimatedTableRow>
                    ))}
                    {aportesList.length === 0 && (
                      <tr>
                        <td colSpan={esSocio ? 6 : 7} className="p-12 text-center text-gray-400">
                          No se encontraron aportes
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">
                    Página {data.page} de {data.totalPages}
                    <span className="text-gray-300 mx-1">·</span>
                    {data.total} aportes
                  </span>
                  <div className="flex gap-1">
                    <AnimatedButton
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      <ChevronLeft size={16} className="text-gray-600" />
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      disabled={page >= data.totalPages}
                      className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
                    >
                      <ChevronRight size={16} className="text-gray-600" />
                    </AnimatedButton>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AnimatedFadeIn>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar Aporte"
        message="¿Está seguro de eliminar este aporte? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => handleDelete(confirmDelete!)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
