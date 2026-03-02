import { create } from "zustand";
import apiClient, { setApiAccessToken } from "@/services/api";
import { AuthState, SignUpInput, User } from "@/types";

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpInput) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string | null) => void;
}

function mapApiUser(raw: any): User {
  const role = raw?.role || "REQUESTER";
  return {
    id: raw?.id,
    name: raw?.name || "User",
    email: raw?.email || "",
    role,
    accountType: role === "PROVIDER" ? "service_provider" : "client",
    phoneNumber: raw?.phone || undefined,
  };
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { data } = await apiClient.post("/auth/login", { email, password });
    const token = data?.accessToken || null;
    const user = mapApiUser(data?.user);
    setApiAccessToken(token);
    set({
      isAuthenticated: Boolean(token),
      user,
      token,
    });
  },

  signUp: async ({ fullName, email, phoneNumber, accountType, password }: SignUpInput) => {
    const role = accountType === "service_provider" ? "PROVIDER" : "CLIENT";
    const { data } = await apiClient.post("/auth/signup", {
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
    });
  },

  logout: () => {
    setApiAccessToken(null);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  setUser: (user: User) => set({ user, isAuthenticated: true }),

  setToken: (token: string | null) => {
    setApiAccessToken(token);
    set({ token, isAuthenticated: Boolean(token) });
  },
}));
