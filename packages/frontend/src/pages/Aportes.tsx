import { Outlet, Link, useLocation } from 'react-router-dom';
import { Plus, List, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';

export default function AportesPage() {
  const { pathname } = useLocation();
  const usuario = useAuthStore((s) => s.usuario);
  const esSocio = usuario?.rol === 'socio';

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-800">Aportes</h1>
            <p className="text-sm text-gray-500">Registro de aportes de los socios</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/aportes"
            end
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
              pathname === '/aportes'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:text-emerald-600 hover:shadow-md',
            )}
          >
            <List size={16} /> Lista
          </Link>
          {!esSocio && (
            <Link
              to="/aportes/crear"
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname === '/aportes/crear'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:text-emerald-600 hover:shadow-md',
              )}
            >
              <Plus size={16} /> Nuevo Aporte
            </Link>
          )}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
