import { useState } from 'react';
import {
  Bell,
  Search,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useDataStore } from '../../store/useDataStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Base';

export const Topbar = () => {
  const { isSidebarCollapsed } = useUIStore();
  const { stockAlerts } = useDataStore();
  const { user } = useAuthStore();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const activeAlerts = stockAlerts.filter(a => !a.resolved);

  return (
    <header 
      className={cn(
        "h-20 fixed top-0 right-0 z-40 px-8 flex items-center justify-between border-b border-border bg-white/80 backdrop-blur-md transition-all duration-300",
        isSidebarCollapsed ? "left-[80px]" : "left-[280px]"
      )}
    >
      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-bg border border-border px-4 py-2.5 rounded-xl w-[400px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
        <Search size={18} className="text-text-2/50" />
        <input 
          type="text" 
          placeholder="Pesquisar contratos, equipamentos ou NS..." 
          className="bg-transparent border-none outline-none text-sm w-full font-medium text-text-1 placeholder:text-text-2/40"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 border-r border-border pr-4 mr-2">
          <button 
            title="Ajuda e Documentação"
            aria-label="Abrir central de ajuda"
            className="p-2.5 text-text-2 hover:text-text-1 hover:bg-bg rounded-xl transition-all"
          >
            <HelpCircle size={20} />
          </button>
          <button 
            title="Configurações do Sistema"
            aria-label="Abrir configurações"
            className="p-2.5 text-text-2 hover:text-text-1 hover:bg-bg rounded-xl transition-all"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Alerts Notification */}
        <div className="relative">
          <button
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            title="Alertas de Estoque"
            aria-label={`${activeAlerts.length} alertas de estoque críticos`}
            className={cn(
              "relative p-2.5 flex items-center justify-center rounded-xl transition-all border border-transparent",
              isAlertsOpen ? "bg-bg border-border text-text-1" : "text-text-2 hover:text-text-1 hover:bg-bg"
            )}
          >
            <Bell size={20} />
            {activeAlerts.length > 0 && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-danger text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                {activeAlerts.length}
              </span>
            )}
          </button>

          {isAlertsOpen && (
            <div className="absolute right-0 top-14 w-80 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-bg/50">
                <span className="text-[10px] font-black text-text-1 uppercase tracking-widest">Alertas de Estoque</span>
                <Badge variant="danger">{activeAlerts.length} Críticos</Badge>
              </div>
              <div className="max-h-80 overflow-y-auto scroll-elite py-2">
                {activeAlerts.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                      <Bell size={20} className="text-success" />
                    </div>
                    <p className="text-xs font-bold text-text-2/40 uppercase tracking-widest">Tudo em dia!</p>
                  </div>
                ) : activeAlerts.map(alert => (
                  <div key={alert.id} className="px-5 py-4 hover:bg-bg/50 transition-colors cursor-pointer border-b border-border/50 last:border-none">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-black text-text-1 uppercase truncate">{alert.alert_type.replace('_', ' ')}</p>
                      <span className="text-[9px] font-bold text-text-2/40">{format(new Date(alert.triggered_at), 'HH:mm')}</span>
                    </div>
                    <p className="text-[9px] font-bold text-danger uppercase tracking-widest mb-2">
                      Saldo: {alert.current_value} (Mín: {alert.min_value})
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-danger animate-pulse" />
                      <p className="text-[8px] font-bold text-text-2/40 uppercase tracking-tighter truncate">Contrato #{alert.contract_id.substring(0, 8)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border bg-bg/30 text-center">
                <button className="text-[9px] font-black text-primary hover:underline uppercase tracking-widest">Ver todos os alertas</button>
              </div>
            </div>
          )}
        </div>

        {/* Date & User Info */}
        <div className="flex items-center gap-4 pl-4 border-l border-border h-10">
          <div className="hidden lg:block text-right">
             <p className="text-[9px] font-black text-text-1 uppercase tracking-tight">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
             <p className="text-[8px] font-bold text-text-2/40 uppercase tracking-widest mt-0.5">Sistema RDY Online</p>
          </div>
          
          <div className="flex items-center gap-3 pl-4">
             <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center text-text-1 font-black shadow-sm">
                {user?.name?.charAt(0) || 'U'}
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};
