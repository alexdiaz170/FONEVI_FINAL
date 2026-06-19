import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import {
  apiCalcularMora,
  apiCrearAcuerdo,
  apiListarAcuerdos,
  ApiError,
  type MoraCalculada,
  type AcuerdoPagoDTO,
} from '../lib/api';
import { formatCurrency } from '../lib/utils';

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-800 mb-6">Panel de Mora</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('mora')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'mora' ? 'bg-navy-700 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
        >
          Socios en Mora ({moraList?.length ?? 0})
        </button>
        <button
          onClick={() => setTab('acuerdos')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${tab === 'acuerdos' ? 'bg-navy-700 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}
        >
          Acuerdos de Pago ({acuerdosData?.data?.length ?? 0})
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      {tab === 'mora' && (
        <div className="bg-white rounded-lg shadow">
          {moraLoading && <div className="p-8 text-center text-gray-400">Cargando...</div>}
          {moraList && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="text-left p-3 font-medium">Socio</th>
                    <th className="text-center p-3 font-medium">Aportes Vencidos</th>
                    <th className="text-right p-3 font-medium">Total Adeudado</th>
                    <th className="text-center p-3 font-medium">Días Mora</th>
                    <th className="text-right p-3 font-medium">Interés Mora</th>
                    <th className="text-center p-3 font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {moraList.map((m: MoraCalculada) => (
                    <tr key={m.socioId} className="border-t hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-900">{m.socioNombre}</td>
                      <td className="p-3 text-center">{m.aportesVencidos}</td>
                      <td className="p-3 text-right font-mono text-sm">
                        {formatCurrency(m.totalAdeudado)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.diasMora > 60 ? 'bg-red-100 text-red-700' : m.diasMora > 30 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}
                        >
                          <AlertTriangle size={12} />
                          {m.diasMora} días
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-sm">
                        {formatCurrency(m.interesMora)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelectedSocio(m)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-navy-600 text-white rounded text-xs hover:bg-navy-700"
                        >
                          <DollarSign size={14} /> Acuerdo
                        </button>
                      </td>
                    </tr>
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
        <div className="bg-white rounded-lg shadow">
          {acuerdosLoading && <div className="p-8 text-center text-gray-400">Cargando...</div>}
          {acuerdosData && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="text-left p-3 font-medium">Socio ID</th>
                    <th className="text-right p-3 font-medium">Monto Total</th>
                    <th className="text-right p-3 font-medium">Cuota</th>
                    <th className="text-center p-3 font-medium">Cuotas</th>
                    <th className="text-left p-3 font-medium">Estado</th>
                    <th className="text-left p-3 font-medium">Inicio</th>
                  </tr>
                </thead>
                <tbody>
                  {acuerdosData.data.map((a: AcuerdoPagoDTO) => {
                    const montoTotal =
                      typeof a.montoTotal === 'number' ? a.montoTotal : a.montoTotal._valor;
                    const montoCuota =
                      typeof a.montoCuota === 'number' ? a.montoCuota : a.montoCuota._valor;
                    return (
                      <tr key={a.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-mono text-xs">{a.socioId.slice(0, 8)}...</td>
                        <td className="p-3 text-right font-mono text-sm">
                          {formatCurrency(montoTotal)}
                        </td>
                        <td className="p-3 text-right font-mono text-sm">
                          {formatCurrency(montoCuota)}
                        </td>
                        <td className="p-3 text-center">{a.cuotas}</td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${a.estado === 'activo' ? 'bg-blue-100 text-blue-700' : a.estado === 'cumplido' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                          >
                            {a.estado === 'cumplido' && <CheckCircle size={12} />}
                            {a.estado}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600 text-xs">
                          {a.fechaInicio ? new Date(a.fechaInicio).toLocaleDateString() : '—'}
                        </td>
                      </tr>
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

      {selectedSocio && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedSocio(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Acuerdo de Pago</h3>
            <p className="text-sm text-gray-600 mb-4">
              Socio: <strong>{selectedSocio.socioNombre}</strong>
              <br />
              Total Adeudado: <strong>{formatCurrency(selectedSocio.totalAdeudado)}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Cuotas
                </label>
                <input
                  type="number"
                  min={1}
                  value={acuerdoForm.cuotas}
                  onChange={(e) =>
                    setAcuerdoForm((p) => ({ ...p, cuotas: Number(e.target.value) }))
                  }
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
                {acuerdoForm.cuotas > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Cuota estimada:{' '}
                    {formatCurrency(selectedSocio.totalAdeudado / acuerdoForm.cuotas)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  rows={2}
                  value={acuerdoForm.notas}
                  onChange={(e) => setAcuerdoForm((p) => ({ ...p, notas: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() =>
                    acuerdoMutation.mutate({
                      socioId: selectedSocio.socioId,
                      montoTotal: selectedSocio.totalAdeudado,
                      cuotas: acuerdoForm.cuotas,
                      notas: acuerdoForm.notas || null,
                    })
                  }
                  disabled={acuerdoMutation.isPending}
                  className="px-6 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
                >
                  {acuerdoMutation.isPending ? 'Creando...' : 'Crear Acuerdo'}
                </button>
                <button
                  onClick={() => setSelectedSocio(null)}
                  className="px-6 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
