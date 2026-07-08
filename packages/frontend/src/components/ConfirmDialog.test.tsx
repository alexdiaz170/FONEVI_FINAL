import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'Eliminar socio',
    message: '¿Está seguro de eliminar este socio?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('should render the dialog when open is true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Eliminar socio')).toBeInTheDocument();
    expect(screen.getByText('¿Está seguro de eliminar este socio?')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Eliminar socio')).not.toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText('Eliminar'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('should call onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('should show custom button labels', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="Sí, borrar" cancelLabel="No, volver" />);
    expect(screen.getByText('Sí, borrar')).toBeInTheDocument();
    expect(screen.getByText('No, volver')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);
    expect(screen.getByText('Eliminando...')).toBeInTheDocument();
    expect(screen.getByText('Eliminando...')).toBeDisabled();
  });

  it('should disable action buttons when loading', () => {
    render(<ConfirmDialog {...defaultProps} loading={true} />);
    expect(screen.getByText('Eliminando...')).toBeDisabled();
    expect(screen.getByText('Cancelar')).toBeDisabled();
  });

  it('should call onCancel when clicking the overlay backdrop', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    const overlay = screen.getByLabelText('Cerrar');
    fireEvent.click(overlay);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('should prevent overlay click when loading', () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} loading={true} onCancel={onCancel} />);
    const overlay = screen.getByLabelText('Cerrar');
    fireEvent.click(overlay);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
