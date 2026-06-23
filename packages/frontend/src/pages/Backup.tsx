import { useState } from 'react';
import { Shield, Download, Loader2 } from 'lucide-react';
import { apiGenerarBackup, ApiError } from '../lib/api';

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
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield size={28} className="text-navy-600" />
            <div>
              <h1 className="text-xl font-bold text-navy-800">Respaldo de Base de Datos</h1>
              <p className="text-sm text-gray-500">
                Genera una copia completa de todos los datos del sistema
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">Importante:</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              <li>El respaldo contiene TODOS los registros del sistema</li>
              <li>
                Se descargará un archivo <strong>.json</strong> con la fecha actual
              </li>
              <li>
                Para restaurar, usar el comando{' '}
                <code className="bg-amber-100 px-1 rounded">npx prisma db push</code> con los datos
                del archivo
              </li>
              <li>Se recomienda guardar el archivo en un lugar seguro</li>
            </ul>
          </div>

          <button
            onClick={handleGenerar}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-navy-700 text-white rounded-lg font-medium hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generando respaldo...
              </>
            ) : (
              <>
                <Download size={20} />
                Generar y Descargar Respaldo
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
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
    </div>
  );
}
