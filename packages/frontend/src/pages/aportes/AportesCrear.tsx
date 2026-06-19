import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { apiCrearAporte, apiListarPeriodos, apiListarSocios } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { ApiError } from '../../lib/api';

export default function AportesCrear() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    socioId: '',
    periodoId: '',
    monto: 0,
    fechaPago: '',
    estado: 'pendiente',
    metodo: '',
    notas: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: periodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => apiListarPeriodos(),
  });

  const { data: sociosData } = useQuery({
    queryKey: ['socios-select', 1],
    queryFn: () => apiListarSocios(1, 100),
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.name === 'monto' ? Number(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.socioId) {
      setError('Seleccione un socio');
      return;
    }
    if (!form.periodoId) {
      setError('Seleccione un periodo');
      return;
    }
    if (form.monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await apiCrearAporte({
        socioId: form.socioId,
        periodoId: Number(form.periodoId),
        monto: form.monto,
        fechaPago: form.fechaPago || null,
        estado: form.estado,
        metodo: form.metodo || null,
        notas: form.notas || null,
      });
      navigate('/aportes');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear aporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        to="/aportes"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy-700 mb-4"
      >
        <ArrowLeft size={16} /> Volver a lista
      </Link>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Registrar Aporte</h2>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodo *</label>
            <select
              name="periodoId"
              value={form.periodoId}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Seleccione un periodo...</option>
              {periodos?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              name="estado"
              value={form.estado}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="mora">Mora</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Pago</label>
            <input
              name="fechaPago"
              type="date"
              value={form.fechaPago}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
            <input
              name="metodo"
              value={form.metodo}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="ej: efectivo, transferencia"
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
          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Aporte'}
            </button>
            <Link
              to="/aportes"
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
