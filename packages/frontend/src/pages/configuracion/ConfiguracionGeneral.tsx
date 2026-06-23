import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, X } from 'lucide-react';
import { apiGetConfiguraciones, apiUpdateConfiguracion, ApiError } from '../../lib/api';
import { GENERAL_KEYS, KEY_LABELS } from './constants';

export function ConfiguracionGeneral() {
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

  const generalConfigs = configs?.filter((c) => GENERAL_KEYS.includes(c.clave)) ?? [];

  if (isLoading) return <div className="text-gray-400 text-center py-8">Cargando...</div>;

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Datos institucionales del fondo.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {generalConfigs.map((cfg) => {
          const meta = KEY_LABELS[cfg.clave];
          if (!meta) return null;

          return (
            <div key={cfg.clave} className="bg-white rounded-lg shadow p-4">
              <div>
                <label className="text-sm font-semibold text-gray-800">{meta.label}</label>
                <p className="text-xs text-gray-400 mb-2">{meta.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                {editando === cfg.clave ? (
                  <>
                    <input
                      value={valorEdit}
                      onChange={(e) => setValorEdit(e.target.value)}
                      className="flex-1 px-3 py-1.5 border rounded text-sm"
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
                    <span className="flex-1 font-medium">{cfg.valor}</span>
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
