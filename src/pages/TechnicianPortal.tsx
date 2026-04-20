import { useState, useMemo, memo, useCallback } from 'react';
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
  Camera,
  X,
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
  } = useDataStore();
  
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const { subscribeUser } = usePushNotifications();
  const userConfigs = useDataStore(state => state.userConfigs);
  
  const config = userConfigs.find(c => c.user_id === user?.id);
  const hasSubscription = !!config?.push_subscription;
  
  const [entryData, setEntryData] = useState<Record<string, { current: number; in: number; out: number }>>({});
  const [paperEntry, setPaperEntry] = useState({ current: 0, incoming: 0, outgoing: 0 });
  const [photoData, setPhotoData] = useState<string | null>(null);

  const modelMap = useMemo(() => new Map(equipmentModels.map(m => [m.id, m])), [equipmentModels]);

  const assignedContracts = useMemo(() => {
    if (!user) return [];
    // Admins e CTOs continuam com visão total
    if (user.role === 'admin' || user.role === 'cto') return contracts;
    
    // Técnicos vêem apenas contratos ativos ONDE o ID deles está vinculado
    return contracts.filter(c => c.active && c.technicianIds?.includes(user.id));
  }, [contracts, user]);

  const selectedContract = useMemo(
    () => assignedContracts.find(c => c.id === selectedContractId),
    [assignedContracts, selectedContractId]
  );
  const contractMachines = useMemo(
    () => contractEquipment.filter(ce => ce.contract_id === selectedContractId),
    [contractEquipment, selectedContractId]
  );
  const activeMachine = useMemo(
    () => contractMachines.find(m => m.id === selectedMachineId),
    [contractMachines, selectedMachineId]
  );
  const activeModel = useMemo(
    () => activeMachine ? (modelMap.get(activeMachine.equipment_model_id) ?? null) : null,
    [activeMachine, modelMap]
  );

  const handleValueChange = useCallback((field: string, subfield: 'current' | 'in' | 'out', valValue: string) => {
    const val = parseInt(valValue) || 0;
    setEntryData(prev => ({
      ...prev,
      [field]: { ...(prev[field] ?? { current: 0, in: 0, out: 0 }), [subfield]: val },
    }));
  }, []);

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

      await addStockEntry({ ...entryFields, photo_data: photoData ?? undefined });
      toast.success('Leitura sincronizada!');
      setSelectedMachineId(null);
      setEntryData({});
      setPhotoData(null);
    } catch (err: any) {
      console.error('Erro de Sincronização:', err);
      toast.error(err.message || 'Erro na sincronização.');
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
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar papel.');
    }
  };

  if (!selectedContractId) {
    return (
      <div className="space-y-10 animate-fade pb-10 px-4">
        {/* Device Registration Banner */}
        <div className="bg-surface border border-border rounded-[35px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-6">
            <div className={cn(
              "w-16 h-16 rounded-[24px] flex items-center justify-center transition-all",
              hasSubscription ? "bg-success/10 text-success border border-success/10" : "bg-primary/10 text-primary border border-primary/10"
            )}>
              {hasSubscription ? <Bell size={28} /> : <BellOff size={28} />}
            </div>
            <div>
              <p className="text-[11px] font-black text-text-1 uppercase italic tracking-tighter leading-none mb-2">
                {hasSubscription ? 'SISTEMA DE AVISOS ATIVO' : 'CADASTRO DE DISPOSITIVO'}
              </p>
              <p className="text-[10px] font-black text-text-1 opacity-20 uppercase tracking-widest mt-0.5 max-w-[400px]">
                {hasSubscription ? 'RECEBENDO ALERTAS OPERACIONAIS EM TEMPO REAL' : 'ATIVE AS NOTIFICAÇÕES PARA RECEBER LEMBRETES TÁTICOS'}
              </p>
            </div>
          </div>
          {!hasSubscription && (
            <Button 
              onClick={subscribeUser}
              className="px-10 h-14 rdy-btn-elite text-[10px]"
            >
              Ativar Agora
            </Button>
          )}
        </div>

        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4 px-2">
           <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary animate-pulse" />
                 <p className="text-[11px] font-black text-text-1 uppercase tracking-[0.4em] leading-none">Operações de Campo</p>
              </div>
              <h2 className="text-5xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
                CENTRAL <span className="font-light not-italic text-text-1 opacity-20">DO TÉCNICO</span>
              </h2>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
          {assignedContracts.map(contract => (
            <button
              key={contract.id}
              onClick={() => setSelectedContractId(contract.id)}
              className="group text-left p-10 bg-surface border border-border rounded-[45px] hover:border-black transition-all active:scale-[0.98] shadow-sm hover:shadow-2xl hover:shadow-black/5"
            >
               <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 rounded-[22px] bg-black/5 flex items-center justify-center text-text-1 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                     <Box size={28} />
                  </div>
                  <Badge variant="primary" className="bg-black text-white border-none rounded-lg text-[9px] px-3 py-1 font-black">
                    {contract.code}
                  </Badge>
               </div>
               <h3 className="text-3xl font-black text-text-1 uppercase tracking-tighter italic mb-2 leading-none">{contract.name}</h3>
               <p className="text-[11px] font-black text-text-1 opacity-20 uppercase tracking-widest">{contract.client}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade pb-32 px-4">
       <button 
        onClick={() => { setSelectedContractId(null); setSelectedMachineId(null); }}
        className="flex items-center gap-3 text-text-1 hover:text-white hover:bg-black transition-all bg-surface px-8 py-4 rounded-[24px] border border-border shadow-sm group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[11px] font-black uppercase tracking-widest">Alternar Unidade Operacional</span>
      </button>

      <header className="px-2">
         <div className="flex items-center gap-4 mb-3">
            <span className="text-primary font-black italic text-2xl tracking-tighter">RDY</span>
            <div className="w-px h-6 bg-border/40" />
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-text-1 opacity-20 italic">Check-in Operacional v2</span>
         </div>
         <h2 className="text-5xl font-black text-text-1 uppercase italic tracking-tighter leading-none">{selectedContract?.name}</h2>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
         <div className="xl:col-span-1 space-y-6">
            <div className="flex items-center gap-3 px-4">
               <Monitor size={20} className="text-text-1 opacity-20" />
               <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-1 opacity-40">Ativos Vinculados</h4>
            </div>
            
            <div className="space-y-4">
                {contractMachines.map(me => {
                  const model = modelMap.get(me.equipment_model_id);
                  const isSelected = selectedMachineId === me.id;
                  
                  const stockEntries = useDataStore.getState().equipmentStockEntries;
                  const lastSync = stockEntries.find(e => e.contract_equipment_id === me.id);
                  const isSyncedToday = lastSync && lastSync.entry_date === format(new Date(), 'yyyy-MM-dd');
                  
                  return (
                    <button
                      key={me.id}
                      onClick={() => setSelectedMachineId(me.id)}
                      className={cn(
                        "w-full p-8 text-left border rounded-[35px] transition-all relative overflow-hidden group/btn",
                        isSelected 
                          ? "bg-black text-white border-transparent shadow-2xl shadow-black/30" 
                          : "bg-surface border-border hover:border-black text-text-1"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4">
                         <div className="flex flex-col gap-2">
                            <p className={cn("text-[10px] font-black uppercase tracking-widest", isSelected ? "text-primary" : "opacity-30")}>{model?.brand}</p>
                            {isSyncedToday && (
                               <span className="text-[9px] font-black bg-success text-white px-3 py-1 rounded-full uppercase tracking-widest animate-pulse border border-success/30 shadow-lg shadow-success/20">SINCRONIZADO HOJE</span>
                            )}
                         </div>
                         {isSelected && <CheckCircle2 size={24} className="text-primary drop-shadow-[0_0_8px_rgba(255,214,0,0.4)]" />}
                         {!isSelected && isSyncedToday && <CheckCircle2 size={20} className="text-success" />}
                      </div>
                      <p className="text-2xl font-black truncate mb-5 uppercase italic tracking-tight leading-none">{model?.name}</p>
                      <div className="flex items-end justify-between">
                         <div className="flex flex-col gap-1 text-[11px] font-black opacity-40">
                            <span className="flex items-center gap-2"><Hash size={14} /> {me.serial_number}</span>
                            <span className="flex items-center gap-2"><MapPin size={14} /> {me.location}</span>
                         </div>
                         {lastSync && (
                            <div className="flex flex-col items-end gap-1">
                               <span className="text-[8px] font-black opacity-30 uppercase tracking-[0.2em] mb-1">
                                 {format(new Date(lastSync.created_at), 'dd/MM HH:mm')}
                               </span>
                               <div className="flex flex-wrap gap-2 justify-end max-w-[180px]">
                                  {/* Toners */}
                                  {lastSync.toner_black !== undefined && lastSync.toner_black >= 0 && <div className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded-md border border-white/10" title="Toner Black"><div className="w-1.5 h-1.5 rounded-full bg-black shadow-[0_0_4px_black]" /><span className="text-[10px] font-black">{lastSync.toner_black}</span></div>}
                                  {lastSync.toner_cyan !== undefined && lastSync.toner_cyan > 0 && <div className="flex items-center gap-1 bg-[#00ADEF]/10 px-2 py-1 rounded-md border border-[#00ADEF]/20" title="Toner Cyan"><div className="w-1.5 h-1.5 rounded-full bg-[#00ADEF] shadow-[0_0_5px_#00ADEF]" /><span className="text-[10px] font-black">{lastSync.toner_cyan}</span></div>}
                                  {lastSync.toner_magenta !== undefined && lastSync.toner_magenta > 0 && <div className="flex items-center gap-1 bg-[#E10098]/10 px-2 py-1 rounded-md border border-[#E10098]/20" title="Toner Magenta"><div className="w-1.5 h-1.5 rounded-full bg-[#E10098] shadow-[0_0_6px_#E10098]" /><span className="text-[10px] font-black">{lastSync.toner_magenta}</span></div>}
                                  {lastSync.toner_yellow !== undefined && lastSync.toner_yellow > 0 && <div className="flex items-center gap-1 bg-[#FFD600]/10 px-2 py-1 rounded-md border border-[#FFD600]/20" title="Toner Yellow"><div className="w-1.5 h-1.5 rounded-full bg-[#FFD600] shadow-[0_0_5px_#FFD600]" /><span className="text-[10px] font-black">{lastSync.toner_yellow}</span></div>}
                                  
                                  {/* Drums */}
                                  {lastSync.drum_black !== undefined && lastSync.drum_black > 0 && <div className="flex items-center gap-1 bg-black/5 px-2 py-1 rounded-md border border-white/20 border-dashed" title="Cilindro Black"><div className="w-1.5 h-1.5 rounded-full bg-black ring-1 ring-white/50" /><span className="text-[10px] font-black">{lastSync.drum_black}</span></div>}
                                  {lastSync.drum_cyan !== undefined && lastSync.drum_cyan > 0 && <div className="flex items-center gap-1 bg-[#00ADEF]/5 px-2 py-1 rounded-md border border-[#00ADEF]/20 border-dashed" title="Cilindro Cyan"><div className="w-1.5 h-1.5 rounded-full bg-[#00ADEF] ring-1 ring-white/50 shadow-[0_0_2px_#00ADEF]" /><span className="text-[10px] font-black">{lastSync.drum_cyan}</span></div>}
                                  {lastSync.drum_magenta !== undefined && lastSync.drum_magenta > 0 && <div className="flex items-center gap-1 bg-[#E10098]/5 px-2 py-1 rounded-md border border-[#E10098]/20 border-dashed" title="Cilindro Magenta"><div className="w-1.5 h-1.5 rounded-full bg-[#E10098] ring-1 ring-white/50 shadow-[0_0_2px_#E10098]" /><span className="text-[10px] font-black">{lastSync.drum_magenta}</span></div>}
                                  {lastSync.drum_yellow !== undefined && lastSync.drum_yellow > 0 && <div className="flex items-center gap-1 bg-[#FFD600]/5 px-2 py-1 rounded-md border border-[#FFD600]/20 border-dashed" title="Cilindro Yellow"><div className="w-1.5 h-1.5 rounded-full bg-[#FFD600] ring-1 ring-white/50 shadow-[0_0_2px_#FFD600]" /><span className="text-[10px] font-black">{lastSync.drum_yellow}</span></div>}
                               </div>
                            </div>
                         )}
                      </div>
                    </button>
                  )
                })}
            </div>

            <div className="pt-10 border-t border-border/10">
               <div className="flex items-center gap-3 mb-6 px-4">
                  <LayoutGrid size={20} className="text-text-1 opacity-20" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-text-1 opacity-40">Fluxo de Papelaria</h4>
               </div>
               <div className="bg-surface border border-border p-8 rounded-[40px] space-y-8 shadow-sm">
                  <div className="flex items-center justify-between">
                     <span className="text-sm font-black uppercase tracking-tighter text-text-1 italic">RESMAS A4 REPROGRAF</span>
                     <Badge variant="primary" className="bg-black text-white border-none rounded-lg text-[8px] font-black">STOCK</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-text-1 uppercase tracking-widest opacity-20 ml-2">Saldo em Depósito</label>
                       <input type="number" className="w-full h-16 bg-bg/50 border border-border rounded-2xl text-center text-xl font-black text-text-1" value={paperEntry.current || ''} onChange={e => handlePaperChange('current', e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  <Button className="w-full h-16 rdy-btn-elite text-[11px]" onClick={handleSubmitPaper}>
                    Sincronizar Papel
                  </Button>
               </div>
            </div>
         </div>

         <div className="xl:col-span-2">
            {!selectedMachineId ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[50px] bg-black/[0.01]">
                 <div className="w-24 h-24 rounded-full border border-border flex items-center justify-center mb-8 bg-white shadow-sm">
                    <Monitor size={40} className="text-text-1 opacity-10" />
                 </div>
                 <p className="text-[12px] font-black uppercase tracking-[0.6em] text-text-1 opacity-20">Selecione o Ativo no Painel Lateral</p>
              </div>
            ) : (
              <div className="space-y-10 animate-fade">
                 <div className="bg-surface border border-border p-12 rounded-[50px] shadow-2xl shadow-black/5 relative overflow-hidden">
                    <div className="relative">
                       <div className="flex items-center gap-6 mb-12">
                          <div className="w-20 h-20 rounded-[28px] bg-black text-white flex items-center justify-center shadow-2xl shadow-black/20">
                             <Box size={36} />
                          </div>
                          <div>
                             <h3 className="text-4xl font-black text-text-1 uppercase italic tracking-tighter leading-none mb-3">{activeModel?.name}</h3>
                             <p className="text-[12px] font-black text-text-1 uppercase tracking-widest opacity-20 flex items-center gap-3">
                                <span className="text-primary">S/N: {activeMachine?.serial_number}</span>
                                <span className="opacity-40">|</span>
                                <span>{activeMachine?.location}</span>
                             </p>
                          </div>
                       </div>

                       <div className="space-y-10">
                          <div className="flex items-center gap-4 border-b border-border/10 pb-4">
                             <span className="text-[12px] font-black uppercase tracking-[0.4em] text-text-1 italic">AUDITORIA DE CONSUMÍVEIS</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                             <MachineField label="Toner Black" type="K" field="toner_black" data={entryData.toner_black} onChange={handleValueChange} />
                             {activeModel?.is_color && (
                               <>
                                 <MachineField label="Toner Cyan" type="C" field="toner_cyan" data={entryData.toner_cyan} onChange={handleValueChange} />
                                 <MachineField label="Toner Magenta" type="M" field="toner_magenta" data={entryData.toner_magenta} onChange={handleValueChange} />
                                 <MachineField label="Toner Yellow" type="Y" field="toner_yellow" data={entryData.toner_yellow} onChange={handleValueChange} />
                               </>
                             )}
                             {activeModel?.has_drum && (
                               <>
                                 <MachineField label="Cilindro Black" type="K" field="drum_black" data={entryData.drum_black} onChange={handleValueChange} />
                                 {activeModel.is_color && (
                                   <>
                                     <MachineField label="Cilindro Cyan" type="C" field="drum_cyan" data={entryData.drum_cyan} onChange={handleValueChange} />
                                     <MachineField label="Cilindro Magenta" type="M" field="drum_magenta" data={entryData.drum_magenta} onChange={handleValueChange} />
                                     <MachineField label="Cilindro Yellow" type="Y" field="drum_yellow" data={entryData.drum_yellow} onChange={handleValueChange} />
                                   </>
                                 )}
                               </>
                             )}
                          </div>
                       </div>

                        <div className="mt-10 pt-8 border-t border-border/10">
                           <div className="flex items-center gap-3 mb-5">
                             <Camera size={18} className="text-primary" />
                             <span className="text-[11px] font-black uppercase tracking-[0.3em] text-text-1 opacity-40 italic">Evidência Fotográfica</span>
                           </div>
                           {photoData ? (
                             <div className="relative rounded-[24px] overflow-hidden border border-border shadow-md max-h-56">
                               <img src={photoData} alt="Evidência" className="w-full object-cover max-h-56" />
                               <button
                                 onClick={() => setPhotoData(null)}
                                 className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-danger transition-all"
                                 title="Remover Foto"
                               >
                                 <X size={16} />
                               </button>
                             </div>
                           ) : (
                             <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-[24px] p-8 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                               <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                                 <Camera size={26} className="text-primary" />
                               </div>
                               <span className="text-[10px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-100 transition-all">Tirar Foto ou Selecionar Arquivo</span>
                               <input
                                 type="file"
                                 accept="image/*"
                                 
                                 className="hidden"
                                 onChange={(e) => {
                                   const file = e.target.files?.[0];
                                   if (!file) return;
                                   const reader = new FileReader();
                                   reader.onload = () => setPhotoData(reader.result as string);
                                   reader.readAsDataURL(file);
                                 }}
                               />
                             </label>
                           )}
                        </div>

                        <div className="mt-16 pt-12 border-t border-border/10 flex justify-end">
                           <Button 
                            className="h-24 px-20 rdy-btn-elite text-[13px] tracking-[0.4em] gap-5"
                            onClick={handleSubmitMachine}
                          >
                             <Save size={24} strokeWidth={3} />
                             SALVAR LEITURA
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

const MachineField = memo(({ label, type, field, data, onChange }: {
  label: string;
  type: 'C' | 'M' | 'Y' | 'K';
  field: string;
  data?: { current?: number; in?: number; out?: number };
  onChange: (field: string, sub: 'current' | 'in' | 'out', val: string) => void;
}) => {
  const baseId = label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="space-y-6 flex flex-col items-center">
       <div className="flex items-center gap-4">
          <CMYKBadge type={type} className="scale-125" />
          <label className="text-[12px] font-black text-text-1 uppercase tracking-widest leading-none">{label}</label>
       </div>
       <div className="w-full max-w-[160px] space-y-3">
          <label htmlFor={`${baseId}-saldo`} className="text-[10px] font-black text-text-1 uppercase tracking-widest block text-center opacity-20 cursor-pointer">Saldo Real (Físico)</label>
          <input
            id={`${baseId}-saldo`}
            type="number"
            className="w-full h-20 bg-bg/50 border border-border rounded-[28px] text-center text-3xl font-black text-text-1 outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all shadow-sm"
            placeholder="0"
            value={data?.current || ''}
            onChange={e => onChange(field, 'current', e.target.value)}
          />
       </div>
    </div>
  );
});
