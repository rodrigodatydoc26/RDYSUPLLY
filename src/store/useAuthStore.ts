import { create } from 'zustand';

export type UserRole = 'admin' | 'analyst' | 'technician' | 'cto';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  themeColor: string;
  login: (email: string, role: UserRole) => Promise<void>;
  logout: () => void;
  setThemeColor: (color: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  themeColor: localStorage.getItem('rdy-theme') || '#F5C800',
  login: async (email, role) => {
    set({ isLoading: true });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const mockUser: Profile = {
      id: Math.random().toString(36).substring(7),
      name: email.split('@')[0],
      email: email,
      role: role,
    };
    
    set({ user: mockUser, isLoading: false });
    localStorage.setItem('rdy-user', JSON.stringify(mockUser));
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
    useAuthStore.setState({ user: JSON.parse(savedUser) });
  } catch {
    localStorage.removeItem('rdy-user');
  }
}
