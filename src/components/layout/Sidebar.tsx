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
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { cn } from '../ui/Base';

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin', 'analyst', 'cto'] },
    { name: 'Portal Técnico', icon: Truck, path: '/tecnico', roles: ['admin', 'technician'] },
    { name: 'Contratos', icon: ClipboardList, path: '/contratos', roles: ['admin', 'analyst'] },
    { name: 'Catálogo', icon: Package, path: '/insumos', roles: ['admin', 'analyst'] },
    { name: 'Histórico', icon: History, path: '/historico', roles: ['admin', 'analyst', 'cto'] },
    { name: 'Usuários', icon: Users, path: '/usuarios', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 bottom-0 bg-secondary text-white z-50 flex flex-col transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-[80px]" : "w-[280px]"
      )}
    >
      {/* Logo Section */}
      <div className="h-20 flex items-center px-6 border-b border-white/5 relative">
        <div className={cn("flex items-center gap-3", isSidebarCollapsed && "justify-center w-full")}>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-secondary shrink-0 shadow-lg shadow-primary/20">
            <span className="font-black text-xl italic tracking-tighter">RDY</span>
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight leading-none">RDY <span className="text-primary italic">SUPPLY</span></span>
              <span className="text-[7px] font-bold text-white/30 tracking-[0.4em] uppercase">Tactical Inventory</span>
            </div>
          )}
        </div>

        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 mt-4 w-6 h-6 rounded-full bg-primary text-secondary flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all outline-none"
        >
          {isSidebarCollapsed ? <ChevronRight size={12} strokeWidth={3} /> : <ChevronLeft size={12} strokeWidth={3} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-8 px-3 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative font-medium",
              isActive 
                ? "bg-primary text-secondary" 
                : "text-white/60 hover:text-white hover:bg-white/5",
              isSidebarCollapsed && "justify-center px-0 mx-auto w-12"
            )}
          >
            <item.icon size={20} strokeWidth={2} className="shrink-0" />
            {!isSidebarCollapsed && (
              <span className="text-sm tracking-tight">{item.name}</span>
            )}
            
            {/* Active Indicator Line for collapsed */}
            {isSidebarCollapsed && (
              <NavLink
                to={item.path}
                className={({ isActive }) => cn(
                  "absolute right-0 w-1 h-6 bg-primary rounded-l-full transition-opacity",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile */}
      <div className="p-4 border-t border-white/5">
        {!isSidebarCollapsed ? (
          <div className="bg-white/5 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white uppercase tracking-tight">{user?.name}</p>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{user?.role}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-white/40 hover:text-danger transition-colors"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={logout}
            className="w-12 h-12 mx-auto flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-danger transition-all"
            title="Sair"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </aside>
  );
};
