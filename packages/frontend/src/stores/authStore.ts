import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UsuarioAuth {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

interface AuthState {
  usuario: UsuarioAuth | null;
  token: string | null;
  refreshToken: string | null;
  setAuth: (usuario: UsuarioAuth, token: string, refreshToken: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      refreshToken: null,
      setAuth: (usuario, token, refreshToken) => set({ usuario, token, refreshToken }),
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      logout: () => set({ usuario: null, token: null, refreshToken: null }),
      isAuthenticated: () => get().token !== null,
    }),
    { name: 'fonevi-auth' },
  ),
);
