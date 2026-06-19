import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { apiCrearCredito, apiListarSocios } from '../../lib/api';
import { ApiError } from '../../lib/api';

export default function CreditosCrear() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    socioId: '',
    monto: 0,
    tasaMensual: 0,
    cuotas: 0,
    fechaDesembolso: '',
    proposito: '',
    notas: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: sociosData } = useQuery({
    queryKey: ['socios-select', 1],
    queryFn: () => apiListarSocios(1, 100),
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const value =
      e.target.name === 'monto' || e.target.name === 'tasaMensual' || e.target.name === 'cuotas'
        ? Number(e.target.value)
        : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.socioId) {
      setError('Seleccione un socio');
      return;
    }
    if (form.monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    if (form.tasaMensual <= 0 || form.tasaMensual > 100) {
      setError('La tasa debe ser entre 0 y 100');
      return;
    }
    if (form.cuotas < 1) {
      setError('Debe haber al menos 1 cuota');
      return;
    }

    setLoading(true);
    try {
      await apiCrearCredito({
        socioId: form.socioId,
        monto: form.monto,
        tasaMensual: form.tasaMensual,
        cuotas: form.cuotas,
        fechaDesembolso: form.fechaDesembolso || undefined,
        proposito: form.proposito || null,
        notas: form.notas || null,
      });
      navigate('/creditos');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear crédito');
    } finally {
      setLoading(false);
    }
  };

  const cuotaEstimada =
    form.monto > 0 && form.tasaMensual > 0 && form.cuotas > 0
      ? (form.monto *
          (form.tasaMensual / 100) *
          Math.pow(1 + form.tasaMensual / 100, form.cuotas)) /
        (Math.pow(1 + form.tasaMensual / 100, form.cuotas) - 1)
      : 0;

  return (
    <div>
      <Link
        to="/creditos"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy-700 mb-4"
      >
        <ArrowLeft size={16} /> Volver a lista
      </Link>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Nuevo Crédito</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Socio *</label>
            <select
              name="socioId"
              value={form.socioId}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Seleccione un socio...</option>
              {sociosData?.data.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} ({s.numeroDocumento})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
            <input
              name="monto"
              type="number"
              step="0.01"
              value={form.monto}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tasa Mensual % *</label>
            <input
              name="tasaMensual"
              type="number"
              step="0.01"
              value={form.tasaMensual}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Cuotas *
            </label>
            <input
              name="cuotas"
              type="number"
              value={form.cuotas}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desembolso</label>
            <input
              name="fechaDesembolso"
              type="date"
              value={form.fechaDesembolso}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Propósito</label>
            <input
              name="proposito"
              value={form.proposito}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              name="notas"
              rows={3}
              value={form.notas}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          {cuotaEstimada > 0 && (
            <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded p-3 text-sm">
              <span className="text-blue-800 font-medium">Cuota mensual estimada: </span>
              <span className="text-blue-900 font-mono font-bold">
                {cuotaEstimada.toFixed(2)} Gs.
              </span>
            </div>
          )}

          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Crear Crédito'}
            </button>
            <Link
              to="/creditos"
              className="px-6 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
