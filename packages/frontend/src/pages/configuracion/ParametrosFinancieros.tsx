import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, X, Edit2 } from 'lucide-react';
import { apiGetConfiguraciones, apiUpdateConfiguracion, ApiError } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { FINANCIERO_KEYS, KEY_LABELS } from './constants';
import {
  AnimatedFadeIn,
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  AnimatedButton,
} from '../../components/ui';

export function ParametrosFinancieros() {
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<string | null>(null);
  const [valorEdit, setValorEdit] = useState('');
  const [error, setError] = useState('');

  const { data: configs, isLoading } = useQuery({
    queryKey: ['configuraciones'],
    queryFn: () => apiGetConfiguraciones(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ clave, valor }: { clave: string; valor: string }) =>
      apiUpdateConfiguracion(clave, valor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuraciones'] });
      setEditando(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Error al actualizar'),
  });

  const financieroConfigs = configs?.filter((c) => FINANCIERO_KEYS.includes(c.clave)) ?? [];

  if (isLoading) return <div className="text-gray-400 text-center py-8">Cargando...</div>;

  return (
    <AnimatedFadeIn>
      <p className="text-sm text-gray-500 mb-4">
        Configure los parámetros financieros que rigen los cálculos del sistema.
      </p>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}
      <AnimatedStaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {financieroConfigs.map((cfg) => {
          const meta = KEY_LABELS[cfg.clave];
          if (!meta) return null;
          const displayValue =
            meta.type === 'currency'
              ? formatCurrency(Number(cfg.valor))
              : meta.type === 'percent'
                ? `${cfg.valor}%`
                : cfg.valor;
          return (
            <AnimatedStaggerItem key={cfg.clave}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <label className="text-sm font-semibold text-navy-800">{meta.label}</label>
                    <p className="text-xs text-gray-400">{meta.desc}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {editando === cfg.clave ? (
                    <>
                      <input
                        value={valorEdit}
                        onChange={(e) => setValorEdit(e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-mono outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500"
                        autoFocus
                      />
                      <AnimatedButton
                        onClick={() =>
                          updateMutation.mutate({ clave: cfg.clave, valor: valorEdit })
                        }
                        disabled={updateMutation.isPending}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                      >
                        <Save size={16} />
                      </AnimatedButton>
                      <button
                        onClick={() => setEditando(null)}
                        className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className={`flex-1 font-mono text-lg text-navy-800`}>
                        {displayValue}
                      </span>
                      <button
                        onClick={() => {
                          setEditando(cfg.clave);
                          setValorEdit(cfg.valor);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all"
                      >
                        <Edit2 size={12} /> Editar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </AnimatedStaggerItem>
          );
        })}
      </AnimatedStaggerContainer>
    </AnimatedFadeIn>
  );
}
