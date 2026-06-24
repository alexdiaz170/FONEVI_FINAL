import { LogOut, Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { fadeInDown } from '../../lib/animations';

export function Topbar() {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <motion.header
      variants={fadeInDown}
      initial="hidden"
      animate="visible"
      className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0"
    >
      <div className="text-sm text-gray-500">
        {new Date().toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/notificaciones')}
          className="relative p-2 text-gray-500 hover:text-navy-700 hover:bg-gray-100 rounded-full"
          title="Notificaciones"
        >
          <Bell size={20} />
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
          />
        </motion.button>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-navy-600 rounded-full flex items-center justify-center text-white text-sm">
            <User size={16} />
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">{usuario?.nombre ?? 'Usuario'}</p>
            <p className="text-gray-500 capitalize">{usuario?.rol ?? ''}</p>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05, color: '#dc2626' }}
          whileTap={{ scale: 0.95 }}
          onClick={logout}
          className="p-2 text-gray-500 hover:bg-red-50 rounded-full"
          title="Cerrar sesión"
        >
          <LogOut size={20} />
        </motion.button>
      </div>
    </motion.header>
  );
}
