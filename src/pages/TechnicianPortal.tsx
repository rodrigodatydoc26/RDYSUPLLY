import { useState, useMemo, useEffect } from 'react';
import {
  Save,
  ChevronLeft,
  CheckCircle2,
  Monitor,
  Box,
  LayoutGrid,
  Hash,
  MapPin,
  Bell,
  BellOff,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Button, Badge, CMYKBadge } from '../components/ui/Base';
import { usePushNotifications } from '../hooks/usePushNotifications';

export const TechnicianPortal = () => {
  const { user } = useAuthStore();
  const { 
    contracts, 
    equipmentModels, 
    contractEquipment, 
    addStockEntry, 
    addPaperEntry,
    fetchInitialData 
  } = useDataStore();
  
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const { subscribeUser } = usePushNotifications();
  const userConfigs = useDataStore(state => state.userConfigs);
  
  const config = userConfigs.find(c => c.user_id === user?.id);
  const hasSubscription = !!config?.push_subscription;
  
  // Local storage cache for the current session
  const [entryData, setEntryData] = useState<Record<string, { current: number; in: number; out: number }>>({});
  const [paperEntry, setPaperEntry] = useState({ current: 0, incoming: 0, outgoing: 0 });

  const assignedContracts = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'cto') return contracts;
    return contracts.filter(c => c.active);
  }, [contracts, user]);

  const selectedContract = contracts.find(c => c.id === selectedContractId);
  const contractMachines = contractEquipment.filter(ce => ce.contract_id === selectedContractId);
  const activeMachine = contractMachines.find(m => m.id === selectedMachineId);
  const activeModel = activeMachine ? equipmentModels.find(m => m.id === activeMachine.equipment_model_id) : null;

  useEffect(() => {
    if (user) fetchInitialData();
  }, [user, fetchInitialData]);

  const handleValueChange = (field: string, subfield: 'current' | 'in' | 'out', valValue: string) => {
    const val = parseInt(valValue) || 0;
    setEntryData((prev) => ({
      ...prev,
      [field]: {
        ...(prev[field] || { current: 0, in: 0, out: 0 }),
        [subfield]: val
      }
    }));
  };

  const handlePaperChange = (field: 'current' | 'incoming' | 'outgoing', valValue: string) => {
    const val = parseInt(valValue) || 0;
    setPaperEntry(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmitMachine = async () => {
    if (!selectedMachineId || !user) return;

    try {
      const entryFields = {
        contract_equipment_id: selectedMachineId,
        technician_id: user.id,
        entry_date: format(new Date(), 'yyyy-MM-dd'),
        toner_black: entryData.toner_black?.current || 0,
        toner_black_in: 0,
        toner_black_out: 0,
        toner_cyan: entryData.toner_cyan?.current || 0,
        toner_cyan_in: 0,
        toner_cyan_out: 0,
        toner_magenta: entryData.toner_magenta?.current || 0,
        toner_magenta_in: 0,
        toner_magenta_out: 0,
        toner_yellow: entryData.toner_yellow?.current || 0,
        toner_yellow_in: 0,
        toner_yellow_out: 0,
        drum_black: entryData.drum_black?.current || 0,
        drum_black_in: 0,
        drum_black_out: 0,
        drum_cyan: entryData.drum_cyan?.current || 0,
        drum_cyan_in: 0,
        drum_cyan_out: 0,
        drum_magenta: entryData.drum_magenta?.current || 0,
        drum_magenta_in: 0,
        drum_magenta_out: 0,
        drum_yellow: entryData.drum_yellow?.current || 0,
        drum_yellow_in: 0,
        drum_yellow_out: 0,
      };

      await addStockEntry(entryFields);
      toast.success('Leitura da máquina sincronizada!');
      setSelectedMachineId(null);
      setEntryData({});
    } catch {
      toast.error('Erro ao sincronizar leitura.');
    }
  };

  const handleSubmitPaper = async () => {
    if (!selectedContractId || !user) return;
    try {
      await addPaperEntry({
        contract_id: selectedContractId,
        technician_id: user.id,
        entry_date: format(new Date(), 'yyyy-MM-dd'),
        reams_current: paperEntry.current,
        reams_in: paperEntry.incoming,
        reams_out: paperEntry.outgoing,
      });
      toast.success('Estoque de papel atualizado!');
      setPaperEntry({ current: 0, incoming: 0, outgoing: 0 });
    } catch {
      toast.error('Erro ao atualizar papel.');
    }
  };

  if (!selectedContractId) {
    return (
      <div className="space-y-8 animate-fade pb-10">
        <div className="bg-surface border border-border rounded-[32px] p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              hasSubscription ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
            )}>
              {hasSubscription ? <Bell size={20} /> : <BellOff size={20} />}
            </div>
            <div>
              <p className="text-[10px] font-black text-text-1 uppercase italic tracking-tighter">
                {hasSubscription ? 'SISTEMA DE AVISOS ATIVO' : 'CADASTRO DE DISPOSITIVO'}
              </p>
              <p className="text-[8px] font-black text-text-2 uppercase tracking-[0.2em] mt-0.5">
                {hasSubscription ? 'VOCÊ RECEBERÁ ALERTAS NA BARRA DO CELULAR' : 'ATIVE PARA RECEBER OS LEMBRETES DE ESTOQUE'}
              </p>
            </div>
          </div>
          {!hasSubscription && (
            <button 
              onClick={subscribeUser}
              className="px-6 h-10 bg-primary text-secondary text-[8px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              Ativar Agora
            </button>
          )}
        </div>
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
           <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary animate-pulse" />
                 <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.3em] ">Operações de Campo</p>
              </div>
              <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
                CENTRAL <span className="text-text-2 font-light not-italic">DO TÉCNICO</span>
              </h2>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedContracts.map(contract => (
            <button
              key={contract.id}
              onClick={() => setSelectedContractId(contract.id)}
              className="group text-left p-8 bg-surface border border-border rounded-[40px] hover:border-text-1 transition-all active:scale-[0.98] shadow-sm"
            >
               <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-secondary shadow-lg shadow-primary transition-transform group-hover:-rotate-3">
                     <Box size={24} strokeWidth={2.5} />
                  </div>
                  <Badge variant="neutral">{contract.code}</Badge>
               </div>
               <h3 className="text-xl font-black text-text-1 uppercase tracking-tight italic mb-2">{contract.name}</h3>
               <p className="text-[9px] font-bold text-text-2 uppercase tracking-widest">{contract.client}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade pb-32">
       <button 
        onClick={() => { setSelectedContractId(null); setSelectedMachineId(null); }}
        className="flex items-center gap-2 text-text-2 hover:text-text-1 transition-all bg-surface px-6 py-3 rounded-2xl border border-border shadow-sm group"
      >
        <ChevronLeft size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest">Alternar Unidade Operacional</span>
      </button>

      <header className="border-b border-border pb-10">
         <div className="flex items-center gap-3 mb-4">
            <span className="text-primary font-black italic text-lg tracking-tighter">RDY</span>
            <div className="w-px h-4 bg-border" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-2 italic">Check-in Operacional v2</span>
         </div>
         <h2 className="text-4xl font-black text-text-1 uppercase italic tracking-tighter leading-none">{selectedContract?.name}</h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2 px-2">
               <Monitor size={16} className="text-primary" />
               <h4 className="text-[10px] font-black uppercase tracking-widest text-text-2">Selecione o Equipamento</h4>
            </div>
            {contractMachines.map(me => {
              const model = equipmentModels.find(m => m.id === me.equipment_model_id);
              const isSelected = selectedMachineId === me.id;
              return (
                <button
                  key={me.id}
                  onClick={() => setSelectedMachineId(me.id)}
                  className={cn(
                    "w-full p-6 text-left border rounded-[32px] transition-all relative overflow-hidden",
                    isSelected 
                      ? "bg-secondary text-white border-transparent shadow-xl" 
                      : "bg-surface border-border hover:border-primary/50 text-text-1"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                     <p className={cn("text-[9px] font-black uppercase tracking-widest", isSelected ? "text-primary" : "text-text-2")}>{model?.brand}</p>
                     {isSelected && <CheckCircle2 size={16} className="text-primary" />}
                  </div>
                  <p className="text-base font-black truncate mb-4">{model?.name}</p>
                  <div className="flex items-center justify-between text-[10px] font-bold ">
                     <span className="flex items-center gap-1"><Hash size={10} /> {me.serial_number}</span>
                     <span className="flex items-center gap-1"><MapPin size={10} /> {me.location}</span>
                  </div>
                </button>
              )
            })}

            <div className="pt-8 border-t border-border/50">
               <div className="flex items-center gap-2 mb-4 px-2">
                  <LayoutGrid size={16} className="text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-text-2">Controle de Papel (Contract Wide)</h4>
               </div>
               <div className="bg-surface border border-border p-6 rounded-[32px] space-y-6 shadow-sm">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-black uppercase tracking-tight text-text-1 italic">RESMAS A4</span>
                     <Badge variant="neutral">RESMAS</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                       <label htmlFor="paper-saldo" className="text-[8px] font-black text-text-2 uppercase block text-center cursor-pointer">Saldo</label>
                       <input id="paper-saldo" type="number" className="w-full h-10 bg-bg border border-border rounded-xl text-center text-xs font-black" value={paperEntry.current || ''} onChange={e => handlePaperChange('current', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                       <label htmlFor="paper-in" className="text-[8px] font-black text-success uppercase block text-center cursor-pointer">Entrou</label>
                       <input id="paper-in" type="number" className="w-full h-10 bg-success/5 border border-success rounded-xl text-center text-xs font-black text-success" value={paperEntry.incoming || ''} onChange={e => handlePaperChange('incoming', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                       <label htmlFor="paper-out" className="text-[8px] font-black text-danger uppercase block text-center cursor-pointer">Saída</label>
                       <input id="paper-out" type="number" className="w-full h-10 bg-danger/5 border border-danger rounded-xl text-center text-xs font-black text-danger" value={paperEntry.outgoing || ''} onChange={e => handlePaperChange('outgoing', e.target.value)} />
                    </div>
                  </div>
                  <Button size="sm" className="w-full h-10 text-[9px] rounded-xl" onClick={handleSubmitPaper}>
                    Sincronizar Papel
                  </Button>
               </div>
            </div>
         </div>

         <div className="lg:col-span-2">
            {!selectedMachineId ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[40px]">
                 <div className="w-20 h-20 rounded-full border-2 border-text-1 flex items-center justify-center mb-6">
                    <Monitor size={32} />
                 </div>
                 <p className="text-sm font-black uppercase tracking-[0.4em]">Selecione uma máquina para iniciar</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                 <div className="bg-surface border border-border p-10 rounded-[48px] shadow-2xl relative overflow-hidden">
                    <div className="relative">
                       <div className="flex items-center gap-4 mb-8">
                          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-secondary">
                             <Box size={28} />
                          </div>
                          <div>
                             <h3 className="text-2xl font-black text-text-1 uppercase italic tracking-tighter leading-none mb-2">{activeModel?.name}</h3>
                             <p className="text-[10px] font-black text-text-2 uppercase tracking-widest">S/N: {activeMachine?.serial_number} — {activeMachine?.location}</p>
                          </div>
                       </div>

                       <div className="space-y-6 mb-12 text-center">
                          <div className="flex items-center gap-3 border-b border-border pb-3">
                             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-1 italic font-bold">Leitura Atual de Insumos</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 py-8">
                             <MachineField 
                                label="Toner Black" 
                                type="K" 
                                data={entryData.toner_black} 
                                onChange={(sub, val) => handleValueChange('toner_black', sub, val)} 
                             />
                             {activeModel?.is_color && (
                               <>
                                 <MachineField label="Toner Cyan" type="C" data={entryData.toner_cyan} onChange={(sub, val) => handleValueChange('toner_cyan', sub, val)} />
                                 <MachineField label="Toner Magenta" type="M" data={entryData.toner_magenta} onChange={(sub, val) => handleValueChange('toner_magenta', sub, val)} />
                                 <MachineField label="Toner Yellow" type="Y" data={entryData.toner_yellow} onChange={(sub, val) => handleValueChange('toner_yellow', sub, val)} />
                               </>
                             )}
                             {activeModel?.has_drum && (
                               <>
                                 <MachineField label="Cilindro Black" type="K" data={entryData.drum_black} onChange={(sub, val) => handleValueChange('drum_black', sub, val)} />
                                 {activeModel.is_color && (
                                   <>
                                     <MachineField label="Cilindro Cyan" type="C" data={entryData.drum_cyan} onChange={(sub, val) => handleValueChange('drum_cyan', sub, val)} />
                                     <MachineField label="Cilindro Magenta" type="M" data={entryData.drum_magenta} onChange={(sub, val) => handleValueChange('drum_magenta', sub, val)} />
                                     <MachineField label="Cilindro Yellow" type="Y" data={entryData.drum_yellow} onChange={(sub, val) => handleValueChange('drum_yellow', sub, val)} />
                                   </>
                                 )}
                               </>
                             )}
                          </div>
                       </div>

                       <div className="mt-8 pt-12 border-t border-border flex justify-end">
                          <Button 
                            className="h-20 px-16 rounded-3xl text-[12px] font-black uppercase tracking-[0.3em] gap-3 shadow-2xl shadow-primary"
                            onClick={handleSubmitMachine}
                          >
                             <Save size={20} strokeWidth={3} />
                             Confirmar Saldo Atual
                          </Button>
                       </div>
                    </div>
                 </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

const MachineField = ({ label, type, data, onChange }: {
  label: string;
  type: 'C' | 'M' | 'Y' | 'K';
  data?: { current?: number; in?: number; out?: number };
  onChange: (sub: 'current' | 'in' | 'out', val: string) => void;
}) => {
  const baseId = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-4 flex flex-col items-center">
       <div className="flex items-center gap-3">
          <CMYKBadge type={type} />
          <label className="text-[11px] font-black text-text-1 uppercase tracking-widest">{label}</label>
       </div>
       <div className="w-full max-w-[120px] space-y-2">
          <label htmlFor={`${baseId}-saldo`} className="text-[10px] font-black text-text-2 uppercase tracking-widest block text-center cursor-pointer">Saldo Físico</label>
          <input 
            id={`${baseId}-saldo`}
            type="number" 
            className="w-full h-16 bg-bg border-4 border-border rounded-[24px] text-center text-2xl font-black text-text-1 focus:border-primary focus:ring-0 outline-none transition-all shadow-inner" 
            placeholder="0"
            value={data?.current || ''}
            onChange={e => onChange('current', e.target.value)}
          />
       </div>
    </div>
  );
};
