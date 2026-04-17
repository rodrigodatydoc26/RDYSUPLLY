import { useMemo, useState, useEffect } from 'react';
import { 
  ArrowUpRight,
  Activity,
  ShieldCheck,
  SearchCode,
  Box,
  ChevronDown,
  AlertTriangle,
  FolderOpen,
  CheckCircle2
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { format } from 'date-fns';

export const Inventory = () => {
  const { contracts, supplyTypes, contractSupplies, stockEntries, updateMinStock } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Toner' | 'Papel' | 'Cilindro'>('all');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [clock, setClock] = useState(() => format(new Date(), 'HH:mm:ss'));
  useEffect(() => {
    const id = setInterval(() => setClock(format(new Date(), 'HH:mm:ss')), 1000);
    return () => clearInterval(id);
  }, []);

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

  const selectedContract = useMemo(() => 
    currentInventory.find(c => c.id === selectedContractId),
    [currentInventory, selectedContractId]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">
      {/* Standardized 'Catálogo Mestre' Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--rdy-primary-rgb),0.6)]" />
            <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.3em] leading-none opacity-40">Catálogo Mestre de Recursos</p>
          </div>
          <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            ESTOQUES <span className="text-text-2/40 font-light not-italic uppercase">HIERÁRQUICOS</span>
          </h2>
        </div>

        <div className="flex bg-surface/50 p-1 rounded-xl border border-border/40 backdrop-blur-md">
           <div className="px-5 py-2 flex items-center gap-3">
              <Activity size={14} className="text-primary/60" />
              <p className="text-[10px] font-black text-text-1 uppercase tracking-widest">{clock}</p>
           </div>
           <div className="w-px h-6 my-auto bg-border" />
           <div className="px-5 py-2 flex items-center gap-3">
              <ShieldCheck size={14} className="text-success/60" />
              <p className="text-[10px] font-black text-text-1 uppercase tracking-widest">Sincronizado</p>
           </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-center">
        <div className="flex-1 relative w-full group">
          <SearchCode className="absolute left-5 top-1/2 -translate-y-1/2 text-text-2 opacity-20 group-focus-within:opacity-100 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="PROCURAR CONTRATO OU UNIDADE DE ESTOQUE..."
            className="w-full h-14 bg-surface border border-border rounded-[20px] pl-14 pr-6 text-[10px] font-black uppercase tracking-widest text-text-1 focus:bg-bg outline-none transition-all placeholder:text-text-2/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex bg-surface p-1.5 rounded-[20px] border border-border">
           {(['all', 'Toner', 'Papel', 'Cilindro'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-8 h-11 rounded-[14px] text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                  selectedCategory === cat 
                    ? 'bg-primary text-black shadow-md' 
                    : 'text-text-2/30 hover:text-text-1 hover:bg-bg'
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
          const criticalItems = contract.supplies.filter(s => s.current_stock <= s.min_stock);
          const hasAlert = criticalItems.length > 0;

          return (
            <div 
              key={contract.id} 
              onClick={() => setSelectedContractId(contract.id)}
              className="group border border-border bg-surface hover:border-primary/40 hover:shadow-xl transition-all duration-500 rounded-[32px] overflow-hidden cursor-pointer"
            >
              {/* Card Body */}
              <div className="px-8 py-7 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center transition-all duration-500 ${
                    hasAlert ? 'bg-danger/10 text-danger' : 'bg-bg text-text-2/20'
                  }`}>
                    {hasAlert ? <AlertTriangle size={24} /> : <Box size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                       <h3 className="text-xl font-black text-text-1 italic uppercase tracking-tighter leading-none">{contract.name}</h3>
                       {hasAlert && (
                         <div className="px-3 py-1 bg-danger/10 text-danger text-[7px] font-black uppercase rounded-full">
                           {criticalItems.length} Alerta{criticalItems.length > 1 ? 's' : ''}
                         </div>
                       )}
                    </div>
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-text-2/20">
                      <span className="flex items-center gap-1.5"><Box size={10} /> {contract.supplies.length} Insumos Vinculados</span>
                      <div className="w-px h-2 bg-border" />
                      <span>ID: {contract.code}</span>
                      <div className="w-px h-2 bg-border" />
                      <span>{contract.client}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden md:flex gap-2">
                     <div className="px-5 py-2.5 bg-bg rounded-xl border border-border text-center">
                        <p className="text-[6px] font-black text-text-2/40 uppercase mb-0.5">Status Geral</p>
                        <p className={`text-[9px] font-black uppercase ${hasAlert ? 'text-danger' : 'text-text-2/40'}`}>
                           {hasAlert ? 'Reposição Necessária' : 'Estoque Nominal'}
                        </p>
                     </div>
                  </div>
                  <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-text-2/20 group-hover:bg-primary group-hover:text-black group-hover:border-primary transition-all">
                    <ArrowUpRight size={20} />
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

      {/* Detail Modal - Superfécie Industrial Tática */}
      {selectedContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-5xl bg-surface border border-border rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-10 py-10 border-b border-border flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--rdy-primary-rgb),0.6)]" />
                   <p className="text-[10px] font-black text-text-2/40 uppercase tracking-[0.3em]">Gestão de Ativos em Tempo Real</p>
                </div>
                <h3 className="text-4xl font-black text-text-1 italic uppercase tracking-tighter leading-none">{selectedContract.name}</h3>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
                   <FolderOpen size={12} strokeWidth={3} />
                   {selectedContract.client}
                </p>
              </div>
              <button
                onClick={() => setSelectedContractId(null)}
                className="w-14 h-14 rounded-[20px] bg-bg border border-border flex items-center justify-center text-text-2/20 hover:text-danger hover:border-danger/20 hover:bg-danger/5 transition-all"
              >
                <ChevronDown className="rotate-90" size={28} strokeWidth={3} />
              </button>
            </div>

            {/* Modal Content - Table Elite */}
            <div className="flex-1 overflow-y-auto p-10">
              <div className="rounded-[32px] border border-border overflow-hidden bg-surface shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border bg-bg/50 text-text-2/40 text-[9px] font-black uppercase tracking-widest">
                      <th className="px-10 py-6">Insumo Identificado</th>
                      <th className="px-10 py-6">Categoria</th>
                      <th className="px-10 py-6 text-center">Saldo Atual (Técnico)</th>
                      <th className="px-10 py-6 text-center">Reserva Mínima</th>
                      <th className="px-10 py-6 text-center">Status Saúde</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {selectedContract.supplies.map(link => {
                      const isCritical = link.current_stock <= link.min_stock;
                      return (
                        <tr key={link.id} className="group hover:bg-bg/50 transition-colors">
                          <td className="px-10 py-8">
                            <p className="text-lg font-black text-text-1 uppercase tracking-tight">{link.supplyInfo?.name}</p>
                            <p className="text-[9px] text-text-2/20 font-black uppercase tracking-widest mt-2">GDC-REF: {link.id.substring(0, 8)}</p>
                          </td>
                          <td className="px-10 py-8">
                            <span className="px-4 py-1.5 bg-bg border border-border rounded-xl text-[10px] font-black text-text-2/40 uppercase">
                              {link.supplyInfo?.category}
                            </span>
                          </td>
                          <td className="px-10 py-8">
                             <div className="flex flex-col items-center">
                               <div className="flex items-baseline gap-2">
                                  <span className={`text-3xl font-black tracking-tighter italic ${isCritical ? 'text-danger' : 'text-text-1'}`}>
                                     {link.current_stock.toLocaleString()}
                                  </span>
                                  <span className="text-[11px] font-black text-text-2/20 uppercase">{link.supplyInfo?.unit}</span>
                               </div>
                               <p className="text-[8px] text-text-2/10 font-black uppercase mt-1.5">Sincronizado via Mobile</p>
                             </div>
                          </td>
                          <td className="px-10 py-8">
                            <div className="flex justify-center">
                              <div className="relative group/input">
                                <input
                                  type="number"
                                  value={link.min_stock}
                                  onChange={(e) => updateMinStock(link.id, parseInt(e.target.value) || 0)}
                                  className="w-24 h-12 bg-bg border border-border rounded-2xl text-center font-black text-text-1 text-base focus:bg-surface focus:border-text-1 transition-all outline-none"
                                />
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                                  <p className="text-[8px] text-primary font-black uppercase whitespace-nowrap">Ajuste de Limite</p>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-center">
                            {isCritical ? (
                              <div className="flex flex-col items-center gap-2 text-danger">
                                <AlertTriangle size={20} strokeWidth={3} />
                                <p className="text-[9px] font-black uppercase tracking-widest">Ação Requerida</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-success">
                                <CheckCircle2 size={20} strokeWidth={3} />
                                <p className="text-[9px] font-black uppercase tracking-widest">Operacional</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-bg p-8 border-t border-border flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                     <p className="text-[8px] font-black text-text-2/30 uppercase tracking-[0.3em] mb-1.5">Última Auditoria</p>
                     <p className="text-xs font-black text-text-1 uppercase tracking-widest">{format(new Date(), 'dd MMMM yyyy')}</p>
                  </div>
               </div>
               <button className="h-14 px-10 bg-text-1 text-bg rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl">
                 GERAR RELATÓRIO TÁTICO
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
