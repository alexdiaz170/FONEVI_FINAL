import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  const mockUsuario = { id: '1', nombre: 'Admin', email: 'admin@test.com', rol: 'admin' };

  beforeEach(() => {
    useAuthStore.setState({ usuario: null, token: null, refreshToken: null });
  });

  it('should start unauthenticated', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    expect(useAuthStore.getState().usuario).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('should set auth state', () => {
    useAuthStore.getState().setAuth(mockUsuario, 'token-123', 'refresh-456');
    const state = useAuthStore.getState();
    expect(state.usuario).toEqual(mockUsuario);
    expect(state.token).toBe('token-123');
    expect(state.refreshToken).toBe('refresh-456');
    expect(state.isAuthenticated()).toBe(true);
  });

  it('should update tokens without changing user', () => {
    useAuthStore.getState().setAuth(mockUsuario, 'old-token', 'old-refresh');
    useAuthStore.getState().setTokens('new-token', 'new-refresh');
    const state = useAuthStore.getState();
    expect(state.token).toBe('new-token');
    expect(state.refreshToken).toBe('new-refresh');
    expect(state.usuario).toEqual(mockUsuario);
  });

  it('should clear auth on logout', () => {
    useAuthStore.getState().setAuth(mockUsuario, 'token-123', 'refresh-456');
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.usuario).toBeNull();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
  });

  it('should reflect authentication status', () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    useAuthStore.getState().setAuth(mockUsuario, 't', 'r');
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });
});
