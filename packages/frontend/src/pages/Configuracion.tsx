import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save } from 'lucide-react';
import {
  apiGetConfiguraciones,
  apiUpdateConfiguracion,
  ApiError,
  type ConfiguracionDTO,
} from '../lib/api';
import { formatDate } from '../lib/utils';

export default function ConfiguracionPage() {
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-800 mb-6">Configuración</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {isLoading && <div className="p-8 text-center text-gray-400">Cargando...</div>}
        {configs && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="text-left p-3 font-medium">Clave</th>
                  <th className="text-left p-3 font-medium">Valor</th>
                  <th className="text-right p-3 font-medium">Actualizado</th>
                  <th className="text-center p-3 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {configs.map((cfg: ConfiguracionDTO) => (
                  <tr key={cfg.clave} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs text-gray-700">{cfg.clave}</td>
                    <td className="p-3">
                      {editando === cfg.clave ? (
                        <input
                          value={valorEdit}
                          onChange={(e) => setValorEdit(e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm font-mono"
                          autoFocus
                        />
                      ) : (
                        <span className="font-mono text-sm">{cfg.valor}</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-xs text-gray-400">
                      {formatDate(cfg.updatedAt)}
                    </td>
                    <td className="p-3 text-center">
                      {editando === cfg.clave ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() =>
                              updateMutation.mutate({ clave: cfg.clave, valor: valorEdit })
                            }
                            disabled={updateMutation.isPending}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditando(null)}
                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded text-xs"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditando(cfg.clave);
                            setValorEdit(cfg.valor);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 border rounded text-xs text-gray-600 hover:bg-gray-50"
                        >
                          <Settings size={12} /> Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
