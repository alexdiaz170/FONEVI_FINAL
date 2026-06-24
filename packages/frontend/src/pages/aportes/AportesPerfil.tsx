import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  PiggyBank,
  CreditCard,
  Wallet,
  FileText,
  HandHeart,
  TrendingUp,
} from 'lucide-react';
import { apiObtenerAporte, apiListarPeriodos } from '../../lib/api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import { GlassCard, AnimatedStaggerContainer, AnimatedStaggerItem } from '../../components/ui';

const estadoStyle: Record<string, string> = {
  pagado: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  pendiente: 'bg-amber-50 text-amber-700 border border-amber-200',
  mora: 'bg-red-50 text-red-700 border border-red-200',
  vencido: 'bg-orange-50 text-orange-700 border border-orange-200',
  anulado: 'bg-gray-50 text-gray-600 border border-gray-200',
};

const estadoDot: Record<string, string> = {
  pagado: 'bg-emerald-500',
  pendiente: 'bg-amber-500',
  mora: 'bg-red-500',
  vencido: 'bg-orange-500',
  anulado: 'bg-gray-400',
};

export default function AportesPerfil() {
  const { id } = useParams<{ id: string }>();

  const {
    data: aporte,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['aporte', id],
    queryFn: () => apiObtenerAporte(id!),
    enabled: !!id,
  });

  const { data: periodos } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => apiListarPeriodos(),
  });

  const periodoNombre = periodos?.find((p) => p.id === aporte?.periodoId)?.nombre;

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (error || !aporte)
    return (
      <div className="text-center py-16 text-red-500">
        Error: {(error as ApiError)?.message ?? 'Aporte no encontrado'}
      </div>
    );

  const ahorro = aporte.monto - aporte.pagoSolidaridad - aporte.pagoCredito;

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <AnimatedStaggerContainer className="max-w-2xl">
        <AnimatedStaggerItem>
          <Link
            to="/aportes"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-4 transition-colors"
          >
            <ArrowLeft size={15} /> Volver a lista
          </Link>
        </AnimatedStaggerItem>

        <AnimatedStaggerItem>
          <GlassCard>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 flex items-center justify-center shadow-md">
                <Wallet size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Detalle del Aporte</h2>
                <p className="text-sm text-gray-500">Información completa del registro</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailBlock
                icon={<User size={15} />}
                label="Socio"
                value={aporte.nombreSocio ?? aporte.socioId}
              />
              <DetailBlock
                icon={<Calendar size={15} />}
                label="Periodo"
                value={periodoNombre ?? String(aporte.periodoId)}
              />
              <DetailBlock
                icon={<DollarSign size={15} />}
                label="Monto"
                value={formatCurrency(aporte.monto)}
                highlight
              />
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  <span className="text-gray-400 text-xs">#</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Estado
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium mt-0.5 ${estadoStyle[aporte.estado] ?? 'bg-gray-50 text-gray-600 border border-gray-200'}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${estadoDot[aporte.estado] ?? 'bg-gray-400'}`}
                    />
                    {aporte.estado}
                  </span>
                </div>
              </div>
              <DetailBlock
                icon={<Calendar size={15} />}
                label="Fecha de Pago"
                value={aporte.fechaPago ? formatDate(aporte.fechaPago) : '—'}
              />
              <DetailBlock
                icon={<FileText size={15} />}
                label="Método"
                value={aporte.metodo ?? '—'}
              />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={16} className="text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Distribución
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <HandHeart size={16} className="text-amber-500" />
                    <span className="text-xs font-medium text-amber-700 uppercase tracking-wider">
                      Solidaridad
                    </span>
                  </div>
                  <p className="text-lg font-bold font-mono text-amber-800">
                    {formatCurrency(aporte.pagoSolidaridad)}
                  </p>
                </div>
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={16} className="text-blue-500" />
                    <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">
                      Pago Crédito
                    </span>
                  </div>
                  <p className="text-lg font-bold font-mono text-blue-800">
                    {formatCurrency(aporte.pagoCredito)}
                  </p>
                </div>
                <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <PiggyBank size={16} className="text-purple-500" />
                    <span className="text-xs font-medium text-purple-700 uppercase tracking-wider">
                      Ahorro
                    </span>
                  </div>
                  <p className="text-lg font-bold font-mono text-purple-800">
                    {formatCurrency(ahorro)}
                  </p>
                </div>
              </div>
            </div>

            {aporte.notas && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} className="text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    Notas
                  </h3>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{aporte.notas}</p>
                </div>
              </div>
            )}
          </GlassCard>
        </AnimatedStaggerItem>
      </AnimatedStaggerContainer>
    </div>
  );
}

function DetailBlock({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-gray-100">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
        <p
          className={`text-sm truncate ${highlight ? 'font-bold text-navy-700 font-mono' : 'font-medium text-gray-900'}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
