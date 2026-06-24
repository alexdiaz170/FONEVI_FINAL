import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Calculator,
  PieChart,
} from 'lucide-react';
import {
  apiListarSocios,
  apiCrearCredito,
  apiCalcularCapacidad,
  type CrearCreditoDTO,
  type SocioDTO,
} from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import { AnimatedFadeIn, AnimatedButton } from '../../components/ui';

const MESES_DISTRIBUCION = [3, 6, 9, 12, 18, 24, 36] as const;

export default function CreditosCrear() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CrearCreditoDTO>({
    socioId: '',
    monto: 0,
    tasaInteresMensual: 2,
    numeroCuotas: 3,
    fechaDesembolso: new Date().toISOString().split('T')[0],
    proposito: '',
    notas: '',
  });
  const [showAmort, setShowAmort] = useState(false);

  const { data: socios } = useQuery({
    queryKey: ['socios-credito'],
    queryFn: () => apiListarSocios(1, 200),
  });

  const { data: capacidad } = useQuery({
    queryKey: ['capacidad', form.socioId],
    queryFn: () => apiCalcularCapacidad(form.socioId).then((r) => r.capacidadMaxima),
    enabled: !!form.socioId,
    staleTime: 0,
  });

  const socioSeleccionado = socios?.data?.find((s: SocioDTO) => s.id === form.socioId);

  const cuotaMensual =
    form.monto > 0 && form.numeroCuotas > 0
      ? form.monto *
        (((form.tasaInteresMensual / 100) *
          Math.pow(1 + form.tasaInteresMensual / 100, form.numeroCuotas)) /
          (Math.pow(1 + form.tasaInteresMensual / 100, form.numeroCuotas) - 1))
      : 0;

  const generarAmortizacion = () => {
    if (!form.monto || !form.numeroCuotas) return [];
    const tasaMensual = form.tasaInteresMensual / 100;
    const cuota = cuotaMensual;
    let saldo = form.monto;
    const tabla: { n: number; cuota: number; interes: number; amort: number; saldo: number }[] = [];
    for (let i = 1; i <= form.numeroCuotas; i++) {
      const interes = saldo * tasaMensual;
      const amort = cuota - interes;
      saldo = i === form.numeroCuotas ? 0 : saldo - amort;
      tabla.push({ n: i, cuota, interes, amort, saldo: Math.round(saldo * 100) / 100 });
    }
    return tabla;
  };

  const amortizacion = form.monto > 0 ? generarAmortizacion() : [];

  const crearMutation = useMutation({
    mutationFn: (data: CrearCreditoDTO) =>
      apiCrearCredito({
        socioId: data.socioId,
        monto: data.monto,
        tasaMensual: data.tasaInteresMensual,
        cuotas: data.numeroCuotas,
        fechaDesembolso: data.fechaDesembolso,
        proposito: data.proposito || null,
        notas: data.notas || null,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['creditos'] });
      navigate('/creditos', {
        state: { success: `Crédito por ${formatCurrency(form.monto)} creado exitosamente` },
      });
    },
  });

  const totalInteres = amortizacion.reduce((acc, row) => acc + row.interes, 0);

  const validar = () => {
    if (!form.socioId) return 'Seleccione un socio';
    if (form.monto <= 0) return 'Ingrese un monto válido';
    if (capacidad && form.monto > capacidad) return 'El monto excede la capacidad máxima del socio';
    return null;
  };

  const error =
    form.socioId && !socios?.data?.find((s: SocioDTO) => s.id === form.socioId)
      ? 'Socio no encontrado'
      : null;

  return (
    <div className="max-w-3xl mx-auto">
      <AnimatedFadeIn>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-navy-800 mb-2">Nuevo Crédito</h2>
          <p className="text-sm text-gray-500 mb-6">
            Complete la información para registrar el préstamo
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const msg = validar();
              if (msg) {
                alert(msg);
                return;
              }
              crearMutation.mutate(form);
            }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-navy-700 mb-1.5">Socio</label>
                <select
                  value={form.socioId}
                  onChange={(e) => setForm({ ...form, socioId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                >
                  <option value="">Seleccione un socio</option>
                  {socios?.data?.map((s: SocioDTO) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} — {s.numeroDocumento}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  Monto solicitado
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                    $
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.monto || ''}
                    onChange={(e) => setForm({ ...form, monto: Number(e.target.value) })}
                    className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                  />
                </div>
                {capacidad && (
                  <p
                    className={`mt-1 text-xs flex items-center gap-1 ${form.monto > capacidad ? 'text-red-500' : 'text-emerald-600'}`}
                  >
                    {form.monto > capacidad ? <AlertCircle size={12} /> : <CheckCircle size={12} />}
                    Capacidad máxima: {formatCurrency(capacidad)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  Tasa interés mensual (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={form.tasaInteresMensual || ''}
                    onChange={(e) =>
                      setForm({ ...form, tasaInteresMensual: Number(e.target.value) })
                    }
                    className="w-full pr-7 pl-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  Número de cuotas
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MESES_DISTRIBUCION.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setForm({ ...form, numeroCuotas: m })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        form.numeroCuotas === m
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {m} meses
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  Fecha de desembolso
                </label>
                <input
                  type="date"
                  value={form.fechaDesembolso}
                  onChange={(e) => setForm({ ...form, fechaDesembolso: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  Propósito del crédito
                </label>
                <input
                  type="text"
                  value={form.proposito}
                  placeholder="Ej: Capital de trabajo, mejora de vivienda..."
                  onChange={(e) => setForm({ ...form, proposito: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-navy-700 mb-1.5">
                  Notas (opcional)
                </label>
                <textarea
                  rows={2}
                  value={form.notas}
                  placeholder="Notas internas..."
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all resize-none"
                />
              </div>
            </div>

            {form.socioId && socioSeleccionado && (
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/10 flex items-center justify-center shrink-0">
                    <Calculator size={16} className="text-purple-600" />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-navy-800 mb-1">Resumen del crédito</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Capital</span>
                        <p className="font-mono font-semibold text-navy-700">
                          {formatCurrency(form.monto)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Cuota mensual</span>
                        <p className="font-mono font-semibold text-purple-700">
                          {formatCurrency(cuotaMensual)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Plazo</span>
                        <p className="font-semibold text-navy-700">{form.numeroCuotas} meses</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total intereses</span>
                        <p className="font-mono font-semibold text-amber-600">
                          {formatCurrency(totalInteres)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {amortizacion.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAmort(!showAmort)}
                  className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-navy-700 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <PieChart size={16} className="text-purple-600" />
                    Tabla de amortización
                  </div>
                  {showAmort ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {showAmort && (
                  <div className="overflow-x-auto border-t border-gray-100">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500">
                          <th className="text-left p-2.5 font-semibold">N°</th>
                          <th className="text-right p-2.5 font-semibold">Cuota</th>
                          <th className="text-right p-2.5 font-semibold">Interés</th>
                          <th className="text-right p-2.5 font-semibold text-emerald-600">
                            Amortización
                          </th>
                          <th className="text-right p-2.5 font-semibold">Saldo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {amortizacion.map((row) => (
                          <tr
                            key={row.n}
                            className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="p-2.5 font-medium text-gray-600">{row.n}</td>
                            <td className="p-2.5 text-right font-mono">
                              {formatCurrency(row.cuota)}
                            </td>
                            <td className="p-2.5 text-right font-mono text-amber-600">
                              {formatCurrency(row.interes)}
                            </td>
                            <td className="p-2.5 text-right font-mono text-emerald-600">
                              {formatCurrency(row.amort)}
                            </td>
                            <td className="p-2.5 text-right font-mono text-gray-700">
                              {formatCurrency(row.saldo)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <AnimatedButton
                type="button"
                onClick={() => navigate('/creditos')}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </AnimatedButton>
              <AnimatedButton
                type="submit"
                disabled={crearMutation.isPending}
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl shadow-lg shadow-purple-500/25 hover:from-purple-700 hover:to-purple-600 disabled:opacity-50 transition-all"
              >
                {crearMutation.isPending ? 'Creando...' : 'Crear Crédito'}
              </AnimatedButton>
            </div>
          </form>
        </div>
      </AnimatedFadeIn>
    </div>
  );
}
