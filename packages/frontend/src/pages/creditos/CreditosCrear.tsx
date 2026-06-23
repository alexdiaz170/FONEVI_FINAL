import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import {
  apiCrearCredito,
  apiCalcularCredito,
  apiListarSocios,
  apiListarCreditos,
  apiGetConfiguraciones,
  type AmortizacionPreviewDTO,
} from '../../lib/api';
import { ApiError } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';

export default function CreditosCrear() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    socioId: '',
    monto: '',
    tasaMensual: '',
    cuotas: '',
    fechaDesembolso: new Date().toISOString().split('T')[0],
    proposito: '',
    notas: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [amortizacion, setAmortizacion] = useState<AmortizacionPreviewDTO | null>(null);
  const [showTabla, setShowTabla] = useState(false);
  const [calculando, setCalculando] = useState(false);

  const { data: sociosData } = useQuery({
    queryKey: ['socios-select', 1],
    queryFn: () => apiListarSocios(1, 100),
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    let value = e.target.value;
    if (e.target.name === 'tasaMensual' && value) {
      const num = Number(value);
      if (!isNaN(num)) value = String(Math.round(num * 10) / 10);
    }
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const monto = Number(form.monto);
    const tasaMensual = Number(form.tasaMensual);
    const cuotas = Number(form.cuotas);

    if (!form.socioId) {
      setError('Seleccione un socio');
      return;
    }
    if (!form.monto || monto <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    if (!form.tasaMensual || tasaMensual <= 0 || tasaMensual > 100) {
      setError('La tasa debe ser entre 0.01 y 100');
      return;
    }
    if (!form.cuotas || cuotas < 1 || !Number.isInteger(cuotas)) {
      setError('Debe haber al menos 1 cuota');
      return;
    }
    if (monto > capacidadDisponible) {
      setError(
        `El monto excede la capacidad disponible. Ahorro: ${formatCurrency(socioSeleccionado!.ahorroAcumulado)} × ${multiplicador} = ${formatCurrency(maxCredito)}${deudaActiva > 0 ? ` - deuda activa ${formatCurrency(deudaActiva)}` : ''} = ${formatCurrency(capacidadDisponible)}`,
      );
      return;
    }
    if (!form.fechaDesembolso) {
      setError('Seleccione una fecha de desembolso');
      return;
    }

    setLoading(true);
    try {
      await apiCrearCredito({
        socioId: form.socioId,
        monto,
        tasaMensual,
        cuotas,
        fechaDesembolso: form.fechaDesembolso,
        proposito: form.proposito || null,
        notas: form.notas || null,
      });
      navigate('/creditos', {
        state: {
          success:
            'Crédito creado correctamente. Queda en estado pendiente hasta que un administrador lo apruebe.',
        },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear crédito');
    } finally {
      setLoading(false);
    }
  };

  const { data: configs } = useQuery({
    queryKey: ['configuraciones'],
    queryFn: () => apiGetConfiguraciones(),
  });
  const multiplicador = Number(
    configs?.find((c) => c.clave === 'multiplicador_maximo_credito')?.valor ?? 4,
  );
  const tasaFromConfig = configs?.find((c) => c.clave === 'tasa_interes_mensual')?.valor;

  const socioSeleccionado = sociosData?.data.find((s) => s.id === form.socioId);
  const maxCredito = socioSeleccionado ? socioSeleccionado.ahorroAcumulado * multiplicador : 0;

  const { data: creditosData } = useQuery({
    queryKey: ['creditos-socio', form.socioId],
    queryFn: () =>
      apiListarCreditos({ socioId: form.socioId, estado: 'activo,pendiente', limit: 100 }),
    enabled: !!form.socioId,
  });
  const deudaActiva = creditosData?.data.reduce((sum, c) => sum + c.saldoCapital, 0) ?? 0;
  const capacidadDisponible = Math.max(0, maxCredito - deudaActiva);

  useEffect(() => {
    if (tasaFromConfig !== undefined) {
      setForm((prev) => {
        if (prev.tasaMensual !== tasaFromConfig) {
          return { ...prev, tasaMensual: tasaFromConfig };
        }
        return prev;
      });
    }
  }, [tasaFromConfig]);

  const montoNum = Number(form.monto);
  const tasaNum = Number(form.tasaMensual);
  const cuotasNum = Number(form.cuotas);
  const cuotaEstimada =
    montoNum > 0 && tasaNum > 0 && cuotasNum > 0
      ? (montoNum * (tasaNum / 100) * Math.pow(1 + tasaNum / 100, cuotasNum)) /
        (Math.pow(1 + tasaNum / 100, cuotasNum) - 1)
      : 0;

  useEffect(() => {
    if (montoNum > 0 && tasaNum > 0 && cuotasNum > 0) {
      const timer = setTimeout(async () => {
        setCalculando(true);
        try {
          const data = await apiCalcularCredito(montoNum, tasaNum, cuotasNum);
          setAmortizacion(data);
        } catch {
          setAmortizacion(null);
        } finally {
          setCalculando(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setAmortizacion(null);
    }
  }, [form.monto, form.tasaMensual, form.cuotas]);

  return (
    <div>
      <Link
        to="/creditos"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy-700 mb-4"
      >
        <ArrowLeft size={16} /> Volver a lista
      </Link>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Nuevo Crédito</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
            {error}
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
          {socioSeleccionado && (
            <div className="md:col-span-2 bg-gray-50 border border-gray-200 rounded p-3 text-sm space-y-1">
              <p className="text-gray-600">
                <span className="font-medium">Ahorro acumulado:</span>{' '}
                {formatCurrency(socioSeleccionado.ahorroAcumulado)}
                <span className="mx-2">·</span>
                <span className="font-medium">Capacidad total:</span> {formatCurrency(maxCredito)}
                <span className="ml-1 text-gray-400">(×{multiplicador})</span>
              </p>
              {deudaActiva > 0 && (
                <p className="text-gray-600">
                  <span className="font-medium">Deuda activa:</span>{' '}
                  <span className="text-orange-600">{formatCurrency(deudaActiva)}</span>
                </p>
              )}
              <p className="text-gray-600">
                <span className="font-medium">Capacidad disponible:</span>{' '}
                <span
                  className={`font-bold ${montoNum > capacidadDisponible ? 'text-red-600' : 'text-green-700'}`}
                >
                  {formatCurrency(capacidadDisponible)}
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
            <input
              name="monto"
              type="number"
              min="1"
              value={form.monto}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tasa Mensual %
              <span className="text-gray-400 font-normal ml-1">(desde configuración)</span>
            </label>
            <input
              name="tasaMensual"
              type="number"
              min="0"
              step="0.1"
              value={form.tasaMensual}
              readOnly
              className="w-full px-3 py-2 border rounded-md text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Cuotas *
            </label>
            <input
              name="cuotas"
              type="number"
              min="1"
              step="1"
              value={form.cuotas}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desembolso *
            </label>
            <input
              name="fechaDesembolso"
              type="date"
              value={form.fechaDesembolso}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Propósito</label>
            <input
              name="proposito"
              value={form.proposito}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
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

          {amortizacion && (
            <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded p-3 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">Resumen del crédito</span>
                {calculando && <span className="text-blue-400 text-xs">Calculando...</span>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <span className="text-blue-600">Cuota fija:</span>
                  <p className="text-blue-900 font-mono font-bold">
                    {formatCurrency(amortizacion.cuotaFija)}
                  </p>
                </div>
                <div>
                  <span className="text-blue-600">Total intereses:</span>
                  <p className="text-blue-900 font-mono font-bold">
                    {formatCurrency(amortizacion.totalIntereses)}
                  </p>
                </div>
                <div>
                  <span className="text-blue-600">Total seguro:</span>
                  <p className="text-blue-900 font-mono font-bold">
                    {formatCurrency(amortizacion.totalSeguro)}
                  </p>
                </div>
                <div>
                  <span className="text-blue-600">Total a pagar:</span>
                  <p className="text-blue-900 font-mono font-bold">
                    {formatCurrency(amortizacion.totalPagar)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTabla(!showTabla)}
                className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-medium"
              >
                {showTabla ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showTabla ? 'Ocultar' : 'Ver'} tabla de amortización
              </button>
              {showTabla && (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-xs text-gray-700">
                    <thead>
                      <tr className="border-b border-blue-200">
                        <th className="text-left py-1 pr-2">#</th>
                        <th className="text-right py-1 px-2">Cuota</th>
                        <th className="text-right py-1 px-2">Capital</th>
                        <th className="text-right py-1 px-2">Interés</th>
                        <th className="text-right py-1 px-2">Seguro</th>
                        <th className="text-right py-1 pl-2">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {amortizacion.tabla.map((row) => (
                        <tr key={row.numero} className="border-b border-blue-100">
                          <td className="py-1 pr-2">{row.numero}</td>
                          <td className="text-right py-1 px-2 font-mono">
                            {formatCurrency(row.cuota)}
                          </td>
                          <td className="text-right py-1 px-2 font-mono">
                            {formatCurrency(row.capital)}
                          </td>
                          <td className="text-right py-1 px-2 font-mono">
                            {formatCurrency(row.interes)}
                          </td>
                          <td className="text-right py-1 px-2 font-mono">
                            {formatCurrency(row.seguro)}
                          </td>
                          <td className="text-right py-1 pl-2 font-mono">
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

          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Solicitar Crédito'}
            </button>
            <Link
              to="/creditos"
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
