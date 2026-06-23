import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Mail, Shield, RefreshCw, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiGetProfile, apiCambiarPassword, ApiError } from '../lib/api';

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

  const [showForm, setShowForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    if (newPassword.length < 6) {
      setPwdMsg({ text: 'La nueva contraseña debe tener al menos 6 caracteres', ok: false });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'Las contraseñas no coinciden', ok: false });
      return;
    }
    setPwdLoading(true);
    try {
      await apiCambiarPassword(currentPassword, newPassword);
      setPwdMsg({ text: 'Contraseña actualizada correctamente', ok: true });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowForm(false);
    } catch (err) {
      setPwdMsg({
        text: err instanceof ApiError ? err.message : 'Error al cambiar contraseña',
        ok: false,
      });
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-800 mb-6">Mi Cuenta</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        {/* Profile info */}
        <div className="bg-white rounded-lg shadow">
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
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Actualizar
                Perfil
              </button>
            </div>
          )}
        </div>

        {/* Password change */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex items-center gap-3">
            <Lock size={18} className="text-navy-500" />
            <h2 className="font-semibold text-gray-800">Cambiar Contraseña</h2>
          </div>
          <div className="p-6">
            {pwdMsg && (
              <div
                className={`mb-4 px-4 py-2.5 rounded text-sm ${pwdMsg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
              >
                {pwdMsg.ok && <Check size={14} className="inline mr-1" />}
                {pwdMsg.text}
              </div>
            )}

            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full px-4 py-2 bg-navy-600 text-white rounded-lg text-sm font-medium hover:bg-navy-700"
              >
                Cambiar Contraseña
              </button>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña actual
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="flex-1 px-4 py-2 bg-navy-600 text-white rounded-lg text-sm font-medium hover:bg-navy-700 disabled:opacity-50"
                  >
                    {pwdLoading ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setPwdMsg(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
