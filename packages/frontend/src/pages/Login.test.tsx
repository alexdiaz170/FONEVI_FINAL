import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './Login';
import { ApiError } from '../lib/api';

const mockLogin = vi.fn();
const mockIsAuthenticated = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated(),
    login: mockLogin,
  }),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsAuthenticated.mockReturnValue(false);
});

describe('LoginPage', () => {
  it('renders the login form', () => {
    renderPage();
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
    expect(screen.getByText('FONEVI')).toBeInTheDocument();
  });

  it('redirects to dashboard when already authenticated', () => {
    mockIsAuthenticated.mockReturnValue(true);
    renderPage();
    expect(screen.queryByLabelText('Correo electrónico')).not.toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(await screen.findByText('El email es requerido')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows validation error for empty password', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'test@test.com' },
    });
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(await screen.findByText('La contraseña es requerida')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login on valid submit', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'admin@fonevi.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'secret' },
    });
    fireEvent.click(screen.getByText('Iniciar sesión'));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@fonevi.com', 'secret');
    });
  });

  it('shows loading state while submitting', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}));
    renderPage();
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'a@b.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'p' },
    });
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(await screen.findByText('Iniciando sesión...')).toBeInTheDocument();
  });

  it('shows ApiError message on login failure', async () => {
    mockLogin.mockRejectedValue(new ApiError(401, 'Credenciales inválidas'));
    renderPage();
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'a@b.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'p' },
    });
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument();
  });

  it('shows generic error for non-ApiError', async () => {
    mockLogin.mockRejectedValue(new Error('network'));
    renderPage();
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'a@b.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'p' },
    });
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(await screen.findByText('Error de conexión con el servidor')).toBeInTheDocument();
  });

  it('disables submit button while loading', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}));
    renderPage();
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'a@b.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'p' },
    });
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(await screen.findByText('Iniciando sesión...')).toBeDisabled();
  });

  it('shows current year in footer', () => {
    renderPage();
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(String(year)))).toBeInTheDocument();
  });

  it('clears previous error on new submit attempt', async () => {
    mockLogin.mockRejectedValueOnce(new ApiError(401, 'Bad'));
    const { rerender } = render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'a@b.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'p' },
    });
    fireEvent.click(screen.getByText('Iniciar sesión'));
    expect(await screen.findByText('Bad')).toBeInTheDocument();

    mockLogin.mockRejectedValueOnce(new ApiError(401, 'Bad'));
    fireEvent.click(screen.getByText('Iniciar sesión'));
    await waitFor(() => {
      expect(screen.queryByText('Bad')).toBeInTheDocument();
    });
  });
});
