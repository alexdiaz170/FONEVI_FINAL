import { LogOut, Bell, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export function Topbar() {
  const { usuario, logout } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-sm text-gray-500">
        {new Date().toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-navy-700 hover:bg-gray-100 rounded-full">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-navy-600 rounded-full flex items-center justify-center text-white text-sm">
            <User size={16} />
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">{usuario?.nombre ?? 'Usuario'}</p>
            <p className="text-gray-500 capitalize">{usuario?.rol ?? ''}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
          title="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
