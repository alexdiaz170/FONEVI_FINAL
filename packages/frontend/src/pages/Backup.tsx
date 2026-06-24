import { useState } from 'react';
import { Shield, Download, Loader2, AlertTriangle } from 'lucide-react';
import { apiGenerarBackup, ApiError } from '../lib/api';
import { AnimatedFadeIn, AnimatedButton } from '../components/ui';

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerar() {
    setLoading(true);
    setError('');
    try {
      await apiGenerarBackup();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al generar respaldo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <AnimatedFadeIn>
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-navy-800">Respaldo de Base de Datos</h1>
                <p className="text-sm text-gray-500">
                  Genera una copia completa de todos los datos del sistema
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Importante:</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>El respaldo contiene TODOS los registros del sistema</li>
                    <li>
                      Se descargará un archivo <strong>.json</strong> con la fecha actual
                    </li>
                    <li>
                      Para restaurar, usar el comando{' '}
                      <code className="bg-amber-100 px-1 rounded">npx prisma db push</code> con los
                      datos del archivo
                    </li>
                    <li>Se recomienda guardar el archivo en un lugar seguro</li>
                  </ul>
                </div>
              </div>
            </div>

            <AnimatedButton
              onClick={handleGenerar}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-600 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Generando respaldo...
                </>
              ) : (
                <>
                  <Download size={20} /> Generar y Descargar Respaldo
                </>
              )}
            </AnimatedButton>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="text-center text-xs text-gray-400">
                Al hacer clic se consultarán todas las tablas y se empaquetarán en un archivo JSON
              </div>
            )}
          </div>
        </div>
      </AnimatedFadeIn>
    </div>
  );
}
