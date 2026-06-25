import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { apiListarMovimientos, ApiError, downloadExport, type MovimientoDTO } from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { AnimatedFadeIn, AnimatedTableRow, AnimatedButton } from '../../components/ui';

export default function MovimientosLista() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['movimientos', page, search, tipoFilter, categoriaFilter, desde, hasta],
    queryFn: () =>
      apiListarMovimientos({
        page,
        limit: 15,
        tipo: tipoFilter || undefined,
        categoria: categoriaFilter || undefined,
        q: search || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
      }),
  });

  const movimientosList = data?.data ?? [];
  const categorias = [...new Set(data?.data?.map((m) => m.categoria) ?? [])];

  return (
    <AnimatedFadeIn>
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar por socio, descripción o categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all"
              />
            </div>
            {movimientosList.length > 0 && (
              <div className="flex gap-2 shrink-0">
                <AnimatedButton
                  onClick={() => downloadExport('movimientos', 'xlsx')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
                >
                  <FileSpreadsheet size={14} /> Excel
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => downloadExport('movimientos', 'pdf')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                >
                  <FileText size={14} /> PDF
                </AnimatedButton>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <Filter size={16} className="text-gray-400" />
            <select
              value={tipoFilter}
              onChange={(e) => {
                setTipoFilter(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              <option value="">Todos los tipos</option>
              <option value="ingreso">Ingresos</option>
              <option value="egreso">Egresos</option>
            </select>
            <select
              value={categoriaFilter}
              onChange={(e) => {
                setCategoriaFilter(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="h-5 w-px bg-gray-200" />
            <input
              type="date"
              value={desde}
              onChange={(e) => {
                setDesde(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500/30"
              title="Desde"
            />
            <span className="text-gray-400 text-xs">a</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => {
                setHasta(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500/30"
              title="Hasta"
            />
          </div>
        </div>

        {isLoading && (
          <div className="p-12 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando...
          </div>
        )}
        {error && (
          <div className="p-8 text-center text-red-500">Error: {(error as ApiError).message}</div>
        )}

        {movimientosList.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Socio
                    </th>
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosList.map((mov: MovimientoDTO, idx: number) => (
                    <AnimatedTableRow key={mov.id} index={idx}>
                      <td className="p-3.5 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(mov.fecha)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium ${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {mov.tipo === 'ingreso' ? (
                            <ArrowUpCircle size={14} />
                          ) : (
                            <ArrowDownCircle size={14} />
                          )}
                          {mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          {mov.categoria}
                        </span>
                      </td>
                      <td className="p-3.5 text-navy-800 font-medium">{mov.socioNombre ?? '—'}</td>
                      <td className="p-3.5 text-gray-600 max-w-[250px]">{mov.descripcion}</td>
                      <td
                        className={`p-3.5 text-right font-mono font-semibold whitespace-nowrap ${mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {mov.tipo === 'ingreso' ? '+' : '-'}
                        {formatCurrency(mov.monto)}
                      </td>
                    </AnimatedTableRow>
                  ))}
                </tbody>
              </table>
            </div>
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  Página {data.page} de {data.totalPages} ({data.total} movimientos)
                </span>
                <div className="flex gap-1">
                  <AnimatedButton
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} className="text-gray-600" />
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page >= data.totalPages}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight size={16} className="text-gray-600" />
                  </AnimatedButton>
                </div>
              </div>
            )}
          </>
        )}
        {movimientosList.length === 0 && !isLoading && !error && (
          <div className="p-8 text-center text-gray-400">No se encontraron movimientos</div>
        )}
      </div>
    </AnimatedFadeIn>
  );
}
