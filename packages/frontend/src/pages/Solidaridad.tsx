import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HandHeart, Search, Filter, FileSpreadsheet, FileText, Plus, X } from 'lucide-react';
import {
  apiListarSolidaridad,
  apiCrearMovimientoSolidaridad,
  apiListarSocios,
  ApiError,
} from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { downloadExport } from '../lib/api';
import {
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  AnimatedFadeIn,
  AnimatedTableRow,
  AnimatedButton,
} from '../components/ui';

const TIPOS_AYUDA = [
  'Apoyo educativo',
  'Asesoría jurídica',
  'Auxilio funerario',
  'Calamidad doméstica',
] as const;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function SolidaridadPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'ingreso' | 'egreso'>('todos');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['solidaridad', page, tipoFilter, desde, hasta],
    queryFn: () =>
      apiListarSolidaridad({
        page,
        limit: 20,
        tipo: tipoFilter === 'todos' ? undefined : tipoFilter,
        desde: desde || undefined,
        hasta: hasta || undefined,
      }),
  });

  const { data: allData } = useQuery({
    queryKey: ['solidaridad-all'],
    queryFn: () => apiListarSolidaridad({ page: 1, limit: 99999 }),
  });

  const totalIngresos =
    allData?.data.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0) ?? 0;
  const totalEgresos =
    allData?.data.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0) ?? 0;
  const saldoActual = totalIngresos - totalEgresos;

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-600 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/25">
            <HandHeart size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-800">Fondo de Solidaridad</h1>
            <p className="text-sm text-gray-500">Gestión del fondo mutual</p>
          </div>
        </div>
      </div>

      <AnimatedStaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <AnimatedStaggerItem>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Total Ingresos
              </span>
              <div className="text-2xl font-bold mt-1">{formatCurrency(totalIngresos)}</div>
            </div>
          </div>
        </AnimatedStaggerItem>
        <AnimatedStaggerItem>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-rose-600 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Total Egresos
              </span>
              <div className="text-2xl font-bold mt-1">{formatCurrency(totalEgresos)}</div>
            </div>
          </div>
        </AnimatedStaggerItem>
        <AnimatedStaggerItem>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-600 to-rose-500 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Saldo Actual
              </span>
              <div className="text-2xl font-bold mt-1">{formatCurrency(saldoActual)}</div>
            </div>
          </div>
        </AnimatedStaggerItem>
      </AnimatedStaggerContainer>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {(['todos', 'ingreso', 'egreso'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTipoFilter(t);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tipoFilter === t
                    ? 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-pink-300'
                }`}
              >
                {t === 'todos' ? 'Todos' : t === 'ingreso' ? 'Ingresos' : 'Egresos'}
              </button>
            ))}
          </div>
          <div className="h-5 w-px bg-gray-200" />
          <input
            type="date"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              setPage(1);
            }}
            className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-pink-500/30"
            title="Desde"
          />
          <span className="text-gray-400 text-sm">a</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value);
              setPage(1);
            }}
            className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-pink-500/30"
            title="Hasta"
          />
          <div className="ml-auto flex gap-2">
            {data && data.data.length > 0 && (
              <>
                <AnimatedButton
                  onClick={() => downloadExport('solidaridad', 'xlsx')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
                >
                  <FileSpreadsheet size={14} /> Excel
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => downloadExport('solidaridad', 'pdf')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                >
                  <FileText size={14} /> PDF
                </AnimatedButton>
              </>
            )}
            <AnimatedButton
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-pink-500/25 hover:from-pink-700 hover:to-rose-600 transition-all"
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? 'Cancelar' : 'Nuevo Movimiento'}
            </AnimatedButton>
          </div>
        </div>
      </div>

      {showForm && (
        <SolidaridadForm
          onSuccess={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      <AnimatedFadeIn>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Cargando...
            </div>
          ) : (
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
                      Descripción
                    </th>
                    <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Beneficiario
                    </th>
                    <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.data ?? []).map((m, idx) => (
                    <AnimatedTableRow key={m.id} index={idx}>
                      <td className="p-3.5 text-gray-600 text-xs">{formatDate(m.fecha)}</td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            m.tipo === 'ingreso'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-700">{m.descripcion}</td>
                      <td className="p-3.5 text-gray-600">{m.beneficiario ?? '—'}</td>
                      <td
                        className={`p-3.5 text-right font-mono font-semibold ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {formatCurrency(m.monto)}
                      </td>
                    </AnimatedTableRow>
                  ))}
                  {(data?.data ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-8">
                        No hay movimientos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Página {data.page} de {data.totalPages}
              </span>
              <div className="flex gap-1">
                <AnimatedButton
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  ←
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40"
                >
                  →
                </AnimatedButton>
              </div>
            </div>
          )}
        </div>
      </AnimatedFadeIn>
    </div>
  );
}

function SolidaridadForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    tipo: 'ingreso' as 'ingreso' | 'egreso',
    descripcion: '',
    monto: '',
    fecha: todayStr(),
    beneficiario: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: sociosData } = useQuery({
    queryKey: ['socios-select', 1],
    queryFn: () => apiListarSocios(1, 100),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const montoNum = Number(form.monto);
    if (!form.monto || montoNum <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    if (!form.descripcion) {
      setError('La descripción es requerida');
      return;
    }
    setLoading(true);
    try {
      const socio = form.beneficiario
        ? sociosData?.data.find((s) => s.id === form.beneficiario)
        : undefined;
      await apiCrearMovimientoSolidaridad({
        tipo: form.tipo,
        descripcion: form.descripcion,
        monto: montoNum,
        fecha: form.fecha || undefined,
        beneficiario: socio?.nombre ?? (form.beneficiario || null),
        socioId: socio?.id,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear movimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3"
    >
      <div>
        <label className="block text-xs font-medium text-navy-700 mb-1">Tipo</label>
        <select
          value={form.tipo}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              tipo: e.target.value as 'ingreso' | 'egreso',
              beneficiario: '',
            }))
          }
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
        >
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-navy-700 mb-1">Monto *</label>
        <input
          type="text"
          inputMode="numeric"
          value={form.monto}
          onChange={(e) => setForm((p) => ({ ...p, monto: e.target.value.replace(/\D/g, '') }))}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
          placeholder="0"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-navy-700 mb-1">Descripción *</label>
        <select
          value={form.descripcion}
          onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
        >
          <option value="">Seleccione tipo de ayuda...</option>
          {TIPOS_AYUDA.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-navy-700 mb-1">Fecha</label>
        <input
          type="date"
          value={form.fecha}
          onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-navy-700 mb-1">Beneficiario *</label>
        <select
          value={form.beneficiario}
          onChange={(e) => setForm((p) => ({ ...p, beneficiario: e.target.value }))}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500"
        >
          <option value="">Seleccione un socio...</option>
          {sociosData?.data.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <div className="md:col-span-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      <div className="md:col-span-2 flex gap-2 pt-1">
        <AnimatedButton
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-pink-500/25 hover:from-pink-700 hover:to-rose-600 disabled:opacity-50 transition-all"
        >
          {loading ? 'Guardando...' : 'Guardar Movimiento'}
        </AnimatedButton>
      </div>
    </form>
  );
}
