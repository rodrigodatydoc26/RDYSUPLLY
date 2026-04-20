import {
  Bell,
  Search,
  HelpCircle,
  Moon,
  Sun,
  LogOut,
  Menu,
} from 'lucide-react';
import { useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useDataStore } from '../../store/useDataStore';
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Base';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const Topbar = () => {
  const { isSidebarCollapsed, darkMode, accentColor, toggleDarkMode, setAccentColor, toggleSidebar } = useUIStore();
  const { stockAlerts } = useDataStore();
  const { user, logout } = useAuthStore();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const activeAlerts = stockAlerts.filter(a => !a.resolved);

  return (
    <header 
      className={cn(
        "h-20 fixed top-0 right-0 z-40 px-4 lg:px-8 flex items-center justify-between border-b border-border bg-bg transition-all duration-300",
        isSidebarCollapsed ? "lg:left-[80px]" : "lg:left-[280px]",
        "left-0"
      )}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={toggleSidebar}
          title="Alternar Menu Lateral"
          className="lg:hidden w-10 h-10 flex items-center justify-center bg-surface border border-border rounded-xl text-text-1 hover:bg-black hover:text-white transition-all shadow-sm"
        >
          <Menu size={20} />
        </button>

        {/* Search - Responsive */}
        <div className="flex-1 max-w-xl mx-8 hidden md:block">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-1 opacity-20 group-focus-within:opacity-100 transition-opacity" size={18} />
          <input 
            type="text" 
            placeholder="PESQUISAR ATIVOS..."
            title="Campo de Pesquisa"
            className="w-full h-11 bg-surface border border-border rounded-full pl-12 pr-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-primary/10 transition-all opacity-60 focus:opacity-100"
          />
        </div>
      </div>
      </div>

      {/* Right - Consolidated Actions */}
      <div className="flex items-center gap-2 lg:gap-4 shrink-0">
        
        {/* Theme Settings - Compact on mobile */}
        <div className="flex items-center gap-2 lg:gap-3 pr-2 lg:pr-4 border-r border-border/10">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-bg/50 border border-border rounded-full shadow-inner">
            <button title="Cor Amarela" onClick={() => setAccentColor('yellow')} className={cn("w-2.5 h-2.5 rounded-full bg-[#FFD700] ring-offset-2 transition-all", accentColor === 'yellow' ? "ring-2 ring-black scale-110" : "opacity-30")} />
            <button title="Cor Magenta" onClick={() => setAccentColor('magenta')} className={cn("w-2.5 h-2.5 rounded-full bg-[#FF007A] ring-offset-2 transition-all", accentColor === 'magenta' ? "ring-2 ring-black scale-110" : "opacity-30")} />
            <button title="Cor Ciano" onClick={() => setAccentColor('cyan')} className={cn("w-2.5 h-2.5 rounded-full bg-[#00A3FF] ring-offset-2 transition-all", accentColor === 'cyan' ? "ring-2 ring-black scale-110" : "opacity-30")} />
          </div>

          <button 
            onClick={toggleDarkMode}
            title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            className="w-9 h-9 flex items-center justify-center bg-surface border border-border rounded-xl text-text-1 hover:bg-black hover:text-white transition-all shadow-sm"
          >
            {darkMode ? <Sun size={18} className="text-primary" /> : <Moon size={18} />}
          </button>
        </div>

        {/* Global Actions - Hidden on mobile, consolidated in menu/help */}
        <div className="flex items-center gap-1 lg:gap-1.5 pr-2 lg:pr-4 border-r border-border/10">
          <button title="Ajuda" className="hidden lg:flex w-8 h-8 items-center justify-center text-text-1 opacity-60 hover:opacity-100 hover:bg-black hover:text-white rounded-lg transition-all"><HelpCircle size={18} /></button>
          
          <div className="relative ml-1">
            <button
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              title="Ver Alertas"
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-xl transition-all",
                isAlertsOpen ? "bg-black text-primary" : "text-text-1 hover:text-primary hover:bg-black"
              )}
            >
              <Bell size={18} />
              {activeAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-danger text-white text-[8px] font-black rounded-full flex items-center justify-center ring-2 ring-black animate-pulse">
                  {activeAlerts.length}
                </span>
              )}
            </button>

            {isAlertsOpen && (
              <div className="absolute right-0 top-12 w-80 bg-surface border border-border rounded-[30px] shadow-2xl z-50 overflow-hidden animate-fade border-t-4 border-t-primary">
                <div className="px-5 py-4 border-b border-border/10 flex items-center justify-between">
                  <span className="text-[9px] font-black text-text-1 uppercase tracking-widest">Alertas Críticos</span>
                  <Badge variant="danger" className="border-none text-[8px] px-2 py-0.5">{activeAlerts.length}</Badge>
                </div>
                <div className="max-h-72 overflow-y-auto scroll-elite py-2">
                  {activeAlerts.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-[10px] font-black text-text-1 uppercase tracking-widest opacity-20">Estoque Estável</p>
                    </div>
                  ) : activeAlerts.map(alert => (
                    <div key={alert.id} className="px-5 py-3 hover:bg-black/[0.02] transition-colors border-b border-border/5 last:border-none">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-[10px] font-black text-text-1 uppercase truncate">{alert.alert_type.replace('_', ' ')}</p>
                        <span className="text-[8px] font-black text-text-1 opacity-30">{alert.triggered_at ? format(new Date(alert.triggered_at), 'HH:mm') : ''}</span>
                      </div>
                      <p className="text-[8px] font-black text-danger uppercase tracking-widest mb-1.5">Saldo: {alert.current_value}</p>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
                        <p className="text-[8px] font-black text-text-1 opacity-40 uppercase truncate">Contrato #{alert.contract_id.substring(0, 8)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User & Info Group */}
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden xl:block text-right">
             <p className="text-[10px] font-black text-text-1 uppercase tracking-tight leading-none">{format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</p>
             <p className="text-[7px] font-black text-text-1 opacity-20 uppercase tracking-[0.4em] mt-1">v2.4</p>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-3">
             <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black text-text-1 uppercase tracking-tighter leading-none">{user?.name}</span>
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.1em] italic leading-none">{user?.role}</span>
             </div>
             <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-black text-white flex items-center justify-center font-black shadow-lg shadow-black/20 text-sm lg:text-lg overflow-hidden border border-primary/20">
                {user?.name?.charAt(0) || 'U'}
             </div>
             
             <button 
               onClick={logout}
               className="w-9 h-9 rounded-xl bg-surface border border-border flex items-center justify-center text-text-1 hover:bg-danger hover:text-white hover:border-danger transition-all shadow-sm group"
               title="Encerrar Sessão"
             >
               <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
             </button>
          </div>
        </div>

      </div>
    </header>
  );
};
