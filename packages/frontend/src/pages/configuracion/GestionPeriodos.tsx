import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Trash2, X } from 'lucide-react';
import {
  apiListarPeriodos,
  apiCrearPeriodo,
  apiActivarPeriodo,
  apiEliminarPeriodo,
  ApiError,
} from '../../lib/api';
import { AnimatedFadeIn, AnimatedTableRow, AnimatedButton } from '../../components/ui';

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
    <AnimatedFadeIn>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Gestione los períodos mensuales del fondo. El período activo es el vigente para aportes.
        </p>
        <AnimatedButton
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-500 text-white rounded-xl text-sm font-medium shadow-md hover:from-slate-800 hover:to-slate-600 transition-all"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}{' '}
          {showForm ? 'Cancelar' : 'Nuevo Período'}
        </AnimatedButton>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-4 mb-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="periodo-nombre"
                className="block text-xs font-medium text-navy-700 mb-1"
              >
                Nombre *
              </label>
              <input
                id="periodo-nombre"
                value={form.nombre}
                onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500"
                placeholder="Ej: Enero 2026"
              />
            </div>
            <div>
              <label
                htmlFor="periodo-anio"
                className="block text-xs font-medium text-navy-700 mb-1"
              >
                Año
              </label>
              <input
                id="periodo-anio"
                type="number"
                value={form.anio}
                onChange={(e) => setForm((p) => ({ ...p, anio: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500"
              />
            </div>
            <div>
              <label htmlFor="periodo-mes" className="block text-xs font-medium text-navy-700 mb-1">
                Mes
              </label>
              <select
                id="periodo-mes"
                value={form.mes}
                onChange={(e) => setForm((p) => ({ ...p, mes: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500"
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
            <div className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {formError}
            </div>
          )}
          <div className="mt-3">
            <AnimatedButton
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-500 text-white rounded-xl text-sm font-medium shadow-md hover:from-slate-800 hover:to-slate-600 disabled:opacity-50 transition-all"
            >
              {saving ? 'Guardando...' : 'Crear Período'}
            </AnimatedButton>
          </div>
        </form>
      )}

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 text-gray-500">
                <th className="text-left p-3.5 font-semibold text-xs uppercase tracking-wider">
                  Nombre
                </th>
                <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                  Año
                </th>
                <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                  Mes
                </th>
                <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-center p-3.5 font-semibold text-xs uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {(periodos ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-8">
                    No hay períodos registrados
                  </td>
                </tr>
              )}
              {(periodos ?? []).map((p, idx) => (
                <AnimatedTableRow key={p.id} index={idx}>
                  <td className="p-3.5 font-medium text-navy-800">{p.nombre}</td>
                  <td className="p-3.5 text-center text-gray-600">{p.anio}</td>
                  <td className="p-3.5 text-center text-gray-600">{mesNames[p.mes - 1]}</td>
                  <td className="p-3.5 text-center">
                    {p.activo ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <Check size={12} /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {!p.activo && (
                        <AnimatedButton
                          onClick={() => activateMutation.mutate(p.id)}
                          disabled={activateMutation.isPending}
                          className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-all"
                        >
                          Activar
                        </AnimatedButton>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar período ${p.nombre}?`))
                            deleteMutation.mutate(p.id);
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </AnimatedTableRow>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AnimatedFadeIn>
  );
}
