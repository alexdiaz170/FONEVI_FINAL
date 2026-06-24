import { Outlet, Link, useLocation } from 'react-router-dom';
import { Plus, List, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';

export default function CreditosPage() {
  const { pathname } = useLocation();
  const usuario = useAuthStore((s) => s.usuario);
  const esSocio = usuario?.rol === 'socio';

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <CreditCard size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-800">Créditos</h1>
            <p className="text-sm text-gray-500">Gestión de préstamos y financiación</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/creditos"
            end
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
              pathname === '/creditos'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:text-purple-600 hover:shadow-md',
            )}
          >
            <List size={16} /> Lista
          </Link>
          {!esSocio && (
            <Link
              to="/creditos/crear"
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                pathname === '/creditos/crear'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:text-purple-600 hover:shadow-md',
              )}
            >
              <Plus size={16} /> Nuevo Crédito
            </Link>
          )}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
