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
  Sun,
  Moon
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  
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
    <aside className="fixed left-0 top-0 bottom-0 w-[190px] glass border-r z-50 flex flex-col pt-4 transition-colors duration-500 text-[10px]">
      <div className="px-3 mb-4">
        <div className="flex items-center gap-2.5 group cursor-pointer border-b border-border pb-4">
          <div className="w-9 h-9 rounded bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/10">
            <Layers size={18} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black italic tracking-tighter uppercase leading-none flex items-center">
                <span className="text-text-1">RDY</span><span className="text-primary ml-1">SUPPLY</span>
              </h1>
              <div className="w-px h-2.5 bg-border/60" />
              <p className="text-[7px] font-black text-text-2 uppercase tracking-widest opacity-60 leading-none">INVESTMENT - PERFORMANCE</p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 overflow-y-auto scroll-elite">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-2 px-2.5 py-1 transition-all group relative border border-transparent
              ${isActive 
                ? 'bg-primary/5 text-text-1 border-border/40 rounded-sm' 
                : 'text-text-2 hover:text-text-1 hover:bg-white/5'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon size={12} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-primary' : 'text-text-2/30 group-hover:text-text-1/60'} />
                <span className={`text-[8.5px] font-black uppercase tracking-wider ${isActive ? 'translate-x-0' : ''}`}>
                  {item.name}
                </span>
                {isActive && <div className="absolute right-0 w-0.5 h-3 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--rdy-primary-rgb),0.8)]" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile & Settings Section - Minimalist */}
      <div className="p-3 border-t border-border mt-auto bg-bg/40">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded bg-surface border border-border flex items-center justify-center text-[7px] font-black text-primary italic">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black text-text-1 italic truncate leading-none uppercase">{user?.name}</p>
              </div>
           </div>
           <button 
             onClick={toggleTheme}
             className="w-5 h-5 rounded bg-surface border border-border flex items-center justify-center text-text-2 hover:text-primary transition-colors"
           >
             {theme === 'light' ? <Moon size={8} /> : <Sun size={8} />}
           </button>
        </div>
        
        <button 
          onClick={logout}
          className="w-full h-7 text-[7px] font-black text-text-2 uppercase tracking-widest border border-border rounded hover:bg-danger hover:text-white transition-all flex items-center justify-center gap-1.5"
        >
          <LogOut size={9} />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
};
