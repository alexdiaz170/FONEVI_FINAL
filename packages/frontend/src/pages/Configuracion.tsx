import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, Check, X } from 'lucide-react';
import {
  apiGetConfiguraciones,
  apiUpdateConfiguracion,
  apiListarPeriodos,
  apiCrearPeriodo,
  apiActivarPeriodo,
  ApiError,
  type ConfiguracionDTO,
  type PeriodoDTO,
} from '../lib/api';
import { formatCurrency } from '../lib/utils';

type Section = 'financiero' | 'periodos' | 'general';

const sections: { key: Section; label: string }[] = [
  { key: 'financiero', label: 'Parámetros Financieros' },
  { key: 'periodos', label: 'Gestión de Períodos' },
  { key: 'general', label: 'Configuración General' },
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

const GENERAL_KEYS = ['nombre_institucion', 'nit_institucion'];

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
                  {!p.activo && (
                    <button
                      onClick={() => activateMutation.mutate(p.id)}
                      disabled={activateMutation.isPending}
                      className="px-3 py-1 text-xs border rounded text-navy-700 hover:bg-navy-50 disabled:opacity-40"
                    >
                      Activar
                    </button>
                  )}
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
