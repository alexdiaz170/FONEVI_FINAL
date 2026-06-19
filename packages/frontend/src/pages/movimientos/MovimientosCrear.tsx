import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiCrearMovimiento } from '../../lib/api';
import { ApiError } from '../../lib/api';

export default function MovimientosCrear() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tipo: 'ingreso',
    categoria: '',
    descripcion: '',
    monto: 0,
    fecha: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const value = e.target.name === 'monto' ? Number(e.target.value) : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.categoria || form.categoria.length < 2) {
      setError('La categoría debe tener al menos 2 caracteres');
      return;
    }
    if (!form.descripcion || form.descripcion.length < 3) {
      setError('La descripción debe tener al menos 3 caracteres');
      return;
    }
    if (form.monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await apiCrearMovimiento({ ...form, fecha: form.fecha || undefined });
      navigate('/movimientos');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear movimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        to="/movimientos"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy-700 mb-4"
      >
        <ArrowLeft size={16} /> Volver a lista
      </Link>
      <div className="bg-white rounded-lg shadow p-6 max-w-lg">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Nuevo Movimiento</h2>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
            <input
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="ej: servicios, salarios, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
            <textarea
              name="descripcion"
              rows={3}
              value={form.descripcion}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              name="fecha"
              type="date"
              value={form.fecha}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Movimiento'}
            </button>
            <Link
              to="/movimientos"
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
