import { useMemo, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import {
  Monitor,
  AlertTriangle,
  X,
  Search,
  Box,
  ChevronRight,
  FileText,
  Download,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import type { EquipmentStockEntry, PaperStockEntry } from '../types';
import { cn } from '../lib/utils';
import { Button, Card, Badge, CMYKBadge } from '../components/ui/Base';
import { ImportModal } from '../components/features/ImportModal';
import { exportToExcel, exportToPDF } from '../utils/reportExporter';

export const Inventory = () => {
  const {
    contracts,
    equipmentModels,
    contractEquipment,
    equipmentMinStock,
    equipmentStockEntries,
    paperStockEntries,
    importEquipment
  } = useDataStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const contractInventory = useMemo(() => {
    const modelMap = new Map(equipmentModels.map(m => [m.id, m]));
    const minMap = new Map(equipmentMinStock.map(ms => [ms.contract_equipment_id, ms]));

    const latestEntryMap = new Map<string, EquipmentStockEntry>();
    for (const e of equipmentStockEntries) {
      const prev = latestEntryMap.get(e.contract_equipment_id);
      if (!prev || (e.created_at ?? '') > (prev.created_at ?? '')) {
        latestEntryMap.set(e.contract_equipment_id, e);
      }
    }

    const latestPaperMap = new Map<string, PaperStockEntry>();
    for (const p of paperStockEntries) {
      const prev = latestPaperMap.get(p.contract_id);
      if (!prev || (p.created_at ?? '') > (prev.created_at ?? '')) {
        latestPaperMap.set(p.contract_id, p);
      }
    }

    const searchLower = searchTerm.toLowerCase();

    return contracts
      .filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.client.toLowerCase().includes(searchLower)
      )
      .map(contract => {
        const machines = contractEquipment
          .filter(ce => ce.contract_id === contract.id)
          .map(me => {
            const model = modelMap.get(me.equipment_model_id);
            const min = minMap.get(me.id);
            const latestEntry = latestEntryMap.get(me.id);

            const hasAlert = !!(min && latestEntry && (
              (latestEntry.toner_black ?? 0) <= min.toner_black_min ||
              (min.toner_cyan_min > 0 && (latestEntry.toner_cyan ?? 0) <= min.toner_cyan_min) ||
              (min.toner_magenta_min > 0 && (latestEntry.toner_magenta ?? 0) <= min.toner_magenta_min) ||
              (min.toner_yellow_min > 0 && (latestEntry.toner_yellow ?? 0) <= min.toner_yellow_min)
            ));

            return {
              ...me,
              model,
              min,
              latestEntry,
              hasAlert,
              isSynced: !!latestEntry,
              lastSync: latestEntry?.created_at,
              latestStock: latestEntry ? {
                 toners: {
                    K: latestEntry.toner_black,
                    C: latestEntry.toner_cyan,
                    M: latestEntry.toner_magenta,
                    Y: latestEntry.toner_yellow
                 },
                 drums: {
                    K: latestEntry.drum_black,
                    C: latestEntry.drum_cyan,
                    M: latestEntry.drum_magenta,
                    Y: latestEntry.drum_yellow
                 }
              } : null
            };
          });

        const latestPaper = latestPaperMap.get(contract.id);
        const hasAlert = machines.some(m => m.hasAlert) || !!(latestPaper && latestPaper.reams_current <= 5);

        const syncDates = [...machines.map(m => m.lastSync), latestPaper?.created_at].filter((d): d is string => !!d);
        const lastSyncAt = syncDates.length > 0 ? syncDates.reduce((max, d) => d > max ? d : max) : undefined;

        return {
          ...contract,
          machines,
          latestPaper,
          hasAlert,
          lastSyncAt,
          syncedCount: machines.filter(m => m.isSynced).length,
          pendingCount: machines.filter(m => !m.isSynced).length,
        };
      })
      .filter(contract => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'TONER') return contract.machines.some(m => m.hasAlert);
        if (activeFilter === 'PAPEL') return !!(contract.latestPaper && contract.latestPaper.reams_current <= 5);
        if (activeFilter === 'CILINDRO') return contract.machines.some(m => {
          const min = m.min; const le = m.latestEntry;
          return !!(min && le && (
            (min.drum_black_min > 0 && (le.drum_black ?? 0) <= min.drum_black_min) ||
            (min.drum_cyan_min > 0 && (le.drum_cyan ?? 0) <= min.drum_cyan_min) ||
            (min.drum_magenta_min > 0 && (le.drum_magenta ?? 0) <= min.drum_magenta_min) ||
            (min.drum_yellow_min > 0 && (le.drum_yellow ?? 0) <= min.drum_yellow_min)
          ));
        });
        return true;
      });
  }, [contracts, equipmentModels, contractEquipment, equipmentMinStock, equipmentStockEntries, searchTerm, activeFilter]);

  const selectedContract = useMemo(
    () => contractInventory.find(c => c.id === selectedContractId),
    [contractInventory, selectedContractId]
  );

  return (
    <div className="space-y-8 animate-fade pb-10">
      {/* V2 Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 pt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/50" />
            <p className="text-[11px] font-black text-text-1 uppercase tracking-[0.4em] leading-none">CATÁLOGO MESTRE DE RECURSOS</p>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-text-1 tracking-tighter uppercase leading-none italic">
            ESTOQUES <span className="font-light not-italic text-text-1 opacity-20">HIERÁRQUICOS</span>
          </h2>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
           <div className="hidden sm:flex items-center gap-3 px-6 py-4 bg-surface border border-border rounded-full shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                <span className="text-[11px] font-black text-text-1 uppercase tracking-widest whitespace-nowrap">SINCRONIZADO</span>
           </div>
           
           <div className="flex items-center gap-3">
              <Button 
                 onClick={() => exportToPDF(contractInventory)}
                 className="h-14 px-6 bg-surface border border-border text-text-1 text-[10px] font-black uppercase tracking-widest hover:border-danger hover:text-danger transition-all rounded-[20px]"
              >
                 <FileText size={18} className="mr-2" />
                 PDF
              </Button>
              <Button 
                 onClick={() => exportToExcel(contractInventory)}
                 className="h-14 px-6 bg-surface border border-border text-text-1 text-[10px] font-black uppercase tracking-widest hover:border-success hover:text-success transition-all rounded-[20px]"
              >
                 <Download size={18} className="mr-2" />
                 Excel
              </Button>
              <Button onClick={() => setIsImportModalOpen(true)} className="h-14 px-8 rdy-btn-elite text-[10px]">
                 IMPORTAR DADOS
              </Button>
           </div>
        </div>
      </div>

      {/* V2 Filter & Search Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 px-4 items-end">
        <div className="relative group">
          <label className="text-[10px] font-black text-text-2 uppercase ml-6 mb-2 block tracking-[0.3em]">Pesquisa de Ativos</label>
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-1 opacity-20" size={22} />
            <input
              type="text"
              placeholder="PROCURAR CONTRATO OU UNIDADE DE ESTOQUE..."
              className="w-full h-16 bg-surface border border-border rounded-[24px] pl-16 pr-8 text-[11px] font-black uppercase tracking-[0.2em] text-text-1 outline-none focus:ring-4 focus:ring-black/5 transition-all placeholder:text-text-1 placeholder:opacity-20 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] font-black text-text-2 uppercase ml-6 mb-2 block tracking-[0.3em]">Matriz de Filtro</label>
          <div className="flex bg-surface border border-border p-1.5 rounded-[28px] shadow-sm overflow-x-auto">
              {['ALL', 'TONER', 'CILINDRO'].map(filter => (
                  <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={cn(
                          "px-10 h-14 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                          activeFilter === filter 
                              ? "bg-primary text-black shadow-lg shadow-primary/20" 
                              : "text-text-1 hover:bg-black/5 opacity-40 hover:opacity-100"
                      )}
                  >
                      {filter}
                  </button>
              ))}
          </div>
        </div>
      </div>

      {/* V2 Contract List */}
      <div className="space-y-4 px-4">
        {contractInventory.map(contract => (
          <Card 
            key={contract.id}
            onClick={() => setSelectedContractId(contract.id)}
            className={cn(
                "group relative overflow-hidden transition-all duration-300 rounded-[28px] border border-border hover:border-black cursor-pointer bg-surface hover:shadow-xl",
                contract.hasAlert && "bg-danger/[0.02] border-danger/10"
            )}
          >
             <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                   {/* Left Icon Area */}
                   <div className={cn(
                       "w-14 h-14 flex items-center justify-center rounded-[18px] transition-all duration-500 shrink-0",
                       contract.hasAlert ? "bg-danger/10 text-danger" : "bg-black/5 text-text-1 group-hover:bg-black group-hover:text-white"
                   )}>
                      {contract.hasAlert ? <AlertTriangle size={24} /> : <Box size={24} />}
                   </div>

                   {/* Content Area */}
                   <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                         <h3 className="text-xl font-black text-text-1 uppercase tracking-tighter italic leading-none truncate">{contract.name}</h3>
                         {contract.hasAlert && (
                             <Badge variant="danger" className="text-[8px] font-black uppercase py-0.5 px-2 border-none rounded-md bg-danger text-white">
                                {contract.machines.filter(m => m.hasAlert).length + (contract.latestPaper && contract.latestPaper.reams_current <= 5 ? 1 : 0)} ALERTA
                             </Badge>
                         )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[9px] font-black text-text-1 uppercase tracking-wider transition-opacity">
                         <span className="opacity-30">{contract.machines.length} ATIVOS</span>
                         <span className="opacity-10">|</span>
                         <span className="opacity-30">ID: {contract.code}</span>
                         <span className="opacity-10">|</span>
                         <span className={cn(
                            "px-2 py-0.5 rounded bg-black/5",
                            contract.pendingCount > 0 ? "text-warning" : "text-success"
                          )}>
                            {contract.syncedCount}/{contract.machines.length} SINCRONIZADOS
                          </span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-6">
                   <div className="md:text-right space-y-1 shrink-0">
                      <p className="text-[8px] font-black text-text-1 opacity-20 uppercase tracking-[0.3em]">ÚLTIMA SINCRONIA</p>
                      <p className="text-[10px] font-black text-text-1 uppercase italic tracking-widest whitespace-nowrap">
                         {contract.lastSyncAt ? new Date(contract.lastSyncAt).toLocaleString('pt-BR') : 'SEM REGISTRO'}
                      </p>
                   </div>
                   
                   <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
                       <ChevronRight size={20} />
                   </div>
                </div>
             </div>
          </Card>
        ))}
        {contractInventory.length === 0 && (
            <div className="py-40 text-center">
                <Box size={48} className="mx-auto mb-4 opacity-10" />
                <p className="text-[12px] font-black text-text-1 uppercase tracking-[0.4em] opacity-20">Nenhum contrato localizado no setor selecionado</p>
            </div>
        )}
      </div>

      {/* Detail Modal - Portal Overlay */}
      {selectedContract && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-xl animate-fade">
          <div className="w-full max-w-6xl bg-surface border border-border rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] flex flex-col max-h-[92vh] overflow-hidden my-auto relative z-[1000] animate-slide-up">
             {/* Modal Header */}
             <div className="px-10 py-8 border-b border-border flex justify-between items-center">
                <div className="space-y-1">
                   <div className="flex items-center gap-2 mb-2">
                       <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary" />
                       <span className="text-[10px] font-black text-text-1 uppercase tracking-[0.4em] opacity-30">AUDITORIA DE ATIVOS</span>
                   </div>
                   <h3 className="text-3xl font-black text-text-1 uppercase italic tracking-tighter leading-tight">{selectedContract.name}</h3>
                   <div className="hidden lg:flex items-center gap-10 absolute right-[140px] top-1/2 -translate-y-1/2">
                      <div className="text-right">
                         <p className="text-[9px] font-black text-text-1 opacity-20 uppercase tracking-[0.3em] mb-1">AUDITORIA DE SINCRONISMO</p>
                         <div className="flex items-center gap-3 justify-end">
                            <span className="text-xl font-black text-success">{selectedContract.syncedCount} <span className="text-[10px] opacity-40 italic">CONCLUÍDOS</span></span>
                            <div className="w-px h-6 bg-border" />
                            <span className="text-xl font-black text-warning">{selectedContract.pendingCount} <span className="text-[10px] opacity-40 italic">PENDENTES</span></span>
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-4 mt-2">
                      <Badge variant="primary" className="bg-black text-white border-none px-3 py-1 rounded-lg font-black text-[9px]">{selectedContract.code}</Badge>
                      <span className="text-[10px] font-black text-text-1 uppercase tracking-widest opacity-40">{selectedContract.client}</span>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedContractId(null)}
                  title="Fechar Detalhes"
                  className="w-14 h-14 rounded-full bg-black/5 hover:bg-danger hover:text-white transition-all flex items-center justify-center group"
                >
                   <X size={24} className="group-hover:rotate-90 transition-transform" />
                </button>
             </div>

             {/* Modal Content */}
             <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                {/* Section Title */}
                <div className="flex items-center gap-3 border-b border-border/10 pb-4">
                    <Monitor size={20} className="text-text-1 opacity-20" />
                    <h4 className="text-xl font-black text-text-1 uppercase italic tracking-tight">PARQUE MONITORADO</h4>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   {selectedContract.machines.map(me => (
                     <Card key={me.id} className={cn(
                         "border p-6 rounded-[30px] transition-all relative overflow-hidden",
                         me.hasAlert ? "border-danger/30 bg-danger/[0.02] shadow-xl shadow-danger/5" : "border-border hover:border-black/20"
                     )}>
                        <div className="flex justify-between items-start mb-6 pb-6 border-b border-border/10">
                           <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[9px] font-black text-white bg-black px-2 py-0.5 rounded-md uppercase tracking-widest">{me.model?.brand}</span>
                                <span className="text-[10px] font-black text-text-1 uppercase opacity-30 tracking-tight">{me.serial_number}</span>
                              </div>
                              <h4 className="text-xl font-black text-text-1 uppercase italic tracking-tighter leading-none">{me.model?.name}</h4>
                              <p className="text-[10px] font-black text-text-1 mt-2 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-sm" />
                                  <span className="opacity-40">{me.location}</span>
                              </p>
                           </div>
                           <div className="text-right flex flex-col items-end gap-2">
                              <p className="text-[8px] font-black text-text-1 opacity-20 uppercase tracking-widest mb-1 leading-none">ÚLTIMA SINCRONIA</p>
                              <span className={cn(
                                "text-[10px] font-black uppercase italic tracking-widest px-2.5 py-1 rounded-lg shrink-0",
                                me.isSynced ? "bg-success/10 text-success" : "bg-black/5 text-text-1 opacity-40"
                              )}>
                                 {me.lastSync ? new Date(me.lastSync).toLocaleString('pt-BR') : 'SEM REGISTRO'}
                              </span>
                              {me.hasAlert && <AlertTriangle size={20} className="text-danger animate-pulse" />}
                           </div>
                        </div>
                        <div className="space-y-8">
                           {/* Toners Section */}
                           <div>
                              <div className="flex items-center justify-between mb-4">
                                  <p className="text-[10px] font-black text-text-1 uppercase tracking-[0.2em] opacity-40">Status de Toners</p>
                                  <div className="flex gap-1.5 shadow-sm">
                                    <CMYKBadge type="K" />
                                    {me.model?.is_color && <><CMYKBadge type="C" /><CMYKBadge type="M" /><CMYKBadge type="Y" /></>}
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                 <StockSquare color="K" current={me.latestStock?.toners.K} min={me.min?.toner_black_min} />
                                 {me.model?.is_color && (
                                   <>
                                     <StockSquare color="C" current={me.latestStock?.toners.C} min={me.min?.toner_cyan_min} />
                                     <StockSquare color="M" current={me.latestStock?.toners.M} min={me.min?.toner_magenta_min} />
                                     <StockSquare color="Y" current={me.latestStock?.toners.Y} min={me.min?.toner_yellow_min} />
                                   </>
                                 )}
                              </div>
                           </div>

                           {/* Drums Section */}
                           <div>
                              <div className="flex items-center justify-between mb-4">
                                  <p className="text-[10px] font-black text-text-1 uppercase tracking-[0.2em] opacity-40">Status de Cilindros (Drums)</p>
                                  <div className="flex gap-1.5 opacity-50">
                                     <CMYKBadge type="K" className="border border-dashed border-black/20 bg-transparent text-black" />
                                     {me.model?.is_color && <><CMYKBadge type="C" className="border border-dashed border-[#00ADEF]/40 bg-transparent text-[#00ADEF]" /><CMYKBadge type="M" className="border border-dashed border-[#E10098]/40 bg-transparent text-[#E10098]" /><CMYKBadge type="Y" className="border border-dashed border-[#FFD600]/40 bg-transparent text-[#FFD600]" /></>}
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                 <StockSquare color="K" current={me.latestStock?.drums.K} min={me.min?.drum_black_min} isDrum />
                                 {me.model?.is_color && (
                                   <>
                                     <StockSquare color="C" current={me.latestStock?.drums.C} min={me.min?.drum_cyan_min} isDrum />
                                     <StockSquare color="M" current={me.latestStock?.drums.M} min={me.min?.drum_magenta_min} isDrum />
                                     <StockSquare color="Y" current={me.latestStock?.drums.Y} min={me.min?.drum_yellow_min} isDrum />
                                   </>
                                 )}
                              </div>
                           </div>
                        </div>
                     </Card>
                   ))}
                </div>
             </div>

             {/* Modal Footer */}
             <div className="p-8 border-t border-border bg-black/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex gap-10">
                   <div>
                      <p className="text-[9px] font-black text-text-1 uppercase tracking-widest mb-2 opacity-30">Estoque de Papel A4</p>
                      <div className="flex items-center gap-4">
                         <div className={cn(
                             "px-4 py-2 rounded-xl flex items-center gap-3 border",
                             (selectedContract.latestPaper?.reams_current || 0) <= 5 ? "bg-danger/10 border-danger/30" : "bg-white border-border shadow-sm"
                         )}>
                            <span className="text-2xl font-black text-text-1 italic leading-none">{selectedContract.latestPaper?.reams_current || 0}</span>
                            <span className="text-[10px] font-black text-text-1 uppercase tracking-tight">RESMAS</span>
                         </div>
                         <Badge variant={ (selectedContract.latestPaper?.reams_current || 0) <= 5 ? "danger" : "success"} className="text-[8px] px-3 py-1">
                            {(selectedContract.latestPaper?.reams_current || 0) <= 5 ? 'Crítico' : 'Operacional'}
                         </Badge>
                      </div>
                   </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-initial h-14 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest border-border bg-white text-text-1 hover:bg-black hover:text-white transition-all">Relatório</Button>
                    <Button className="flex-1 md:flex-initial h-14 px-12 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">Reposição Imediata</Button>
                </div>
             </div>
          </div>
        </div>,
        document.body
      )}

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

const StockSquare = memo(({ color, current, min, isDrum }: { color: 'C' | 'M' | 'Y' | 'K' | 'neutral', current?: number, min?: number, isDrum?: boolean }) => {
  const isCritical = current !== undefined && min !== undefined && current <= min;
  
  const colorVariants = {
    C: { bg: 'bg-[#00ADEF] text-white border-transparent', stroke: 'text-[#00ADEF] border-[#00ADEF] bg-transparent' },
    M: { bg: 'bg-[#E10098] text-white border-transparent', stroke: 'text-[#E10098] border-[#E10098] bg-transparent' },
    Y: { bg: 'bg-[#FFD600] text-black border-transparent', stroke: 'text-[#FFD600] border-[#FFD600] bg-transparent' },
    K: { bg: 'bg-[#000000] text-white border-transparent', stroke: 'text-[#000000] border-[#000000] bg-transparent' },
    neutral: { bg: 'bg-white text-black border-border', stroke: 'text-black border-black bg-transparent' }
  };

  const variant = colorVariants[color] || colorVariants.neutral;

  return (
    <div className={cn(
      "p-4 rounded-[22px] border transition-all flex flex-col items-center justify-center bg-white shadow-sm",
      isCritical ? "border-danger bg-danger/[0.03]" : "border-border hover:border-black/20"
    )}>
       <div 
          className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center mb-3 font-black text-[10px] border shadow-sm transition-colors",
            isDrum ? cn("border-dashed", variant.stroke) : cn("border-solid", variant.bg)
          )}
       >
           {color}
       </div>
       <div className="flex flex-col items-center">
          <span className={cn("text-2xl font-black italic tracking-tighter leading-none", isCritical ? "text-danger" : "text-text-1")}>
            {current !== undefined ? current : '--'}
          </span>
          <div className="mt-2 text-[8px] font-black text-text-1 uppercase tracking-widest flex items-center gap-1">
             <span className="opacity-20 text-[6px]">MÍN:</span> 
             <span className="opacity-40">{min || '--'}</span>
          </div>
       </div>
    </div>
  );
});
