import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiCrearSocio } from '../../lib/api';
import { ApiError } from '../../lib/api';

export default function SociosCrear() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    tipoDocumento: 'ci',
    numeroDocumento: '',
    email: '',
    telefono: '',
    fechaIngreso: '',
    aporteMensual: 0,
    cargo: '',
    sede: '',
  });
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState<{
    socio: { nombre: string };
    passwordInicial: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.nombre || form.nombre.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }
    if (!form.numeroDocumento) {
      setError('El número de documento es requerido');
      return;
    }
    if (form.aporteMensual <= 0) {
      setError('El aporte mensual debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      const result = await apiCrearSocio({
        ...form,
        email: form.email || null,
        telefono: form.telefono || null,
        fechaIngreso: form.fechaIngreso || null,
        cargo: form.cargo || null,
        sede: form.sede || null,
      });
      setResultado(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear socio');
    } finally {
      setLoading(false);
    }
  };

  if (resultado) {
    return (
      <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto text-center">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Socio creado exitosamente</h2>
        <p className="text-gray-600 mb-4">{resultado.socio.nombre}</p>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
          <p className="text-sm font-medium text-yellow-800">Contraseña inicial:</p>
          <p className="text-lg font-mono font-bold text-yellow-900">{resultado.passwordInicial}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link to="/socios" className="px-4 py-2 bg-navy-700 text-white rounded-md text-sm">
            Volver a lista
          </Link>
          <button
            onClick={() => {
              setResultado(null);
              setForm({
                codigo: '',
                nombre: '',
                tipoDocumento: 'ci',
                numeroDocumento: '',
                email: '',
                telefono: '',
                fechaIngreso: '',
                aporteMensual: 0,
                cargo: '',
                sede: '',
              });
            }}
            className="px-4 py-2 border rounded-md text-sm"
          >
            Crear otro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/socios"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy-700 mb-4"
      >
        <ArrowLeft size={16} /> Volver a lista
      </Link>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Nuevo Socio</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input
              name="codigo"
              value={form.codigo}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
            <select
              name="tipoDocumento"
              value={form.tipoDocumento}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="ci">Cédula</option>
              <option value="ruc">RUC</option>
              <option value="pasaporte">Pasaporte</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nro. Documento *</label>
            <input
              name="numeroDocumento"
              value={form.numeroDocumento}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aporte Mensual *</label>
            <input
              name="aporteMensual"
              type="number"
              step="0.01"
              value={form.aporteMensual}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Ingreso</label>
            <input
              name="fechaIngreso"
              type="date"
              value={form.fechaIngreso}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
            <input
              name="cargo"
              value={form.cargo}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sede</label>
            <input
              name="sede"
              value={form.sede}
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
              {loading ? 'Guardando...' : 'Guardar Socio'}
            </button>
            <Link
              to="/socios"
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
