import { create } from 'zustand';
import type { UserPublic } from '@si-learning/shared';
import { apiFetch, setAccessToken } from '../api';

interface AuthState {
  user: UserPublic | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string, role: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch<{ user: UserPublic; tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      );
      if (res.data) {
        setAccessToken(res.data.tokens.accessToken);
        localStorage.setItem('refreshToken', res.data.tokens.refreshToken);
        set({ user: res.data.user, isAuthenticated: true, isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name, email, password, confirmPassword, role) => {
    set({ isLoading: true });
    try {
      const res = await apiFetch<{ user: UserPublic; tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify({ name, email, password, confirmPassword, role }) },
      );
      if (res.data) {
        setAccessToken(res.data.tokens.accessToken);
        localStorage.setItem('refreshToken', res.data.tokens.refreshToken);
        set({ user: res.data.user, isAuthenticated: true, isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    setAccessToken(null);
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const res = await apiFetch<UserPublic>('/auth/me');
      if (res.data) {
        set({ user: res.data, isAuthenticated: true, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
