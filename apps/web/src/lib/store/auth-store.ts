import { create } from 'zustand';
import type { UserPublic } from '@si-learning/shared';
import { apiFetch, setAccessToken } from '../api';
import { mockLogin, mockGetMe, initMockData, isBackendAvailable } from '../mock-api';

// Initialize mock data for standalone mode
if (typeof window !== 'undefined') {
  initMockData();
}

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
      // Try real API first, fallback to mock
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        // Use mock data
        const data = mockLogin(email, password);
        setAccessToken(data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        set({ user: data.user as UserPublic, isAuthenticated: true, isLoading: false });
        return;
      }
      
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
      // Try real API first, fallback to mock
      const backendAvailable = await isBackendAvailable();
      if (!backendAvailable) {
        const user = mockGetMe();
        if (user) {
          set({ user: user as UserPublic, isAuthenticated: true, isLoading: false });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
        return;
      }
      
      const res = await apiFetch<UserPublic>('/auth/me');
      if (res.data) {
        set({ user: res.data, isAuthenticated: true, isLoading: false });
      }
    } catch {
      // Fallback to mock
      const user = mockGetMe();
      if (user) {
        set({ user: user as UserPublic, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },
}));
