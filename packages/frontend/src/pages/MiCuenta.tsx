import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Mail,
  Shield,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  Check,
  Key,
  Fingerprint,
  Clock,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiGetProfile, apiCambiarPassword, ApiError } from '../lib/api';
import {
  AnimatedStaggerContainer,
  AnimatedStaggerItem,
  GlassCard,
  AnimatedButton,
  AnimatedFadeIn,
  AnimatedSlideLeft,
} from '../components/ui';

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
    <div className="relative">
      <div className="absolute top-0 right-0 w-72 h-72 bg-navy-500/10 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-navy-500/10 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <AnimatedStaggerContainer className="relative">
        <AnimatedStaggerItem>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-navy-800">Mi Cuenta</h1>
            <p className="text-gray-500 mt-1">Gestiona tu perfil y seguridad</p>
          </div>
        </AnimatedStaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Profile Card */}
          <AnimatedStaggerItem className="lg:col-span-3">
            <GlassCard>
              {isLoading && (
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 rounded-full bg-white/10 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-5 w-40 bg-white/10 rounded animate-pulse" />
                    <div className="h-4 w-28 bg-white/10 rounded animate-pulse" />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-400 text-sm mb-4">
                  Error: {(error as ApiError).message}
                </div>
              )}

              {display && (
                <>
                  <div className="flex items-start gap-5 mb-8">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 bg-gradient-to-br from-navy-500 to-blue-400 rounded-full flex items-center justify-center shadow-lg shadow-navy-500/30">
                        <User size={32} className="text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 border-2 border-navy-800 rounded-full flex items-center justify-center">
                        <BadgeCheck size={14} className="text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold text-gray-900">{display.nombre}</h2>
                      <p className="text-sm text-gray-500">{display.email}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-navy-600 to-navy-500 text-white shadow-sm">
                          <Shield size={11} />
                          {display.rol}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Activo
                        </span>
                      </div>
                    </div>
                    <AnimatedButton
                      onClick={() => refetch()}
                      disabled={isLoading}
                      className="shrink-0 p-2.5 rounded-xl bg-white/80 hover:bg-white border border-gray-200 text-gray-500 hover:text-navy-600 transition-colors"
                    >
                      <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </AnimatedButton>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/50 border border-gray-100">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy-100 to-navy-50 flex items-center justify-center">
                        <Mail size={16} className="text-navy-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Email
                        </p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {display.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/50 border border-gray-100">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                        <Shield size={16} className="text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Rol
                        </p>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {display.rol}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/50 border border-gray-100">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                        <Clock size={16} className="text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          Estado
                        </p>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {display.estado ?? 'activo'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/50 border border-gray-100">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                        <BadgeCheck size={16} className="text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                          ID
                        </p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {display.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </GlassCard>
          </AnimatedStaggerItem>

          {/* Password Card */}
          <AnimatedStaggerItem className="lg:col-span-2">
            <GlassCard>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-500 to-blue-400 flex items-center justify-center shadow-md">
                  <Key size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Seguridad</h2>
                  <p className="text-xs text-gray-500">Cambia tu contraseña</p>
                </div>
              </div>

              {pwdMsg && (
                <AnimatedFadeIn>
                  <div
                    className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 border ${
                      pwdMsg.ok
                        ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200'
                        : 'bg-red-50/80 text-red-700 border-red-200'
                    }`}
                  >
                    {pwdMsg.ok ? (
                      <Check size={16} className="shrink-0 text-emerald-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-red-500 shrink-0" />
                    )}
                    {pwdMsg.text}
                  </div>
                </AnimatedFadeIn>
              )}

              {!showForm ? (
                <AnimatedButton
                  onClick={() => setShowForm(true)}
                  className="w-full py-3 bg-gradient-to-r from-navy-600 to-navy-500 text-white rounded-xl text-sm font-medium hover:from-navy-700 hover:to-navy-600 shadow-lg shadow-navy-500/25 transition-all"
                >
                  <Lock size={16} className="inline mr-2" />
                  Cambiar Contraseña
                </AnimatedButton>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Contraseña actual
                    </label>
                    <div className="relative">
                      <Lock
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <Fingerprint
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full pl-10 pr-3 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirmar nueva contraseña
                    </label>
                    <div className="relative">
                      <Fingerprint
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-3 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-all"
                        placeholder="Repite la contraseña"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <AnimatedButton
                      type="submit"
                      disabled={pwdLoading}
                      className="flex-1 py-2.5 bg-gradient-to-r from-navy-600 to-navy-500 text-white rounded-xl text-sm font-medium hover:from-navy-700 hover:to-navy-600 shadow-lg shadow-navy-500/25 disabled:opacity-50 transition-all"
                    >
                      {pwdLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw size={14} className="animate-spin" />
                          Guardando...
                        </span>
                      ) : (
                        'Guardar'
                      )}
                    </AnimatedButton>
                    <AnimatedButton
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setPwdMsg(null);
                      }}
                      className="px-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-white hover:text-gray-800 transition-all"
                    >
                      Cancelar
                    </AnimatedButton>
                  </div>
                </form>
              )}

              <AnimatedSlideLeft>
                <div className="mt-6 p-3.5 rounded-xl bg-navy-50/50 border border-navy-100">
                  <p className="text-xs text-navy-600 flex items-start gap-2">
                    <Shield size={14} className="shrink-0 mt-0.5 text-navy-400" />
                    Recomendamos usar una contraseña única con al menos 8 caracteres, combinando
                    letras, números y símbolos.
                  </p>
                </div>
              </AnimatedSlideLeft>
            </GlassCard>
          </AnimatedStaggerItem>
        </div>
      </AnimatedStaggerContainer>
    </div>
  );
}
