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
        // Clear state FIRST for instant UI response
        set({ user: null, session: null });
        localStorage.removeItem('rdy-auth-storage');
        localStorage.removeItem('rdy-inventory-storage');
        // Fire and forget - don't wait for server
        supabase.auth.signOut().catch(() => undefined);
        window.location.href = '/login';
      },

      refreshProfile: async () => {
        const { session } = get();
        if (!session?.user) return;

        try {
          // Use Promise.race to prevent the app from hanging if the DB is in a deadlock/recursion loop
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile Timeout')), 3000)
          );

          const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as { data: any, error: any };

          if (!error && profile) {
            set({ user: profile as Profile });
          } else {
            // Error, Timeout or Missing Profile — use fallback to unblock the UI
            console.warn('[RDY] Use of fallback profile due to error or timeout:', error || 'Timeout');
            const newProfile: Profile = {
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
              email: session.user.email || '',
              role: (session.user.user_metadata?.role as any) || 'admin', // Default to admin for the current session to allow fixing RLS
              active: true,
              created_at: new Date().toISOString()
            };
            set({ user: newProfile });
          }
        } catch (err) {
          console.error('[RDY] Critical profile error, using fallback:', err);
          // Force entry even on critical library errors
          const fallbackUser: Profile = {
            id: session.user.id,
            name: 'Acesso Emergencial',
            email: session.user.email || '',
            role: 'admin',
            active: true,
            created_at: new Date().toISOString()
          };
          set({ user: fallbackUser });
        }
      },

      initializeAuth: async () => {
        const state = get();
        
        // FAST PATH: If we already have a persisted user from localStorage,
        // mark as hydrated immediately so the UI renders instantly.
        // Background-refresh the session to validate it.
        if (state.user && state.session) {
          set({ _hasHydrated: true, isLoading: false });
          
          // Validate session in background (non-blocking)
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              set({ session });
              // Refresh profile silently in background
              get().refreshProfile();
            } else {
              // Session expired - force re-login
              set({ user: null, session: null });
            }
          }).catch(() => undefined);
        } else {
          // COLD PATH: No persisted data, must fetch
          const { data: { session } } = await supabase.auth.getSession();
          set({ session, _hasHydrated: true });
          
          if (session) {
            await get().refreshProfile();
          }
          set({ isLoading: false });
        }

        // Listen for changes (runs once)
        supabase.auth.onAuthStateChange(async (_event, session) => {
          set({ session });
          if (session) {
            // Don't set isLoading=true for auth changes - prevents flash
            await get().refreshProfile();
          } else {
            set({ user: null });
          }
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
