import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiCrearSocio } from '../../lib/api';
import { ApiError } from '../../lib/api';

const DEPARTAMENTOS: Record<string, string[]> = {
  Amazonas: ['Leticia', 'Puerto Nariño'],
  Antioquia: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro', 'Apartadó'],
  Arauca: ['Arauca', 'Tame', 'Saravena'],
  Atlántico: ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia'],
  Bolívar: ['Cartagena', 'Magangué', 'Turbaco', 'El Carmen de Bolívar'],
  Boyacá: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Paipa'],
  Caldas: ['Manizales', 'Villamaría', 'Chinchiná', 'La Dorada'],
  Caquetá: ['Florencia', 'Cartagena del Chairá', 'San Vicente del Caguán'],
  Casanare: ['Yopal', 'Aguazul', 'Paz de Ariporo'],
  Cauca: ['Popayán', 'Santander de Quilichao', 'Puerto Tejada'],
  Cesar: ['Valledupar', 'Aguachica', 'Codazzi', 'La Paz'],
  Chocó: ['Quibdó', 'Istmina', 'Turbo'],
  Córdoba: ['Montería', 'Lorica', 'Sahagún', 'Cereté'],
  Cundinamarca: [
    'Bogotá',
    'Soacha',
    'Chía',
    'Cajicá',
    'Zipaquirá',
    'Facatativá',
    'Girardot',
    'Fusagasugá',
  ],
  Guainía: ['Inírida'],
  Guaviare: ['San José del Guaviare'],
  Huila: ['Neiva', 'Pitalito', 'La Plata', 'Garzón'],
  'La Guajira': ['Riohacha', 'Maicao', 'Uribia', 'San Juan del Cesar'],
  Magdalena: ['Santa Marta', 'Ciénaga', 'Fundación', 'El Banco'],
  Meta: ['Villavicencio', 'Acacías', 'Granada', 'Puerto Gaitán'],
  Nariño: ['Pasto', 'Tumaco', 'Ipiales', 'Túquerres', 'La Unión', 'San Pablo', 'La Cruz'],
  'Norte de Santander': ['Cúcuta', 'Ocaña', 'Pamplona', 'Los Patios'],
  Putumayo: ['Mocoa', 'Puerto Asís', 'Orito'],
  Quindío: ['Armenia', 'Calarcá', 'Montenegro'],
  Risaralda: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal'],
  'San Andrés y Providencia': ['San Andrés', 'Providencia'],
  Santander: ['Bucaramanga', 'Floridablanca', 'Girón', 'Barrancabermeja', 'San Gil'],
  Sucre: ['Sincelejo', 'Corozal', 'Tolú', 'San Marcos'],
  Tolima: ['Ibagué', 'Espinal', 'Honda', 'Líbano'],
  'Valle del Cauca': ['Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Cartago', 'Buga', 'Yumbo'],
  Vaupés: ['Mitú'],
  Vichada: ['Puerto Carreño', 'La Primavera'],
};

export default function SociosCrear() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    email: '',
    telefono: '',
    fechaIngreso: new Date().toISOString().split('T')[0],
    cargo: '',
    sede: '',
    departamento: '',
    municipio: '',
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

  const handleDepartamentoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dept = e.target.value;
    setForm((prev) => ({ ...prev, departamento: dept, municipio: '' }));
  };

  const depts = Object.keys(DEPARTAMENTOS).sort();
  const municipios = form.departamento ? (DEPARTAMENTOS[form.departamento] ?? []) : [];

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

    setLoading(true);
    try {
      const result = await apiCrearSocio({
        nombre: form.nombre,
        tipoDocumento: form.tipoDocumento,
        numeroDocumento: form.numeroDocumento,
        email: form.email || null,
        telefono: form.telefono || null,
        fechaIngreso: form.fechaIngreso
          ? new Date(form.fechaIngreso).toISOString()
          : new Date().toISOString(),
        cargo: form.cargo || null,
        sede: form.sede || null,
        departamento: form.departamento || null,
        municipio: form.municipio || null,
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
                nombre: '',
                tipoDocumento: 'CC',
                numeroDocumento: '',
                email: '',
                telefono: '',
                fechaIngreso: new Date().toISOString().split('T')[0],
                cargo: '',
                sede: '',
                departamento: '',
                municipio: '',
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
            <select
              name="tipoDocumento"
              value={form.tipoDocumento}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="CC">Cédula</option>
              <option value="CE">Cédula Extranjería</option>
              <option value="NIT">NIT</option>
              <option value="PASAPORTE">Pasaporte</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo *</label>
            <select
              name="cargo"
              value={form.cargo}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Seleccionar cargo...</option>
              <option value="Docente">Docente</option>
              <option value="Administrativo">Administrativo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Ingreso</label>
            <input
              name="fechaIngreso"
              type="date"
              value={form.fechaIngreso}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institución Educativa
            </label>
            <input
              name="sede"
              value={form.sede}
              onChange={handleChange}
              placeholder="Nombre de la institución..."
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
            <select
              name="departamento"
              value={form.departamento}
              onChange={handleDepartamentoChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Seleccionar departamento...</option>
              {depts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
            <select
              name="municipio"
              value={form.municipio}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
              disabled={!form.departamento}
            >
              <option value="">Seleccionar municipio...</option>
              {municipios.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
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
