import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, X } from 'lucide-react';
import { apiGetConfiguraciones, apiUpdateConfiguracion, ApiError } from '../../lib/api';
import { formatCurrency } from '../../lib/utils';
import { FINANCIERO_KEYS, KEY_LABELS } from './constants';

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
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Configure los parámetros financieros que rigen los cálculos del sistema.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div key={cfg.clave} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <label className="text-sm font-semibold text-gray-800">{meta.label}</label>
                  <p className="text-xs text-gray-400">{meta.desc}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {editando === cfg.clave ? (
                  <>
                    <input
                      value={valorEdit}
                      onChange={(e) => setValorEdit(e.target.value)}
                      className="flex-1 px-3 py-1.5 border rounded text-sm font-mono"
                      autoFocus
                    />
                    <button
                      onClick={() => updateMutation.mutate({ clave: cfg.clave, valor: valorEdit })}
                      disabled={updateMutation.isPending}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Save size={16} />
                    </button>
                    <button
                      onClick={() => setEditando(null)}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                    >
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`flex-1 font-mono text-lg`}>{displayValue}</span>
                    <button
                      onClick={() => {
                        setEditando(cfg.clave);
                        setValorEdit(cfg.valor);
                      }}
                      className="px-3 py-1 text-xs border rounded text-gray-600 hover:bg-gray-50"
                    >
                      Editar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
