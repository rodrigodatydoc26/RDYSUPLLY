import { useMemo, useState } from 'react';
import { 
  ArrowUpRight,
  Activity,
  ShieldCheck,
  SearchCode,
  Box,
  ChevronDown,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { format } from 'date-fns';

export const Inventory = () => {
  const { contracts, supplyTypes, contractSupplies, stockEntries } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Toner' | 'Papel' | 'Cilindro'>('all');
  const [expandedContract, setExpandedContract] = useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
    setExpandedContract(expandedContract === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Dynamic Header Section */}
      <div className="border-b border-border pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--rdy-primary-rgb),0.5)]" />
              <p className="text-text-2 text-[10px] font-black uppercase tracking-widest leading-none">Intelligence Active System</p>
            </div>
            <h2 className="text-2xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
              Estoques <span className="text-text-2/30">Hierárquicos</span>
            </h2>
          </div>

          <div className="flex bg-surface/50 p-1 rounded-xl border border-border/40 backdrop-blur-md">
             <div className="px-5 py-2 flex items-center gap-3">
                <Activity size={14} className="text-primary/60" />
                <p className="text-[10px] font-black text-text-1 uppercase tracking-widest">{format(new Date(), 'HH:mm:ss')}</p>
             </div>
             <div className="w-px h-6 my-auto bg-border" />
             <div className="px-5 py-2 flex items-center gap-3">
                <ShieldCheck size={14} className="text-success/60" />
                <p className="text-[10px] font-black text-text-1 uppercase tracking-widest">Sincronizado</p>
             </div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-center">
        <div className="flex-1 relative w-full group">
          <SearchCode className="absolute left-4 top-1/2 -translate-y-1/2 text-text-2/40 group-focus-within:text-primary transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="PROCURAR CONTRATO OU UNIDADE DE ESTOQUE..."
            className="rdy-input h-12 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex bg-surface/50 p-1 rounded-xl border border-border/40 backdrop-blur-md">
           {(['all', 'Toner', 'Papel', 'Cilindro'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 h-10 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                  selectedCategory === cat 
                    ? 'bg-primary text-black shadow-lg shadow-primary/20' 
                    : 'text-text-2 hover:text-text-1 hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
           ))}
        </div>
      </div>

      {/* Contract Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {currentInventory.map(contract => {
          const isExpanded = expandedContract === contract.id;
          const criticalItems = contract.supplies.filter(s => s.current_stock <= s.min_stock);
          const hasAlert = criticalItems.length > 0;

          return (
            <div 
              key={contract.id} 
              className={`group border transition-all duration-500 rounded-[28px] overflow-hidden ${
                isExpanded 
                  ? 'border-primary/40 bg-primary/[0.02] shadow-2xl' 
                  : 'border-border/60 bg-surface/30 hover:border-primary/20 hover:bg-surface/50 shadow-lg'
              }`}
            >
              {/* Card Header */}
              <div 
                onClick={() => toggleExpand(contract.id)}
                className="px-8 py-6 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-18 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    hasAlert ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-surface border border-border text-text-2'
                  }`}>
                    {hasAlert ? <AlertTriangle size={24} /> : <FolderOpen size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                       <h3 className="text-lg font-black text-text-1 italic uppercase tracking-tighter leading-none">{contract.name}</h3>
                       {hasAlert && (
                         <div className="px-2 py-0.5 bg-danger text-black text-[7px] font-black uppercase rounded-full animate-pulse">
                           {criticalItems.length} Alerta{criticalItems.length > 1 ? 's' : ''}
                         </div>
                       )}
                    </div>
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-text-2/40">
                      <span className="flex items-center gap-1.5"><Box size={10} /> {contract.supplies.length} Insumos Vinculados</span>
                      <div className="w-1 h-1 rounded-full bg-border" />
                      <span>ID: {contract.code}</span>
                      <div className="w-1 h-1 rounded-full bg-border" />
                      <span>{contract.client}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Summary Pills */}
                  <div className="hidden md:flex gap-2">
                     <div className="px-4 py-2 bg-black/20 rounded-xl border border-white/5 text-center">
                        <p className="text-[6px] font-black text-text-2/40 uppercase mb-0.5">Status Geral</p>
                        <p className={`text-[9px] font-black uppercase ${hasAlert ? 'text-danger' : 'text-success'}`}>
                           {hasAlert ? 'Reposição Necessária' : 'Estoque Nominal'}
                        </p>
                     </div>
                  </div>
                  <ChevronDown className={`text-text-2 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-primary' : ''}`} size={20} />
                </div>
              </div>

              {/* Expanded Table */}
              <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[1000px] border-t border-primary/10' : 'max-h-0'}`}>
                <div className="p-4 sm:p-8">
                  <div className="rounded-[20px] border border-border/40 overflow-hidden bg-black/20 backdrop-blur-sm">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border/40 bg-surface/30 text-text-2 text-[7.5px] font-black uppercase tracking-[0.2em]">
                          <th className="px-6 py-4">Insumo Identificado</th>
                          <th className="px-6 py-4">Categoria</th>
                          <th className="px-6 py-4">Saldo Atual</th>
                          <th className="px-6 py-4">Reserva Mínima</th>
                          <th className="px-6 py-4">Saúde</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {contract.supplies.map(link => {
                          const isCritical = link.current_stock <= link.min_stock;
                          return (
                            <tr key={link.id} className="group/row hover:bg-white/5 transition-all">
                              <td className="px-6 py-4">
                                <p className="text-[11px] font-black text-text-1 uppercase tracking-tight">{link.supplyInfo?.name}</p>
                                <p className="text-[7px] text-text-2/40 font-bold uppercase tracking-widest mt-1">GDC-SKU: {link.id.substring(0, 8)}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-3 py-1 bg-surface border border-border rounded-lg text-[8px] font-black text-text-2 uppercase">
                                  {link.supplyInfo?.category}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-baseline gap-2">
                                   <span className={`text-base font-black tracking-tighter ${isCritical ? 'text-danger' : 'text-text-1'}`}>
                                      {link.current_stock}
                                   </span>
                                   <span className="text-[8px] font-black text-text-2/20 uppercase">{link.supplyInfo?.unit}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-black text-text-2/40 tracking-tighter">{link.min_stock}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-danger animate-pulse shadow-[0_0_8px_rgba(255,82,82,0.8)]' : 'bg-success/40'}`} />
                                  <span className={`text-[8px] font-black uppercase tracking-widest ${isCritical ? 'text-danger' : 'text-text-2/30'}`}>
                                    {isCritical ? 'Crítico' : 'Estável'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button className="h-10 px-4 bg-surface border border-border rounded-xl text-[9px] font-black text-text-2 uppercase tracking-widest hover:bg-primary hover:border-primary hover:text-black transition-all flex items-center gap-2 ml-auto group/btn shadow-sm">
                                   <span>Reposição</span>
                                   <ArrowUpRight size={12} strokeWidth={3} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {contract.supplies.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center">
                              <p className="text-[9px] font-black text-text-2/20 uppercase tracking-[0.4em]">Nenhum insumo vinculado a este estoque</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {currentInventory.length === 0 && (
          <div className="py-40 text-center border-2 border-dashed border-border rounded-[40px] opacity-20">
            <p className="text-[12px] font-black text-text-2 uppercase tracking-[0.8em]">Unidade de estoque não encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
};
