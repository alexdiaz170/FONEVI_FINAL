import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Users,
  UserCheck,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { apiListarSocios, apiEliminarSocio, type SocioDTO } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import { downloadExport } from '../../lib/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  AnimatedButton,
  AnimatedTableRow,
  AnimatedFadeIn,
} from '../../components/ui';

const kpiConfig = [
  {
    label: 'Total Socios',
    key: 'total' as const,
    sub: 'Socios registrados',
    icon: Users,
    gradient: 'from-blue-600 to-blue-500',
    shadow: 'shadow-blue-500/25',
  },
  {
    label: 'Socios Activos',
    key: 'activos' as const,
    sub: 'Al día con aportes',
    icon: UserCheck,
    gradient: 'from-green-600 to-emerald-500',
    shadow: 'shadow-green-500/25',
  },
  {
    label: 'En Mora',
    key: 'enMora' as const,
    sub: 'Con obligaciones vencidas',
    icon: AlertTriangle,
    gradient: 'from-red-600 to-red-500',
    shadow: 'shadow-red-500/25',
  },
  {
    label: 'Pendientes',
    key: 'pendientes' as const,
    sub: 'Sin aportes registrados',
    icon: Clock,
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-amber-500/25',
  },
];

export default function SociosLista() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['socios', page, search],
    queryFn: () => apiListarSocios(page, 10, false, search || undefined),
  });

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await apiEliminarSocio(id);
      refetch();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Error al eliminar');
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };

  const sociosList = data?.data ?? [];

  const total = data?.total ?? 0;
  const activos = sociosList.filter((s) => s.estado === 'activo').length;
  const enMora = sociosList.filter((s) => s.estado === 'mora').length;
  const pendientes = sociosList.filter((s) => s.estado !== 'activo' && s.estado !== 'mora').length;

  const kpiValues = { total, activos, enMora, pendientes };

  return (
    <div>
      <AnimatedStaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiConfig.map((k) => (
          <AnimatedStaggerItem key={k.label}>
            <div
              className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${k.gradient} p-4 text-white shadow-lg ${k.shadow}`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/3" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    {k.label}
                  </span>
                  <k.icon size={18} className="opacity-50" />
                </div>
                <div className="text-2xl font-bold">{kpiValues[k.key]}</div>
                <div className="text-xs mt-1 opacity-70">{k.sub}</div>
              </div>
            </div>
          </AnimatedStaggerItem>
        ))}
      </AnimatedStaggerContainer>

      <AnimatedFadeIn>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
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
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 transition-all"
              />
            </div>
            {sociosList.length > 0 && (
              <div className="flex items-center gap-2">
                <AnimatedButton
                  onClick={() => downloadExport('socios', 'xlsx')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100"
                >
                  <FileSpreadsheet size={14} /> Excel
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => downloadExport('socios', 'pdf')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100"
                >
                  <FileText size={14} /> PDF
                </AnimatedButton>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="p-12 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-navy-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Cargando socios...
            </div>
          )}
          {error && (
            <div className="p-8 text-center text-red-500">Error: {(error as ApiError).message}</div>
          )}

          {sociosList && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                      <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Código
                      </th>
                      <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Documento
                      </th>
                      <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Ahorro Acumulado
                      </th>
                      <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Ingreso
                      </th>
                      <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sociosList.map((socio: SocioDTO, idx: number) => (
                      <AnimatedTableRow key={socio.id} index={idx}>
                        <td className="p-3.5 font-mono text-xs text-gray-500">
                          {socio.codigoSocio ?? socio.codigo}
                        </td>
                        <td className="p-3.5 font-medium text-gray-900">{socio.nombre}</td>
                        <td className="p-3.5 text-gray-600">{socio.numeroDocumento}</td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              socio.estado === 'activo'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : socio.estado === 'mora'
                                  ? 'bg-red-50 text-red-700 border border-red-200'
                                  : 'bg-gray-50 text-gray-600 border border-gray-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                socio.estado === 'activo'
                                  ? 'bg-emerald-500'
                                  : socio.estado === 'mora'
                                    ? 'bg-red-500'
                                    : 'bg-gray-400'
                              }`}
                            />
                            {socio.estado}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono text-sm font-semibold text-navy-700">
                          {formatCurrency(socio.ahorroAcumulado)}
                        </td>
                        <td className="p-3.5 text-right text-gray-500 text-xs">
                          {formatDate(socio.fechaIngreso)}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              to={`/socios/${socio.id}`}
                              className="p-2 text-navy-500 hover:bg-navy-50 rounded-lg transition-colors"
                            >
                              <Eye size={15} />
                            </Link>
                            <button
                              onClick={() => setConfirmDelete(socio.id)}
                              disabled={deleting === socio.id}
                              className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </AnimatedTableRow>
                    ))}
                    {sociosList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-gray-400">
                          <div className="text-3xl mb-2 opacity-30">👥</div>
                          No se encontraron socios
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
                    {data.total} socios
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
        title="Eliminar Socio"
        message="¿Está seguro de eliminar este socio? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={() => handleDelete(confirmDelete!)}
        onCancel={() => setConfirmDelete(null)}
        loading={!!deleting}
      />
    </div>
  );
}
