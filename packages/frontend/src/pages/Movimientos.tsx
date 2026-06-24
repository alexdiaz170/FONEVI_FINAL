import { Outlet, Link, useLocation } from 'react-router-dom';
import { Plus, List, ArrowLeftRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function MovimientosPage() {
  const { pathname } = useLocation();

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <ArrowLeftRight size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-800">Movimientos</h1>
            <p className="text-sm text-gray-500">Registro de transacciones del fondo</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/movimientos"
            end
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
              pathname === '/movimientos'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-lg shadow-cyan-500/25'
                : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:text-cyan-600 hover:shadow-md',
            )}
          >
            <List size={16} /> Lista
          </Link>
          <Link
            to="/movimientos/crear"
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
              pathname === '/movimientos/crear'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-lg shadow-cyan-500/25'
                : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:text-cyan-600 hover:shadow-md',
            )}
          >
            <Plus size={16} /> Nuevo Movimiento
          </Link>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
