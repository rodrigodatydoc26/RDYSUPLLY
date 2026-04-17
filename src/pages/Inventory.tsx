import { useMemo, useState } from 'react';
import { 
  Layers,
  ArrowUpRight,
  Filter,
  Zap,
  Activity,
  ShieldCheck,
  SearchCode,
  Box
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { format } from 'date-fns';

export const Inventory = () => {
  const { contracts, supplyTypes, contractSupplies, stockEntries } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'toner' | 'paper' | 'part'>('all');

  const currentInventory = useMemo(() => {
    if (!contracts || !stockEntries) return [];

    return (contracts || []).map(contract => {
      const supplies = (contractSupplies || [])
        .filter(cs => cs.contract_id === contract.id)
        .map(relation => {
          const supplyInfo = (supplyTypes || []).find(s => s.id === relation.supply_type_id);
          const latestEntry = [...(stockEntries || [])]
            .filter(e => e.contract_id === contract.id && e.supply_type_id === relation.supply_type_id)
            .sort((a, b) => {
               const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
               const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
               return dateB - dateA;
            })[0];

          return {
            ...relation,
            supplyInfo,
            current_stock: latestEntry?.current_stock ?? 0,
            last_updated: latestEntry?.created_at,
          };
        });

      return {
        ...contract,
        supplies
      };
    }).filter(contract => {
      const matchesSearch = contract.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           contract.client?.toLowerCase().includes(searchTerm.toLowerCase());
      const hasCategory = selectedCategory === 'all' || 
                         contract.supplies?.some(s => s.supplyInfo?.category === selectedCategory);
      return matchesSearch && hasCategory;
    });
  }, [contracts, supplyTypes, contractSupplies, stockEntries, searchTerm, selectedCategory]);

  const stats = useMemo(() => {
    let totalItems = 0;
    let criticalItems = 0;
    
    currentInventory.forEach(c => {
      c.supplies.forEach(s => {
        totalItems++;
        if (s.current_stock <= s.min_stock) criticalItems++;
      });
    });

    return { totalItems, criticalItems, okItems: totalItems - criticalItems };
  }, [currentInventory]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Dynamic Header Section */}
      <div className="border-b border-border pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-primary" />
              <p className="text-text-2 text-[8px] font-black uppercase tracking-widest">Livro Mestre de Ativos Global</p>
            </div>
            <h2 className="text-lg font-black text-text-1 italic tracking-tighter uppercase leading-none">
              Controle <span className="text-text-2/40">de Estoque</span>
            </h2>
          </div>

          <div className="flex bg-surface/50 p-0.5 rounded border border-border">
             <div className="px-3 py-1 flex items-center gap-2">
                <Activity size={10} className="text-primary/60" />
                <p className="text-[8px] font-black text-text-2 uppercase tracking-wide">{format(new Date(), 'HH:mm:ss')}</p>
             </div>
             <div className="w-px h-3 my-auto bg-border" />
             <div className="px-3 py-1 flex items-center gap-2">
                <ShieldCheck size={10} className="text-primary/60" />
                <p className="text-[8px] font-black text-text-2 uppercase tracking-wide">Verified</p>
             </div>
          </div>
        </div>
      </div>

      {/* Control Bar - High Density */}
      <div className="flex flex-col xl:flex-row gap-2 items-center">
        <div className="flex-1 relative w-full lg:w-auto">
          <SearchCode className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-2/40" size={12} />
          <input 
            type="text" 
            placeholder="FILTRAR POR IDENTIFICADOR..."
            className="rdy-input h-7 pl-8 pr-4 text-[8px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex bg-surface/50 p-0.5 rounded border border-border">
           {(['all', 'Toner', 'Papel', 'Cilindro'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 h-6 rounded text-[7px] font-black uppercase tracking-wider transition-all ${
                  selectedCategory === cat 
                    ? 'bg-primary text-black' 
                    : 'text-text-2 hover:text-text-1'
                }`}
              >
                {cat}
              </button>
           ))}
        </div>
      </div>

      {/* High-Density Inventory List */}
      <div className="card-xp overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-text-2 text-[7px] font-black uppercase tracking-widest bg-surface/30">
              <th className="px-4 py-2 opacity-50">Cliente / Unidade</th>
              <th className="px-4 py-2 opacity-50">Identificação do Insumo</th>
              <th className="px-4 py-2 opacity-50">Saldo</th>
              <th className="px-4 py-2 opacity-50">Limite</th>
              <th className="px-4 py-2 opacity-50">Status</th>
              <th className="px-4 py-2 text-right opacity-50">Tarefa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {currentInventory.flatMap(contract => 
              contract.supplies
                .filter(s => selectedCategory === 'all' || s.supplyInfo?.category === selectedCategory)
                .map(link => {
                  const isCritical = link.current_stock <= link.min_stock;
                  return (
                    <tr key={link.id} className="group/row hover:bg-white/5 transition-all text-[10px]">
                      <td className="px-4 py-1.5">
                         <p className="font-bold text-text-1 uppercase tracking-tight">{contract.name}</p>
                         <p className="text-[7px] text-text-2 font-bold uppercase tracking-widest">{contract.code}</p>
                      </td>
                      <td className="px-4 py-1.5">
                         <div className="flex items-center gap-2">
                            <Box size={10} className="text-text-2/40" />
                            <p className="font-medium text-text-2 truncate max-w-[150px]">{link.supplyInfo?.name}</p>
                            <span className="text-[6px] px-1 py-0.5 bg-border rounded text-text-2/40 uppercase font-black">{link.supplyInfo?.category}</span>
                         </div>
                      </td>
                      <td className="px-4 py-1.5">
                         <div className="flex items-baseline gap-1">
                            <span className={`font-black tracking-tighter ${isCritical ? 'text-danger' : 'text-text-1'}`}>
                               {link.current_stock}
                            </span>
                            <span className="text-[7px] font-black text-text-2/20 uppercase">{link.supplyInfo?.unit}</span>
                         </div>
                      </td>
                      <td className="px-4 py-1.5 text-text-2/40 font-bold">
                         {link.min_stock}
                      </td>
                      <td className="px-4 py-1.5">
                         <div className="flex items-center gap-1.5">
                            <div className={`w-1 h-1 rounded-full ${isCritical ? 'bg-danger animate-pulse shadow-[0_0_5px_rgba(255,82,82,0.6)]' : 'bg-primary/40'}`} />
                            <span className={`text-[7px] font-black uppercase tracking-widest ${isCritical ? 'text-danger' : 'text-text-2/40'}`}>
                               {isCritical ? 'Critical' : 'Nominal'}
                            </span>
                         </div>
                      </td>
                      <td className="px-4 py-1.5 text-right">
                         <button className="h-6 px-2 bg-surface border border-border rounded text-[7px] font-black text-text-2 uppercase tracking-widest hover:border-primary hover:text-primary transition-all flex items-center gap-1 ml-auto group/btn">
                            <span>Adjust</span>
                            <ArrowUpRight size={8} />
                         </button>
                      </td>
                    </tr>
                  );
                })
            )}
            {currentInventory.length === 0 && (
              <tr>
                <td colSpan={6} className="px-10 py-32 text-center">
                  <p className="text-[10px] font-black text-text-2/20 uppercase tracking-[0.5em]">Sem ativos sincronizados para esta busca</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
