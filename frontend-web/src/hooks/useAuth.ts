import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const { user, accessToken, isLoading } = useAuthStore();
  const isAuthenticated = Boolean(user && accessToken);

  return { user, isAuthenticated, isLoading };
};

export const useRequireAuth = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Keep guest browsing friendly: unauthenticated users are redirected to home, not forced to login.
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { user, isAuthenticated, isLoading };
};

export const useRequireRole = (role: 'CLIENT' | 'PROVIDER' | 'ADMIN' | 'REQUESTER') => {
  const { user, isAuthenticated, isLoading } = useRequireAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && user.role !== role) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading, role, navigate]);

  return { user, isAuthenticated, isLoading };
};
