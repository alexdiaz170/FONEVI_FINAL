import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Check, Copy, Eye, EyeOff } from 'lucide-react';
import { apiCrearSocio } from '../../lib/api';
import { ApiError } from '../../lib/api';
import {
  GlassCard,
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  AnimatedButton,
  AnimatedFadeIn,
} from '../../components/ui';

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
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopyPassword = () => {
    if (resultado) {
      navigator.clipboard.writeText(resultado.passwordInicial);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (resultado) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 rounded-3xl pointer-events-none" />
        <AnimatedStaggerContainer className="relative max-w-lg mx-auto text-center">
          <AnimatedStaggerItem>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
              <Check size={36} className="text-white" />
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Socio creado exitosamente</h2>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-100 to-navy-50 flex items-center justify-center">
                <UserPlus size={16} className="text-navy-600" />
              </div>
              <p className="text-lg font-medium text-gray-700">{resultado.socio.nombre}</p>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <GlassCard className="text-left mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Eye size={16} className="text-amber-500" />
                Contraseña inicial del usuario
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <span className="text-lg font-mono font-bold text-amber-900">
                    {showPwd ? resultado.passwordInicial : '••••••••'}
                  </span>
                </div>
                <AnimatedButton
                  onClick={() => setShowPwd(!showPwd)}
                  className="p-3 bg-white/80 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-white"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </AnimatedButton>
                <AnimatedButton
                  onClick={handleCopyPassword}
                  className="p-3 bg-white/80 border border-gray-200 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-white"
                >
                  <Copy size={18} />
                </AnimatedButton>
              </div>
              {copied && (
                <AnimatedFadeIn>
                  <p className="text-xs text-emerald-600 mt-2">¡Copiado al portapapeles!</p>
                </AnimatedFadeIn>
              )}
            </GlassCard>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="flex gap-3 justify-center">
              <Link
                to="/socios"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-navy-600 to-navy-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-navy-500/25 hover:from-navy-700 hover:to-navy-600 transition-all"
              >
                <ArrowLeft size={15} /> Volver a lista
              </Link>
              <AnimatedButton
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
                className="px-6 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-white transition-all"
              >
                Crear otro
              </AnimatedButton>
            </div>
          </AnimatedStaggerItem>
        </AnimatedStaggerContainer>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-navy-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-navy-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <AnimatedStaggerContainer>
        <AnimatedStaggerItem>
          <Link
            to="/socios"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-4 transition-colors"
          >
            <ArrowLeft size={15} /> Volver a lista
          </Link>
        </AnimatedStaggerItem>

        <AnimatedStaggerItem>
          <GlassCard className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-500 to-blue-400 flex items-center justify-center shadow-md">
                <UserPlus size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Nuevo Socio</h2>
                <p className="text-sm text-gray-500">Registra un nuevo miembro del fondo</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre completo <span className="text-red-400">*</span>
                </label>
                <input
                  id="nombre"
                  aria-label="Nombre completo"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 transition-all"
                  placeholder="Nombres y apellidos"
                />
              </div>
              <div>
                <label
                  htmlFor="tipo-documento"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Tipo Documento
                </label>
                <select
                  id="tipo-documento"
                  name="tipoDocumento"
                  value={form.tipoDocumento}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 transition-all"
                >
                  <option value="CC">Cédula</option>
                  <option value="CE">Cédula Extranjería</option>
                  <option value="NIT">NIT</option>
                  <option value="PASAPORTE">Pasaporte</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="numero-documento"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Nro. Documento <span className="text-red-400">*</span>
                </label>
                <input
                  id="numero-documento"
                  aria-label="Nro. Documento"
                  name="numeroDocumento"
                  value={form.numeroDocumento}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 transition-all"
                  placeholder="Sin puntos ni guiones"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  aria-label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 transition-all"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label
                  htmlFor="telefono"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Teléfono
                </label>
                <input
                  id="telefono"
                  aria-label="Teléfono"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 transition-all"
                  placeholder="300 123 4567"
                />
              </div>
              <div>
                <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cargo <span className="text-red-400">*</span>
                </label>
                <select
                  id="cargo"
                  name="cargo"
                  value={form.cargo}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 transition-all"
                >
                  <option value="">Seleccionar cargo...</option>
                  <option value="Docente">Docente</option>
                  <option value="Administrativo">Administrativo</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="fecha-ingreso"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Fecha Ingreso
                </label>
                <input
                  id="fecha-ingreso"
                  aria-label="Fecha Ingreso"
                  name="fechaIngreso"
                  type="date"
                  value={form.fechaIngreso}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 transition-all"
                />
              </div>
              <div>
                <label htmlFor="sede" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Institución Educativa
                </label>
                <input
                  id="sede"
                  aria-label="Institución Educativa"
                  name="sede"
                  value={form.sede}
                  onChange={handleChange}
                  placeholder="Nombre de la institución..."
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="departamento"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Departamento
                </label>
                <select
                  id="departamento"
                  name="departamento"
                  value={form.departamento}
                  onChange={handleDepartamentoChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 transition-all"
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
                <label
                  htmlFor="municipio"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Municipio
                </label>
                <select
                  id="municipio"
                  name="municipio"
                  value={form.municipio}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 transition-all disabled:opacity-50"
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
                <AnimatedButton
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-navy-600 to-navy-500 text-white rounded-xl text-sm font-medium hover:from-navy-700 hover:to-navy-600 shadow-lg shadow-navy-500/25 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Guardando...' : 'Guardar Socio'}
                </AnimatedButton>
                <Link
                  to="/socios"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-white hover:text-gray-800 transition-all"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </GlassCard>
        </AnimatedStaggerItem>
      </AnimatedStaggerContainer>
    </div>
  );
}
