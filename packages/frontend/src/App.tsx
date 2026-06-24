import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/Login';

const DashboardPage = React.lazy(() => import('./pages/Dashboard'));
const SociosPage = React.lazy(() => import('./pages/Socios'));
const SociosLista = React.lazy(() => import('./pages/socios/SociosLista'));
const SociosCrear = React.lazy(() => import('./pages/socios/SociosCrear'));
const SociosPerfil = React.lazy(() => import('./pages/socios/SociosPerfil'));
const AportesPage = React.lazy(() => import('./pages/Aportes'));
const AportesLista = React.lazy(() => import('./pages/aportes/AportesLista'));
const AportesCrear = React.lazy(() => import('./pages/aportes/AportesCrear'));
const AportesPerfil = React.lazy(() => import('./pages/aportes/AportesPerfil'));
const CreditosPage = React.lazy(() => import('./pages/Creditos'));
const CreditosLista = React.lazy(() => import('./pages/creditos/CreditosLista'));
const CreditosCrear = React.lazy(() => import('./pages/creditos/CreditosCrear'));
const CreditosPerfil = React.lazy(() => import('./pages/creditos/CreditosPerfil'));
const MoraPage = React.lazy(() => import('./pages/Mora'));
const MovimientosPage = React.lazy(() => import('./pages/Movimientos'));
const MiCuentaPage = React.lazy(() => import('./pages/MiCuenta'));
const ConfiguracionPage = React.lazy(() => import('./pages/Configuracion'));
const NotificacionesPage = React.lazy(() => import('./pages/Notificaciones'));
const MovimientosLista = React.lazy(() => import('./pages/movimientos/MovimientosLista'));
const MovimientosCrear = React.lazy(() => import('./pages/movimientos/MovimientosCrear'));
const SolidaridadPage = React.lazy(() => import('./pages/Solidaridad'));
const SimuladorCreditoPage = React.lazy(() => import('./pages/SimuladorCredito'));
const AuditoriaPage = React.lazy(() => import('./pages/Auditoria'));
const CierrePeriodoPage = React.lazy(() => import('./pages/CierrePeriodo'));
const ReportesPage = React.lazy(() => import('./pages/Reportes'));
const WhatsAppPage = React.lazy(() => import('./pages/WhatsApp'));
const BackupPage = React.lazy(() => import('./pages/Backup'));

function LazyLoader({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center h-64 text-gray-400">Cargando...</div>
      }
    >
      {children}
    </React.Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <LazyLoader>
                  <DashboardPage />
                </LazyLoader>
              }
            />
            <Route
              path="socios"
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <LazyLoader>
                    <SociosPage />
                  </LazyLoader>
                </ProtectedRoute>
              }
            >
              <Route index element={<SociosLista />} />
              <Route path="crear" element={<SociosCrear />} />
              <Route path=":id" element={<SociosPerfil />} />
            </Route>
            <Route
              path="aportes"
              element={
                <LazyLoader>
                  <AportesPage />
                </LazyLoader>
              }
            >
              <Route index element={<AportesLista />} />
              <Route path="crear" element={<AportesCrear />} />
              <Route path=":id" element={<AportesPerfil />} />
            </Route>
            <Route
              path="creditos"
              element={
                <LazyLoader>
                  <CreditosPage />
                </LazyLoader>
              }
            >
              <Route index element={<CreditosLista />} />
              <Route path="crear" element={<CreditosCrear />} />
              <Route path=":id" element={<CreditosPerfil />} />
            </Route>
            <Route
              path="simulador-credito"
              element={
                <LazyLoader>
                  <SimuladorCreditoPage />
                </LazyLoader>
              }
            />
            <Route
              path="mora"
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <LazyLoader>
                    <MoraPage />
                  </LazyLoader>
                </ProtectedRoute>
              }
            />
            <Route
              path="movimientos"
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <LazyLoader>
                    <MovimientosPage />
                  </LazyLoader>
                </ProtectedRoute>
              }
            >
              <Route index element={<MovimientosLista />} />
              <Route path="crear" element={<MovimientosCrear />} />
            </Route>
            <Route
              path="notificaciones"
              element={
                <LazyLoader>
                  <NotificacionesPage />
                </LazyLoader>
              }
            />
            <Route
              path="mi-cuenta"
              element={
                <LazyLoader>
                  <MiCuentaPage />
                </LazyLoader>
              }
            />
            <Route
              path="configuracion"
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <LazyLoader>
                    <ConfiguracionPage />
                  </LazyLoader>
                </ProtectedRoute>
              }
            />
            <Route
              path="solidaridad"
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <LazyLoader>
                    <SolidaridadPage />
                  </LazyLoader>
                </ProtectedRoute>
              }
            />
            <Route
              path="reportes"
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <LazyLoader>
                    <ReportesPage />
                  </LazyLoader>
                </ProtectedRoute>
              }
            />
            <Route
              path="auditoria"
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <LazyLoader>
                    <AuditoriaPage />
                  </LazyLoader>
                </ProtectedRoute>
              }
            />
            <Route
              path="cierre-periodo"
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <LazyLoader>
                    <CierrePeriodoPage />
                  </LazyLoader>
                </ProtectedRoute>
              }
            />
            <Route
              path="whatsapp"
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <LazyLoader>
                    <WhatsAppPage />
                  </LazyLoader>
                </ProtectedRoute>
              }
            />
            <Route
              path="backup"
              element={
                <ProtectedRoute roles={['admin', 'superadmin']}>
                  <LazyLoader>
                    <BackupPage />
                  </LazyLoader>
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
