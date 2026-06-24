import { useParams, Link } from 'react-router-dom';
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
  FileSpreadsheet,
  FileText,
  User,
  BadgeCheck,
  Banknote,
} from 'lucide-react';
import { apiObtenerSocio, apiGetReporteEstadoCuentaSocio } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import { useState } from 'react';
import { apiActualizarSocio } from '../../lib/api';
import { exportToExcel, exportToPDF, type ExportColumn } from '../../lib/export';
import {
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  GlassCard,
  CardPanel,
  AnimatedButton,
  AnimatedFadeIn,
  AnimatedTableRow,
} from '../../components/ui';

export default function SociosPerfil() {
  const { id } = useParams<{ id: string }>();
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

  const aportesColumns: ExportColumn[] = [
    { header: 'Periodo', key: 'periodoNombre' },
    { header: 'Tipo', key: 'tipoOperacion' },
    { header: 'Monto', key: 'monto', format: (v) => formatCurrency(Number(v)) },
    { header: 'Solidaridad', key: 'pagoSolidaridad', format: (v) => formatCurrency(Number(v)) },
    { header: 'A Crédito', key: 'pagoCredito', format: (v) => formatCurrency(Number(v)) },
    { header: 'Ahorro', key: 'ahorro', format: (v) => formatCurrency(Number(v)) },
    { header: 'Fecha', key: 'fechaPago', format: (v) => formatDate(String(v)) },
    { header: 'Estado', key: 'estado' },
  ];

  const creditosColumns: ExportColumn[] = [
    { header: 'Monto', key: 'monto', format: (v) => formatCurrency(Number(v)) },
    { header: 'Saldo', key: 'saldoCapital', format: (v) => formatCurrency(Number(v)) },
    { header: 'Cuotas', key: 'cuotas' },
    { header: 'Cuotas Pagadas', key: 'cuotasPagadas' },
    { header: 'Estado', key: 'estado' },
  ];

  function handleExportAportes() {
    if (!reporte?.aportes?.length) return;
    exportToExcel(
      reporte.aportes as unknown as Record<string, unknown>[],
      aportesColumns,
      `aportes-${id}`,
    );
  }

  async function handleExportAportesPDF() {
    if (!reporte?.aportes?.length) return;
    await exportToPDF(
      reporte.aportes as unknown as Record<string, unknown>[],
      aportesColumns,
      `Aportes - ${socio?.nombre ?? 'Socio'}`,
      `aportes-${id}`,
    );
  }

  function handleExportCreditos() {
    if (!reporte?.creditos?.length) return;
    const data = reporte.creditos.map((c) => ({
      monto: c.monto,
      saldoCapital: c.saldoCapital,
      cuotas: c.cuotas,
      cuotasPagadas: c.cuotasPagadas,
      estado: c.estado,
    }));
    exportToExcel(data as unknown as Record<string, unknown>[], creditosColumns, `creditos-${id}`);
  }

  async function handleExportCreditosPDF() {
    if (!reporte?.creditos?.length) return;
    const data = reporte.creditos.map((c) => ({
      monto: c.monto,
      saldoCapital: c.saldoCapital,
      cuotas: c.cuotas,
      cuotasPagadas: c.cuotasPagadas,
      estado: c.estado,
    }));
    await exportToPDF(
      data as unknown as Record<string, unknown>[],
      creditosColumns,
      `Créditos - ${socio?.nombre ?? 'Socio'}`,
      `creditos-${id}`,
    );
  }

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
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-navy-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (queryError || !socio)
    return (
      <div className="text-center py-16 text-red-500">
        Error: {(queryError as ApiError)?.message ?? 'Socio no encontrado'}
      </div>
    );

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-72 h-72 bg-navy-500/10 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-navy-500/10 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <AnimatedStaggerContainer>
        <AnimatedStaggerItem>
          <Link
            to="/socios"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-4 transition-colors"
          >
            <ArrowLeft size={15} /> Volver a lista
          </Link>
        </AnimatedStaggerItem>

        {/* Header */}
        <AnimatedStaggerItem>
          <GlassCard className="mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-navy-500 to-blue-400 flex items-center justify-center shadow-lg shadow-navy-500/25 shrink-0">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{socio.nombre}</h2>
                  <p className="text-sm text-gray-500 font-mono mt-0.5">
                    {socio.codigoSocio ?? socio.codigo}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        socio.estado === 'activo'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : socio.estado === 'mora'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          socio.estado === 'activo'
                            ? 'bg-emerald-500'
                            : socio.estado === 'mora'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                        }`}
                      />
                      {socio.estado}
                    </span>
                  </div>
                </div>
              </div>
              {!editando && (
                <AnimatedButton
                  onClick={handleEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-navy-600 to-navy-500 text-white rounded-xl text-sm font-medium hover:from-navy-700 hover:to-navy-600 shadow-lg shadow-navy-500/25 transition-all"
                >
                  <Pencil size={15} /> Editar Socio
                </AnimatedButton>
              )}
            </div>
          </GlassCard>
        </AnimatedStaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Info Personal */}
          <AnimatedStaggerItem className="lg:col-span-2">
            <GlassCard>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy-100 to-navy-50 flex items-center justify-center">
                  <Award size={16} className="text-navy-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Información Personal</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoBlock icon={<Mail size={15} />} label="Email" value={socio.email} />
                <InfoBlock icon={<Phone size={15} />} label="Teléfono" value={socio.telefono} />
                <InfoBlock
                  icon={<BadgeCheck size={15} />}
                  label="Documento"
                  value={`${socio.tipoDocumento.toUpperCase()}: ${socio.numeroDocumento}`}
                />
                <InfoBlock
                  icon={<Calendar size={15} />}
                  label="Fecha Ingreso"
                  value={formatDate(socio.fechaIngreso)}
                />
                <InfoBlock icon={<MapPin size={15} />} label="Sede" value={socio.sede} />
                <InfoBlock icon={<Award size={15} />} label="Cargo" value={socio.cargo} />
              </div>
            </GlassCard>
          </AnimatedStaggerItem>

          {/* Financiero */}
          <AnimatedStaggerItem>
            <GlassCard>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                  <Banknote size={16} className="text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Financiero</h3>
              </div>
              <InfoBlock
                icon={<PiggyBank size={15} />}
                label="Ahorro Acumulado"
                value={formatCurrency(socio.ahorroAcumulado)}
                highlight
              />
            </GlassCard>
          </AnimatedStaggerItem>
        </div>

        {/* Edit Form */}
        {editando && (
          <AnimatedFadeIn>
            <GlassCard className="mb-6">
              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                  <Pencil size={16} className="text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800">Editar Socio</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {['nombre', 'email', 'telefono', 'cargo', 'sede'].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 capitalize">
                      {field === 'nombre' ? 'Nombre completo' : field}
                    </label>
                    <input
                      name={field}
                      value={form[field] ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 transition-all"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <AnimatedButton
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-navy-600 to-navy-500 text-white rounded-xl text-sm font-medium hover:from-navy-700 hover:to-navy-600 shadow-lg shadow-navy-500/25 disabled:opacity-50 transition-all"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => setEditando(false)}
                  className="px-6 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-white transition-all"
                >
                  Cancelar
                </AnimatedButton>
              </div>
            </GlassCard>
          </AnimatedFadeIn>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              icon: <PiggyBank size={20} />,
              label: 'Ahorro Acumulado',
              value: formatCurrency(socio.ahorroAcumulado),
              gradient: 'from-blue-600 to-blue-500',
            },
            {
              icon: <TrendingUp size={20} />,
              label: 'Total Aportado',
              value: formatCurrency(totalAportado),
              gradient: 'from-green-600 to-emerald-500',
            },
            {
              icon: <CreditCard size={20} />,
              label: 'Créditos Activos',
              value: `${creditosActivos.length}`,
              sub: saldoPendiente > 0 ? `Saldo: ${formatCurrency(saldoPendiente)}` : undefined,
              gradient: 'from-purple-600 to-purple-500',
            },
            {
              icon: <DollarSign size={20} />,
              label: 'Total Créditos',
              value: formatCurrency(totalCreditos),
              gradient: 'from-amber-500 to-orange-500',
            },
          ].map((stat) => (
            <AnimatedStaggerItem key={stat.label}>
              <div
                className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-4 text-white shadow-lg relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    {stat.icon}
                    <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                      {stat.label}
                    </span>
                  </div>
                  <div className="text-lg font-bold">{stat.value}</div>
                  {stat.sub && <div className="text-xs mt-0.5 opacity-70">{stat.sub}</div>}
                </div>
              </div>
            </AnimatedStaggerItem>
          ))}
        </div>

        {/* Aportes Table */}
        <AnimatedStaggerItem>
          <GlassCard className="mb-6" padding={false}>
            <div className="p-4 border-b border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-navy-600" />
                <h3 className="font-semibold text-gray-800">Aportes</h3>
              </div>
              {reporte?.aportes && reporte.aportes.length > 0 && (
                <div className="flex items-center gap-2">
                  <AnimatedButton
                    onClick={handleExportAportes}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100"
                  >
                    <FileSpreadsheet size={14} /> Excel
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={handleExportAportesPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100"
                  >
                    <FileText size={14} /> PDF
                  </AnimatedButton>
                </div>
              )}
            </div>
            {reporteLoading ? (
              <div className="text-center text-gray-400 py-8 text-sm">Cargando...</div>
            ) : !reporte?.aportes?.length ? (
              <div className="text-center text-gray-400 py-8 text-sm">Sin aportes registrados</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="text-left p-3.5 font-semibold">Periodo</th>
                      <th className="text-left p-3.5 font-semibold">Tipo</th>
                      <th className="text-right p-3.5 font-semibold">Monto</th>
                      <th className="text-right p-3.5 font-semibold">Solidaridad</th>
                      <th className="text-right p-3.5 font-semibold">A Crédito</th>
                      <th className="text-right p-3.5 font-semibold">Ahorro</th>
                      <th className="text-left p-3.5 font-semibold">Fecha</th>
                      <th className="text-center p-3.5 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.aportes.map((a, idx) => {
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
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : a.estado === 'mora' || a.estado === 'vencido'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200';
                      return (
                        <AnimatedTableRow key={a.id} index={idx}>
                          <td className="p-3.5 font-medium text-gray-900">{a.periodoNombre}</td>
                          <td className="p-3.5">
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${tipoColor}`}
                            >
                              {tipoLabel}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-mono">{formatCurrency(a.monto)}</td>
                          <td className="p-3.5 text-right font-mono text-amber-600">
                            {formatCurrency(a.pagoSolidaridad)}
                          </td>
                          <td className="p-3.5 text-right font-mono text-blue-600">
                            {formatCurrency(a.pagoCredito)}
                          </td>
                          <td className="p-3.5 text-right font-mono text-emerald-600">
                            {formatCurrency(a.ahorro)}
                          </td>
                          <td className="p-3.5 text-gray-500 text-xs">{formatDate(a.fechaPago)}</td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${estColor}`}
                            >
                              {a.estado}
                            </span>
                          </td>
                        </AnimatedTableRow>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </AnimatedStaggerItem>

        {/* Creditos */}
        <AnimatedStaggerItem>
          <GlassCard padding={false}>
            <div className="p-4 border-b border-white/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-purple-600" />
                <h3 className="font-semibold text-gray-800">Créditos</h3>
              </div>
              {reporte?.creditos && reporte.creditos.length > 0 && (
                <div className="flex items-center gap-2">
                  <AnimatedButton
                    onClick={handleExportCreditos}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100"
                  >
                    <FileSpreadsheet size={14} /> Excel
                  </AnimatedButton>
                  <AnimatedButton
                    onClick={handleExportCreditosPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100"
                  >
                    <FileText size={14} /> PDF
                  </AnimatedButton>
                </div>
              )}
            </div>
            <div className="p-4">
              {reporteLoading ? (
                <div className="text-center text-gray-400 py-4 text-sm">Cargando...</div>
              ) : !reporte?.creditos?.length ? (
                <div className="text-center text-gray-400 py-4 text-sm">
                  Sin créditos registrados
                </div>
              ) : (
                <div className="space-y-3">
                  {reporte.creditos.map((c) => (
                    <div
                      key={c.id}
                      className="border border-gray-200 rounded-xl p-4 text-sm hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(c.monto)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            c.estado === 'activo'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : c.estado === 'pagado'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-50 text-gray-600 border border-gray-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              c.estado === 'activo'
                                ? 'bg-blue-500'
                                : c.estado === 'pagado'
                                  ? 'bg-emerald-500'
                                  : 'bg-gray-400'
                            }`}
                          />
                          {c.estado}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 rounded-lg p-2.5">
                          <span className="block text-xs text-gray-500 mb-0.5">Saldo</span>
                          <span className="font-medium text-gray-800 font-mono">
                            {formatCurrency(c.saldoCapital)}
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2.5">
                          <span className="block text-xs text-gray-500 mb-0.5">Cuotas</span>
                          <span className="font-medium text-gray-800">
                            {c.cuotasPagadas}/{c.cuotas}
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2.5">
                          <span className="block text-xs text-gray-500 mb-0.5">Cuota</span>
                          <span className="font-medium text-gray-800 font-mono">
                            {formatCurrency(c.cuotaMensual)}
                          </span>
                        </div>
                      </div>
                      {c.pagos?.length > 0 && (
                        <details className="mt-3">
                          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                            Pagos realizados ({c.pagos.length})
                          </summary>
                          <div className="mt-3 overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50 text-gray-500">
                                  <th className="text-left p-2 font-medium">N°</th>
                                  <th className="text-right p-2 font-medium">Monto</th>
                                  <th className="text-right p-2 font-medium">Capital</th>
                                  <th className="text-right p-2 font-medium">Interés</th>
                                  <th className="text-left p-2 font-medium">Fecha</th>
                                </tr>
                              </thead>
                              <tbody>
                                {c.pagos.map((p) => (
                                  <tr
                                    key={p.numeroCuota}
                                    className="border-t border-gray-100 hover:bg-gray-50/50"
                                  >
                                    <td className="p-2">{p.numeroCuota}</td>
                                    <td className="p-2 text-right font-mono">
                                      {formatCurrency(p.monto)}
                                    </td>
                                    <td className="p-2 text-right font-mono">
                                      {formatCurrency(p.montoCapital)}
                                    </td>
                                    <td className="p-2 text-right font-mono">
                                      {formatCurrency(p.montoInteres)}
                                    </td>
                                    <td className="p-2">{formatDate(p.fechaPago)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </AnimatedStaggerItem>
      </AnimatedStaggerContainer>
    </div>
  );
}

function InfoBlock({
  icon,
  label,
  value,
  highlight,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number | null;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-gray-100">
      {icon && (
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
        <p
          className={`text-sm truncate ${
            highlight ? 'font-bold text-navy-700 font-mono' : 'font-medium text-gray-900'
          }`}
        >
          {value ?? '—'}
        </p>
      </div>
    </div>
  );
}
