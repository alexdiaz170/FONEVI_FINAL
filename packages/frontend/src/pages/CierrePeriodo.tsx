import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  CalendarCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import {
  apiValidarCierre,
  apiSimularCierre,
  apiEjecutarCierre,
  type ValidacionCierre,
  type SimulacionCierre,
  type ResultadoCierre,
} from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { AnimatedFadeIn, AnimatedButton } from '../components/ui';

type Step = 'inicio' | 'validacion' | 'simulacion' | 'resultado';

export default function CierrePeriodoPage() {
  const [step, setStep] = useState<Step>('inicio');
  const [validacion, setValidacion] = useState<ValidacionCierre | null>(null);
  const [simulacion, setSimulacion] = useState<SimulacionCierre | null>(null);
  const [resultado, setResultado] = useState<ResultadoCierre | null>(null);

  const validarMutation = useMutation({
    mutationFn: apiValidarCierre,
    onSuccess: (data) => {
      setValidacion(data);
      setStep('validacion');
    },
  });
  const simularMutation = useMutation({
    mutationFn: apiSimularCierre,
    onSuccess: (data) => {
      setSimulacion(data);
      setStep('simulacion');
    },
  });
  const ejecutarMutation = useMutation({
    mutationFn: apiEjecutarCierre,
    onSuccess: (data) => {
      setResultado(data);
      setStep('resultado');
    },
  });

  const handleVolverInicio = () => {
    setStep('inicio');
    setValidacion(null);
    setSimulacion(null);
    setResultado(null);
  };

  const steps = [
    { key: 'inicio' as const, label: 'Inicio', numero: 1 },
    { key: 'validacion' as const, label: 'Validar', numero: 2 },
    { key: 'simulacion' as const, label: 'Simular', numero: 3 },
    { key: 'resultado' as const, label: 'Resultado', numero: 4 },
  ];
  const stepIdx = ['inicio', 'validacion', 'simulacion', 'resultado'].indexOf(step);

  return (
    <div className="max-w-3xl mx-auto relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
          <CalendarCheck size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Cierre de Período</h1>
          <p className="text-sm text-gray-500">Finaliza el período operativo mensual</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => {
          const active =
            ['inicio', 'validacion', 'simulacion', 'resultado'].indexOf(s.key) <= stepIdx;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {s.numero}
              </div>
              <span className={`text-sm font-medium ${active ? 'text-teal-700' : 'text-gray-400'}`}>
                {s.label}
              </span>
              {i < 3 && (
                <div className={`w-8 h-0.5 rounded ${active ? 'bg-teal-500' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {step === 'inicio' && (
        <AnimatedFadeIn>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/25">
              <CalendarCheck size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-navy-800 mb-2">Cierre de Período</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Este proceso finaliza el período operativo mensual, consolidando la información
              financiera y preparando el sistema para el siguiente ciclo.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left text-sm text-amber-800">
              <p className="font-medium mb-1">Importante:</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                <li>El cierre no puede revertirse automáticamente</li>
                <li>Se recomienda realizar un respaldo antes de continuar</li>
                <li>Solo SuperAdmin y Tesorero pueden ejecutar esta acción</li>
              </ul>
            </div>
            <AnimatedButton
              onClick={() => validarMutation.mutate()}
              disabled={validarMutation.isPending}
              className="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-500 text-white rounded-xl font-medium shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-cyan-600 disabled:opacity-50 inline-flex items-center gap-2 transition-all"
            >
              {validarMutation.isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Validando...
                </>
              ) : (
                <>
                  Iniciar Cierre <ArrowRight size={20} />
                </>
              )}
            </AnimatedButton>
          </div>
        </AnimatedFadeIn>
      )}

      {step === 'validacion' && validacion && (
        <AnimatedFadeIn>
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-navy-800 mb-4">Validaciones</h3>
              {validacion.periodo ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm">
                  <span className="font-medium">Período activo:</span> {validacion.periodo.nombre} (
                  {validacion.periodo.mes}/{validacion.periodo.anio})
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
                  No hay un período activo
                </div>
              )}
              {validacion.errores.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-red-700">Errores:</p>
                  {validacion.errores.map((e, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3"
                    >
                      <XCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{e}</span>
                    </div>
                  ))}
                </div>
              )}
              {validacion.advertencias.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-amber-700">Advertencias:</p>
                  {validacion.advertencias.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-xl p-3"
                    >
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              )}
              {validacion.valido && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
                  <CheckCircle2 size={18} /> Todas las validaciones fueron superadas
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-between">
              <AnimatedButton
                onClick={handleVolverInicio}
                className="px-6 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1 transition-all"
              >
                <ChevronLeft size={16} /> Volver
              </AnimatedButton>
              {validacion.valido && (
                <AnimatedButton
                  onClick={() => simularMutation.mutate()}
                  disabled={simularMutation.isPending}
                  className="px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-cyan-600 disabled:opacity-50 inline-flex items-center gap-2 transition-all"
                >
                  {simularMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Simulando...
                    </>
                  ) : (
                    <>
                      Ver simulación <ArrowRight size={16} />
                    </>
                  )}
                </AnimatedButton>
              )}
            </div>
          </div>
        </AnimatedFadeIn>
      )}

      {step === 'simulacion' && simulacion && (
        <AnimatedFadeIn>
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-navy-800 mb-4">Simulación de Cierre</h3>
              <p className="text-sm text-gray-500 mb-4">
                Período: <span className="font-medium">{simulacion.periodo.nombre}</span>
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Socios activos</p>
                  <p className="text-2xl font-bold text-navy-700">
                    {simulacion.totalSociosActivos}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total aportes</p>
                  <p className="text-2xl font-bold text-navy-700">{simulacion.totalAportes}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Socios al día</p>
                  <p className="text-2xl font-bold text-green-700">{simulacion.sociosAlDia}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-4 border border-red-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Socios en mora</p>
                  <p className="text-2xl font-bold text-red-700">{simulacion.sociosEnMora}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-navy-700 mb-3">Resumen financiero</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-gray-600">Total recaudado</span>
                    <span className="font-medium text-navy-800">
                      {formatCurrency(simulacion.totalRecaudado)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-gray-600">Solidaridad</span>
                    <span className="font-medium text-navy-800">
                      {formatCurrency(simulacion.totalSolidaridad)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-gray-600">Aplicado a créditos</span>
                    <span className="font-medium text-navy-800">
                      {formatCurrency(simulacion.totalAplicadoCreditos)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-t border-gray-100 pt-2">
                    <span className="font-medium text-navy-700">Ahorro acumulado</span>
                    <span className="font-bold text-navy-800">
                      {formatCurrency(simulacion.totalAhorro)}
                    </span>
                  </div>
                </div>
              </div>
              {simulacion.saldoPorCobrar > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4 text-sm text-amber-800">
                  Saldo por cobrar en créditos activos: {formatCurrency(simulacion.saldoPorCobrar)}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-between">
              <AnimatedButton
                onClick={() => setStep('validacion')}
                className="px-6 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1 transition-all"
              >
                <ChevronLeft size={16} /> Atrás
              </AnimatedButton>
              <AnimatedButton
                onClick={() => ejecutarMutation.mutate()}
                disabled={ejecutarMutation.isPending}
                className="px-8 py-2 bg-gradient-to-r from-emerald-600 to-green-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-green-600 disabled:opacity-50 inline-flex items-center gap-2 transition-all"
              >
                {ejecutarMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Ejecutando cierre...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Confirmar y Ejecutar Cierre
                  </>
                )}
              </AnimatedButton>
            </div>
          </div>
        </AnimatedFadeIn>
      )}

      {step === 'resultado' && resultado && (
        <AnimatedFadeIn>
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              {resultado.exitoso ? (
                <>
                  <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-4" />
                  <h3 className="text-xl font-bold text-emerald-700 mb-2">Cierre Exitoso</h3>
                  <p className="text-gray-600 mb-6">{resultado.mensaje}</p>
                </>
              ) : (
                <>
                  <XCircle size={64} className="mx-auto text-red-500 mb-4" />
                  <h3 className="text-xl font-bold text-red-700 mb-2">Error en el Cierre</h3>
                  <p className="text-gray-600 mb-6">{resultado.mensaje}</p>
                </>
              )}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 grid grid-cols-2 gap-3 text-left border border-gray-100 mb-6">
                <div>
                  <p className="text-xs text-gray-500">Período</p>
                  <p className="font-medium text-navy-800">{resultado.periodo.nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Movimientos creados</p>
                  <p className="font-medium text-navy-800">{resultado.movimientosCreados}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total recaudado</p>
                  <p className="font-medium text-navy-800">
                    {formatCurrency(resultado.totalRecaudado)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total ahorro</p>
                  <p className="font-medium text-navy-800">
                    {formatCurrency(resultado.totalAhorro)}
                  </p>
                </div>
              </div>
            </div>
            <AnimatedButton
              onClick={handleVolverInicio}
              className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-teal-500/25 hover:from-teal-700 hover:to-cyan-600 transition-all"
            >
              Finalizar
            </AnimatedButton>
          </div>
        </AnimatedFadeIn>
      )}

      {(validarMutation.error || simularMutation.error || ejecutarMutation.error) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mt-4">
          {String(validarMutation.error ?? simularMutation.error ?? ejecutarMutation.error ?? '')}
        </div>
      )}
    </div>
  );
}
