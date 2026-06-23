import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Trash2 } from 'lucide-react';
import {
  apiListarPeriodos,
  apiCrearPeriodo,
  apiActivarPeriodo,
  apiEliminarPeriodo,
  ApiError,
} from '../../lib/api';

const mesNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function GestionPeriodos() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    anio: String(new Date().getFullYear()),
    mes: String(new Date().getMonth() + 1),
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: periodos, isLoading } = useQuery({
    queryKey: ['periodos'],
    queryFn: () => apiListarPeriodos(),
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => apiActivarPeriodo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['periodos'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiEliminarPeriodo(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['periodos'] }),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const anio = Number(form.anio);
    const mes = Number(form.mes);
    if (!form.nombre || form.nombre.length < 3) {
      setFormError('El nombre debe tener al menos 3 caracteres');
      return;
    }
    if (anio < 2000 || anio > 2100) {
      setFormError('Año inválido');
      return;
    }
    if (mes < 1 || mes > 12) {
      setFormError('Mes inválido');
      return;
    }

    setSaving(true);
    try {
      await apiCrearPeriodo({ nombre: form.nombre, anio, mes });
      setShowForm(false);
      setForm({
        nombre: '',
        anio: String(new Date().getFullYear()),
        mes: String(new Date().getMonth() + 1),
      });
      queryClient.invalidateQueries({ queryKey: ['periodos'] });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Error al crear período');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="text-gray-400 text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Gestione los períodos mensuales del fondo. El período activo es el vigente para aportes.
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800"
        >
          <Plus size={16} /> {showForm ? 'Cancelar' : 'Nuevo Período'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Ej: Enero 2026"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Año</label>
              <input
                type="number"
                value={form.anio}
                onChange={(e) => setForm((p) => ({ ...p, anio: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mes</label>
              <select
                value={form.mes}
                onChange={(e) => setForm((p) => ({ ...p, mes: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {mesNames.map((name, i) => (
                  <option key={i + 1} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{formError}</div>
          )}

          <div className="mt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Crear Período'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-center px-4 py-3">Año</th>
              <th className="text-center px-4 py-3">Mes</th>
              <th className="text-center px-4 py-3">Estado</th>
              <th className="text-center px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(periodos ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-8">
                  No hay períodos registrados
                </td>
              </tr>
            )}
            {(periodos ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.nombre}</td>
                <td className="px-4 py-3 text-center">{p.anio}</td>
                <td className="px-4 py-3 text-center">{mesNames[p.mes - 1]}</td>
                <td className="px-4 py-3 text-center">
                  {p.activo ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      <Check size={12} /> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {!p.activo && (
                      <button
                        onClick={() => activateMutation.mutate(p.id)}
                        disabled={activateMutation.isPending}
                        className="px-3 py-1 text-xs border rounded text-navy-700 hover:bg-navy-50 disabled:opacity-40"
                      >
                        Activar
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar período ${p.nombre}?`)) deleteMutation.mutate(p.id);
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
