import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Save, Plus, Check, X, Trash2, UserPlus, Pencil, Key, Copy, RefreshCw } from 'lucide-react';
import {
  apiGetConfiguraciones,
  apiUpdateConfiguracion,
  apiListarPeriodos,
  apiCrearPeriodo,
  apiActivarPeriodo,
  apiEliminarPeriodo,
  apiListarUsuarios,
  apiCrearUsuario,
  apiActualizarUsuario,
  apiEliminarUsuario,
  apiListarSocios,
  ApiError,
  type ConfiguracionDTO,
  type PeriodoDTO,
  type UsuarioDTO,
  type SocioDTO,
} from '../lib/api';
import { formatCurrency } from '../lib/utils';

type Section = 'financiero' | 'periodos' | 'general' | 'usuarios' | 'credenciales';

const sections: { key: Section; label: string }[] = [
  { key: 'financiero', label: 'Parámetros Financieros' },
  { key: 'periodos', label: 'Gestión de Períodos' },
  { key: 'general', label: 'Configuración General' },
  { key: 'credenciales', label: 'Credenciales Socios' },
  { key: 'usuarios', label: 'Usuarios' },
];

const FINANCIERO_KEYS = [
  'tasa_interes_mensual',
  'tasa_mora_mensual',
  'porcentaje_seguro',
  'valor_solidaridad',
  'valor_minimo_aporte',
  'valor_ahorro_mensual',
  'multiplicador_maximo_credito',
  'reservas',
];

const GENERAL_KEYS = ['nombre_institucion', 'nit_institucion', 'representante'];

const KEY_LABELS: Record<
  string,
  { label: string; type: 'percent' | 'currency' | 'number' | 'text'; desc: string }
> = {
  tasa_interes_mensual: {
    label: 'Tasa de Interés Mensual',
    type: 'percent',
    desc: 'Porcentaje aplicado al capital del crédito',
  },
  tasa_mora_mensual: {
    label: 'Tasa de Mora Mensual',
    type: 'percent',
    desc: 'Porcentaje adicional por pago extemporáneo',
  },
  porcentaje_seguro: {
    label: 'Porcentaje de Seguro',
    type: 'percent',
    desc: 'Porcentaje destinado al seguro del crédito',
  },
  valor_solidaridad: {
    label: 'Valor de Solidaridad',
    type: 'currency',
    desc: 'Aporte obligatorio al fondo de solidaridad',
  },
  valor_minimo_aporte: {
    label: 'Valor Mínimo de Aporte',
    type: 'currency',
    desc: 'Aporte mensual mínimo requerido',
  },
  valor_ahorro_mensual: {
    label: 'Valor de Ahorro Mensual',
    type: 'currency',
    desc: 'Monto fijo destinado al ahorro en cada aporte',
  },
  multiplicador_maximo_credito: {
    label: 'Multiplicador Máx. Crédito',
    type: 'number',
    desc: 'Veces del ahorro que se puede prestar',
  },
  reservas: {
    label: 'Reservas Institucionales',
    type: 'currency',
    desc: 'Monto de reserva para el balance general',
  },
  nombre_institucion: {
    label: 'Nombre de la Institución',
    type: 'text',
    desc: 'Razón social del fondo',
  },
  nit_institucion: { label: 'NIT', type: 'text', desc: 'Número de identificación tributaria' },
  representante: { label: 'Representante', type: 'text', desc: 'Nombre del representante legal' },
};

export default function ConfiguracionPage() {
  const [activeSection, setActiveSection] = useState<Section>('financiero');

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Panel de Administración</h1>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-md ${
              activeSection === s.key
                ? 'bg-white text-navy-700 border border-b-white border-gray-200 -mb-px'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'financiero' && <ParametrosFinancieros />}
      {activeSection === 'periodos' && <GestionPeriodos />}
      {activeSection === 'general' && <ConfiguracionGeneral />}
      {activeSection === 'credenciales' && <GestionCredenciales />}
      {activeSection === 'usuarios' && <GestionUsuarios />}
    </div>
  );
}

function ParametrosFinancieros() {
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<string | null>(null);
  const [valorEdit, setValorEdit] = useState('');
  const [error, setError] = useState('');

  const { data: configs, isLoading } = useQuery({
    queryKey: ['configuraciones'],
    queryFn: () => apiGetConfiguraciones(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ clave, valor }: { clave: string; valor: string }) =>
      apiUpdateConfiguracion(clave, valor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuraciones'] });
      setEditando(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Error al actualizar'),
  });

  const financieroConfigs = configs?.filter((c) => FINANCIERO_KEYS.includes(c.clave)) ?? [];

  if (isLoading) return <div className="text-gray-400 text-center py-8">Cargando...</div>;

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Configure los parámetros financieros que rigen los cálculos del sistema.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {financieroConfigs.map((cfg) => {
          const meta = KEY_LABELS[cfg.clave];
          if (!meta) return null;

          const displayValue =
            meta.type === 'currency'
              ? formatCurrency(Number(cfg.valor))
              : meta.type === 'percent'
                ? `${cfg.valor}%`
                : cfg.valor;

          return (
            <div key={cfg.clave} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <label className="text-sm font-semibold text-gray-800">{meta.label}</label>
                  <p className="text-xs text-gray-400">{meta.desc}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {editando === cfg.clave ? (
                  <>
                    <input
                      value={valorEdit}
                      onChange={(e) => setValorEdit(e.target.value)}
                      className="flex-1 px-3 py-1.5 border rounded text-sm font-mono"
                      autoFocus
                    />
                    <button
                      onClick={() => updateMutation.mutate({ clave: cfg.clave, valor: valorEdit })}
                      disabled={updateMutation.isPending}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={() => setEditando(null)}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className={`flex-1 font-mono text-lg ${meta.type === 'percent' ? '' : ''}`}
                    >
                      {displayValue}
                    </span>
                    <button
                      onClick={() => {
                        setEditando(cfg.clave);
                        setValorEdit(cfg.valor);
                      }}
                      className="px-3 py-1 text-xs border rounded text-gray-600 hover:bg-gray-50"
                    >
                      Editar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GestionPeriodos() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    anio: String(new Date().getFullYear()),
    mes: String(new Date().getMonth() + 1),
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: periodos, isLoading } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => apiListarPeriodos(),
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => apiActivarPeriodo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['periodos'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiEliminarPeriodo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['periodos'] }),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const anio = Number(form.anio);
    const mes = Number(form.mes);
    if (!form.nombre || form.nombre.length < 3) {
      setFormError('El nombre debe tener al menos 3 caracteres');
      return;
    }
    if (anio < 2000 || anio > 2100) {
      setFormError('Año inválido');
      return;
    }
    if (mes < 1 || mes > 12) {
      setFormError('Mes inválido');
      return;
    }

    setSaving(true);
    try {
      await apiCrearPeriodo({ nombre: form.nombre, anio, mes });
      setShowForm(false);
      setForm({
        nombre: '',
        anio: String(new Date().getFullYear()),
        mes: String(new Date().getMonth() + 1),
      });
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Error al crear período');
    } finally {
      setSaving(false);
    }
  };

  const mesNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  if (isLoading) return <div className="text-gray-400 text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Gestione los períodos mensuales del fondo. El período activo es el vigente para aportes.
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800"
        >
          <Plus size={16} /> {showForm ? 'Cancelar' : 'Nuevo Período'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Ej: Enero 2026"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Año</label>
              <input
                type="number"
                value={form.anio}
                onChange={(e) => setForm((p) => ({ ...p, anio: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mes</label>
              <select
                value={form.mes}
                onChange={(e) => setForm((p) => ({ ...p, mes: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {mesNames.map((name, i) => (
                  <option key={i + 1} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{formError}</div>
          )}

          <div className="mt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Crear Período'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-center px-4 py-3">Año</th>
              <th className="text-center px-4 py-3">Mes</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-center px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(periodos ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-8">
                  No hay períodos registrados
                </td>
              </tr>
            )}
            {(periodos ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.nombre}</td>
                <td className="px-4 py-3 text-center">{p.anio}</td>
                <td className="px-4 py-3 text-center">{mesNames[p.mes - 1]}</td>
                <td className="px-4 py-3 text-center">
                  {p.activo ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      <Check size={12} /> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {!p.activo && (
                      <button
                        onClick={() => activateMutation.mutate(p.id)}
                        disabled={activateMutation.isPending}
                        className="px-3 py-1 text-xs border rounded text-navy-700 hover:bg-navy-50 disabled:opacity-40"
                      >
                        Activar
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar período ${p.nombre}?`)) deleteMutation.mutate(p.id);
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConfiguracionGeneral() {
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<string | null>(null);
  const [valorEdit, setValorEdit] = useState('');
  const [error, setError] = useState('');

  const { data: configs, isLoading } = useQuery({
    queryKey: ['configuraciones'],
    queryFn: () => apiGetConfiguraciones(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ clave, valor }: { clave: string; valor: string }) =>
      apiUpdateConfiguracion(clave, valor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuraciones'] });
      setEditando(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Error al actualizar'),
  });

  const generalConfigs = configs?.filter((c) => GENERAL_KEYS.includes(c.clave)) ?? [];

  if (isLoading) return <div className="text-gray-400 text-center py-8">Cargando...</div>;

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Datos institucionales del fondo.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {generalConfigs.map((cfg) => {
          const meta = KEY_LABELS[cfg.clave];
          if (!meta) return null;

          return (
            <div key={cfg.clave} className="bg-white rounded-lg shadow p-4">
              <div>
                <label className="text-sm font-semibold text-gray-800">{meta.label}</label>
                <p className="text-xs text-gray-400 mb-2">{meta.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                {editando === cfg.clave ? (
                  <>
                    <input
                      value={valorEdit}
                      onChange={(e) => setValorEdit(e.target.value)}
                      className="flex-1 px-3 py-1.5 border rounded text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => updateMutation.mutate({ clave: cfg.clave, valor: valorEdit })}
                      disabled={updateMutation.isPending}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={() => setEditando(null)}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{cfg.valor}</span>
                    <button
                      onClick={() => {
                        setEditando(cfg.clave);
                        setValorEdit(cfg.valor);
                      }}
                      className="px-3 py-1 text-xs border rounded text-gray-600 hover:bg-gray-50"
                    >
                      Editar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function generarPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$%&';
  let pwd = '';
  for (let i = 0; i < length; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

function GestionCredenciales() {
  const queryClient = useQueryClient();

  const { data: socios, isLoading: sociosLoading } = useQuery({
    queryKey: ['socios-all'],
    queryFn: () => apiListarSocios(1, 99999),
  });

  const { data: usuarios, isLoading: usuariosLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => apiListarUsuarios(),
  });

  const crearMutation = useMutation({
    mutationFn: (data: { nombre: string; email: string; password: string }) =>
      apiCrearUsuario({
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        rol: 'socio',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiActualizarUsuario(id, { password }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => apiEliminarUsuario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const [mensaje, setMensaje] = useState<{ text: string; type: 'ok' | 'error' } | null>(null);
  const [modal, setModal] = useState<{
    socio: SocioDTO;
    user?: UsuarioDTO;
    password: string;
    done: boolean;
  } | null>(null);

  function abrirCrear(s: SocioDTO) {
    setModal({ socio: s, password: generarPassword(), done: false });
  }

  function abrirReset(u: UsuarioDTO, s: SocioDTO) {
    setModal({ socio: s, user: u, password: generarPassword(), done: false });
  }

  function confirmarModal() {
    if (!modal) return;
    if (modal.user) {
      resetMutation.mutate(
        { id: modal.user.id, password: modal.password },
        {
          onSuccess: () => setModal({ ...modal, done: true }),
          onError: (err) =>
            setMensaje({
              text: err instanceof ApiError ? err.message : 'Error al resetear contraseña',
              type: 'error',
            }),
        },
      );
    } else {
      crearMutation.mutate(
        { nombre: modal.socio.nombre, email: modal.socio.email!, password: modal.password },
        {
          onSuccess: () => setModal({ ...modal, done: true }),
          onError: (err) =>
            setMensaje({
              text: err instanceof ApiError ? err.message : 'Error al crear usuario',
              type: 'error',
            }),
        },
      );
    }
  }

  if (sociosLoading || usuariosLoading)
    return <div className="text-gray-400 text-center py-8">Cargando...</div>;

  const usuarioPorEmail = new Map(usuarios?.map((u) => [u.email.toLowerCase(), u]) ?? []);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Administrar cuentas de usuario de los socios. Cada socio debe tener un email para poder
        iniciar sesión.
      </p>

      {/* Modal contraseña */}
      {modal && !mensaje && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {modal.done ? (
              <div>
                <div className="flex items-center gap-2 text-green-600 mb-4">
                  <Check size={20} />
                  <h3 className="font-semibold text-lg">Contraseña generada</h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {modal.user ? `Contraseña actualizada para` : `Usuario creado para`}
                </p>
                <p className="font-medium mb-3">{modal.socio.nombre}</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 text-center">
                  <code
                    className="text-xl font-mono font-bold text-navy-700 select-all"
                    ref={(el) => el?.focus()}
                  >
                    {modal.password}
                  </code>
                </div>
                <p className="text-xs text-amber-600 mb-4">
                  Copie esta contraseña y entréguela al socio. Por seguridad no podrá consultarla
                  después.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(modal.password);
                      setMensaje({ text: 'Contraseña copiada al portapapeles', type: 'ok' });
                      setModal(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-navy-600 text-white px-4 py-2 rounded-lg hover:bg-navy-700 text-sm font-medium"
                  >
                    <Copy size={16} /> Copiar
                  </button>
                  <button
                    onClick={() => setModal(null)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Key size={20} className="text-amber-500" />
                  <h3 className="font-semibold text-lg">
                    {modal.user ? 'Resetear contraseña' : 'Crear usuario'}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {modal.user ? 'Nueva contraseña para' : 'Se creará usuario para'}
                </p>
                <p className="font-medium mb-4">{modal.socio.nombre}</p>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-lg font-bold tracking-wider text-navy-700 select-all">
                    {modal.password}
                  </div>
                  <button
                    onClick={() => setModal({ ...modal, password: generarPassword() })}
                    className="p-2.5 text-gray-500 hover:text-navy-600 hover:bg-gray-100 rounded-lg"
                    title="Generar nueva contraseña"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={confirmarModal}
                    disabled={crearMutation.isPending || resetMutation.isPending}
                    className="flex-1 bg-navy-600 text-white px-4 py-2 rounded-lg hover:bg-navy-700 text-sm font-medium disabled:opacity-50"
                  >
                    {crearMutation.isPending || resetMutation.isPending
                      ? 'Guardando...'
                      : 'Confirmar'}
                  </button>
                  <button
                    onClick={() => setModal(null)}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mensaje flotante */}
      {mensaje && (
        <div
          className={`mb-4 px-4 py-3 rounded text-sm ${mensaje.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
        >
          {mensaje.text}
          <button onClick={() => setMensaje(null)} className="float-right font-bold">
            &times;
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Socio</th>
              <th className="text-left px-4 py-3">Documento</th>
              <th className="text-left px-4 py-3">Teléfono</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-center px-4 py-3">Usuario</th>
              <th className="text-center px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(socios?.data ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">
                  No hay socios registrados
                </td>
              </tr>
            )}
            {(socios?.data ?? []).map((s) => {
              const user = s.email ? usuarioPorEmail.get(s.email.toLowerCase()) : undefined;
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/socios/${s.id}`}
                      className="text-navy-600 hover:text-navy-800 hover:underline font-medium"
                    >
                      {s.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {s.tipoDocumento} {s.numeroDocumento}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{s.email ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {user ? (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                        Sin cuenta
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      {user ? (
                        <>
                          <button
                            onClick={() => abrirReset(user, s)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                            title="Resetear contraseña"
                          >
                            <Key size={16} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar usuario ${user.nombre}?`))
                                eliminarMutation.mutate(user.id);
                            }}
                            disabled={eliminarMutation.isPending}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : s.email ? (
                        <button
                          onClick={() => abrirCrear(s)}
                          className="p-1.5 text-navy-600 hover:bg-navy-50 rounded"
                          title="Crear usuario"
                        >
                          <UserPlus size={16} />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin email</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GestionUsuarios() {
  const queryClient = useQueryClient();
  const [showCrear, setShowCrear] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'contador' });
  const [formError, setFormError] = useState('');

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: '',
    estado: '',
  });

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => apiListarUsuarios(),
  });

  const crearMutation = useMutation({
    mutationFn: () =>
      apiCrearUsuario({
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        rol: form.rol,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setShowCrear(false);
      setForm({ nombre: '', email: '', password: '', rol: 'contador' });
    },
    onError: (err) => setFormError(err instanceof ApiError ? err.message : 'Error al crear'),
  });

  const actualizarMutation = useMutation({
    mutationFn: () =>
      apiActualizarUsuario(editandoId!, {
        nombre: editForm.nombre,
        email: editForm.email,
        password: editForm.password || undefined,
        rol: editForm.rol,
        estado: editForm.estado,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setEditandoId(null);
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => apiEliminarUsuario(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiActualizarUsuario(id, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });

  const roles = ['superadmin', 'admin', 'contador', 'socio'];

  const rolColor: Record<string, string> = {
    superadmin: 'bg-red-100 text-red-700',
    admin: 'bg-navy-100 text-navy-700',
    contador: 'bg-purple-100 text-purple-700',
    socio: 'bg-green-100 text-green-700',
  };

  function iniciarEdicion(u: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    estado: string;
  }) {
    setEditandoId(u.id);
    setEditForm({ nombre: u.nombre, email: u.email, password: '', rol: u.rol, estado: u.estado });
    setShowCrear(false);
  }

  if (isLoading) return <div className="text-gray-400 text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Gestión de usuarios del sistema.</p>
        <button
          onClick={() => {
            setShowCrear(!showCrear);
            setEditandoId(null);
          }}
          className="inline-flex items-center gap-1 px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800"
        >
          <UserPlus size={16} /> {showCrear ? 'Cancelar' : 'Nuevo Usuario'}
        </button>
      </div>

      {showCrear && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Crear Usuario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rol *</label>
              <select
                value={form.rol}
                onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{formError}</div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => crearMutation.mutate()}
              disabled={crearMutation.isPending || !form.nombre || !form.email || !form.password}
              className="px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
            >
              {crearMutation.isPending ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-center px-4 py-3">Contraseña</th>
              <th className="text-center px-4 py-3">Rol</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-center px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(usuarios ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
            {(usuarios ?? []).map((u) =>
              editandoId === u.id ? (
                <tr key={u.id} className="bg-yellow-50">
                  <td className="px-4 py-3">
                    <input
                      value={editForm.nombre}
                      onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="password"
                      value={editForm.password}
                      onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                      className="w-28 px-2 py-1 border rounded text-sm"
                      placeholder="Nueva"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={editForm.rol}
                      onChange={(e) => setEditForm((p) => ({ ...p, rol: e.target.value }))}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={editForm.estado}
                      onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value }))}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="activo">activo</option>
                      <option value="inactivo">inactivo</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => actualizarMutation.mutate()}
                        disabled={actualizarMutation.isPending}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="Guardar"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditandoId(null)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                        title="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-center text-gray-400 font-mono">••••••••</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${rolColor[u.rol] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${u.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {u.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => iniciarEdicion(u)}
                        className="p-1.5 text-navy-600 hover:bg-navy-50 rounded"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          const pwd = prompt('Nueva contraseña para ' + u.nombre + ':');
                          if (pwd && pwd.length >= 6)
                            resetPasswordMutation.mutate({ id: u.id, password: pwd });
                          else if (pwd) alert('La contraseña debe tener al menos 6 caracteres');
                        }}
                        disabled={resetPasswordMutation.isPending}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded"
                        title="Cambiar contraseña"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar usuario ${u.nombre}?`))
                            eliminarMutation.mutate(u.id);
                        }}
                        disabled={eliminarMutation.isPending}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
