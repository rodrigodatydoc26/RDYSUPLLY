import { type ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuthStore } from '../../store/useAuthStore';
import { useDataStore } from '../../store/useDataStore';
import { Navigate } from 'react-router-dom';
import { useThemeStore } from '../../store/useThemeStore';
import { useUIStore } from '../../store/useUIStore';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, isLoading, themeColor } = useAuthStore();
  const { _hasHydrated } = useDataStore();
  const { isSidebarCollapsed } = useUIStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--rdy-primary', themeColor);
  }, [themeColor]);

  if (isLoading || !_hasHydrated) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-1000">
         <div className="w-20 h-20 rounded-[2.5rem] bg-white/[0.03] border border-primary/20 flex items-center justify-center animate-pulse">
            <div className="w-4 h-4 rounded-full bg-primary animate-ping" />
         </div>
         <div className="text-center space-y-3">
            <p className="text-[12px] font-black text-white/40 uppercase tracking-[1em] animate-pulse">Establishing Connection</p>
            <p className="text-[10px] font-medium text-white/10 uppercase tracking-[0.3em]">RDY SECURE CLOUD GATEWAY</p>
         </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <div 
        className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarCollapsed ? 'pl-[90px]' : 'pl-[300px]'}`}
      >
        <Topbar />

        <main className="pt-20 px-8 pb-12 min-h-screen">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
