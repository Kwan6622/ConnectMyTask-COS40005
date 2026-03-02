import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Auto-fetch user if token exists
      useAuthStore.getState().fetchCurrentUser();
    }
  }, []);

  return { user, isAuthenticated, isLoading };
};

export const useRequireAuth = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading]);

  return { user, isAuthenticated, isLoading };
};

export const useRequireRole = (role: 'CLIENT' | 'PROVIDER' | 'ADMIN') => {
  const { user, isAuthenticated, isLoading } = useRequireAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && user.role !== role) {
      navigate('/', { replace: true });
    }
  }, [user, isLoading]);

  return { user, isAuthenticated, isLoading };
};
