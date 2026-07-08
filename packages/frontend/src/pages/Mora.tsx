import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Users,
  AlertOctagon,
  Clock,
  FileSpreadsheet,
  FileText,
  Handshake,
  X,
} from 'lucide-react';
import {
  apiCalcularMora,
  apiCrearAcuerdo,
  apiListarAcuerdos,
  ApiError,
  type MoraCalculada,
  type AcuerdoPagoDTO,
} from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { downloadExport } from '../lib/api';
import { exportToExcel, exportToPDF, type ExportColumn } from '../lib/export';
import {
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  AnimatedFadeIn,
  AnimatedTableRow,
  AnimatedButton,
} from '../components/ui';

const estadoEstilo: Record<string, string> = {
  activo: 'bg-blue-50 text-blue-700 border border-blue-200',
  cumplido: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  incumplido: 'bg-red-50 text-red-700 border border-red-200',
};

export default function MoraPage() {
  const queryClient = useQueryClient();
  const [selectedSocio, setSelectedSocio] = useState<MoraCalculada | null>(null);
  const [acuerdoForm, setAcuerdoForm] = useState({ cuotas: 1, notas: '' });
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'mora' | 'acuerdos'>('mora');

  const { data: moraList, isLoading: moraLoading } = useQuery({
    queryKey: ['mora'],
    queryFn: () => apiCalcularMora(),
    refetchInterval: 15000,
  });

  const { data: acuerdosData, isLoading: acuerdosLoading } = useQuery({
    queryKey: ['acuerdos', 1],
    queryFn: () => apiListarAcuerdos(1, 20),
  });

  const acuerdoMutation = useMutation({
    mutationFn: (data: {
      socioId: string;
      montoTotal: number;
      cuotas: number;
      notas?: string | null;
    }) => apiCrearAcuerdo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acuerdos'] });
      setSelectedSocio(null);
      setAcuerdoForm({ cuotas: 1, notas: '' });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Error al crear acuerdo'),
  });

  const kpis = useMemo(() => {
    if (!moraList || moraList.length === 0) return null;
    return {
      totalAdeudado: moraList.reduce((s, m) => s + m.totalAdeudado, 0),
      totalIntereses: moraList.reduce((s, m) => s + m.interesMora, 0),
      promDias: Math.round(moraList.reduce((s, m) => s + m.diasMora, 0) / moraList.length),
      criticos: moraList.filter((m) => m.diasMora > 60).length,
    };
  }, [moraList]);

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/25">
            <AlertTriangle size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-800">Panel de Mora</h1>
            <p className="text-sm text-gray-500">
              Gestión de obligaciones vencidas y acuerdos de pago
            </p>
          </div>
        </div>
      </div>

      {kpis && (
        <AnimatedStaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <AnimatedStaggerItem>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-4 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    Total en Mora
                  </span>
                  <Users size={18} className="opacity-50" />
                </div>
                <div className="text-2xl font-bold">{moraList!.length}</div>
                <div className="text-xs mt-1 opacity-70">Socios con obligaciones vencidas</div>
              </div>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-4 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    Total Adeudado
                  </span>
                  <DollarSign size={18} className="opacity-50" />
                </div>
                <div className="text-2xl font-bold">{formatCurrency(kpis.totalAdeudado)}</div>
                <div className="text-xs mt-1 opacity-70">
                  Intereses: {formatCurrency(kpis.totalIntereses)}
                </div>
              </div>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-4 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    Promedio Días Mora
                  </span>
                  <Clock size={18} className="opacity-50" />
                </div>
                <div className="text-2xl font-bold">{kpis.promDias}</div>
                <div className="text-xs mt-1 opacity-70">Días promedio sin pago</div>
              </div>
            </div>
          </AnimatedStaggerItem>
          <AnimatedStaggerItem>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-600 to-rose-700 p-4 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                    Casos Críticos
                  </span>
                  <AlertOctagon size={18} className="opacity-50" />
                </div>
                <div className="text-2xl font-bold">{kpis.criticos}</div>
                <div className="text-xs mt-1 opacity-70">Más de 60 días en mora</div>
              </div>
            </div>
          </AnimatedStaggerItem>
        </AnimatedStaggerContainer>
      )}

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab('mora')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'mora'
              ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/25'
              : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:text-red-600 hover:shadow-md'
          }`}
        >
          Socios en Mora ({moraList?.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setTab('acuerdos')}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === 'acuerdos'
              ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/25'
              : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:text-red-600 hover:shadow-md'
          }`}
        >
          Acuerdos de Pago ({acuerdosData?.data?.length ?? 0})
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <AnimatedFadeIn key={tab}>
        {tab === 'mora' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
            {moraList && moraList.length > 0 && (
              <div className="p-3 border-b border-gray-100 flex gap-2">
                <AnimatedButton
                  onClick={() => {
                    const columns: ExportColumn[] = [
                      { header: 'Socio', key: 'socioNombre' },
                      { header: 'Días Mora', key: 'diasMora' },
                      { header: 'Adeudado', key: 'totalAdeudado' },
                      { header: 'Interés', key: 'interesMora' },
                    ];
                    exportToExcel(
                      moraList as unknown as Record<string, unknown>[],
                      columns,
                      'socios-en-mora',
                    );
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100"
                >
                  <FileSpreadsheet size={14} /> Excel
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => {
                    const columns: ExportColumn[] = [
                      { header: 'Socio', key: 'socioNombre' },
                      { header: 'Días Mora', key: 'diasMora' },
                      { header: 'Adeudado', key: 'totalAdeudado' },
                      { header: 'Interés', key: 'interesMora' },
                    ];
                    exportToPDF(
                      moraList as unknown as Record<string, unknown>[],
                      columns,
                      'Socios en Mora',
                      'socios-en-mora',
                    );
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100"
                >
                  <FileText size={14} /> PDF
                </AnimatedButton>
              </div>
            )}
            {moraLoading && (
              <div className="p-12 text-center text-gray-400">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Cargando...
              </div>
            )}
            {moraList && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                      <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Socio
                      </th>
                      <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Aportes Vencidos
                      </th>
                      <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Total Adeudado
                      </th>
                      <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Días Mora
                      </th>
                      <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Interés Mora
                      </th>
                      <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {moraList.map((m: MoraCalculada, idx: number) => (
                      <AnimatedTableRow key={m.socioId} index={idx}>
                        <td className="p-3.5 font-medium text-gray-900">{m.socioNombre}</td>
                        <td className="p-3.5 text-center">{m.aportesVencidos}</td>
                        <td className="p-3.5 text-right font-mono text-sm font-semibold text-navy-700">
                          {formatCurrency(m.totalAdeudado)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              m.diasMora > 60
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : m.diasMora > 30
                                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <AlertTriangle size={11} />
                            {m.diasMora} días
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono text-sm">
                          {formatCurrency(m.interesMora)}
                        </td>
                        <td className="p-3.5 text-center">
                          <AnimatedButton
                            onClick={() => setSelectedSocio(m)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg text-xs font-medium shadow-sm hover:from-red-700 hover:to-orange-600 transition-all"
                          >
                            <Handshake size={13} /> Acuerdo
                          </AnimatedButton>
                        </td>
                      </AnimatedTableRow>
                    ))}
                    {moraList.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">
                          No hay socios en mora
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'acuerdos' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
            {acuerdosData && acuerdosData.data.length > 0 && (
              <div className="p-3 border-b border-gray-100 flex gap-2">
                <AnimatedButton
                  onClick={() => downloadExport('acuerdos-pago', 'xlsx')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100"
                >
                  <FileSpreadsheet size={14} /> Excel
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => downloadExport('acuerdos-pago', 'pdf')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100"
                >
                  <FileText size={14} /> PDF
                </AnimatedButton>
              </div>
            )}
            {acuerdosLoading && (
              <div className="p-12 text-center text-gray-400">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Cargando...
              </div>
            )}
            {acuerdosData && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                      <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Socio ID
                      </th>
                      <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Monto Total
                      </th>
                      <th className="text-right p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Cuota
                      </th>
                      <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Cuotas
                      </th>
                      <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                        Inicio
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {acuerdosData.data.map((a: AcuerdoPagoDTO, idx: number) => {
                      const montoTotal =
                        typeof a.montoTotal === 'number' ? a.montoTotal : a.montoTotal._valor;
                      const montoCuota =
                        typeof a.montoCuota === 'number' ? a.montoCuota : a.montoCuota._valor;
                      return (
                        <AnimatedTableRow key={a.id} index={idx}>
                          <td className="p-3.5 font-mono text-xs text-gray-500">
                            {a.socioId.slice(0, 8)}...
                          </td>
                          <td className="p-3.5 text-right font-mono text-sm font-semibold text-navy-700">
                            {formatCurrency(montoTotal)}
                          </td>
                          <td className="p-3.5 text-right font-mono text-sm">
                            {formatCurrency(montoCuota)}
                          </td>
                          <td className="p-3.5 text-center">{a.cuotas}</td>
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoEstilo[a.estado] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                            >
                              {a.estado === 'cumplido' && <CheckCircle size={11} />}
                              {a.estado}
                            </span>
                          </td>
                          <td className="p-3.5 text-gray-600 text-xs">
                            {a.fechaInicio ? new Date(a.fechaInicio).toLocaleDateString() : '—'}
                          </td>
                        </AnimatedTableRow>
                      );
                    })}
                    {acuerdosData.data.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">
                          No hay acuerdos de pago
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </AnimatedFadeIn>

      {selectedSocio && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedSocio(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-md">
                  <Handshake size={18} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-navy-800">Acuerdo de Pago</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSocio(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-3 mb-4">
              <p className="text-sm text-navy-700">
                <span className="font-medium">Socio:</span> {selectedSocio.socioNombre}
              </p>
              <p className="text-sm text-navy-700 mt-1">
                <span className="font-medium">Total Adeudado:</span>{' '}
                <span className="font-mono font-semibold text-red-600">
                  {formatCurrency(selectedSocio.totalAdeudado)}
                </span>
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="num-cuotas"
                  className="block text-sm font-medium text-navy-700 mb-1.5"
                >
                  Número de Cuotas
                </label>
                <input
                  id="num-cuotas"
                  type="number"
                  min={1}
                  value={acuerdoForm.cuotas}
                  onChange={(e) =>
                    setAcuerdoForm((p) => ({ ...p, cuotas: Number(e.target.value) }))
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                />
                {acuerdoForm.cuotas > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Cuota estimada:{' '}
                    {formatCurrency(selectedSocio.totalAdeudado / acuerdoForm.cuotas)}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="notas" className="block text-sm font-medium text-navy-700 mb-1.5">
                  Notas
                </label>
                <textarea
                  id="notas"
                  rows={2}
                  value={acuerdoForm.notas}
                  onChange={(e) => setAcuerdoForm((p) => ({ ...p, notas: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <AnimatedButton
                  onClick={() =>
                    acuerdoMutation.mutate({
                      socioId: selectedSocio.socioId,
                      montoTotal: selectedSocio.totalAdeudado,
                      cuotas: acuerdoForm.cuotas,
                      notas: acuerdoForm.notas || null,
                    })
                  }
                  disabled={acuerdoMutation.isPending}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-red-500/25 hover:from-red-700 hover:to-orange-600 disabled:opacity-50 transition-all"
                >
                  {acuerdoMutation.isPending ? 'Creando...' : 'Crear Acuerdo'}
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => setSelectedSocio(null)}
                  className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
