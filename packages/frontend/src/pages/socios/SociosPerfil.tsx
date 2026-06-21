import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Award,
  PiggyBank,
  CreditCard,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { apiObtenerSocio, apiGetReporteEstadoCuentaSocio } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import { useState } from 'react';
import { apiActualizarSocio } from '../../lib/api';

export default function SociosPerfil() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const {
    data: socio,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['socio', id],
    queryFn: () => apiObtenerSocio(id!),
    enabled: !!id,
  });

  const { data: reporte, isLoading: reporteLoading } = useQuery({
    queryKey: ['reporte-estado-cuenta', id],
    queryFn: () => apiGetReporteEstadoCuentaSocio(id!),
    enabled: !!id,
  });

  const creditosActivos = reporte?.creditos?.filter((c) => c.estado === 'activo') ?? [];
  const totalAportado = reporte?.totalAportado ?? 0;
  const totalCreditos = reporte?.creditos?.reduce((sum, c) => sum + c.monto, 0) ?? 0;
  const saldoPendiente = reporte?.creditos?.reduce((sum, c) => sum + c.saldoCapital, 0) ?? 0;

  const handleEdit = () => {
    if (socio) {
      setForm({
        nombre: socio.nombre,
        email: socio.email ?? '',
        telefono: socio.telefono ?? '',
        cargo: socio.cargo ?? '',
        sede: socio.sede ?? '',
      });
      setEditando(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await apiActualizarSocio(id!, form);
      setEditando(false);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">Cargando...</div>
    );
  if (queryError || !socio)
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-red-500">
        Error: {(queryError as ApiError)?.message ?? 'Socio no encontrado'}
      </div>
    );

  return (
    <div>
      <Link
        to="/socios"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy-700 mb-4"
      >
        <ArrowLeft size={16} /> Volver a lista
      </Link>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{socio.nombre}</h2>
              <p className="text-sm text-gray-500 font-mono">{socio.codigoSocio ?? socio.codigo}</p>
            </div>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                socio.estado === 'activo'
                  ? 'bg-green-100 text-green-700'
                  : socio.estado === 'mora'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {socio.estado}
            </span>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Información Personal
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <InfoRow icon={<Mail size={16} />} label="Email" value={socio.email} />
              <InfoRow icon={<Phone size={16} />} label="Teléfono" value={socio.telefono} />
              <InfoRow
                icon={<Award size={16} />}
                label="Documento"
                value={`${socio.tipoDocumento.toUpperCase()}: ${socio.numeroDocumento}`}
              />
              <InfoRow
                icon={<Calendar size={16} />}
                label="Fecha Ingreso"
                value={formatDate(socio.fechaIngreso)}
              />
              <InfoRow icon={<MapPin size={16} />} label="Sede" value={socio.sede} />
              <InfoRow icon={<Award size={16} />} label="Cargo" value={socio.cargo} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Financiero
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <InfoRow label="Ahorro Acumulado" value={formatCurrency(socio.ahorroAcumulado)} />
            </div>
          </div>

          {editando && (
            <div className="md:col-span-2 border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Editar Socio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['nombre', 'email', 'telefono', 'cargo', 'sede'].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {field}
                    </label>
                    <input
                      name={field}
                      value={form[field] ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  onClick={() => setEditando(false)}
                  className="px-6 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {!editando && (
          <div className="px-6 pb-6">
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800"
            >
              <Pencil size={16} /> Editar Socio
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <CardStat
          icon={<PiggyBank size={20} />}
          label="Ahorro Acumulado"
          value={formatCurrency(socio.ahorroAcumulado)}
          color="blue"
        />
        <CardStat
          icon={<TrendingUp size={20} />}
          label="Total Aportado"
          value={formatCurrency(totalAportado)}
          color="green"
        />
        <CardStat
          icon={<CreditCard size={20} />}
          label="Créditos Activos"
          value={`${creditosActivos.length}`}
          subtitle={saldoPendiente > 0 ? `Saldo: ${formatCurrency(saldoPendiente)}` : undefined}
          color="purple"
        />
        <CardStat
          icon={<DollarSign size={20} />}
          label="Total Créditos"
          value={formatCurrency(totalCreditos)}
          color="amber"
        />
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Aportes
            </h3>
          </div>
          {reporteLoading ? (
            <div className="text-center text-gray-400 py-8 text-sm">Cargando...</div>
          ) : !reporte?.aportes?.length ? (
            <div className="text-center text-gray-400 py-8 text-sm">Sin aportes registrados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="text-left p-3 font-medium">Periodo</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-right p-3 font-medium">Monto</th>
                    <th className="text-right p-3 font-medium">Solidaridad</th>
                    <th className="text-right p-3 font-medium">A Crédito</th>
                    <th className="text-right p-3 font-medium">Ahorro</th>
                    <th className="text-left p-3 font-medium">Fecha</th>
                    <th className="text-center p-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.aportes.map((a) => {
                    const tipoLabel =
                      a.tipoOperacion === 'cuota_normal'
                        ? 'Cuota'
                        : a.tipoOperacion === 'abono_credito'
                          ? 'Abono'
                          : 'Adelanto';
                    const tipoColor =
                      a.tipoOperacion === 'cuota_normal'
                        ? 'bg-blue-100 text-blue-700'
                        : a.tipoOperacion === 'abono_credito'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-teal-100 text-teal-700';
                    const estColor =
                      a.estado === 'pagado'
                        ? 'bg-green-100 text-green-700'
                        : a.estado === 'mora' || a.estado === 'vencido'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700';
                    return (
                      <tr key={a.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-900">{a.periodoNombre}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${tipoColor}`}
                          >
                            {tipoLabel}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono">{formatCurrency(a.monto)}</td>
                        <td className="p-3 text-right font-mono text-amber-600">
                          {formatCurrency(a.pagoSolidaridad)}
                        </td>
                        <td className="p-3 text-right font-mono text-blue-600">
                          {formatCurrency(a.pagoCredito)}
                        </td>
                        <td className="p-3 text-right font-mono text-green-600">
                          {formatCurrency(a.ahorro)}
                        </td>
                        <td className="p-3 text-gray-500 text-xs">{formatDate(a.fechaPago)}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${estColor}`}
                          >
                            {a.estado}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Créditos
            </h3>
          </div>
          <div className="p-4">
            {reporteLoading ? (
              <div className="text-center text-gray-400 py-4 text-sm">Cargando...</div>
            ) : !reporte?.creditos?.length ? (
              <div className="text-center text-gray-400 py-4 text-sm">Sin créditos registrados</div>
            ) : (
              <div className="space-y-3">
                {reporte.creditos.map((c) => (
                  <div key={c.id} className="border rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{formatCurrency(c.monto)}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          c.estado === 'activo'
                            ? 'bg-blue-100 text-blue-700'
                            : c.estado === 'pagado'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {c.estado}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                      <div>
                        <span className="block">Saldo</span>
                        <span className="font-medium text-gray-800">
                          {formatCurrency(c.saldoCapital)}
                        </span>
                      </div>
                      <div>
                        <span className="block">Cuotas</span>
                        <span className="font-medium text-gray-800">
                          {c.cuotasPagadas}/{c.cuotas}
                        </span>
                      </div>
                      <div>
                        <span className="block">Cuota</span>
                        <span className="font-medium text-gray-800">
                          {formatCurrency(c.cuotaMensual)}
                        </span>
                      </div>
                    </div>
                    {c.pagos?.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                          Últimos pagos ({c.pagos.length})
                        </summary>
                        <div className="mt-1 space-y-1">
                          {c.pagos.slice(0, 3).map((p) => (
                            <div
                              key={p.numeroCuota}
                              className="flex justify-between text-xs text-gray-500 pl-2"
                            >
                              <span>Cuota #{p.numeroCuota}</span>
                              <span>{formatCurrency(p.monto)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardStat({
  icon,
  label,
  value,
  subtitle,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
      {subtitle && <div className="text-xs mt-0.5 opacity-70">{subtitle}</div>}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
      <span className="text-gray-500 min-w-[100px]">{label}:</span>
      <span className="text-gray-900 font-medium">{value ?? '—'}</span>
    </div>
  );
}
