import { LogOut, Bell, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { fadeInDown } from '../../lib/animations';

export function Topbar({ onToggleMobile }: { onToggleMobile: () => void }) {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <motion.header
      variants={fadeInDown}
      initial="hidden"
      animate="visible"
      className="h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 md:px-6 shrink-0"
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMobile}
          className="p-2 text-gray-500 hover:text-navy-700 hover:bg-gray-100 rounded-full md:hidden"
          title="Menú"
        >
          <Menu size={20} />
        </button>
        <div className="text-xs md:text-sm text-gray-500 max-md:hidden">
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/notificaciones')}
          className="relative p-1.5 md:p-2 text-gray-500 hover:text-navy-700 hover:bg-gray-100 rounded-full"
          title="Notificaciones"
        >
          <Bell size={18} />
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full"
          />
        </motion.button>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-1.5 md:gap-2"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 bg-navy-600 rounded-full flex items-center justify-center text-white text-xs md:text-sm">
            <User size={14} />
          </div>
          <div className="text-xs md:text-sm max-sm:hidden">
            <p className="font-medium text-gray-900 truncate max-w-[100px] md:max-w-[200px]">
              {usuario?.nombre ?? 'Usuario'}
            </p>
            <p className="text-gray-500 capitalize hidden md:block">{usuario?.rol ?? ''}</p>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05, color: '#dc2626' }}
          whileTap={{ scale: 0.95 }}
          onClick={logout}
          className="p-1.5 md:p-2 text-gray-500 hover:bg-red-50 rounded-full"
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </motion.button>
      </div>
    </motion.header>
  );
}
