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
    <header className={`h-16 fixed top-0 right-0 z-40 px-8 flex items-center justify-between border-b border-black/5 bg-white/80 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isSidebarCollapsed ? 'left-[80px]' : 'left-[280px]'}`}>
      <div className="flex items-center gap-4 bg-zinc-50 border border-black/5 px-4 py-2 rounded-full w-[380px] focus-within:bg-white focus-within:ring-1 focus-within:ring-primary/20 transition-all pointer-events-auto">
        <Search size={14} className="text-zinc-400" />
        <input 
          type="text" 
          placeholder="PESQUISAR..." 
          className="bg-transparent border-none outline-none text-[10px] w-full font-black uppercase tracking-widest text-black placeholder-zinc-300"
        />
      </div>

      <div className="flex items-center gap-8 pointer-events-auto">
        {/* Aesthetic Sync Dots (CMYK) */}
        <div className="flex items-center gap-1.5 p-1.5 bg-zinc-50 rounded-xl border border-black/5">
          {themes.map((t) => (
            <button
              key={t.color}
              onClick={() => setThemeColor(t.color)}
              className={`w-3.5 h-3.5 rounded-md transition-all ${themeColor === t.color ? 'shadow-sm ring-1 ring-primary/20' : 'opacity-20 hover:opacity-100'}`}
              style={{ backgroundColor: t.color }}
            />
          ))}
        </div>

        <button 
          onClick={() => setIsAlertsOpen(!isAlertsOpen)}
          className="relative h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-50 border border-black/5 text-zinc-400 hover:text-black transition-all"
        >
          <Bell size={18} />
          {alerts.length > 0 && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full ring-2 ring-white"></span>
          )}
        </button>

        <div className="flex items-center gap-4 pl-4 border-l border-black/5">
          <div className="text-right">
             <p className="text-[7px] font-black text-black/20 uppercase tracking-[0.2em] leading-none mb-1">Contexto de Segurança</p>
             <p className="text-[10px] font-black text-black tracking-widest leading-none">{format(new Date(), 'dd.MM.yy')}</p>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end">
                <p className="text-[9px] font-black text-black uppercase leading-none">{user?.name}</p>
                <div className="flex items-center gap-1.5 mt-1 border-t border-black/5 pt-1">
                   <div className="w-1 h-1 rounded-full bg-success" />
                   <p className="text-[7px] font-black text-black/20 uppercase tracking-widest">{user?.role}</p>
                </div>
             </div>
             
             <button 
               onClick={logout}
               className="h-10 w-10 rounded-xl bg-zinc-50 border border-black/5 flex items-center justify-center text-zinc-400 hover:text-danger hover:border-danger/20 transition-all"
             >
               <LogOut size={16} />
             </button>
          </div>
        </div>
      </div>
    </header>
  );
};
