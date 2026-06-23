import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { apiCrearAporte, apiListarPeriodos, apiListarSocios } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { ApiError } from '../../lib/api';

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
        )}

        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              type="text"
              inputMode="numeric"
              value={formatThousands(form.monto)}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Operación *
            </label>
            <select
              name="tipoOperacion"
              value={form.tipoOperacion}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              {TIPOS_OPERACION.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
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
            <select
              name="metodo"
              value={form.metodo}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              {METODOS_PAGO.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
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
