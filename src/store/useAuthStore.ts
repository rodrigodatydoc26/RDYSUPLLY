import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthState {
  user: Profile | null;
  session: Session | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  themeColor: string;
  setUser: (user: Profile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  setThemeColor: (color: string) => void;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  _hasHydrated: false,
  themeColor: localStorage.getItem('rdy-theme') || '#F5C800',
  
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ isLoading: loading }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
    localStorage.removeItem('rdy-user');
  },

  setThemeColor: (color) => {
    set({ themeColor: color });
    localStorage.setItem('rdy-theme', color);
  },

  refreshProfile: async () => {
    const { session } = get();
    if (!session?.user) return;

    // Check if profile exists
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    let finalProfile = profile;

    // If it doesn't exist, create a default one (fallback)
    if (error && error.code === 'PGRST116') {
      const newProfile: Profile = {
        id: session.user.id,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Novo Usuário',
        email: session.user.email || '',
        role: (session.user.user_metadata?.role as 'admin' | 'technician' | 'analyst' | 'cto') || 'technician',
        active: true,
        created_at: new Date().toISOString()
      };

      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (!createError && created) {
        finalProfile = created;
      } else {
        console.error('[Supabase Error] profile_creation:', createError);
      }
    }

    if (finalProfile) {
      set({ user: finalProfile as Profile });
      localStorage.setItem('rdy-user', JSON.stringify(finalProfile));
    }
  }
}));

// Auth Initialization & Listener
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.getState().setSession(session);
  if (session) {
    useAuthStore.getState().refreshProfile().finally(() => {
      useAuthStore.getState().setLoading(false);
      useAuthStore.setState({ _hasHydrated: true });
    });
  } else {
    useAuthStore.getState().setLoading(false);
    useAuthStore.setState({ _hasHydrated: true });
  }
});

supabase.auth.onAuthStateChange(async (_event, session) => {
  useAuthStore.getState().setSession(session);
  if (session) {
    await useAuthStore.getState().refreshProfile();
  } else {
    useAuthStore.getState().setUser(null);
  }
  useAuthStore.getState().setLoading(false);
});
