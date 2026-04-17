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
      className={`fixed left-0 top-0 bottom-0 glass border-r z-50 flex flex-col pt-6 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarCollapsed ? 'w-[90px]' : 'w-[300px]'}`}
    >
      {/* Branding Section */}
      <div className="px-6 mb-10">
        <div className={`flex items-center gap-5 group border-b border-border pb-8 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="flex-shrink-0 w-12 h-16 rounded-[12px] bg-primary flex items-center justify-center text-black shadow-xl shadow-primary/20 transition-transform duration-500 group-hover:scale-105">
            <Layers size={28} strokeWidth={2.5} />
          </div>
          
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
              <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none flex items-center whitespace-nowrap">
                <span className="text-text-1">RDY</span><span className="text-primary ml-1.5">SUPPLY</span>
              </h1>
              
              <div className="w-px h-10 bg-white/10" />

              <div className="flex flex-col">
                <p className="text-[8px] font-black text-text-2 uppercase tracking-[0.3em] opacity-40 leading-[1.2]">INVESTMENT</p>
                <p className="text-[8px] font-black text-text-2 uppercase tracking-[0.3em] opacity-40 leading-[1.2]">PERFORMANCE</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 space-y-2 px-4 overflow-y-auto scroll-elite">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={isSidebarCollapsed ? item.name : ''}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-4 transition-all group relative border border-transparent rounded-2xl
              ${isActive 
                ? 'bg-primary/10 text-text-1 border-primary/20 shadow-sm' 
                : 'text-text-2 hover:text-text-1 hover:bg-white/5'}
              ${isSidebarCollapsed ? 'justify-center px-0' : ''}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-primary' : 'text-text-2/40 group-hover:text-text-1/70 transition-colors'} />
                
                {!isSidebarCollapsed && (
                  <span className={`text-sm font-black uppercase tracking-[0.1em] animate-in fade-in slide-in-from-left-4 duration-500 ${isActive ? 'text-primary' : ''}`}>
                    {item.name}
                  </span>
                )}
                
                {isActive && (
                  <div className={`absolute right-0 w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--rdy-primary-rgb),0.8)] ${isSidebarCollapsed ? 'h-1.5 w-1.5 top-0 right-1/2 translate-x-1/2' : ''}`} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3.5 top-24 w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center text-text-2 hover:text-primary hover:border-primary/50 transition-all shadow-xl z-[60] group"
      >
        {isSidebarCollapsed ? <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />}
      </button>

    </aside>
  );
};
