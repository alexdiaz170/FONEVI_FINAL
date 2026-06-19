import { useQuery } from '@tanstack/react-query';
import { User, Mail, Shield, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiGetProfile } from '../lib/api';
import { ApiError } from '../lib/api';

export default function MiCuentaPage() {
  const { usuario } = useAuth();

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiGetProfile(),
  });

  const display = profile ?? usuario;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-800 mb-6">Mi Cuenta</h1>

      <div className="bg-white rounded-lg shadow max-w-lg">
        <div className="p-6 border-b flex items-center gap-4">
          <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center">
            <User size={28} className="text-navy-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{display?.nombre}</h2>
            <p className="text-sm text-gray-500">{display?.email}</p>
          </div>
        </div>

        {isLoading && (
          <div className="p-4 text-center text-gray-400 text-sm">Cargando perfil...</div>
        )}
        {error && (
          <div className="p-4 text-center text-red-500 text-sm">
            Error: {(error as ApiError).message}
          </div>
        )}

        {display && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-gray-400" />
              <span className="text-gray-500 min-w-[80px]">Email:</span>
              <span className="text-gray-900">{display.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield size={16} className="text-gray-400" />
              <span className="text-gray-500 min-w-[80px]">Rol:</span>
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-navy-100 text-navy-700 capitalize">
                {display.rol}
              </span>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 mt-4 px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              Actualizar Perfil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
