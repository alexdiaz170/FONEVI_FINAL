import { Outlet, Link, useLocation } from 'react-router-dom';
import { Plus, List } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../stores/authStore';

export default function CreditosPage() {
  const { pathname } = useLocation();
  const usuario = useAuthStore((s) => s.usuario);
  const esSocio = usuario?.rol === 'socio';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-800">Créditos</h1>
        <div className="flex gap-2">
          <Link
            to="/creditos"
            end
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === '/creditos'
                ? 'bg-navy-700 text-white'
                : 'bg-white text-gray-700 border hover:bg-gray-50',
            )}
          >
            <List size={16} /> Lista
          </Link>
          {!esSocio && (
            <Link
              to="/creditos/crear"
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === '/creditos/crear'
                  ? 'bg-navy-700 text-white'
                  : 'bg-white text-gray-700 border hover:bg-gray-50',
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
