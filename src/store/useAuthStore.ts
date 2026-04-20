import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthState {
  user: Profile | null;
  session: Session | null;
  isLoading: boolean;
  _hasHydrated: boolean;
  setUser: (user: Profile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true,
      _hasHydrated: false,
      
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ isLoading: loading }),

      logout: async () => {
        try {
          await supabase.auth.signOut();
          // Limpa o estado local
          set({ user: null, session: null });
          // Opcional: Se quiser limpar o storage do navegador completamente
          localStorage.removeItem('rdy-auth-storage');
          localStorage.removeItem('rdy-inventory-storage');
          
          window.location.href = '/login';
        } catch (err) {
          console.error('[RDY] logout_error:', err);
          // Fallback force clear
          set({ user: null, session: null });
          window.location.href = '/login';
        }
      },

      refreshProfile: async () => {
        const { session } = get();
        if (!session?.user) return;

        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && profile) {
            set({ user: profile as Profile });
          } else if (error && error.code === 'PGRST116') {
            // Create fallback if needed, but don't block
             const newProfile: Profile = {
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
              email: session.user.email || '',
              role: (session.user.user_metadata?.role as any) || 'technician',
              active: true,
              created_at: new Date().toISOString()
            };
            set({ user: newProfile });
          }
        } catch (err) {
          console.error('[RDY] profile_refresh_error:', err);
        }
      },

      initializeAuth: async () => {
        // First check
        const { data: { session } } = await supabase.auth.getSession();
        set({ session, _hasHydrated: true });
        
        if (session) {
          await get().refreshProfile();
        }
        set({ isLoading: false });

        // Listen for changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
          set({ session, isLoading: true });
          if (session) {
            await get().refreshProfile();
          } else {
            set({ user: null });
          }
          set({ isLoading: false });
        });
      }
    }),
    {
      name: 'rdy-auth-storage',
      partialize: (state) => ({ user: state.user, session: state.session }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      }
    }
  )
);
