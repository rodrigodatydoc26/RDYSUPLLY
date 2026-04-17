import { useState, useMemo } from 'react';
import { Bell, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useDataStore } from '../../store/useDataStore';
import { useAuthStore } from '../../store/useAuthStore';
import { format } from 'date-fns';

const themes = [
  { name: 'Amarelo', color: '#F5C800' },
  { name: 'Magenta', color: '#E6007E' },
  { name: 'Ciano', color: '#00AEEF' },
];

export const Topbar = () => {
  const { stockEntries, contracts, supplyTypes, contractSupplies } = useDataStore();
  const { themeColor, setThemeColor } = useAuthStore();
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
    <header className="h-12 fixed top-0 right-0 left-[190px] z-40 px-5 flex items-center justify-between pointer-events-none border-b border-border/50 bg-bg/50 backdrop-blur-md">
      <div className="flex items-center gap-2 bg-surface/50 px-3 py-1 rounded border border-border focus-within:border-primary/40 transition-all group pointer-events-auto w-60">
        <Search size={12} strokeWidth={2} className="text-text-2/40 group-focus-within:text-primary transition-colors" />
        <input 
          type="text" 
          placeholder="PESQUISAR..." 
          className="bg-transparent border-none outline-none text-[10px] w-full font-bold uppercase tracking-wider text-text-1 placeholder-text-2/20"
        />
      </div>

      <div className="flex items-center gap-8 pointer-events-auto">
        <div className="flex items-center gap-1 p-0.5 bg-surface/50 rounded border border-border">
          {themes.map((t) => (
            <button
              key={t.color}
              onClick={() => setThemeColor(t.color)}
              className={`w-2.5 h-2.5 rounded-sm transition-all hover:scale-110 ${themeColor === t.color ? 'ring-1 ring-white/50' : 'opacity-20 hover:opacity-100'}`}
              style={{ backgroundColor: t.color }}
            />
          ))}
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className={`relative p-1.5 rounded transition-all ${isAlertsOpen ? 'bg-primary/20 text-primary' : 'text-text-2/40 hover:text-text-1'}`}
          >
            <Bell size={12} strokeWidth={2.5} />
            {alerts.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-danger rounded-full ring-2 ring-bg animate-pulse"></span>
            )}
          </button>

          {isAlertsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-bg/50">
                <h4 className="text-[8px] text-text-2 font-black uppercase tracking-widest">Alertas do Sistema</h4>
                <div className="px-1.5 py-0.5 bg-danger/10 border border-danger/20 text-danger rounded text-[7px] font-black uppercase">
                  {alerts.length} Críticos
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto scroll-elite">
                {alerts.length > 0 ? alerts.map((alert) => (
                  <div key={alert.id} className="px-3 py-2 border-b border-border last:border-none hover:bg-white/5 transition-colors cursor-pointer group">
                    <div className="flex gap-2.5">
                      <div className="w-8 h-8 rounded bg-danger/5 text-danger/40 flex items-center justify-center shrink-0 group-hover:text-danger group-hover:bg-danger/10 transition-colors">
                        <AlertTriangle size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-text-1 uppercase truncate leading-tight">{alert.contractName}</p>
                        <p className="text-[8px] text-text-2 mt-0.5 font-bold uppercase tracking-tighter">{alert.supplyName} • BAL: <span className="text-danger font-black">{alert.stock}</span></p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center opacity-20">
                    <CheckCircle2 size={24} className="mx-auto mb-2" />
                    <p className="text-[8px] font-black uppercase tracking-widest">Sem Alertas</p>
                  </div>
                )}
              </div>
              <div className="px-3 py-2 bg-white/5 text-center border-t border-border hover:bg-white/10 transition-all">
                <button className="text-[7px] font-bold text-primary uppercase tracking-widest">Limpar Notificações</button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end">
            <p className="text-[7px] font-black text-text-2 uppercase tracking-widest leading-none">Contexto de Segurança</p>
            <p className="text-[9px] font-black text-text-1 italic leading-none mt-1">{format(new Date(), 'dd.MM.yy')}</p>
        </div>
      </div>
    </header>
  );
};
