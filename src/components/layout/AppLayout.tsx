import { type ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuthStore } from '../../store/useAuthStore';
import { useDataStore } from '../../store/useDataStore';
import { Navigate } from 'react-router-dom';
import { useThemeStore } from '../../store/useThemeStore';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, isLoading, themeColor } = useAuthStore();
  const { _hasHydrated } = useDataStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--rdy-primary', themeColor);
  }, [themeColor]);

  if (isLoading || !_hasHydrated) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-1000">
         <div className="w-16 h-16 rounded-[2rem] bg-white/[0.03] border border-primary/20 flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
         </div>
         <div className="text-center space-y-2">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.8em] animate-pulse">Establishing Connection</p>
            <p className="text-[8px] font-medium text-white/10 uppercase tracking-[0.2em]">RDY SECURE CLOUD GATEWAY</p>
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
      <div className="pl-[190px]">
        <Topbar />
        <main className="pt-14 px-5 pb-8 min-h-screen">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
