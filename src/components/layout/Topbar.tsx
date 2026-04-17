import { useState, useMemo } from 'react';
import { 
  Bell, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Activity,
  User,
  LogOut
} from 'lucide-react';
import { useDataStore } from '../../store/useDataStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
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
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const stats = useMemo(() => {
    const criticals = stockEntries.filter(entry => {
      const relation = contractSupplies.find(cs => cs.contract_id === entry.contract_id && cs.supply_type_id === entry.supply_type_id);
      return relation && entry.current_stock <= relation.min_stock;
    });

    return {
      totalAssets: supplyTypes.length,
      criticalCount: criticals.length,
      totalContracts: contracts.length
    };
  }, [stockEntries, supplyTypes, contracts, contractSupplies]);

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
    <header className={`h-20 fixed top-0 right-0 z-40 px-8 flex items-center justify-between pointer-events-none border-b border-border/40 bg-bg/70 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarCollapsed ? 'left-[90px]' : 'left-[300px]'}`}>
      <div className="flex items-center gap-4 bg-surface/50 px-5 py-2.5 rounded-2xl border border-border focus-within:border-primary/40 focus-within:bg-surface transition-all group pointer-events-auto w-[400px]">
        <Search size={16} strokeWidth={2.5} className="text-text-2/40 group-focus-within:text-primary transition-colors" />
        <input 
          type="text" 
          placeholder="PESQUISAR ATIVOS OU CONTRATOS..." 
          className="bg-transparent border-none outline-none text-[10px] w-full font-black uppercase tracking-widest text-text-1 placeholder-text-2/20"
        />
      </div>

      <div className="flex items-center gap-10 pointer-events-auto">
        {/* Metrics Section */}
        <div className="hidden lg:flex items-center gap-8">
           <div className="flex flex-col items-end border-r border-border pr-6">
              <p className="text-[7px] font-black text-text-2/40 uppercase tracking-widest leading-none mb-1.5">Unidades Operacionais</p>
              <div className="flex items-baseline gap-2">
                 <span className="text-sm font-black text-text-1 tracking-tighter">{stats.totalContracts}</span>
                 <p className="text-[7px] font-black text-primary uppercase">Alpha</p>
              </div>
           </div>
           
           <div className="flex flex-col items-end">
              <p className="text-[7px] font-black text-text-2/40 uppercase tracking-widest leading-none mb-1.5">Riscos de Estoque</p>
              <div className="flex items-baseline gap-2">
                 <span className={`text-sm font-black tracking-tighter ${stats.criticalCount > 0 ? 'text-danger' : 'text-success'}`}>{stats.criticalCount}</span>
                 <AlertTriangle size={10} className={stats.criticalCount > 0 ? 'text-danger' : 'text-success/40'} />
              </div>
           </div>
        </div>

        <div className="w-px h-8 bg-border" />

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 p-1 bg-surface/50 rounded-xl border border-border">
            {themes.map((t) => (
              <button
                key={t.color}
                onClick={() => setThemeColor(t.color)}
                className={`w-4 h-4 rounded-lg transition-all hover:scale-110 ${themeColor === t.color ? 'ring-2 ring-primary/40 shadow-lg' : 'opacity-20 hover:opacity-100'}`}
                style={{ backgroundColor: t.color }}
              />
            ))}
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className={`relative h-12 w-12 flex items-center justify-center rounded-2xl border transition-all ${isAlertsOpen ? 'bg-primary/10 border-primary/40 text-primary shadow-xl shadow-primary/10' : 'bg-surface border-border text-text-2 hover:border-text-2/40 hover:text-text-1'}`}
            >
              <Bell size={20} strokeWidth={2.5} />
              {alerts.length > 0 && (
                <span className="absolute top-3 right-3 w-2 h-2 bg-danger rounded-full ring-4 ring-bg animate-pulse shadow-lg shadow-danger/40"></span>
              )}
            </button>

            {isAlertsOpen && (
              <div className="absolute right-0 mt-4 w-96 bg-surface border border-border rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-white/[0.02]">
                  <div>
                    <h4 className="text-[10px] text-text-1 font-black uppercase tracking-widest">Painel de Alertas</h4>
                    <p className="text-[7px] text-text-2/40 font-bold uppercase tracking-widest mt-1">GDC Real-time Stream</p>
                  </div>
                  <div className="px-3 py-1 bg-danger/10 border border-danger/20 text-danger rounded-lg text-[8px] font-black uppercase tracking-widest">
                    {alerts.length} Críticos
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto scroll-elite">
                  {alerts.length > 0 ? alerts.map((alert) => (
                    <div key={alert.id} className="px-6 py-4 border-b border-border/40 last:border-none hover:bg-white/[0.03] transition-colors cursor-pointer group">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-danger/10 text-danger/40 flex items-center justify-center shrink-0 group-hover:text-danger group-hover:bg-danger/20 transition-all">
                          <AlertTriangle size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-text-1 uppercase truncate leading-tight tracking-tight">{alert.contractName}</p>
                          <p className="text-[9px] text-text-2 mt-1.5 font-bold uppercase tracking-widest flex items-center gap-2">
                             {alert.supplyName} 
                             <span className="w-1 h-1 rounded-full bg-border" />
                             SALDO: <span className="text-danger font-black">{alert.stock}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center opacity-20">
                      <CheckCircle2 size={40} strokeWidth={1} className="mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.4em]">Estoque Nominal Garantido</p>
                    </div>
                  )}
                </div>
                <div className="px-6 py-4 bg-white/[0.02] text-center border-t border-border group">
                  <button className="text-[9px] font-black text-primary uppercase tracking-[.2em] group-hover:underline">Limpar Logs do Sistema</button>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 border-l border-border pl-6">
             <div className="flex flex-col items-end">
                <p className="text-[8px] font-black text-text-1 italic uppercase leading-none">{user?.name}</p>
                <div className="flex items-center gap-2 mt-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(var(--rdy-success-rgb),0.5)]" />
                   <p className="text-[7px] font-black text-text-2/40 uppercase tracking-[0.2em]">{user?.role}</p>
                </div>
             </div>
             <button 
               onClick={logout}
               className="h-10 w-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-2 hover:text-danger hover:border-danger transition-all shadow-sm"
             >
               <LogOut size={16} />
             </button>
          </div>
        </div>
      </div>
    </header>
  );
};
