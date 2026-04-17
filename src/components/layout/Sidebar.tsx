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
      className={`fixed left-0 top-0 bottom-0 glass border-r z-50 flex flex-col pt-4 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-[80px]' : 'w-[260px]'}`}
    >
      {/* Branding Section */}
      <div className="px-4 mb-8">
        <div className={`flex items-center gap-4 group border-b border-border pb-6 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="flex-shrink-0 w-8 h-12 rounded-[10px] bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/20 transition-transform duration-500 group-hover:scale-105">
            <Layers size={20} strokeWidth={2.5} />
          </div>
          
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500">
              <h1 className="text-sm font-black italic tracking-tighter uppercase leading-none flex items-center whitespace-nowrap">
                <span className="text-text-1">RDY</span><span className="text-primary ml-1">SUPPLY</span>
              </h1>
              
              <div className="w-px h-6 bg-white/10" />

              <div className="flex flex-col">
                <p className="text-[7px] font-black text-text-2 uppercase tracking-widest opacity-40 leading-[1.1]">INVESTMENT -</p>
                <p className="text-[7px] font-black text-text-2 uppercase tracking-widest opacity-40 leading-[1.1]">PERFORMANCE</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 space-y-1.5 px-3 overflow-y-auto scroll-elite">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={isSidebarCollapsed ? item.name : ''}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 transition-all group relative border border-transparent rounded-lg
              ${isActive 
                ? 'bg-primary/10 text-text-1 border-primary/20' 
                : 'text-text-2 hover:text-text-1 hover:bg-white/5'}
              ${isSidebarCollapsed ? 'justify-center px-0' : ''}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-primary' : 'text-text-2/40 group-hover:text-text-1/70 transition-colors'} />
                
                {!isSidebarCollapsed && (
                  <span className={`text-[11px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300 ${isActive ? 'text-primary' : ''}`}>
                    {item.name}
                  </span>
                )}
                
                {isActive && (
                  <div className={`absolute right-0 w-1 h-5 bg-primary rounded-full shadow-[0_0_12px_rgba(var(--rdy-primary-rgb),0.6)] ${isSidebarCollapsed ? 'h-1 w-1 top-0 right-1/2 translate-x-1/2' : ''}`} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-text-2 hover:text-primary hover:border-primary/50 transition-all shadow-xl z-[60] group"
      >
        {isSidebarCollapsed ? <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />}
      </button>

      {/* Profile & Settings Section */}
      <div className={`p-4 border-t border-border mt-auto bg-surface/30 backdrop-blur-sm transition-all duration-300 ${isSidebarCollapsed ? 'items-center px-2' : ''}`}>
        <div className={`flex items-center justify-between mb-4 ${isSidebarCollapsed ? 'flex-col gap-4' : ''}`}>
           <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-[10px] font-black text-primary italic shadow-inner">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0 animate-in fade-in slide-in-from-left-2 duration-500">
                  <p className="text-[10px] font-black text-text-1 italic truncate leading-none uppercase">{user?.name}</p>
                  <p className="text-[7px] font-bold text-text-2/40 uppercase tracking-widest mt-1">{user?.role}</p>
                </div>
              )}
           </div>
           <button 
             onClick={toggleTheme}
             className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-text-2 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
             title={isSidebarCollapsed ? "Mudar Tema" : ""}
           >
             {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
           </button>
        </div>
        
        <button 
          onClick={logout}
          title={isSidebarCollapsed ? "Sair" : ""}
          className={`w-full h-10 text-[9px] font-black text-text-2 uppercase tracking-[0.2em] border border-border rounded-lg hover:bg-danger hover:border-danger hover:text-white transition-all flex items-center justify-center gap-2 group ${isSidebarCollapsed ? 'px-0' : ''}`}
        >
          <LogOut size={14} className="group-hover:scale-110 transition-transform" />
          {!isSidebarCollapsed && <span>Sair do Sistema</span>}
        </button>
      </div>
    </aside>
  );
};
