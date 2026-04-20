import { memo, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Users,
  History,
  Truck,
  ChevronLeft,
  ChevronRight,
  Box,
  Layers
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { cn } from '../../lib/utils';

export const Sidebar = memo(() => {
  const user = useAuthStore(state => state.user);
  const isSidebarCollapsed = useUIStore(state => state.isSidebarCollapsed);
  const toggleSidebar = useUIStore(state => state.toggleSidebar);
  
  const menuItems = useMemo(() => [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin', 'analyst', 'cto'] },
    { label: 'Inventário', icon: Package, path: '/inventario', roles: ['admin', 'analyst', 'cto'] },
    { label: 'Gestão de Estoque', icon: Box, path: '/estoque', roles: ['admin', 'analyst', 'cto'] },
    { label: 'Portal Técnico', icon: Truck, path: '/tecnico', roles: ['admin', 'technician'] },
    { label: 'Contratos', icon: ClipboardList, path: '/contratos', roles: ['admin', 'analyst'] },
    { label: 'Catálogo', icon: Layers, path: '/insumos', roles: ['admin', 'analyst'] },
    { label: 'Histórico', icon: History, path: '/historico', roles: ['admin', 'analyst', 'cto'] },
    { label: 'Usuários', icon: Users, path: '/usuarios', roles: ['admin'] },
  ], []);

  const filteredItems = useMemo(() => 
    menuItems.filter(item => item.roles.includes(user?.role || '')),
    [menuItems, user?.role]
  );

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 bottom-0 bg-bg text-text-1 z-[50] flex flex-col transition-all duration-300 ease-in-out border-r border-border",
        // Desktop Scale
        isSidebarCollapsed ? "lg:w-[80px]" : "lg:w-[280px]",
        // Mobile Visibility
        isSidebarCollapsed ? "max-lg:-translate-x-full" : "max-lg:translate-x-0 w-[280px]"
      )}
    >
      {/* Toggle Button - Desktop Only */}
      <button 
        onClick={toggleSidebar}
        className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 bg-black text-white rounded-full items-center justify-center border border-border shadow-xl z-50 hover:scale-110 transition-all"
      >
        {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo Section */}
      <div className="h-20 flex items-center px-6 border-b border-border relative bg-bg">
        <div className={cn("flex items-center gap-4 transition-all", isSidebarCollapsed && "justify-center w-full")}>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black shrink-0 shadow-lg shadow-primary/30">
            <Layers size={20} strokeWidth={3} />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col animate-fade">
              <h1 className="text-2xl font-black italic text-text-1 tracking-tighter leading-none flex items-center gap-1">
                RDY <span className="text-primary">SUPPLY</span>
              </h1>
              <span className="text-[6px] font-black text-text-1 tracking-[0.4em] uppercase mt-1 opacity-30">Investment - Performance</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 space-y-2 py-6 overflow-y-auto scroll-elite">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isSidebarCollapsed ? item.label : undefined}
              className={({ isActive }) => cn(
                "flex items-center gap-4 transition-all duration-500 group relative",
                // Base dimensions
                "h-12 rounded-xl",
                // Collapsed vs Expanded logic
                isSidebarCollapsed 
                  ? "w-12 items-center justify-center mx-auto px-0" 
                  : "w-full px-4",
                // Active vs Inactive logic
                isActive 
                  ? "bg-primary text-black shadow-xl shadow-primary/20 scale-[1.05]" 
                  : "text-text-1 hover:bg-black/5 hover:text-primary"
              )}
            >
              <div className="flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-110">
                <Icon size={20} strokeWidth={2.5} />
              </div>

              {!isSidebarCollapsed && (
                <span className="text-[10px] font-black uppercase tracking-[0.2em] z-10">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
});
