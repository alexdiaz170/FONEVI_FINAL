import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { apiCrearAporte, apiListarPeriodos, apiListarSocios } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import {
  GlassCard,
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  AnimatedButton,
  AnimatedFadeIn,
} from '../../components/ui';

function formatThousands(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('es-CO').replace(/,/g, '.');
}

const TIPOS_OPERACION = [
  { value: 'cuota_normal', label: 'Cuota Normal' },
  { value: 'abono_credito', label: 'Abono a Crédito' },
  { value: 'abono_ahorro', label: 'Abono a Ahorro' },
  { value: 'adelanto_cuotas', label: 'Adelanto de Cuotas' },
] as const;

const METODOS_PAGO = [
  { value: '', label: 'Seleccione...' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'consignacion', label: 'Consignación' },
  { value: 'giro', label: 'Giro' },
  { value: 'nomina', label: 'Nómina' },
] as const;

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AportesCrear() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    socioId: '',
    periodoId: '',
    monto: '',
    fechaPago: todayStr(),
    estado: 'pagado',
    tipoOperacion: 'cuota_normal',
    metodo: '',
    notas: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);
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
    const { name, value } = e.target;
    if (name === 'monto') {
      setForm((prev) => ({ ...prev, monto: value.replace(/\D/g, '') }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors(null);

    if (!form.socioId) {
      setError('Seleccione un socio');
      return;
    }
    if (!form.periodoId) {
      setError('Seleccione un periodo');
      return;
    }
    const montoNum = Number(form.monto);
    if (!form.monto || montoNum <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);
    try {
      await apiCrearAporte({
        socioId: form.socioId,
        periodoId: Number(form.periodoId),
        monto: montoNum,
        fechaPago: form.fechaPago || null,
        estado: form.estado,
        tipoOperacion: form.tipoOperacion,
        metodo: form.metodo || null,
        notas: form.notas || null,
      });
      queryClient.invalidateQueries({ queryKey: ['aportes'] });
      queryClient.invalidateQueries({ queryKey: ['socio', form.socioId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-resumen'] });
      navigate('/aportes');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.details && typeof err.details === 'object') {
          setFieldErrors(err.details as Record<string, string[]>);
        }
      } else {
        setError('Error al crear aporte');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <AnimatedStaggerContainer>
        <AnimatedStaggerItem>
          <Link
            to="/aportes"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-4 transition-colors"
          >
            <ArrowLeft size={15} /> Volver a lista
          </Link>
        </AnimatedStaggerItem>

        <AnimatedStaggerItem>
          <GlassCard className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center shadow-md">
                <DollarSign size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Registrar Aporte</h2>
                <p className="text-sm text-gray-500">Ingresa un nuevo aporte de socio</p>
              </div>
            </div>

            {error && (
              <AnimatedFadeIn>
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  <p>{error}</p>
                  {fieldErrors && (
                    <ul className="mt-1 list-disc list-inside text-xs">
                      {Object.entries(fieldErrors).map(([field, msgs]) => (
                        <li key={field}>
                          <strong>{field}:</strong> {msgs.join(', ')}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </AnimatedFadeIn>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-2">
                <label htmlFor="socio" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Socio <span className="text-red-400">*</span>
                </label>
                <select
                  id="socio"
                  name="socioId"
                  value={form.socioId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
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
                <label htmlFor="periodo" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Periodo <span className="text-red-400">*</span>
                </label>
                <select
                  id="periodo"
                  name="periodoId"
                  value={form.periodoId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
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
                <label htmlFor="monto" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Monto <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                    $
                  </span>
                  <input
                    id="monto"
                    aria-label="Monto"
                    name="monto"
                    type="text"
                    inputMode="numeric"
                    value={formatThousands(form.monto)}
                    onChange={handleChange}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="tipo-operacion"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Tipo de Operación <span className="text-red-400">*</span>
                </label>
                <select
                  id="tipo-operacion"
                  name="tipoOperacion"
                  value={form.tipoOperacion}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                >
                  {TIPOS_OPERACION.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Estado
                </label>
                <select
                  id="estado"
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="mora">Mora</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="fecha-pago"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Fecha de Pago
                </label>
                <input
                  id="fecha-pago"
                  aria-label="Fecha de Pago"
                  name="fechaPago"
                  type="date"
                  value={form.fechaPago}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label htmlFor="metodo" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Método
                </label>
                <select
                  id="metodo"
                  name="metodo"
                  value={form.metodo}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                >
                  {METODOS_PAGO.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notas
                </label>
                <textarea
                  id="notas"
                  aria-label="Notas"
                  name="notas"
                  rows={3}
                  value={form.notas}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
                />
              </div>
              <div className="md:col-span-2 flex gap-3 pt-2">
                <AnimatedButton
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Guardando...' : 'Guardar Aporte'}
                </AnimatedButton>
                <Link
                  to="/aportes"
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
