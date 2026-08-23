import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initAuth: async () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('agentflow_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.token) {
          set({ token: parsed.token, user: parsed.user, isAuthenticated: true });
          // Refresh user profile
          const res = await api.get('/auth/me');
          if (res.success && res.data) {
            set({ user: res.data, isAuthenticated: true });
            localStorage.setItem('agentflow_auth', JSON.stringify({ token: parsed.token, user: res.data }));
          }
        }
      }
    } catch (err) {
      console.warn('Auth init failed or token expired:', err.message);
      get().logout();
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.success && res.data) {
        const { user, token } = res.data;
        set({ user, token, isAuthenticated: true, isLoading: false, error: null });
        if (typeof window !== 'undefined') {
          localStorage.setItem('agentflow_auth', JSON.stringify({ user, token }));
        }
        return { success: true };
      }
      throw new Error(res.message || 'Login failed');
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  register: async (name, email, password, role = 'operator') => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { name, email, password, role });
      if (res.success && res.data) {
        const { user, token } = res.data;
        set({ user, token, isAuthenticated: true, isLoading: false, error: null });
        if (typeof window !== 'undefined') {
          localStorage.setItem('agentflow_auth', JSON.stringify({ user, token }));
        }
        return { success: true };
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false, error: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agentflow_auth');
    }
  },

  clearError: () => set({ error: null })
}));
