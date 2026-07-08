import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MovimientosCrear from './MovimientosCrear';
import { ApiError } from '../../lib/api';

const mockNavigate = vi.fn();
const mockApiCrearMovimiento = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode;
    to: string;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('../../lib/api', () => ({
  apiCrearMovimiento: (...args: unknown[]) => mockApiCrearMovimiento(...args),
  ApiError: class extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MovimientosCrear', () => {
  it('renders the form with all fields', () => {
    render(<MovimientosCrear />);
    expect(screen.getByLabelText('Categoría')).toBeInTheDocument();
    expect(screen.getByLabelText('Descripción')).toBeInTheDocument();
    expect(screen.getByLabelText('Monto')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha')).toBeInTheDocument();
    expect(screen.getByText('Guardar Movimiento')).toBeInTheDocument();
    expect(screen.getByText('Nuevo Movimiento')).toBeInTheDocument();
  });

  it('shows validation error for short categoria', async () => {
    render(<MovimientosCrear />);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'a' } });
    fireEvent.click(screen.getByText('Guardar Movimiento'));
    expect(
      await screen.findByText('La categoría debe tener al menos 2 caracteres'),
    ).toBeInTheDocument();
    expect(mockApiCrearMovimiento).not.toHaveBeenCalled();
  });

  it('shows validation error for short descripcion', async () => {
    render(<MovimientosCrear />);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'cat' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'ab' } });
    fireEvent.click(screen.getByText('Guardar Movimiento'));
    expect(
      await screen.findByText('La descripción debe tener al menos 3 caracteres'),
    ).toBeInTheDocument();
    expect(mockApiCrearMovimiento).not.toHaveBeenCalled();
  });

  it('shows validation error for monto <= 0', async () => {
    render(<MovimientosCrear />);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'cat' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'desc' } });
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '0' } });
    fireEvent.click(screen.getByText('Guardar Movimiento'));
    expect(await screen.findByText('El monto debe ser mayor a 0')).toBeInTheDocument();
    expect(mockApiCrearMovimiento).not.toHaveBeenCalled();
  });

  it('calls apiCrearMovimiento and navigates on valid submit', async () => {
    mockApiCrearMovimiento.mockResolvedValue(undefined);
    render(<MovimientosCrear />);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'servicios' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'pago internet' } });
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '150000' } });
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-07-05' } });
    fireEvent.click(screen.getByText('Guardar Movimiento'));
    await waitFor(() => {
      expect(mockApiCrearMovimiento).toHaveBeenCalledWith({
        tipo: 'ingreso',
        categoria: 'servicios',
        descripcion: 'pago internet',
        monto: 150000,
        fecha: '2026-07-05',
      });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/movimientos');
  });

  it('shows error message on API failure', async () => {
    mockApiCrearMovimiento.mockRejectedValue(new ApiError(400, 'Categoría duplicada'));
    render(<MovimientosCrear />);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'servicios' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'pago internet' } });
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '150000' } });
    fireEvent.click(screen.getByText('Guardar Movimiento'));
    expect(await screen.findByText('Categoría duplicada')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows generic error for non-ApiError', async () => {
    mockApiCrearMovimiento.mockRejectedValue(new Error('network'));
    render(<MovimientosCrear />);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'servicios' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'pago internet' } });
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '150000' } });
    fireEvent.click(screen.getByText('Guardar Movimiento'));
    expect(await screen.findByText('Error al crear movimiento')).toBeInTheDocument();
  });

  it('shows loading state while submitting', async () => {
    mockApiCrearMovimiento.mockImplementation(() => new Promise(() => {}));
    render(<MovimientosCrear />);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'cat' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'desc' } });
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '1000' } });
    fireEvent.click(screen.getByText('Guardar Movimiento'));
    expect(await screen.findByText('Guardando...')).toBeInTheDocument();
  });

  it('uses default tipo ingreso', () => {
    render(<MovimientosCrear />);
    const select = screen.getByLabelText('Tipo *') as HTMLSelectElement;
    expect(select.value).toBe('ingreso');
  });

  it('updates tipo when changed', () => {
    render(<MovimientosCrear />);
    const select = screen.getByLabelText('Tipo *');
    fireEvent.change(select, { target: { value: 'egreso' } });
    expect((select as HTMLSelectElement).value).toBe('egreso');
  });

  it('submits without fecha when empty', async () => {
    mockApiCrearMovimiento.mockResolvedValue(undefined);
    render(<MovimientosCrear />);
    fireEvent.change(screen.getByLabelText('Categoría'), { target: { value: 'cat' } });
    fireEvent.change(screen.getByLabelText('Descripción'), { target: { value: 'desc' } });
    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '50000' } });
    fireEvent.click(screen.getByText('Guardar Movimiento'));
    await waitFor(() => {
      expect(mockApiCrearMovimiento).toHaveBeenCalledWith({
        tipo: 'ingreso',
        categoria: 'cat',
        descripcion: 'desc',
        monto: 50000,
        fecha: undefined,
      });
    });
  });
});
