import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  apiListarSolidaridad,
  apiCrearMovimientoSolidaridad,
  apiListarSocios,
  ApiError,
} from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

const TIPOS_AYUDA = [
  'Apoyo educativo',
  'Asesoría jurídica',
  'Auxilio funerario',
  'Calamidad doméstica',
] as const;

export default function SolidaridadPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'ingreso' | 'egreso'>('todos');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['solidaridad', page, tipoFilter],
    queryFn: () =>
      apiListarSolidaridad({
        page,
        limit: 20,
        tipo: tipoFilter === 'todos' ? undefined : tipoFilter,
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
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Fondo de Solidaridad</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Ingresos</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalIngresos)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Egresos</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalEgresos)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Saldo Actual</p>
          <p
            className={`text-2xl font-bold mt-1 ${saldoActual >= 0 ? 'text-navy-700' : 'text-red-600'}`}
          >
            {formatCurrency(saldoActual)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(['todos', 'ingreso', 'egreso'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTipoFilter(t);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tipoFilter === t
                  ? 'bg-navy-700 text-white'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {t === 'todos' ? 'Todos' : t === 'ingreso' ? 'Ingresos' : 'Egresos'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800"
        >
          {showForm ? 'Cancelar' : 'Nuevo Movimiento'}
        </button>
      </div>

      {showForm && (
        <SolidaridadForm
          onSuccess={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      {isLoading ? (
        <div className="text-gray-400 text-center py-8">Cargando...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Descripción</th>
                <th className="text-left px-4 py-3">Beneficiario</th>
                <th className="text-right px-4 py-3">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.data ?? []).map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(m.fecha)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        m.tipo === 'ingreso'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{m.descripcion}</td>
                  <td className="px-4 py-3">{m.beneficiario ?? '—'}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(m.monto)}
                  </td>
                </tr>
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

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <span className="text-xs text-gray-500">
                Página {data.page} de {data.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

    let beneficiario = form.beneficiario;
    if (beneficiario) {
      const socio = sociosData?.data.find((s) => s.id === beneficiario);
      beneficiario = socio?.nombre ?? beneficiario;
    }

    setLoading(true);
    try {
      await apiCrearMovimientoSolidaridad({
        tipo: form.tipo,
        descripcion: form.descripcion,
        monto: montoNum,
        fecha: form.fecha || undefined,
        beneficiario: beneficiario || null,
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
      className="bg-white rounded-lg shadow p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3"
    >
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
        <select
          value={form.tipo}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              tipo: e.target.value as 'ingreso' | 'egreso',
              beneficiario: '',
            }))
          }
          className="w-full px-3 py-2 border rounded-md text-sm"
        >
          <option value="ingreso">Ingreso</option>
          <option value="egreso">Egreso</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Monto *</label>
        <input
          type="text"
          inputMode="numeric"
          value={form.monto}
          onChange={(e) => setForm((p) => ({ ...p, monto: e.target.value.replace(/\D/g, '') }))}
          className="w-full px-3 py-2 border rounded-md text-sm"
          placeholder="0"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">Descripción *</label>
        <select
          value={form.descripcion}
          onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
          className="w-full px-3 py-2 border rounded-md text-sm"
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
        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha</label>
        <input
          type="date"
          value={form.fecha}
          onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Beneficiario *</label>
        <select
          value={form.beneficiario}
          onChange={(e) => setForm((p) => ({ ...p, beneficiario: e.target.value }))}
          className="w-full px-3 py-2 border rounded-md text-sm"
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
        <div className="md:col-span-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="md:col-span-2 flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Movimiento'}
        </button>
      </div>
    </form>
  );
}
