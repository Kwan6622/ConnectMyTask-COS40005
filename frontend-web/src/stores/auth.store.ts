import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';
import type { User } from '../types';
import { storage } from '../utils';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    role: 'CLIENT' | 'PROVIDER';
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  clearError: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateProfilePhoto: (profilePhotoUrl: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.auth.login(email, password);
          set({
            user: response.data.user,
            accessToken: response.data.accessToken,
            isLoading: false,
          });
          localStorage.setItem('accessToken', response.data.accessToken);
          storage.set('auth_token', response.data.accessToken);
        } catch (error: any) {
          const message =
            error?.response?.data?.message ||
            error?.message ||
            'Login failed';
          set({ 
            error: message, 
            isLoading: false 
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.auth.signup(data);
          set({
            user: response.data.user,
            accessToken: response.data.accessToken,
            isLoading: false,
          });
          localStorage.setItem('accessToken', response.data.accessToken);
          storage.set('auth_token', response.data.accessToken);
        } catch (error: any) {
          set({ 
            error: error.message || 'Registration failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        storage.remove('auth_token');
        set({ user: null, accessToken: null });
      },

      setUser: (user) => set({ user }),
      setToken: (token) => set({ accessToken: token }),
      clearError: () => set({ error: null }),

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call - replace with actual API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          set((state) => ({
            user: state.user ? { ...state.user, ...data } : null,
            isLoading: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update profile',
            isLoading: false
          });
          throw error;
        }
      },

      updateProfilePhoto: async (profilePhotoUrl: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.users.updateProfilePhoto(profilePhotoUrl);
          set((state) => ({
            user: state.user ? { ...state.user, ...response.data.user } : state.user,
            isLoading: false,
          }));
        } catch (error: any) {
          const message =
            error?.response?.data?.message ||
            error?.message ||
            'Failed to update profile photo';
          set({
            error: message,
            isLoading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken 
      }),
    }
  )
);
