import { useState, useMemo } from 'react';
import {
  Building2,
  ChevronRight,
  Save,
  ChevronLeft,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  Droplets,
  Layers,
  Activity
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      <div className="max-w-md mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="space-y-1 text-center border-b border-border pb-4">
          <div className="flex flex-col items-center gap-1.5">
             <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-black">
               <UserCheck size={16} />
             </div>
             <p className="text-[7px] font-black text-text-2 uppercase tracking-widest leading-none">Núcleo de Serviço de Campo</p>
          </div>
          <h2 className="text-xl font-black text-text-1 italic tracking-tighter uppercase leading-none mt-1">OPERAÇÃO <span className="text-primary italic">DE CAMPO</span></h2>
          <p className="text-text-2 font-black text-[7px] uppercase tracking-widest mt-2 opacity-40">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
        </header>

        <div className="space-y-2">
          {assignedContracts.length > 0 ? (
            assignedContracts.map(contract => (
              <button
                key={contract.id}
                onClick={() => setSelectedContractId(contract.id)}
                className="card-xp w-full p-3 text-left group hover:bg-white/5 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center text-text-2/40 group-hover:border-primary transition-colors">
                      <Building2 size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-text-1 uppercase tracking-tight leading-none">{contract.name}</p>
                      <p className="text-[7px] font-black text-text-2 uppercase tracking-widest mt-1 opacity-40">{contract.client}</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-text-2/20 group-hover:text-primary transition-all" />
                </div>
                
                <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between">
                  <span className="text-[7px] font-black text-text-2 uppercase tracking-widest">Tipo: {contractSupplies.filter(cs => cs.contract_id === contract.id).length} Itens</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1 h-1 rounded-full ${stockEntries.filter(e => e.contract_id === contract.id && e.entry_date === today).length > 0 ? 'bg-success' : 'bg-danger animate-pulse'}`} />
                    <span className="text-[7px] font-black text-text-2 uppercase tracking-widest">
                      {stockEntries.filter(e => e.contract_id === contract.id && e.entry_date === today).length > 0 ? 'Sincronizado' : 'Ação Necessária'}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-20 text-center card-xp border-dashed">
              <AlertCircle size={48} className="mx-auto text-text-2/10 mb-6" />
              <p className="text-text-2 font-black uppercase tracking-[0.5em] text-[10px]">Territórios Não Mapeados</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
      <button 
        onClick={() => setSelectedContractId(null)}
        className="flex items-center gap-1.5 text-text-2 hover:text-text-1 transition-all group px-2 h-7 bg-surface/50 rounded border border-border w-fit"
      >
        <ChevronLeft size={10} />
        <span className="text-[7px] font-black uppercase tracking-widest">Trocar Unidade</span>
      </button>

      <header className="flex flex-col sm:flex-row items-end justify-between gap-4 border-b border-border/50 pb-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-primary">
             <div className="w-1.5 h-1.5 rounded-full bg-primary" />
             <span className="text-[7px] font-black uppercase tracking-widest">Sincronização de Unidade</span>
          </div>
          <h2 className="text-xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            {selectedContract?.name}
          </h2>
          <div className="flex items-center gap-1.5">
             <p className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded border border-primary/10">{selectedContract?.code}</p>
             <p className="px-1.5 py-0.5 bg-surface/50 text-text-2 text-[7px] font-black uppercase tracking-widest rounded border border-border max-w-[120px] truncate">{selectedContract?.client}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[7px] font-black text-text-2 uppercase tracking-widest leading-none">Data do Contexto</p>
          <p className="text-sm font-black text-text-1 italic leading-none mt-1">{format(new Date(), 'dd.MM.yyyy')}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-2">
        {contractSuppliesLinked.map(link => {
          const supply = link.type;
          const data = entryData[link.supply_type_id] || { current_stock: 0, incoming: 0, outgoing: 0 };
          const submitted = isAlreadySubmitted(link.supply_type_id);

          return (
            <div key={link.supply_type_id} className={`card-xp p-3 space-y-3 border-l-2 transition-all ${submitted ? 'border-l-success' : 'border-l-transparent'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded flex items-center justify-center border ${supply?.category === 'Toner' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white/5 text-text-2/40 border-white/5'}`}>
                    {supply?.category === 'Toner' ? <Droplets size={14} /> : supply?.category === 'Papel' ? <Layers size={14} /> : <Activity size={14} />}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-text-1 uppercase tracking-tight leading-none">{supply?.name}</h3>
                    <p className="text-[7px] font-black text-text-2/40 uppercase tracking-widest mt-1">LIM: {link.min_stock} {supply?.unit}</p>
                  </div>
                </div>
                {submitted && (
                  <div className="px-1.5 py-0.5 bg-success/10 text-success border border-success/20 rounded text-[6px] font-black uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={8} /> SINCRONIZADO
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="space-y-1">
                  <label className="text-[7px] font-black text-text-2 uppercase tracking-widest ml-1">ESTOQUE</label>
                  <input
                    type="number"
                    className="rdy-input h-7 text-center text-[10px] bg-white/5 border-white/5"
                    value={data.current_stock || ''}
                    onChange={(e) => handleInputChange(link.supply_type_id, 'current_stock', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-black text-success uppercase tracking-widest ml-1">REPOS</label>
                  <input
                    type="number"
                    className="rdy-input h-7 text-center text-[10px] border-success/20 bg-success/5"
                    value={data.incoming || ''}
                    onChange={(e) => handleInputChange(link.supply_type_id, 'incoming', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[7px] font-black text-danger uppercase tracking-widest ml-1">USO</label>
                  <input
                    type="number"
                    className="rdy-input h-7 text-center text-[10px] border-danger/20 bg-danger/5"
                    value={data.outgoing || ''}
                    onChange={(e) => handleInputChange(link.supply_type_id, 'outgoing', e.target.value)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 sticky bottom-4 z-10 max-w-md mx-auto w-full px-4">
        <button 
          onClick={handleSubmit}
          className="rdy-btn-primary w-full h-10 rounded text-[10px] font-black shadow-glow group"
        >
          <Save size={14} />
          <span>Confirmar Sincronização</span>
        </button>
      </div>
    </div>
  );
};


