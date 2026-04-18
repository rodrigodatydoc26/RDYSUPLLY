import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Monitor,
  AlertTriangle,
  X,
  Search,
  Box,
  FileSpreadsheet,
  AlertOctagon,
  ChevronRight,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { cn } from '../lib/utils';
import { Button, Card, Badge, CMYKBadge } from '../components/ui/Base';
import { ImportModal } from '../components/features/ImportModal';

export const Inventory = () => {
  const { user } = useAuthStore();
  const { 
    contracts, 
    equipmentModels, 
    contractEquipment, 
    equipmentMinStock, 
    equipmentStockEntries,
    paperStockEntries,
    fetchInitialData,
    importEquipment 
  } = useDataStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Logic to identify critical components for a machine
  const getCriticalComponents = useCallback((machineId: string) => {
    const min = equipmentMinStock.find(ms => ms.contract_equipment_id === machineId);
    const latest = [...equipmentStockEntries]
      .filter(e => e.contract_equipment_id === machineId)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
    
    if (!min || !latest) return [];

    const criticals: { label: string; current: number; min: number; color: 'C' | 'M' | 'Y' | 'K' | 'neutral' }[] = [];
    const tb = latest.toner_black ?? 0; if (tb <= min.toner_black_min) criticals.push({ label: 'Toner K', current: tb, min: min.toner_black_min, color: 'K' });
    const tc = latest.toner_cyan ?? 0; if (tc <= min.toner_cyan_min && min.toner_cyan_min > 0) criticals.push({ label: 'Toner C', current: tc, min: min.toner_cyan_min, color: 'C' });
    const tm = latest.toner_magenta ?? 0; if (tm <= min.toner_magenta_min && min.toner_magenta_min > 0) criticals.push({ label: 'Toner M', current: tm, min: min.toner_magenta_min, color: 'M' });
    const ty = latest.toner_yellow ?? 0; if (ty <= min.toner_yellow_min && min.toner_yellow_min > 0) criticals.push({ label: 'Toner Y', current: ty, min: min.toner_yellow_min, color: 'Y' });
    const db = latest.drum_black ?? 0; if (db <= min.drum_black_min && min.drum_black_min > 0) criticals.push({ label: 'Cilindro K', current: db, min: min.drum_black_min, color: 'K' });
    const dc = latest.drum_cyan ?? 0; if (dc <= min.drum_cyan_min && min.drum_cyan_min > 0) criticals.push({ label: 'Cilindro C', current: dc, min: min.drum_cyan_min, color: 'C' });
    const dm = latest.drum_magenta ?? 0; if (dm <= min.drum_magenta_min && min.drum_magenta_min > 0) criticals.push({ label: 'Cilindro M', current: dm, min: min.drum_magenta_min, color: 'M' });
    const dy = latest.drum_yellow ?? 0; if (dy <= min.drum_yellow_min && min.drum_yellow_min > 0) criticals.push({ label: 'Cilindro Y', current: dy, min: min.drum_yellow_min, color: 'Y' });

    return criticals;
  }, [equipmentMinStock, equipmentStockEntries]);

  // 🚨 CRISIS ALERT LOGIC
  const crisisItems = useMemo(() => {
    const items: any[] = [];
    
    contractEquipment.forEach(ce => {
      const criticals = getCriticalComponents(ce.id);
      if (criticals.length > 0) {
        const contract = contracts.find(c => c.id === ce.contract_id);
        const model = equipmentModels.find(m => m.id === ce.equipment_model_id);
        items.push({
          id: ce.id,
          type: 'machine',
          contractName: contract?.name || 'N/A',
          contractId: ce.contract_id,
          title: `${model?.brand} ${model?.name}`,
          subtitle: `${ce.serial_number} — ${ce.location}`,
          criticals
        });
      }
    });

    // Paper Crisis
    contracts.forEach(contract => {
        const paperEntries = [...paperStockEntries]
            .filter(e => e.contract_id === contract.id)
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        const latestPaper = paperEntries[0];
        if (latestPaper && latestPaper.reams_current <= 5) { // Hardcoded 5 for paper crisis for now
            items.push({
                id: `paper-${contract.id}`,
                type: 'paper',
                contractName: contract.name,
                contractId: contract.id,
                title: 'PAPEL A4 REPROGRAF',
                subtitle: 'SUPRIMENTO GLOBAL',
                criticals: [{ label: 'Resmas', current: latestPaper.reams_current, min: 5, color: 'neutral' }]
            });
        }
    });

    return items;
  }, [contracts, contractEquipment, equipmentMinStock, equipmentStockEntries, paperStockEntries, equipmentModels, getCriticalComponents]);

  const contractInventory = useMemo(() => {
    return contracts.map(contract => {
      const machines = contractEquipment.filter(ce => ce.contract_id === contract.id).map(me => {
        const model = equipmentModels.find(m => m.id === me.equipment_model_id);
        const min = equipmentMinStock.find(ms => ms.contract_equipment_id === me.id);
        const latestEntry = [...equipmentStockEntries]
          .filter(e => e.contract_equipment_id === me.id)
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];

        return {
          ...me,
          model,
          min,
          latestEntry,
          hasAlert: getCriticalComponents(me.id).length > 0
        };
      });

      const paperEntries = [...paperStockEntries]
        .filter(e => e.contract_id === contract.id)
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      
      const latestPaper = paperEntries[0];

      return {
        ...contract,
        machines,
        latestPaper,
        hasAlert: machines.some(m => m.hasAlert) || (latestPaper && latestPaper.reams_current <= 5)
      };
    }).filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contracts, equipmentModels, contractEquipment, equipmentMinStock, equipmentStockEntries, paperStockEntries, searchTerm, getCriticalComponents]);

  const selectedContract = contractInventory.find(c => c.id === selectedContractId);

  return (
    <div className="space-y-10 animate-fade pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary" />
            <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.3em] ">Centro de Comando</p>
          </div>
          <h2 className="text-5xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            INVENTÁRIO <span className="text-text-2 font-light not-italic text-4xl">& STOCK</span>
          </h2>
        </div>
        <div className="flex gap-4">
            {user?.role !== 'technician' && (
            <Button 
                variant="outline"
                className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 bg-surface/50 border-border/50 hover:bg-surface hover:border-primary/50"
                onClick={() => setIsImportModalOpen(true)}
            >
                <FileSpreadsheet size={16} />
                Importar Dados
            </Button>
            )}
        </div>
      </div>

      {/* 🚨 CRISIS DASHBOARD (New High-Visibility Section) */}
      {crisisItems.length > 0 && (
          <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                  <AlertTriangle className="text-danger animate-pulse" size={24} />
                  <h3 className="text-xl font-black text-text-1 uppercase italic tracking-tight">ESTOQUE EM <span className="text-danger">CRISE</span></h3>
                  <Badge variant="danger" className="ml-2 px-3 py-1 text-[10px]">{crisisItems.length} ATIVOS CRÍTICOS</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {crisisItems.map(item => (
                      <Card 
                        key={item.id} 
                        className="bg-surface border-2 border-danger/30 rounded-[32px] p-6 shrink-0 flex flex-col justify-between hover:border-danger hover:bg-danger/5 transition-all cursor-pointer group shadow-2xl shadow-danger/5"
                        onClick={() => setSelectedContractId(item.contractId)}
                      >
                          <div>
                            <div className="flex justify-between items-start mb-4">
                                <Badge variant="neutral" className="bg-danger/10 text-danger border-none text-[8px] uppercase">{item.contractName}</Badge>
                                <AlertOctagon size={16} className="text-danger opacity-40 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h4 className="text-sm font-black text-text-1 uppercase italic leading-tight mb-1">{item.title}</h4>
                            <p className="text-[10px] font-bold text-text-2 uppercase mb-4">{item.subtitle}</p>
                          </div>

                          <div className="space-y-2 mt-auto">
                              <p className="text-[8px] font-black text-danger uppercase tracking-widest">Níveis Críticos:</p>
                              <div className="flex flex-wrap gap-1.5">
                                  {item.criticals.map((c: any, idx: number) => (
                                      <div key={idx} className="px-2 py-1 bg-bg border border-danger/20 rounded-lg flex items-center gap-2">
                                          {c.color !== 'neutral' && <div className={cn("w-1.5 h-1.5 rounded-full", {
                                              'bg-black': c.color === 'K',
                                              'bg-cyan': c.color === 'C',
                                              'bg-magenta': c.color === 'M',
                                              'bg-primary': c.color === 'Y'
                                          })} />}
                                          <span className="text-[7px] font-black text-text-1 uppercase">{c.label} {c.current}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </Card>
                  ))}
              </div>
          </div>
      )}

      {/* Control & Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-2 group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="PESQUISAR NO INVENTÁRIO (CONTRATO, CLIENTE OU ATIVO)..."
            className="w-full h-16 bg-surface border border-border rounded-[24px] pl-16 pr-8 text-xs font-bold uppercase tracking-[0.2em] text-text-1 outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all placeholder:text-text-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Contract Inventory List */}
      <div className="grid grid-cols-1 gap-6">
        {contractInventory.map(contract => (
          <div key={contract.id} className="relative group">
             {/* Left accent for alerts */}
             {contract.hasAlert && <div className="absolute inset-y-8 -left-1 w-2 bg-danger rounded-full z-10 shadow-lg shadow-danger" />}
             
             <Card 
               className={cn(
                 "overflow-hidden transition-all duration-300 rounded-[40px] hover:scale-[1.005] group",
                 contract.hasAlert ? "border-danger/30 hover:border-danger" : "hover:border-primary-50"
               )}
             >
                <div 
                  className="p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 cursor-pointer bg-bg/20"
                  onClick={() => setSelectedContractId(contract.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedContractId(contract.id)}
                >
                   <div className="flex items-center gap-8">
                      <div className={cn(
                        "w-16 h-16 rounded-3xl flex items-center justify-center border-2 transition-all duration-500",
                        contract.hasAlert ? "bg-danger text-white border-transparent rotate-12" : "bg-bg text-text-2 border-border group-hover:border-primary group-hover:text-primary"
                      )}>
                         {contract.hasAlert ? <AlertTriangle size={32} /> : <Box size={32} />}
                      </div>
                      <div>
                         <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-black text-text-1 uppercase italic tracking-tighter leading-none">{contract.name}</h3>
                            <Badge variant="neutral" className="text-[10px] font-black uppercase tracking-widest bg-surface/50 border-none">{contract.code}</Badge>
                         </div>
                         <div className="flex items-center gap-4 text-[10px] font-bold text-text-2 uppercase tracking-widest group-hover:opacity-100 transition-opacity">
                            <span className="flex items-center gap-2"><Monitor size={12} className="text-primary" /> {contract.machines.length} ATIVOS</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-border" />
                            <span>{contract.client}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex items-center gap-6">
                       {/* Quick Previews */}
                       <div className="hidden xl:flex gap-3">
                          {contract.latestPaper && (
                            <div className={cn(
                                "px-6 py-3 border rounded-2xl flex flex-col items-center justify-center min-w-[120px]",
                                contract.latestPaper.reams_current <= 5 ? "bg-danger/10 border-danger text-danger" : "bg-bg border-border text-text-1"
                            )}>
                               <span className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Papel A4</span>
                               <span className="text-base font-black italic">{contract.latestPaper.reams_current} <span className="text-[10px] not-italic">RES</span></span>
                            </div>
                          )}
                          <div className="px-6 py-3 bg-bg border border-border rounded-2xl flex flex-col items-center justify-center min-w-[120px] text-text-1 group-hover:border-primary transition-colors">
                              <span className="text-[8px] font-black uppercase tracking-widest opacity-50 mb-1">Ativos OK</span>
                              <span className="text-base font-black italic">
                                {contract.machines.filter(m => !m.hasAlert).length} / {contract.machines.length}
                              </span>
                          </div>
                       </div>
                       
                       <Button 
                         variant="ghost" 
                         className="w-14 h-14 rounded-full border border-border text-text-2 group-hover:bg-primary group-hover:text-secondary group-hover:border-primary transition-all"
                       >
                          <ChevronRight size={24} />
                       </Button>
                   </div>
                </div>
             </Card>
          </div>
        ))}
      </div>

      {/* Detail Modal (Enhanced with Grid Layout) */}
      {selectedContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-secondary/95 backdrop-blur-2xl animate-fade overflow-y-auto">
          <div className="w-full max-w-7xl bg-surface border border-border rounded-[48px] shadow-2xl flex flex-col max-h-full overflow-hidden border-t-8 border-t-primary">
             {/* Modal Header */}
             <div className="px-12 py-12 border-b border-border flex justify-between items-center bg-bg/20">
                <div className="space-y-1">
                   <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary" />
                      <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.5em]">Inventory Audit Console</p>
                   </div>
                   <h3 className="text-5xl font-black text-text-1 italic uppercase tracking-tighter leading-none">
                     {selectedContract.name} <span className="text-primary ml-4">({selectedContract.code})</span>
                   </h3>
                   <div className="flex items-center gap-4 mt-6">
                       <Badge variant="neutral" className="px-4 py-2 font-black uppercase text-[10px] tracking-widest border-none bg-surface-2">{selectedContract.client}</Badge>
                       <div className="h-6 w-[1px] bg-border mx-2" />
                       <span className="text-[10px] font-bold text-text-2 uppercase">Total de {selectedContract.machines.length} Equipamentos Monitorados</span>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedContractId(null)}
                  title="Fechar Detalhes do Contrato"
                  className="w-20 h-20 rounded-full bg-surface border border-border flex items-center justify-center text-text-2 hover:bg-danger hover:text-white transition-all hover:rotate-90 shadow-xl"
                >
                  <X size={32} strokeWidth={3} />
                </button>
             </div>

             {/* Modal Content */}
             <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar bg-bg/5">
                
                {/* Machines List (Vertical Stack with detailed info) */}
                <div className="space-y-8">
                   <div className="flex items-center gap-4 border-b border-border pb-6">
                      <Monitor className="text-primary" size={24} />
                      <h4 className="text-2xl font-black text-text-1 uppercase italic tracking-tighter">ESTOQUE DO <span className="text-primary">PARQUE</span></h4>
                   </div>
                   
                   <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      {selectedContract.machines.map(me => (
                        <Card key={me.id} className={cn(
                            "bg-surface border overflow-hidden rounded-[32px] transition-all",
                            me.hasAlert ? "border-danger/30" : "border-border"
                        )}>
                            <div className="p-8 border-b border-border bg-bg/30 flex justify-between items-start">
                               <div>
                                  <div className="flex items-center gap-2 mb-2">
                                     <Badge variant="primary" className="bg-primary text-black border-none text-[8px] uppercase font-black">{me.model?.brand}</Badge>
                                     <span className="text-[10px] font-bold text-text-2 tracking-widest">{me.serial_number}</span>
                                  </div>
                                  <h4 className="text-xl font-black text-text-1 uppercase italic tracking-tight">{me.model?.name}</h4>
                                  <p className="text-[11px] font-bold text-text-2 uppercase mt-2 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-primary" />{me.location}</p>
                               </div>
                               {me.hasAlert && <AlertTriangle size={24} className="text-danger animate-bounce-slow" />}
                            </div>

                            <div className="p-8 space-y-8">
                               {/* Toner Console */}
                               <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                     <span className="text-[9px] font-black text-text-2 uppercase tracking-[0.2em]">Células de Toner</span>
                                     <div className="flex gap-1">
                                        <CMYKBadge type="K" />
                                        {me.model?.is_color && <><CMYKBadge type="C" /><CMYKBadge type="M" /><CMYKBadge type="Y" /></>}
                                     </div>
                                  </div>
                                  <div className="grid grid-cols-4 gap-3">
                                     <StockSquare color="K" current={me.latestEntry?.toner_black} min={me.min?.toner_black_min} />
                                     {me.model?.is_color && (
                                       <>
                                         <StockSquare color="C" current={me.latestEntry?.toner_cyan} min={me.min?.toner_cyan_min} />
                                         <StockSquare color="M" current={me.latestEntry?.toner_magenta} min={me.min?.toner_magenta_min} />
                                         <StockSquare color="Y" current={me.latestEntry?.toner_yellow} min={me.min?.toner_yellow_min} />
                                       </>
                                     )}
                                  </div>
                               </div>

                               {/* Drum Console */}
                               {me.model?.has_drum && (
                                 <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                       <span className="text-[9px] font-black text-warning uppercase tracking-[0.2em]">Matriz de Cilindro / Fotocondutor</span>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                       <StockSquare color="K" current={me.latestEntry?.drum_black} min={me.min?.drum_black_min} />
                                       {me.model?.is_color && (
                                         <>
                                           <StockSquare color="C" current={me.latestEntry?.drum_cyan} min={me.min?.drum_cyan_min} />
                                           <StockSquare color="M" current={me.latestEntry?.drum_magenta} min={me.min?.drum_magenta_min} />
                                           <StockSquare color="Y" current={me.latestEntry?.drum_yellow} min={me.min?.drum_yellow_min} />
                                         </>
                                       )}
                                    </div>
                                 </div>
                               )}
                            </div>
                        </Card>
                      ))}
                   </div>
                </div>
             </div>

             {/* Modal Footer with Global Summary */}
             <div className="p-12 bg-bg border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-10">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-text-2 uppercase tracking-widest mb-2">Status do Papel A4</span>
                      <div className={cn(
                          "px-6 py-4 rounded-2xl border flex items-center gap-4",
                          (selectedContract.latestPaper?.reams_current || 0) <= 5 ? "bg-danger/10 border-danger/30" : "bg-surface border-border"
                      )}>
                         <span className="text-3xl font-black text-text-1 italic">{selectedContract.latestPaper?.reams_current || 0}</span>
                         <span className="text-[12px] font-black text-text-2 uppercase">Resmas</span>
                      </div>
                   </div>
                   <div className="h-16 w-[1px] bg-border" />
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-text-2 uppercase tracking-widest mb-2">Data da Última Leitura</span>
                      <span className="text-sm font-black text-text-1 uppercase italic tracking-tight">
                         {selectedContract.latestPaper?.entry_date ? new Date(selectedContract.latestPaper.entry_date).toLocaleDateString() : 'NENHUM REGISTRO'}
                      </span>
                   </div>
                </div>
                <div className="flex gap-4">
                   <Button variant="outline" className="h-20 px-10 rounded-3xl text-[10px] font-black uppercase tracking-widest">Ver Histórico</Button>
                   <Button className="rdy-btn-primary h-20 px-16 rounded-3xl text-[12px] shadow-2xl shadow-primary">EMITIR ORDEM DE REPOSIÇÃO</Button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <ImportModal 
          type="equipment"
          onClose={() => setIsImportModalOpen(false)}
          onImport={importEquipment}
        />
      )}
    </div>
  );
};

// Tactical Stock Square Component
const StockSquare = ({ color, current, min }: { color: 'C' | 'M' | 'Y' | 'K' | 'neutral', current?: number, min?: number }) => {
  const isCritical = current !== undefined && min !== undefined && current <= min;
  
  return (
    <div className={cn(
      "p-4 rounded-2xl border transition-all flex flex-col items-center justify-center relative group/sq shadow-sm",
      isCritical ? "bg-danger/5 border-danger/40 ring-4 ring-danger/5" : "bg-bg border-border hover:border-text-2/30"
    )}>
       {isCritical && <AlertTriangle className="absolute -top-2 -right-2 text-danger scale-75" size={20} />}
       <div className={cn(
           "w-7 h-7 rounded-sm flex items-center justify-center mb-3 font-black text-[10px] shadow-md transition-transform group-hover/sq:scale-110",
           {
               'bg-black text-white': color === 'K',
               'bg-cyan text-black': color === 'C',
               'bg-magenta text-white': color === 'M',
               'bg-primary text-black': color === 'Y',
               'bg-surface-2 text-text-2': color === 'neutral'
           }
       )}>
           {color}
       </div>
       <p className={cn("text-2xl font-black italic tracking-tighter leading-none", isCritical ? "text-danger" : "text-text-1")}>
         {current !== undefined ? current : '--'}
       </p>
       <div className="mt-2 text-[8px] font-black text-text-2 uppercase tracking-widest flex items-center gap-1">
           MÍN <span className="text-text-1">{min}</span>
       </div>
    </div>
  );
};
