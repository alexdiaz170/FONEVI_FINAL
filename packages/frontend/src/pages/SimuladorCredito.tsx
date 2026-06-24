import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calculator, PiggyBank, BadgeCheck, Clock, TrendingUp, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  apiMiDashboard,
  apiCalcularCredito,
  ApiError,
  type AmortizacionPreviewDTO,
} from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';
import { AnimatedFadeIn, AnimatedStaggerContainer, AnimatedStaggerItem } from '../components/ui';

export default function SimuladorCreditoPage() {
  const usuario = useAuthStore((s) => s.usuario);
  if (usuario?.rol === 'socio') return <SocioSimulator />;
  return <AdminSimulator />;
}

function AdminSimulator() {
  const { data, isLoading } = useQuery({
    queryKey: ['config-simulator'],
    queryFn: async () => {
      const res = await fetch('/api/configuracion');
      if (!res.ok) throw new Error('Error al cargar config');
      const json = await res.json();
      return json.data ?? json;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-60 animate-pulse" />
        <div className="h-64 bg-white/80 rounded-2xl animate-pulse border border-gray-100" />
      </div>
    );
  }

  const config = {
    tasaInteresMensual: Number(data?.tasa_interes_mensual ?? data?.tasaInteresMensual ?? 1),
    multiplicadorMaximoCredito: Number(
      data?.multiplicador_maximo_credito ?? data?.multiplicadorMaximoCredito ?? 4,
    ),
    porcentajeSeguro: Number(data?.porcentaje_seguro ?? data?.porcentajeSeguro ?? 0.5),
  };

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-72 h-72 bg-navy-500/5 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/dashboard"
          className="p-2 rounded-xl bg-white/80 border border-gray-200 text-gray-500 hover:text-navy-600 hover:bg-white transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-600 to-navy-500 flex items-center justify-center shadow-lg shadow-navy-500/25">
          <Calculator size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Simulador de Crédito</h1>
          <p className="text-sm text-gray-500">Simulación libre para consulta</p>
        </div>
      </div>

      <SimuladorFormAdmin
        tasaInteres={config.tasaInteresMensual}
        porcentajeSeguro={config.porcentajeSeguro}
      />
    </div>
  );
}

function SocioSimulator() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['mi-dashboard'],
    queryFn: () => apiMiDashboard(),
  });

  if (isLoading)
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-60 animate-pulse" />
        <div className="h-64 bg-white/80 rounded-2xl animate-pulse border border-gray-100" />
      </div>
    );
  if (error)
    return <div className="text-center text-red-500">Error: {(error as ApiError).message}</div>;
  if (!data) return null;

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-72 h-72 bg-navy-500/5 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/dashboard"
          className="p-2 rounded-xl bg-white/80 border border-gray-200 text-gray-500 hover:text-navy-600 hover:bg-white transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-600 to-navy-500 flex items-center justify-center shadow-lg shadow-navy-500/25">
          <Calculator size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Simulador de Crédito</h1>
          <p className="text-sm text-gray-500">Calcula tu crédito, {data.socio.nombre}</p>
        </div>
      </div>

      <AnimatedStaggerContainer className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <AnimatedStaggerItem>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Ahorro Acumulado
              </span>
              <p className="text-2xl font-bold font-mono mt-1">
                {formatCurrency(data.socio.ahorroAcumulado)}
              </p>
            </div>
          </div>
        </AnimatedStaggerItem>
        <AnimatedStaggerItem>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-600 to-navy-500 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Capacidad Total
              </span>
              <p className="text-2xl font-bold font-mono mt-1">
                {formatCurrency(
                  Math.round(data.socio.ahorroAcumulado * data.config.multiplicadorMaximoCredito),
                )}
              </p>
              <p className="text-xs mt-1 opacity-70">×{data.config.multiplicadorMaximoCredito}</p>
            </div>
          </div>
        </AnimatedStaggerItem>
        <AnimatedStaggerItem>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 to-orange-500 p-4 text-white shadow-lg">
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-wider opacity-80">
                Tasa Mensual
              </span>
              <p className="text-2xl font-bold font-mono mt-1">{data.config.tasaInteresMensual}%</p>
              <p className="text-xs mt-1 opacity-70">Interés + seguro</p>
            </div>
          </div>
        </AnimatedStaggerItem>
      </AnimatedStaggerContainer>

      <AnimatedFadeIn>
        <SimuladorForm
          ahorroAcumulado={data.socio.ahorroAcumulado}
          multiplicador={data.config.multiplicadorMaximoCredito}
          tasaInteres={data.config.tasaInteresMensual}
          porcentajeSeguro={data.config.porcentajeSeguro}
          deudaActiva={data.creditos
            .filter((c) => c.estado === 'activo' || c.estado === 'pendiente')
            .reduce((sum, c) => sum + c.saldoCapital, 0)}
        />
      </AnimatedFadeIn>
    </div>
  );
}

function SimuladorFormAdmin({
  tasaInteres,
  porcentajeSeguro,
}: {
  tasaInteres: number;
  porcentajeSeguro: number;
}) {
  const [monto, setMonto] = useState(500000);
  const [cuotas, setCuotas] = useState(6);
  const [resultado, setResultado] = useState<AmortizacionPreviewDTO | null>(null);
  const [calculando, setCalculando] = useState(false);

  useEffect(() => {
    if (monto > 0 && cuotas > 0) {
      const timer = setTimeout(async () => {
        setCalculando(true);
        try {
          const data = await apiCalcularCredito(monto, tasaInteres, cuotas);
          setResultado(data);
        } catch {
          setResultado(null);
        } finally {
          setCalculando(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else setResultado(null);
  }, [monto, cuotas, tasaInteres]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
        <Calculator size={18} className="text-navy-500" />
        <h2 className="font-semibold text-navy-800">Calcula tu crédito</h2>
      </div>
      <div className="p-6">
        <div className="bg-gradient-to-r from-navy-50 to-blue-50 border border-navy-100 rounded-xl p-4 mb-6 text-sm space-y-1.5">
          <p className="text-navy-700">
            <span className="font-medium">Tasa mensual:</span> {tasaInteres}%{' '}
            <span className="mx-2 text-navy-300">·</span>{' '}
            <span className="font-medium">Seguro:</span> {porcentajeSeguro}%
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-navy-700 mb-1">Monto solicitado</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(Math.max(0, Number(e.target.value) || 0))}
              min={0}
              step={50000}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500"
            />
            <input
              type="range"
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              min={0}
              max={100000000}
              step={50000}
              className="w-full mt-2 accent-navy-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Plazo (meses)</label>
            <select
              value={cuotas}
              onChange={(e) => setCuotas(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500"
            >
              {[3, 6, 9, 12, 18, 24, 36].map((n) => (
                <option key={n} value={n}>
                  {n} meses
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Tasa mensual</label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-navy-600">
              {tasaInteres}%
            </div>
          </div>
        </div>

        {calculando && <div className="text-center text-gray-400 text-sm py-4">Calculando...</div>}

        {resultado && !calculando && (
          <div className="bg-gradient-to-br from-navy-50 to-blue-50/30 border border-navy-200 rounded-xl p-6 space-y-5">
            <h3 className="font-semibold text-navy-800 text-sm">Resumen del crédito</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/80 rounded-xl p-4 border border-navy-100">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cuota mensual</p>
                <p className="text-xl font-bold font-mono text-navy-700">
                  {formatCurrency(resultado.cuotaFija)}
                </p>
              </div>
              <div className="bg-white/80 rounded-xl p-4 border border-navy-100">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Total intereses
                </p>
                <p className="text-lg font-semibold font-mono text-amber-600">
                  {formatCurrency(resultado.totalIntereses)}
                </p>
              </div>
              <div className="bg-white/80 rounded-xl p-4 border border-navy-100">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total seguro</p>
                <p className="text-lg font-semibold font-mono text-orange-600">
                  {formatCurrency(resultado.totalSeguro)}
                </p>
              </div>
              <div className="bg-white/80 rounded-xl p-4 border border-navy-100">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total a pagar</p>
                <p className="text-lg font-semibold font-mono text-navy-800">
                  {formatCurrency(resultado.totalPagar)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-navy-700 text-sm mb-3">Tabla de amortización</h4>
              <div className="overflow-x-auto max-h-64 overflow-y-auto border border-navy-200 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-navy-100 text-navy-700 sticky top-0">
                    <tr>
                      <th className="px-2.5 py-1.5 text-left">#</th>
                      <th className="px-2.5 py-1.5 text-right">Cuota</th>
                      <th className="px-2.5 py-1.5 text-right">Capital</th>
                      <th className="px-2.5 py-1.5 text-right">Interés</th>
                      <th className="px-2.5 py-1.5 text-right">Seguro</th>
                      <th className="px-2.5 py-1.5 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.tabla.map((row) => (
                      <tr
                        key={row.numero}
                        className="border-b border-navy-100/50 hover:bg-navy-50/50 transition-colors"
                      >
                        <td className="px-2.5 py-1.5 text-gray-600">{row.numero}</td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {formatCurrency(row.cuota)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {formatCurrency(row.capital)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {formatCurrency(row.interes)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {formatCurrency(row.seguro)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {formatCurrency(row.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SimuladorForm({
  ahorroAcumulado,
  multiplicador,
  tasaInteres,
  porcentajeSeguro,
  deudaActiva,
}: {
  ahorroAcumulado: number;
  multiplicador: number;
  tasaInteres: number;
  porcentajeSeguro: number;
  deudaActiva: number;
}) {
  const [monto, setMonto] = useState(500000);
  const [cuotas, setCuotas] = useState(6);
  const [resultado, setResultado] = useState<AmortizacionPreviewDTO | null>(null);
  const [calculando, setCalculando] = useState(false);

  const maxCredito = Math.round(ahorroAcumulado * multiplicador);
  const capacidadDisponible = Math.max(0, maxCredito - deudaActiva);
  const excede = monto > capacidadDisponible;

  useEffect(() => {
    if (monto > 0 && cuotas > 0 && monto <= capacidadDisponible) {
      const timer = setTimeout(async () => {
        setCalculando(true);
        try {
          const data = await apiCalcularCredito(monto, tasaInteres, cuotas);
          setResultado(data);
        } catch {
          setResultado(null);
        } finally {
          setCalculando(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else setResultado(null);
  }, [monto, cuotas, tasaInteres]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
        <Calculator size={18} className="text-navy-500" />
        <h2 className="font-semibold text-navy-800">Calcula tu crédito</h2>
      </div>
      <div className="p-6">
        <div className="bg-gradient-to-r from-navy-50 to-blue-50 border border-navy-100 rounded-xl p-4 mb-6 text-sm space-y-1.5">
          <p className="text-navy-700">
            <span className="font-medium">Ahorro acumulado:</span> {formatCurrency(ahorroAcumulado)}{' '}
            <span className="mx-2 text-navy-300">·</span>{' '}
            <span className="font-medium">Capacidad total:</span> {formatCurrency(maxCredito)}{' '}
            <span className="text-navy-400">(×{multiplicador})</span>
          </p>
          {deudaActiva > 0 && (
            <p className="text-navy-700">
              <span className="font-medium">Deuda activa:</span>{' '}
              <span className="text-orange-600">{formatCurrency(deudaActiva)}</span>
            </p>
          )}
          <p className="text-navy-700">
            <span className="font-medium">Capacidad disponible:</span>{' '}
            <span className={`font-bold ${excede ? 'text-red-600' : 'text-green-700'}`}>
              {formatCurrency(capacidadDisponible)}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-navy-700 mb-1">Monto solicitado</label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(Math.max(0, Number(e.target.value) || 0))}
              min={0}
              max={capacidadDisponible}
              step={50000}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500"
            />
            <input
              type="range"
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
              min={0}
              max={Math.max(capacidadDisponible, 1)}
              step={50000}
              className="w-full mt-2 accent-navy-600"
            />
            {excede && (
              <p className="text-xs text-red-500 mt-1">El monto excede su capacidad disponible</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Plazo (meses)</label>
            <select
              value={cuotas}
              onChange={(e) => setCuotas(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500"
            >
              {[3, 6, 9, 12, 18, 24, 36].map((n) => (
                <option key={n} value={n}>
                  {n} meses
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Tasa mensual</label>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-navy-600">
              {tasaInteres}%
            </div>
          </div>
        </div>

        {calculando && <div className="text-center text-gray-400 text-sm py-4">Calculando...</div>}

        {resultado && !calculando && (
          <div className="bg-gradient-to-br from-navy-50 to-blue-50/30 border border-navy-200 rounded-xl p-6 space-y-5">
            <h3 className="font-semibold text-navy-800 text-sm">Resumen del crédito</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/80 rounded-xl p-4 border border-navy-100">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Cuota mensual</p>
                <p className="text-xl font-bold font-mono text-navy-700">
                  {formatCurrency(resultado.cuotaFija)}
                </p>
              </div>
              <div className="bg-white/80 rounded-xl p-4 border border-navy-100">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                  Total intereses
                </p>
                <p className="text-lg font-semibold font-mono text-amber-600">
                  {formatCurrency(resultado.totalIntereses)}
                </p>
              </div>
              <div className="bg-white/80 rounded-xl p-4 border border-navy-100">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total seguro</p>
                <p className="text-lg font-semibold font-mono text-orange-600">
                  {formatCurrency(resultado.totalSeguro)}
                </p>
              </div>
              <div className="bg-white/80 rounded-xl p-4 border border-navy-100">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total a pagar</p>
                <p className="text-lg font-semibold font-mono text-navy-800">
                  {formatCurrency(resultado.totalPagar)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-navy-700 text-sm mb-3">Tabla de amortización</h4>
              <div className="overflow-x-auto max-h-64 overflow-y-auto border border-navy-200 rounded-xl">
                <table className="w-full text-xs">
                  <thead className="bg-navy-100 text-navy-700 sticky top-0">
                    <tr>
                      <th className="px-2.5 py-1.5 text-left">#</th>
                      <th className="px-2.5 py-1.5 text-right">Cuota</th>
                      <th className="px-2.5 py-1.5 text-right">Capital</th>
                      <th className="px-2.5 py-1.5 text-right">Interés</th>
                      <th className="px-2.5 py-1.5 text-right">Seguro</th>
                      <th className="px-2.5 py-1.5 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.tabla.map((row) => (
                      <tr
                        key={row.numero}
                        className="border-b border-navy-100/50 hover:bg-navy-50/50 transition-colors"
                      >
                        <td className="px-2.5 py-1.5 text-gray-600">{row.numero}</td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {formatCurrency(row.cuota)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {formatCurrency(row.capital)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {formatCurrency(row.interes)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {formatCurrency(row.seguro)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {formatCurrency(row.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
