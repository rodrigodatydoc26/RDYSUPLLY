import { type ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuthStore } from '../../store/useAuthStore';
import { useDataStore } from '../../store/useDataStore';
import { Navigate } from 'react-router-dom';
import { useUIStore } from '../../store/useUIStore';
import { cn } from '../../lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const { _hasHydrated, fetchInitialData } = useDataStore();
  const { isSidebarCollapsed } = useUIStore();

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user, fetchInitialData]);

  if (isAuthLoading || !_hasHydrated) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center space-y-8 animate-fade">
         <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-primary font-black text-2xl italic tracking-tighter animate-pulse shadow-xl">
              RDY
            </div>
            <div className="absolute -inset-4 border-2 border-primary/20 rounded-[2rem] animate-[spin_4s_linear_infinite]" />
         </div>
         <div className="text-center">
            <p className="text-[10px] font-black text-text-1 uppercase tracking-[0.5em] animate-pulse">Sincronizando Sistema</p>
            <p className="text-[8px] font-bold text-text-2 uppercase tracking-widest mt-2 italic">RDY Supply Cloud v2</p>
         </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-bg flex overflow-hidden">
      <Sidebar />
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          isSidebarCollapsed ? "pl-[80px]" : "pl-[280px]"
        )}
      >
        <Topbar />

        <main className="flex-1 mt-20 p-8 overflow-y-auto overflow-x-hidden min-h-[calc(100vh-80px)]">
          <div className="max-w-[1400px] mx-auto animate-fade">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
