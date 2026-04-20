import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AccentColor = 'yellow' | 'cyan' | 'magenta';

interface UIState {
  isSidebarCollapsed: boolean;
  darkMode: boolean;
  accentColor: AccentColor;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleDarkMode: () => void;
  setAccentColor: (color: AccentColor) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isSidebarCollapsed: false,
      darkMode: false,
      accentColor: 'yellow',
      
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
      
      toggleDarkMode: () => {
        const newMode = !get().darkMode;
        set({ darkMode: newMode });
        document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
      },
      
      setAccentColor: (color) => {
        set({ accentColor: color });
        document.documentElement.setAttribute('data-accent', color);
      },
    }),
    {
      name: 'rdy-ui-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
          document.documentElement.setAttribute('data-accent', state.accentColor);
        }
      }
    }
  )
);
