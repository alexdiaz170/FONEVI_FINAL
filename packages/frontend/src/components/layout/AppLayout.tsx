import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { AnimatedPage } from '../ui';

export function AppLayout() {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onToggleMobile={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          <AnimatePresence mode="wait">
            <AnimatedPage key={location.pathname}>
              <Outlet />
            </AnimatedPage>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
