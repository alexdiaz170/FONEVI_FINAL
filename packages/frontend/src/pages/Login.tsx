import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ApiError } from '../lib/api';
import {
  AnimatedContainer,
  AnimatedCard,
  AnimatedButton,
  AnimatedInputWrapper,
  AnimatedSlideDown,
  AnimatedSlideLeft,
  AnimatedFadeIn,
} from '../components/ui';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('El email es requerido');
      return;
    }
    if (!password) {
      setError('La contraseña es requerida');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error de conexión con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-navy-600/20 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-40 md:w-80 h-40 md:h-80 bg-navy-600/20 rounded-full translate-y-1/2 -translate-x-1/4" />

      <AnimatedContainer className="w-full max-w-md relative">
        <AnimatedCard className="p-6 md:p-8">
          <AnimatedSlideDown delay={0.1}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-navy-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-gold-400 font-bold text-2xl">F</span>
              </div>
              <h1 className="text-3xl font-bold text-navy-800">FONEVI</h1>
              <p className="text-gray-500 mt-1">Sistema de Gestión Financiera</p>
            </div>
          </AnimatedSlideDown>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <AnimatedSlideLeft>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              </AnimatedSlideLeft>
            )}

            <AnimatedInputWrapper delay={0.15}>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-shadow text-sm"
                  placeholder="admin@fonevi.com"
                  autoComplete="email"
                />
              </div>
            </AnimatedInputWrapper>

            <AnimatedInputWrapper delay={0.2}>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500 transition-shadow text-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </AnimatedInputWrapper>

            <AnimatedFadeIn delay={0.3}>
              <AnimatedButton
                type="submit"
                disabled={loading}
                className="w-full bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar sesión'
                )}
              </AnimatedButton>
            </AnimatedFadeIn>
          </form>
        </AnimatedCard>

        <AnimatedFadeIn delay={0.5}>
          <p className="text-center text-navy-300 text-xs mt-6">
            &copy; {new Date().getFullYear()} FONEVI &mdash; Fondo de Empleados Docentes
          </p>
        </AnimatedFadeIn>
      </AnimatedContainer>
    </div>
  );
}
