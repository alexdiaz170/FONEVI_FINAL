import { Outlet, Link, useLocation } from 'react-router-dom';
import { Plus, List, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatedFadeIn, AnimatedStaggerItem, AnimatedStaggerContainer } from '../components/ui';

export default function SociosPage() {
  const { pathname } = useLocation();

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-navy-500/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-navy-500/10 rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <AnimatedStaggerContainer>
        <AnimatedStaggerItem>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-600 to-navy-400 flex items-center justify-center shadow-lg shadow-navy-500/25">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-navy-800">Socios</h1>
                <p className="text-sm text-gray-500">Gestión de miembros del fondo</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to="/socios"
                end
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                  pathname === '/socios'
                    ? 'bg-gradient-to-r from-navy-600 to-navy-500 text-white shadow-lg shadow-navy-500/25'
                    : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:text-navy-600 hover:shadow-md',
                )}
              >
                <List size={16} /> Lista
              </Link>
              <Link
                to="/socios/crear"
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                  pathname === '/socios/crear'
                    ? 'bg-gradient-to-r from-navy-600 to-navy-500 text-white shadow-lg shadow-navy-500/25'
                    : 'bg-white/80 backdrop-blur-sm text-gray-600 border border-gray-200 hover:bg-white hover:text-navy-600 hover:shadow-md',
                )}
              >
                <Plus size={16} /> Nuevo Socio
              </Link>
            </div>
          </div>
        </AnimatedStaggerItem>

        <AnimatedStaggerItem>
          <Outlet />
        </AnimatedStaggerItem>
      </AnimatedStaggerContainer>
    </div>
  );
}
