import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Mail, Phone, Calendar, MapPin, Award } from 'lucide-react';
import { apiObtenerSocio } from '../../lib/api';
import { formatDate, formatCurrency, cn } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import { useState } from 'react';
import { apiActualizarSocio } from '../../lib/api';

export default function SociosPerfil() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const {
    data: socio,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['socio', id],
    queryFn: () => apiObtenerSocio(id!),
    enabled: !!id,
  });

  const handleEdit = () => {
    if (socio) {
      setForm({
        nombre: socio.nombre,
        email: socio.email ?? '',
        telefono: socio.telefono ?? '',
        cargo: socio.cargo ?? '',
        sede: socio.sede ?? '',
      });
      setEditando(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await apiActualizarSocio(id!, form);
      setEditando(false);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">Cargando...</div>
    );
  if (queryError || !socio)
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-red-500">
        Error: {(queryError as ApiError)?.message ?? 'Socio no encontrado'}
      </div>
    );

  return (
    <div>
      <Link
        to="/socios"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-navy-700 mb-4"
      >
        <ArrowLeft size={16} /> Volver a lista
      </Link>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{socio.nombre}</h2>
              <p className="text-sm text-gray-500 font-mono">{socio.codigoSocio ?? socio.codigo}</p>
            </div>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                socio.estado === 'activo'
                  ? 'bg-green-100 text-green-700'
                  : socio.estado === 'mora'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
              }`}
            >
              {socio.estado}
            </span>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Información Personal
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <InfoRow icon={<Mail size={16} />} label="Email" value={socio.email} />
              <InfoRow icon={<Phone size={16} />} label="Teléfono" value={socio.telefono} />
              <InfoRow
                icon={<Award size={16} />}
                label="Documento"
                value={`${socio.tipoDocumento.toUpperCase()}: ${socio.numeroDocumento}`}
              />
              <InfoRow
                icon={<Calendar size={16} />}
                label="Fecha Ingreso"
                value={formatDate(socio.fechaIngreso)}
              />
              <InfoRow icon={<MapPin size={16} />} label="Sede" value={socio.sede} />
              <InfoRow icon={<Award size={16} />} label="Cargo" value={socio.cargo} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Financiero
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <InfoRow label="Aporte Mensual" value={formatCurrency(socio.aporteMensual)} />
              <InfoRow label="Ahorro Acumulado" value={formatCurrency(socio.ahorroAcumulado)} />
            </div>
          </div>

          {editando && (
            <div className="md:col-span-2 border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Editar Socio
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['nombre', 'email', 'telefono', 'cargo', 'sede'].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                      {field}
                    </label>
                    <input
                      name={field}
                      value={form[field] ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  onClick={() => setEditando(false)}
                  className="px-6 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {!editando && (
          <div className="px-6 pb-6">
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800"
            >
              <Pencil size={16} /> Editar Socio
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
      <span className="text-gray-500 min-w-[100px]">{label}:</span>
      <span className="text-gray-900 font-medium">{value ?? '—'}</span>
    </div>
  );
}
