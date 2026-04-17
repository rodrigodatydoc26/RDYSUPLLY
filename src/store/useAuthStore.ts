import { create } from 'zustand';

import type { Profile } from '../types';

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  themeColor: string;
  login: (profile: Profile) => Promise<void>;
  logout: () => void;
  setThemeColor: (color: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  _hasHydrated: false,
  themeColor: localStorage.getItem('rdy-theme') || '#F5C800',
  login: async (profile) => {
    set({ isLoading: true });
    // Simulando delay de segurança
    await new Promise((resolve) => setTimeout(resolve, 200));
    
    set({ user: profile, isLoading: false });
    localStorage.setItem('rdy-user', JSON.stringify(profile));
  },
  logout: () => {
    set({ user: null });
    localStorage.removeItem('rdy-user');
  },
  setThemeColor: (color) => {
    set({ themeColor: color });
    localStorage.setItem('rdy-theme', color);
  },
}));

// Initialize from localStorage
const savedUser = localStorage.getItem('rdy-user');
if (savedUser) {
  try {
    useAuthStore.setState({ user: JSON.parse(savedUser), _hasHydrated: true });
  } catch {
    localStorage.removeItem('rdy-user');
    useAuthStore.setState({ _hasHydrated: true });
  }
} else {
  useAuthStore.setState({ _hasHydrated: true });
}
