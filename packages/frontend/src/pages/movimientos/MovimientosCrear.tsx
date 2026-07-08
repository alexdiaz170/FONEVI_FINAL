import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiCrearMovimiento, ApiError } from '../../lib/api';
import { AnimatedFadeIn, AnimatedButton } from '../../components/ui';

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
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-cyan-700 mb-4"
      >
        <ArrowLeft size={16} /> Volver a lista
      </Link>
      <AnimatedFadeIn>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 max-w-lg">
          <h2 className="text-lg font-bold text-navy-800 mb-4">Nuevo Movimiento</h2>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-navy-700 mb-1">
                Tipo *
              </label>
              <select
                id="tipo"
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
              >
                <option value="ingreso">Ingreso</option>
                <option value="egreso">Egreso</option>
              </select>
            </div>
            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-navy-700 mb-1">
                Categoría *
              </label>
              <input
                id="categoria"
                aria-label="Categoría"
                name="categoria"
                value={form.categoria}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
                placeholder="ej: servicios, salarios, etc."
              />
            </div>
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-navy-700 mb-1">
                Descripción *
              </label>
              <textarea
                id="descripcion"
                aria-label="Descripción"
                name="descripcion"
                rows={3}
                value={form.descripcion}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 resize-none"
              />
            </div>
            <div>
              <label
                htmlFor="monto-movimiento"
                className="block text-sm font-medium text-navy-700 mb-1"
              >
                Monto *
              </label>
              <input
                id="monto-movimiento"
                aria-label="Monto"
                name="monto"
                type="number"
                step="0.01"
                value={form.monto}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
              />
            </div>
            <div>
              <label
                htmlFor="fecha-movimiento"
                className="block text-sm font-medium text-navy-700 mb-1"
              >
                Fecha
              </label>
              <input
                id="fecha-movimiento"
                aria-label="Fecha"
                name="fecha"
                type="date"
                value={form.fecha}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <AnimatedButton
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-cyan-500/25 hover:from-cyan-700 hover:to-teal-600 disabled:opacity-50 transition-all"
              >
                {loading ? 'Guardando...' : 'Guardar Movimiento'}
              </AnimatedButton>
              <Link
                to="/movimientos"
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-all"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </AnimatedFadeIn>
    </div>
  );
}
