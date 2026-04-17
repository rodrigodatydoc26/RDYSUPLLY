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
      <div className="px-8 mb-10 relative">
        <div className={`flex items-center gap-4 group ${isSidebarCollapsed ? 'justify-center border-b border-border pb-8' : ''}`}>
          <div className="flex-shrink-0 w-12 h-16 rounded-[14px] bg-primary flex items-center justify-center text-black shadow-xl shadow-primary/10 transition-transform duration-500 group-hover:scale-105">
            <Layers size={28} strokeWidth={3} />
          </div>
          
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
              <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none flex items-center whitespace-nowrap">
                <span className="text-text-1">RDY</span><span className="text-primary ml-1.5">SUPPLY</span>
              </h1>
              
              <div className="flex flex-col text-[7.5px] font-black text-text-2/40 uppercase tracking-[0.2em] leading-[1.1] border-l border-border pl-4 ml-1">
                <p>INVESTMENT</p>
                <p>PERFORMANCE</p>
              </div>
            </div>
          )}
        </div>

        {/* Tactical Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-4.5 top-12 w-9 h-9 rounded-full bg-white border-[2.5px] border-black flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-[0_8px_20px_-5px_rgba(0,0,0,0.3)] z-[60] group pointer-events-auto"
        >
          {isSidebarCollapsed ? <ChevronRight size={18} strokeWidth={3.5} /> : <ChevronLeft size={18} strokeWidth={3.5} />}
        </button>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 space-y-2 px-4 overflow-y-auto scroll-elite">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={isSidebarCollapsed ? item.name : ''}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3.5 transition-all group relative rounded-2xl
              ${isActive 
                ? 'bg-primary/5' 
                : 'text-text-2 hover:text-text-1 hover:bg-white/5'}
              ${isSidebarCollapsed ? 'justify-center px-0' : ''}
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all ${isActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-text-2/40 group-hover:text-text-1/70'}`}>
                   <item.icon size={26} strokeWidth={isActive ? 3 : 2} />
                </div>
                
                {!isSidebarCollapsed && (
                  <span className={`text-[11px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-left-4 duration-500 ${isActive ? 'text-text-1' : 'text-text-2/40 group-hover:text-text-1'}`}>
                    {item.name}
                  </span>
                )}
                
                {isActive && (
                  <div className={`absolute w-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--rdy-primary-rgb),0.5)] ${isSidebarCollapsed ? 'right-1.5 h-8' : 'right-4 h-5'}`} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>


    </aside>
  );
};
