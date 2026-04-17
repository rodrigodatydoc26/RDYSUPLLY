import { useMemo, useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Monitor,
  AlertTriangle,
  X,
  Hash,
  Search,
  Box,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { cn, Button, Card, Badge, CMYKBadge } from '../components/ui/Base';

export const Inventory = () => {
  const { 
    contracts, 
    equipmentModels, 
    contractEquipment, 
    equipmentMinStock, 
    equipmentStockEntries,
    paperStockEntries,
    fetchInitialData 
  } = useDataStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const contractInventory = useMemo(() => {
    return contracts.map(contract => {
      const machines = contractEquipment.filter(ce => ce.contract_id === contract.id).map(me => {
        const model = equipmentModels.find(m => m.id === me.equipment_model_id);
        const min = equipmentMinStock.find(ms => ms.contract_equipment_id === me.id);
        
        // Find latest entry for this machine
        const latestEntry = [...equipmentStockEntries]
          .filter(e => e.contract_equipment_id === me.id)
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];

        return {
          ...me,
          model,
          min,
          latestEntry,
          hasAlert: checkMachineAlerts(latestEntry, min)
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
        hasAlert: machines.some(m => m.hasAlert)
      };
    }).filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contracts, equipmentModels, contractEquipment, equipmentMinStock, equipmentStockEntries, paperStockEntries, searchTerm]);

  const selectedContract = contractInventory.find(c => c.id === selectedContractId);

  return (
    <div className="space-y-6 animate-fade pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary" />
            <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.3em] ">Monitoramento de Ativos</p>
          </div>
          <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            ESTOQUES <span className="text-text-2 font-light not-italic opacity-50 text-3xl">POR UNIDADE</span>
          </h2>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-2 group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="PESQUISAR POR CONTRATO, CLIENTE OU CÓDIGO..."
            className="w-full h-14 bg-surface border border-border rounded-2xl pl-14 pr-8 text-xs font-bold uppercase tracking-widest text-text-1 outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Contract Boards */}
      <div className="grid grid-cols-1 gap-6">
        {contractInventory.map(contract => (
          <Card key={contract.id} className="group overflow-hidden">
             <div 
               className="p-8 flex items-center justify-between cursor-pointer hover:bg-bg/50 transition-colors"
               onClick={() => setSelectedContractId(contract.id)}
             >
                <div className="flex items-center gap-6">
                   <div className={cn(
                     "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all",
                     contract.hasAlert ? "bg-danger text-white border-transparent shadow-xl shadow-danger" : "bg-bg text-text-2 border-border"
                   )}>
                      {contract.hasAlert ? <AlertTriangle size={24} /> : <Box size={24} />}
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-text-1 uppercase italic tracking-tighter leading-none mb-2">{contract.name}</h3>
                      <div className="flex items-center gap-3 text-[9px] font-bold text-text-2 uppercase tracking-widest">
                         <span className="flex items-center gap-1.5"><Monitor size={10} /> {contract.machines.length} MÁQUINAS</span>
                         <div className="w-px h-2 bg-border" />
                         <span>{contract.client}</span>
                         <div className="w-px h-2 bg-border" />
                         <span className="text-primary font-black italic">{contract.code}</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex gap-2">
                       {contract.latestPaper && (
                         <div className="px-4 py-2 bg-bg border border-border rounded-xl">
                            <p className="text-[7px] font-black text-text-2 uppercase mb-0.5">PAPEL A4</p>
                            <p className="text-[10px] font-black text-text-1 uppercase italic">{contract.latestPaper.reams_current} RESMAS</p>
                         </div>
                       )}
                    </div>
                    <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-text-2 group-hover:bg-primary group-hover:text-secondary group-hover:border-primary transition-all">
                       <ArrowUpRight size={18} />
                    </div>
                </div>
             </div>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-secondary/90 backdrop-blur-xl animate-fade">
          <div className="w-full max-w-6xl bg-surface border border-border rounded-[40px] shadow-2xl flex flex-col h-[85vh] overflow-hidden">
             {/* Modal Header */}
             <div className="px-10 py-10 border-b border-border flex justify-between items-start bg-bg/50">
                <div className="space-y-1">
                   <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary animate-pulse" />
                      <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.4em]">Auditando Parque de Ativos</p>
                   </div>
                   <h3 className="text-4xl font-black text-text-1 italic uppercase tracking-tighter leading-tight">{selectedContract.name}</h3>
                   <p className="text-xs font-bold text-text-2 uppercase tracking-widest mt-2">{selectedContract.client}</p>
                </div>
                <button 
                  onClick={() => setSelectedContractId(null)}
                  className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center text-text-2 hover:text-danger hover:border-danger transition-all"
                >
                  <X size={24} strokeWidth={3} />
                </button>
             </div>

             {/* Modal Content */}
             <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                {/* Machines Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {selectedContract.machines.map(me => (
                     <div key={me.id} className="bg-bg border border-border rounded-[32px] overflow-hidden group">
                        <div className="p-8 border-b border-border bg-surface">
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                 <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{me.model?.brand}</p>
                                 <h4 className="text-xl font-black text-text-1 italic uppercase tracking-tight">{me.model?.name}</h4>
                              </div>
                              <Badge variant="neutral">{me.location}</Badge>
                           </div>
                           <div className="flex gap-4 text-[9px] font-bold text-text-2 uppercase tracking-widest">
                              <span className="flex items-center gap-1.5"><Hash size={10} /> NS: {me.serial_number}</span>
                              <div className="flex gap-1">
                                {me.model?.is_color && <Badge variant="info">Color</Badge>}
                                {me.model?.has_drum && <Badge variant="warning">Drum System</Badge>}
                              </div>
                           </div>
                        </div>

                        {/* Inventory Details */}
                        <div className="p-8 space-y-6">
                           <div className="grid grid-cols-1 gap-6">
                              {/* Toner Section */}
                              <div className="space-y-4">
                                 <p className="text-[9px] font-black text-text-2 uppercase tracking-widest ">Monitoramento de Toner</p>
                                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

                              {/* Drum Section */}
                              {me.model?.has_drum && (
                                <div className="space-y-4">
                                  <p className="text-[9px] font-black text-warning uppercase tracking-widest ">Monitoramento de Cilindro</p>
                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Modal Footer */}
             <div className="p-8 bg-bg border-t border-border flex items-center justify-between">
                <div>
                   <p className="text-[9px] font-bold text-text-2 uppercase tracking-widest mb-1.5">Métrica Geral Paper (Contract-Wide)</p>
                   <div className="flex gap-4">
                      <div className="bg-surface border border-border px-4 py-2 rounded-xl">
                        <span className="text-xs font-black text-text-1 italic">{selectedContract.latestPaper?.reams_current || 0} RESMAS</span>
                        <span className="text-[8px] font-bold text-text-2 opacity-30 ml-2">ATUAL</span>
                      </div>
                   </div>
                </div>
                <Button className="h-14 px-12 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2">
                   Gerar Relatório Tático (PDF)
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for stock display
const StockSquare = ({ color, current, min }: { color: 'C' | 'M' | 'Y' | 'K', current?: number, min?: number }) => {
  const isCritical = current !== undefined && min !== undefined && current <= min;
  
  return (
    <div className={cn(
      "p-4 rounded-2xl border transition-all flex flex-col items-center",
      isCritical ? "bg-danger/10 border-danger" : "bg-bg border-border"
    )}>
       <CMYKBadge type={color} className="scale-75 mb-3" />
       <p className={cn("text-xl font-black italic tracking-tighter", isCritical ? "text-danger" : "text-text-1")}>
         {current !== undefined ? current : '-'}
       </p>
       <p className="text-[8px] font-bold text-text-2 uppercase mt-1">Mín: {min}</p>
    </div>
  );
};

// Alert check utility
function checkMachineAlerts(entry: any, min: any) {
  if (!entry || !min) return false;
  return (
    (entry.toner_black !== undefined && entry.toner_black <= min.toner_black_min) ||
    (entry.toner_cyan !== undefined && entry.toner_cyan <= min.toner_cyan_min) ||
    (entry.toner_magenta !== undefined && entry.toner_magenta <= min.toner_magenta_min) ||
    (entry.toner_yellow !== undefined && entry.toner_yellow <= min.toner_yellow_min) ||
    (entry.drum_black !== undefined && entry.drum_black <= min.drum_black_min) ||
    (entry.drum_cyan !== undefined && entry.drum_cyan <= min.drum_cyan_min) ||
    (entry.drum_magenta !== undefined && entry.drum_magenta <= min.drum_magenta_min) ||
    (entry.drum_yellow !== undefined && entry.drum_yellow <= min.drum_yellow_min)
  );
}

