import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUIStore } from '../../store/useUIStore';
import { cn } from '../../lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <div className="min-h-screen bg-bg flex overflow-hidden selection:bg-primary selection:text-black">
      {/* Backdrop for Mobile Sidebar */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden animate-fade"
          onClick={toggleSidebar}
        />
      )}

      <Sidebar />
      
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 min-w-0 w-full",
          isSidebarCollapsed ? "lg:pl-[80px]" : "lg:pl-[280px]",
          "pl-0" // Always 0 on mobile, lg: prefix handles desktop
        )}
      >
        <Topbar />

        <main className={cn(
           "flex-1 mt-20 overflow-y-auto overflow-x-hidden min-h-[calc(100vh-80px)] transition-all",
           "p-4 md:p-6 lg:p-8"
        )}>
          <div className="max-w-[1600px] mx-auto animate-fade">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
