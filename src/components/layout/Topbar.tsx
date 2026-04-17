import { useState, useMemo } from 'react';
import {
  Bell,
  Search,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { useDataStore } from '../../store/useDataStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useThemeStore } from '../../store/useThemeStore';
import { format } from 'date-fns';

const themes = [
  { name: 'Amarelo', color: '#F5C800' },
  { name: 'Magenta', color: '#E6007E' },
  { name: 'Ciano', color: '#00AEEF' },
];

export const Topbar = () => {
  const { isSidebarCollapsed } = useUIStore();
  const { stockEntries, contracts, supplyTypes, contractSupplies } = useDataStore();
  const { themeColor, setThemeColor, user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const alerts = useMemo(() => {
    return stockEntries.filter(entry => {
      const relation = contractSupplies.find(cs => cs.contract_id === entry.contract_id && cs.supply_type_id === entry.supply_type_id);
      return relation && entry.current_stock <= relation.min_stock;
    }).map(alert => ({
      id: alert.id,
      contractName: contracts.find(c => c.id === alert.contract_id)?.name || 'Contrato',
      supplyName: supplyTypes.find(s => s.id === alert.supply_type_id)?.name || 'Insumo',
      stock: alert.current_stock,
      date: alert.entry_date
    }));
  }, [stockEntries, contracts, supplyTypes, contractSupplies]);

  return (
    <header className={`h-16 fixed top-0 right-0 z-40 px-8 flex items-center justify-between border-b border-border bg-bg/80 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarCollapsed ? 'left-[80px]' : 'left-[280px]'}`}>
      <div className="flex items-center gap-4 bg-surface border border-border px-4 py-2 rounded-full w-[280px] focus-within:bg-bg focus-within:ring-1 focus-within:ring-primary/20 transition-all pointer-events-auto">
        <Search size={14} className="text-text-2" />
        <input 
          type="text" 
          placeholder="PESQUISAR..." 
          className="bg-transparent border-none outline-none text-[10px] w-full font-black uppercase tracking-widest text-text-1 placeholder-text-2/30"
        />
      </div>

      <div className="flex items-center gap-6 pointer-events-auto">
        <div className="flex items-center gap-4">
          {/* Aesthetic Sync Dots (CMYK) */}
          <div className="flex items-center gap-1.5 p-1.5 bg-surface rounded-xl border border-border">
            {themes.map((t) => (
              <button
                key={t.color}
                onClick={() => setThemeColor(t.color)}
                className={`w-3.5 h-3.5 rounded-md transition-all ${themeColor === t.color ? 'shadow-sm ring-1 ring-primary/20' : 'opacity-20 hover:opacity-100'}`}
                style={{ backgroundColor: t.color }}
              />
            ))}
          </div>

          {/* Theme Toggle — Voltou com força */}
          <button 
            onClick={toggleTheme}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface border border-border text-text-2 hover:text-text-1 transition-all group"
          >
            {theme === 'light' ? <Moon size={18} className="group-hover:rotate-12 transition-transform" /> : <Sun size={18} className="group-hover:rotate-90 transition-transform" />}
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-surface border border-border text-text-2 hover:text-text-1 transition-all"
          >
            <Bell size={18} />
            {alerts.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full ring-2 ring-bg"></span>
            )}
          </button>
          {isAlertsOpen && (
            <div className="absolute right-0 top-12 w-80 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <p className="text-[9px] font-black text-text-1 uppercase tracking-widest">Alertas de Estoque</p>
                <span className="text-[8px] font-black text-danger uppercase">{alerts.length} crítico{alerts.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="max-h-72 overflow-y-auto scroll-elite">
                {alerts.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-[9px] font-black text-text-2/40 uppercase tracking-widest">Sem alertas ativos</p>
                  </div>
                ) : alerts.map(alert => (
                  <div key={alert.id} className="px-5 py-4 border-b border-border/50 hover:bg-bg/50 transition-colors">
                    <p className="text-[10px] font-black text-text-1 uppercase leading-none">{alert.supplyName}</p>
                    <p className="text-[8px] font-black text-text-2/40 uppercase tracking-widest mt-1">{alert.contractName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[8px] font-black text-danger uppercase">Saldo: {alert.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 pl-4 border-l border-border">
          <div className="text-right">
             <p className="text-[7px] font-black text-text-2/60 uppercase tracking-[0.2em] leading-none mb-1">Contexto de Segurança</p>
             <p className="text-[10px] font-black text-text-1 tracking-widest leading-none">{format(new Date(), 'dd.MM.yy')}</p>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end">
                <p className="text-[9px] font-black text-text-1 uppercase leading-none">{user?.name}</p>
                <div className="flex items-center gap-1.5 mt-1 border-t border-border pt-1">
                   <div className="w-1 h-1 rounded-full bg-success" />
                   <p className="text-[7px] font-black text-text-2 uppercase tracking-widest opacity-50">{user?.role}</p>
                </div>
             </div>
             
             <button 
               onClick={logout}
               className="h-10 w-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-2 hover:text-danger hover:border-danger/20 transition-all font-black"
             >
               <LogOut size={16} />
             </button>
          </div>
        </div>
      </div>
    </header>
  );
};
