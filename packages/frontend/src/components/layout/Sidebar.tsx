import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wallet,
  CreditCard,
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

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const usuario = useAuthStore((s) => s.usuario);

  const visibleGroups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => usuario && item.roles.includes(usuario.rol)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <aside
      className={cn(
        'bg-navy-800 text-white flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-navy-600">
        {!collapsed && <span className="text-gold-500 font-bold text-lg">FONEVI</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-navy-700 rounded">
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {visibleGroups.map((group) => (
          <div key={group.label} className="mb-2">
            {!collapsed && (
              <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                {group.label}
              </p>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
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
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
