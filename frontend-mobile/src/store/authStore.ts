import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, setApiAccessToken } from "@/services/api";
import { AuthState, SignUpInput, User } from "@/types";
import { getDisplayName } from "@/utils/taskUtils";

interface AuthStore extends AuthState {
  hasHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpInput) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string | null) => void;
  setHasHydrated: (value: boolean) => void;
  clearError: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateProfilePhoto: (profilePhotoUrl: string) => Promise<void>;
}

function mapApiUser(raw: any): User {
  const role = String(raw?.role || "REQUESTER").toUpperCase();

  return {
    id: raw?.id,
    fullName: raw?.fullName || raw?.name || "User",
    name: raw?.name || raw?.fullName || "User",
    email: raw?.email || "",
    role,
    accountType: role === "PROVIDER" ? "service_provider" : "client",
    phone: raw?.phone || undefined,
    phoneNumber: raw?.phone || undefined,
    location: raw?.location || undefined,
    bio: raw?.bio || undefined,
    rating: raw?.rating != null ? Number(raw.rating) : 0,
    completedTasks: raw?.completedTasks != null ? Number(raw.completedTasks) : 0,
    profilePhotoUrl: raw?.profilePhotoUrl || undefined,
    isVerified: Boolean(raw?.isVerified),
    createdAt: raw?.createdAt || new Date().toISOString(),
  };
}

const memoryStore = new Map<string, string>();

const fallbackStorage: StateStorage = {
  getItem: (name) => memoryStore.get(name) ?? null,
  setItem: (name, value) => {
    memoryStore.set(name, value);
  },
  removeItem: (name) => {
    memoryStore.delete(name);
  },
};

const safeStorage: StateStorage = {
  async getItem(name) {
    try {
      if (AsyncStorage?.getItem) {
        return await AsyncStorage.getItem(name);
      }
    } catch (error) {
      console.warn("[authStore] AsyncStorage getItem failed, using fallback memory storage.", error);
    }
    return fallbackStorage.getItem(name);
  },
  async setItem(name, value) {
    try {
      if (AsyncStorage?.setItem) {
        await AsyncStorage.setItem(name, value);
        return;
      }
    } catch (error) {
      console.warn("[authStore] AsyncStorage setItem failed, using fallback memory storage.", error);
    }
    fallbackStorage.setItem(name, value);
  },
  async removeItem(name) {
    try {
      if (AsyncStorage?.removeItem) {
        await AsyncStorage.removeItem(name);
        return;
      }
    } catch (error) {
      console.warn("[authStore] AsyncStorage removeItem failed, using fallback memory storage.", error);
    }
    fallbackStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hasHydrated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.auth.login(email, password);
      const token = data?.accessToken || null;
      const user = mapApiUser(data?.user);
      setApiAccessToken(token);
      set({
        isAuthenticated: Boolean(token),
        user,
        token,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Login failed";
      set({
        error: message,
        isLoading: false,
      });
      throw error;
    }
  },

  signUp: async ({ fullName, email, phoneNumber, accountType, password }: SignUpInput) => {
    const role = accountType === "service_provider" ? "PROVIDER" : "CLIENT";
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.auth.signup({
        fullName,
        email,
        password,
        role,
        phone: phoneNumber,
      });
      const token = data?.accessToken || null;
      const user = mapApiUser(data?.user);
      setApiAccessToken(token);
      set({
        isAuthenticated: Boolean(token),
        user,
        token,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Registration failed";
      set({
        error: message,
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    setApiAccessToken(null);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  setUser: (user: User) => set({ user, isAuthenticated: true }),

  setToken: (token: string | null) => {
    setApiAccessToken(token);
    set({ token, isAuthenticated: Boolean(token) });
  },

  setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

  clearError: () => set({ error: null }),

  updateProfile: async (data: Partial<User>) => {
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            ...data,
            fullName: data.fullName || data.name || getDisplayName(state.user),
            name: data.name || data.fullName || getDisplayName(state.user),
          }
        : state.user,
    }));
  },

  updateProfilePhoto: async (profilePhotoUrl: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.users.updateProfilePhoto(profilePhotoUrl);
      set((state) => ({
        user: state.user ? { ...state.user, ...mapApiUser(response.data?.user) } : state.user,
        isLoading: false,
      }));
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to update profile photo";
      set({
        error: message,
        isLoading: false,
      });
      throw error;
    }
  },
}),
    {
      name: "mobile-auth-storage",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        const token = state?.token || null;
        setApiAccessToken(token);
        state?.setHasHydrated(true);
      },
    }
  )
);
