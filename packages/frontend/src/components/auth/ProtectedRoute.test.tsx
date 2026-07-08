import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '../../stores/authStore';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual };
});

const mockUsuario = { id: '1', nombre: 'Admin', email: 'admin@test.com', rol: 'admin' };

beforeEach(() => {
  useAuthStore.setState({ usuario: null, token: null, refreshToken: null });
});

function renderWithRouter(ui: React.ReactElement, { initialEntries = ['/'] } = {}) {
  return render(<MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>);
}

describe('ProtectedRoute', () => {
  it('should redirect to /login when not authenticated', () => {
    renderWithRouter(
      <ProtectedRoute>
        <div>Contenido protegido</div>
      </ProtectedRoute>,
    );
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    useAuthStore.getState().setAuth(mockUsuario, 'token-123', 'refresh-456');
    renderWithRouter(
      <ProtectedRoute>
        <div>Contenido protegido</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  it('should redirect to /dashboard when role is not authorized', () => {
    useAuthStore.getState().setAuth({ ...mockUsuario, rol: 'socio' }, 'token-123', 'refresh-456');
    renderWithRouter(
      <ProtectedRoute roles={['admin', 'superadmin']}>
        <div>Panel admin</div>
      </ProtectedRoute>,
    );
    expect(screen.queryByText('Panel admin')).not.toBeInTheDocument();
  });

  it('should render children when role matches', () => {
    useAuthStore.getState().setAuth(mockUsuario, 'token-123', 'refresh-456');
    renderWithRouter(
      <ProtectedRoute roles={['admin', 'superadmin']}>
        <div>Panel admin</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('Panel admin')).toBeInTheDocument();
  });

  it('should render children when no role restriction is set', () => {
    useAuthStore.getState().setAuth(mockUsuario, 'token-123', 'refresh-456');
    renderWithRouter(
      <ProtectedRoute>
        <div>Sin restricción</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('Sin restricción')).toBeInTheDocument();
  });
});
