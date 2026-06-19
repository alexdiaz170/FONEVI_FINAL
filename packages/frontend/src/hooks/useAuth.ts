import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiLogin, apiGetProfile, ApiError } from '../lib/api';

export function useAuth() {
  const { usuario, token, setAuth, logout: storeLogout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await apiLogin(email, password);
      setAuth(data.usuario, data.token, data.refreshToken);
      navigate('/dashboard', { replace: true });
    },
    [setAuth, navigate],
  );

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await apiGetProfile();
      useAuthStore.getState().setAuth(profile, token!, useAuthStore.getState().refreshToken!);
    } catch {
      /* token expired, logout handles it */
    }
  }, [token]);

  const logout = useCallback(() => {
    storeLogout();
    navigate('/login', { replace: true });
  }, [storeLogout, navigate]);

  return { usuario, token, isAuthenticated: isAuthenticated(), login, logout, refreshProfile };
}
