import { useState, useMemo } from 'react';
import {
  Save,
  ChevronLeft,
  CheckCircle2,
  Droplets,
  Layers,
  Activity,
  ArrowUpRight,
  Box
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const TechnicianPortal = () => {
  const { user } = useAuthStore();
  const { contracts, supplyTypes, contractSupplies, stockEntries, addStockEntry } = useDataStore();
  
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [entryData, setEntryData] = useState<Record<string, { current_stock: number; incoming: number; outgoing: number }>>({});

  const offlineKey = (contractId: string) => `rdy-offline-${contractId}`;

  // Filter contracts assigned to this technician
  const assignedContracts = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'cto') return contracts || [];
    return (contracts || []).filter(c => c.technicianIds?.includes(user.id));
  }, [contracts, user]);

  const selectedContract = useMemo(() => 
    (contracts || []).find(c => c.id === selectedContractId), 
  [selectedContractId, contracts]);

  const contractSuppliesLinked = useMemo(() => {
    if (!selectedContractId) return [];
    const links = (contractSupplies || []).filter(cs => cs.contract_id === selectedContractId);
    return links.map(link => {
      const type = (supplyTypes || []).find(st => st.id === link.supply_type_id);
      return { ...link, type };
    });
  }, [selectedContractId, contractSupplies, supplyTypes]);

  const today = format(new Date(), 'yyyy-MM-dd');
  
  const isAlreadySubmitted = (supplyId: string) => {
    return stockEntries.some(e => 
      e.contract_id === selectedContractId && 
      e.supply_type_id === supplyId && 
      e.entry_date === today
    );
  };

  const handleInputChange = (supplyId: string, field: 'current_stock' | 'incoming' | 'outgoing', value: string) => {
    const num = parseInt(value) || 0;
    const newData = {
      ...entryData,
      [supplyId]: {
        ...(entryData[supplyId] || { current_stock: 0, incoming: 0, outgoing: 0 }),
        [field]: num
      }
    };
    setEntryData(newData);
    localStorage.setItem(offlineKey(selectedContractId!), JSON.stringify(newData));
  };

  const handleSubmit = async () => {
    if (!selectedContractId) return;
    
    const entriesToSync = Object.entries(entryData).filter(([_, data]) => 
      data.current_stock > 0 || data.incoming > 0 || data.outgoing > 0
    );

    if (entriesToSync.length === 0) {
      toast.error('Informe ao menos um valor de estoque.');
      return;
    }

    try {
      for (const [supplyId, data] of entriesToSync) {
        addStockEntry({
          contract_id: selectedContractId,
          supply_type_id: supplyId,
          technician_id: user?.id || '',
          current_stock: data.current_stock,
          entries_in: data.incoming,
          entries_out: data.outgoing,
          entry_date: today
        });
      }
      
      toast.success('Sincronização finalizada com sucesso!');
      localStorage.removeItem(offlineKey(selectedContractId));
      setEntryData({});
      setSelectedContractId(null);
    } catch (err) {
      toast.error('Erro ao sincronizar.');
    }
  };

  if (!selectedContractId) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--rdy-primary-rgb),0.6)]" />
              <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.3em] leading-none opacity-40">Operações de Campo / Sincronização</p>
            </div>
            <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
              PORTAL <span className="text-text-2 font-light not-italic">DO TÉCNICO</span>
            </h2>
            <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.2em] mt-2 opacity-20">Unidades Vinculadas ao seu Contexto</p>
          </div>
          <div className="hidden md:flex bg-surface p-1.5 rounded-xl border border-border">
             <div className="px-5 py-2 flex items-center gap-3">
                <Activity size={12} className="text-primary/60" />
                <p className="text-[9px] font-black text-text-1 uppercase tracking-widest">Aguardando Sincro</p>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignedContracts.length > 0 ? (
            assignedContracts.map(contract => {
              const entriesCount = stockEntries.filter(e => e.contract_id === contract.id && e.entry_date === format(new Date(), 'yyyy-MM-dd')).length;
              const isUpdated = entriesCount > 0;

              return (
                <button
                  key={contract.id}
                  onClick={() => setSelectedContractId(contract.id)}
                  className="group bg-surface border border-border p-8 rounded-[32px] w-full text-left hover:border-text-1 hover:shadow-2xl transition-all relative overflow-hidden active:scale-95"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isUpdated ? 'bg-success/10 text-success' : 'bg-primary text-black shadow-lg shadow-primary/20'}`}>
                      {isUpdated ? <CheckCircle2 size={24} /> : <Box size={24} />}
                    </div>
                    {isUpdated && (
                      <div className="px-3 py-1 bg-success/10 text-success rounded-full text-[8px] font-black uppercase tracking-widest border border-success/20 animate-in fade-in duration-500">
                        SINCRONIZADO
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-text-1 uppercase italic tracking-tighter leading-none group-hover:translate-x-1 transition-transform">{contract.name}</h3>
                    <div className="flex items-center gap-3 mt-3 text-[9px] font-black text-text-2/40 uppercase tracking-widest">
                       <span>{contract.code}</span>
                       <div className="w-1 h-1 rounded-full bg-border" />
                       <span className="truncate max-w-[150px]">{contract.client}</span>
                    </div>
                  </div>

                  <ArrowUpRight size={18} className="absolute top-8 right-8 text-text-2/20 group-hover:text-text-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" strokeWidth={3} />
                </button>
              );
            })
          ) : (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-border rounded-[40px] opacity-10">
              <p className="text-[12px] font-black text-text-2 uppercase tracking-[0.8em]">Nenhuma unidade vinculada ao seu ID</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
      <button 
        onClick={() => setSelectedContractId(null)}
        className="flex items-center gap-2 text-text-2 hover:text-text-1 transition-all group px-5 h-11 bg-surface rounded-2xl border border-border w-fit hover:shadow-xl hover:shadow-primary/5"
      >
        <ChevronLeft size={16} strokeWidth={3} />
        <span className="text-[10px] font-black uppercase tracking-widest">TROCAR UNIDADE DE OPERAÇÃO</span>
      </button>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-border pb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-3">
             <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_rgba(var(--rdy-primary-rgb),0.6)] animate-pulse" />
             <span className="text-[11px] font-black uppercase tracking-[0.3em] text-text-2/40 italic">SINCRONIZAÇÃO TÁTICA DE ATIVOS</span>
          </div>
          <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            {selectedContract?.name}
          </h2>
          <div className="flex items-center gap-3 mt-6">
             <p className="px-3 py-1.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl border border-primary/20">{selectedContract?.code}</p>
             <p className="px-3 py-1.5 bg-surface text-text-2/60 text-[9px] font-black uppercase tracking-widest rounded-xl border border-border">{selectedContract?.client}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-text-2/20 uppercase tracking-[0.3em] leading-none mb-3">CICLO OPERACIONAL</p>
          <p className="text-2xl font-black text-text-1 italic leading-none tracking-tighter">{format(new Date(), 'dd.MM.yyyy')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contractSuppliesLinked.map(link => {
          const supply = link.type;
          const data = entryData[link.supply_type_id] || { current_stock: 0, incoming: 0, outgoing: 0 };
          const submitted = isAlreadySubmitted(link.supply_type_id);

          return (
            <div key={link.supply_type_id} className={`bg-surface border p-8 rounded-[40px] space-y-6 shadow-sm transition-all hover:shadow-xl hover:shadow-primary/5 ${submitted ? 'border-success/30' : 'border-border'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${supply?.category === 'Toner' ? 'bg-primary text-black border-black/5' : 'bg-bg text-text-2/40 border-border'}`}>
                    {supply?.category === 'Toner' ? <Droplets size={24} strokeWidth={2.5} /> : supply?.category === 'Papel' ? <Layers size={24} strokeWidth={2.5} /> : <Activity size={24} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-text-1 uppercase tracking-tight leading-none">{supply?.name}</h3>
                    <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.2em] mt-2 italic opacity-30">OBJETIVO: {link.min_stock} {supply?.unit}</p>
                  </div>
                </div>
                {submitted && (
                  <div className="px-4 py-1.5 bg-success shadow-lg shadow-success/20 text-white rounded-xl text-[8px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <CheckCircle2 size={12} strokeWidth={3} /> SINCRONIZADO
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-text-2/40 uppercase tracking-widest ml-1">ESTOQUE</label>
                  <input
                    type="number"
                    className="w-full h-14 bg-bg border border-border rounded-2xl text-center text-lg font-black italic text-text-1 outline-none focus:bg-surface focus:border-text-1 transition-all"
                    value={data.current_stock || ''}
                    onChange={(e) => handleInputChange(link.supply_type_id, 'current_stock', e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-success uppercase tracking-widest ml-1 opacity-50">REPOS</label>
                  <input
                    type="number"
                    className="w-full h-14 bg-success/5 border border-success/10 rounded-2xl text-center text-lg font-black italic text-success outline-none focus:bg-surface focus:border-success transition-all"
                    value={data.incoming || ''}
                    onChange={(e) => handleInputChange(link.supply_type_id, 'incoming', e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-danger uppercase tracking-widest ml-1 opacity-50">CONSUMO</label>
                  <input
                    type="number"
                    className="w-full h-14 bg-danger/5 border border-danger/10 rounded-2xl text-center text-lg font-black italic text-danger outline-none focus:bg-surface focus:border-danger transition-all"
                    value={data.outgoing || ''}
                    onChange={(e) => handleInputChange(link.supply_type_id, 'outgoing', e.target.value)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-10 left-0 right-0 z-[100] px-10">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={handleSubmit}
            className="w-full h-16 bg-text-1 text-bg rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-primary hover:text-black hover:scale-[1.02] transition-all flex items-center justify-center gap-4 active:scale-95"
          >
            <Save size={20} strokeWidth={3} />
            <span>CONFIRMAR SINCRONIZAÇÃO TÁTICA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
