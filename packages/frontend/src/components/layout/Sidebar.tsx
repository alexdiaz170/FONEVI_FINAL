import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LazyMotion, m, AnimatePresence } from 'framer-motion';
import { domAnimation } from 'framer-motion/dom';
import {
  LayoutDashboard,
  Users,
  Wallet,
  CreditCard,
  Calculator,
  AlertTriangle,
  ArrowLeftRight,
  Settings,
  UserCircle,
  Menu,
  X,
  Bell,
  HandHeart,
  FileText,
  ScrollText,
  CalendarCheck,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import { staggerContainer, staggerItem } from '../../lib/animations';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  roles: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Panel',
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'superadmin', 'socio'],
      },
      {
        to: '/mi-cuenta',
        label: 'Mi Cuenta',
        icon: UserCircle,
        roles: ['socio', 'admin', 'superadmin'],
      },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/socios', label: 'Socios', icon: Users, roles: ['admin', 'superadmin'] },
      { to: '/aportes', label: 'Aportes', icon: Wallet, roles: ['admin', 'superadmin', 'socio'] },
      {
        to: '/creditos',
        label: 'Créditos',
        icon: CreditCard,
        roles: ['admin', 'superadmin', 'socio'],
      },
      {
        to: '/simulador-credito',
        label: 'Simulador',
        icon: Calculator,
        roles: ['admin', 'superadmin', 'socio'],
      },
      { to: '/mora', label: 'Mora', icon: AlertTriangle, roles: ['admin', 'superadmin'] },
      {
        to: '/movimientos',
        label: 'Movimientos',
        icon: ArrowLeftRight,
        roles: ['admin', 'superadmin'],
      },
      { to: '/solidaridad', label: 'Solidaridad', icon: HandHeart, roles: ['admin', 'superadmin'] },
    ],
  },
  {
    label: 'Administración',
    items: [
      {
        to: '/notificaciones',
        label: 'Notificaciones',
        icon: Bell,
        roles: ['admin', 'superadmin', 'socio'],
      },
      { to: '/reportes', label: 'Reportes', icon: FileText, roles: ['admin', 'superadmin'] },
      {
        to: '/cierre-periodo',
        label: 'Cierre Período',
        icon: CalendarCheck,
        roles: ['admin', 'superadmin'],
      },
      { to: '/whatsapp', label: 'WhatsApp', icon: MessageSquare, roles: ['admin', 'superadmin'] },
      { to: '/auditoria', label: 'Auditoría', icon: ScrollText, roles: ['admin', 'superadmin'] },
      {
        to: '/configuracion',
        label: 'Configuración',
        icon: Settings,
        roles: ['admin', 'superadmin'],
      },
      { to: '/backup', label: 'Respaldo', icon: Shield, roles: ['admin', 'superadmin'] },
    ],
  },
];

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const usuario = useAuthStore((s) => s.usuario);

  const visibleGroups = navGroups.reduce((acc, g) => {
    const items = g.items.filter((item) => usuario && item.roles.includes(usuario.rol));
    if (items.length > 0) {
      acc.push({ ...g, items });
    }
    return acc;
  }, [] as NavGroup[]);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between p-4 border-b border-navy-600 shrink-0">
        <AnimatePresence>
          {!collapsed && (
            <m.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="text-gold-500 font-bold text-lg"
            >
              FONEVI
            </m.span>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              setCollapsed(false);
            }}
            className="p-1 hover:bg-navy-700 rounded md:hidden"
          >
            <X size={20} />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-navy-700 rounded max-md:hidden"
          >
            <m.span
              animate={{ rotate: collapsed ? 0 : 90 }}
              transition={{ duration: 0.3 }}
              className="block"
            >
              {collapsed ? <Menu size={20} /> : <X size={20} />}
            </m.span>
          </button>
        </div>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <AnimatePresence>
              {!collapsed && (
                <m.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest overflow-hidden"
                >
                  {group.label}
                </m.p>
              )}
            </AnimatePresence>
            <m.div variants={staggerContainer} initial="hidden" animate="visible">
              {group.items.map((item) => (
                <m.div key={item.to} variants={staggerItem}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                        isActive
                          ? 'bg-navy-700 text-gold-400 border-r-2 border-gold-400'
                          : 'text-gray-300 hover:bg-navy-700 hover:text-white',
                      )
                    }
                  >
                    <item.icon size={20} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </m.div>
              ))}
            </m.div>
          </div>
        ))}
      </nav>
    </>
  );

  return (
    <LazyMotion features={domAnimation}>
      <m.aside
        layout
        className={cn(
          'bg-navy-800 text-white flex flex-col overflow-hidden shrink-0',
          'fixed inset-y-0 left-0 z-30 md:relative',
          'max-md:transition-transform max-md:duration-300',
          mobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
          collapsed ? 'w-16' : 'w-64',
        )}
        animate={{ width: collapsed && !mobileOpen ? 64 : 256 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {sidebarContent}
      </m.aside>
    </LazyMotion>
  );
}
