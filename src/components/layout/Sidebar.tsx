import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Package, 
  Users, 
  History, 
  LogOut,
  Truck,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useUIStore } from '../../store/useUIStore';

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin', 'analyst', 'cto'] },
    { name: 'Estoque', icon: Layers, path: '/estoque', roles: ['admin', 'analyst', 'cto'] },
    { name: 'Portal Técnico', icon: Truck, path: '/tecnico', roles: ['admin', 'technician'] },
    { name: 'Contratos', icon: ClipboardList, path: '/contratos', roles: ['admin', 'analyst'] },
    { name: 'Insumos', icon: Package, path: '/insumos', roles: ['admin', 'analyst'] },
    { name: 'Histórico', icon: History, path: '/historico', roles: ['admin', 'analyst', 'cto'] },
    { name: 'Usuários', icon: Users, path: '/usuarios', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <aside 
      className={`fixed left-0 top-0 bottom-0 bg-white border-r border-black/5 z-50 flex flex-col pt-8 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarCollapsed ? 'w-[80px]' : 'w-[280px]'}`}
    >
      {/* Branding Section */}
      <div className="px-6 mb-12 relative flex items-center">
        <div className={`flex items-center gap-3 group ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/10 transition-transform duration-500 group-hover:scale-105">
            <Layers size={22} strokeWidth={2.5} />
          </div>
          
          {!isSidebarCollapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-700">
               <div className="flex items-center gap-1.5">
                  <h1 className="text-xl font-black tracking-tighter uppercase leading-none text-black">
                    RDY <span className="text-primary italic">SUPPLY</span>
                  </h1>
               </div>
               <p className="text-[7.5px] font-black text-black/30 uppercase tracking-[0.3em] leading-tight mt-1">
                 INVESTMENT - PERFORMANCE
               </p>
            </div>
          )}
        </div>

        {/* Tactical Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center text-black/20 hover:text-black hover:scale-110 active:scale-95 transition-all shadow-sm z-[60] pointer-events-auto"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 space-y-1 px-0 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={isSidebarCollapsed ? item.name : ''}
            className={({ isActive }) => `
              flex items-center gap-4 px-6 py-3.5 transition-all group relative
              ${isActive 
                ? 'bg-primary/5 text-black' 
                : 'text-zinc-400 hover:text-black hover:bg-zinc-50'}
              ${isSidebarCollapsed ? 'justify-center px-0' : ''}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`transition-all ${isActive ? 'text-primary' : 'text-inherit opacity-40 group-hover:opacity-100'}`}>
                   <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                
                {!isSidebarCollapsed && (
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-left-4 duration-500 ${isActive ? 'text-black' : 'text-inherit'}`}>
                    {item.name}
                  </span>
                )}
                
                {isActive && (
                  <div className="absolute right-0 w-1 h-6 bg-primary rounded-l-full shadow-[0_0_10px_rgba(var(--rdy-primary-rgb),0.5)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
