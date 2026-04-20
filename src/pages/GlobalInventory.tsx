import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Package, 
  BarChart3, 
  Layers, 
  Box,
  Monitor,
  Calendar,
  Search,
  X,
  ChevronRight,
  MapPin,
  Hash,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { cn } from '../lib/utils';
import { Card, Badge, CMYKBadge } from '../components/ui/Base';
import { format } from 'date-fns';

export const GlobalInventory = () => {
  const { 
    equipmentModels, 
    contractEquipment, 
    equipmentStockEntries,
    contracts,
  } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'COLOR' | 'MONO'>('ALL');
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const consolidatedStock = useMemo(() => {
    return equipmentModels
      .filter(model => {
        const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             model.brand.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'ALL' || 
                             (activeFilter === 'COLOR' && model.is_color) || 
                             (activeFilter === 'MONO' && !model.is_color);
        return matchesSearch && matchesFilter;
      })
      .map(model => {
        const machines = contractEquipment.filter(me => me.equipment_model_id === model.id && me.active);
        
        const machineStocks = machines.map(me => {
          const latest = [...equipmentStockEntries]
            .filter(e => e.contract_equipment_id === me.id)
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
          
          const contract = contracts.find(c => c.id === me.contract_id);

          return {
            me,
            contract,
            latest,
            isSynced: !!latest,
            lastSync: latest?.created_at
          };
        });

        const syncedCount = machineStocks.filter(s => s.isSynced).length;
        const lastSyncAt = machineStocks
          .map(s => s.lastSync)
          .filter(Boolean)
          .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0];

        const totals = {
          k: machineStocks.reduce((sum, s) => sum + (s.latest?.toner_black || 0), 0),
          c: machineStocks.reduce((sum, s) => sum + (s.latest?.toner_cyan || 0), 0),
          m: machineStocks.reduce((sum, s) => sum + (s.latest?.toner_magenta || 0), 0),
          y: machineStocks.reduce((sum, s) => sum + (s.latest?.toner_yellow || 0), 0),
          drum_k: machineStocks.reduce((sum, s) => sum + (s.latest?.drum_black || 0), 0),
          drum_c: machineStocks.reduce((sum, s) => sum + (s.latest?.drum_cyan || 0), 0),
          drum_m: machineStocks.reduce((sum, s) => sum + (s.latest?.drum_magenta || 0), 0),
          drum_y: machineStocks.reduce((sum, s) => sum + (s.latest?.drum_yellow || 0), 0),
          waste: 0,
          fuser: 0,
          belt: 0,
        };

        const grandTotal = totals.k + totals.c + totals.m + totals.y;

        return {
          ...model,
          machineCount: machines.length,
          syncedCount,
          pendingCount: machines.length - syncedCount,
          lastSyncAt,
          totals,
          grandTotal,
          machineStocks,
        };
      }).sort((a, b) => b.grandTotal - a.grandTotal);
  }, [equipmentModels, contractEquipment, equipmentStockEntries, contracts, searchTerm, activeFilter]);

  const selectedModel = useMemo(
    () => consolidatedStock.find(m => m.id === selectedModelId),
    [consolidatedStock, selectedModelId]
  );

  const stats = useMemo(() => {
    const totalMachines = consolidatedStock.reduce((sum, s) => sum + s.machineCount, 0);
    const totalToner = consolidatedStock.reduce((sum, s) => sum + s.grandTotal, 0);
    const activeModels = consolidatedStock.filter(s => s.machineCount > 0).length;

    return [
      { label: 'Modelos Ativos', value: activeModels, icon: Layers, color: 'primary' },
      { label: 'Parque Total', value: totalMachines, icon: Monitor, color: 'primary' },
      { label: 'Volume de Toners', value: totalToner, icon: Package, color: 'primary' },
      { label: 'Média/Máquina', value: totalMachines ? (totalToner / totalMachines).toFixed(1) : 0, icon: BarChart3, color: 'primary' },
    ];
  }, [consolidatedStock]);

  return (
    <div className="space-y-8 animate-fade pb-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />
            <p className="text-[10px] font-black text-text-1 uppercase tracking-[0.4em] opacity-40 leading-none">AUDITORIA DE ATIVOS GLOBAIS</p>
          </div>
          <h2 className="text-5xl font-black text-text-1 tracking-tighter uppercase leading-none flex items-baseline gap-4 italic font-black">
            INVENTÁRIO <span className="text-text-1 opacity-10 not-italic">CONSOLIDADO</span>
          </h2>
          <p className="text-[11px] font-black text-text-1 uppercase tracking-[0.2em] mt-3 opacity-40">Cálculo Geral de Disponibilidade por Modelo e Unidade</p>
        </div>
        <div className="flex bg-surface px-5 py-2.5 rounded-full border border-border gap-3 shadow-sm items-center">
           <Calendar size={16} className="text-text-1 opacity-20" />
           <p className="text-[10px] font-black text-text-1 uppercase tracking-widest">{format(new Date(), 'MMMM yyyy')}</p>
        </div>
      </header>
      
      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 px-4 items-end">
        <div className="relative group">
          <label className="text-[10px] font-black text-text-2 uppercase ml-6 mb-2 block tracking-[0.3em]">Cálculo Global de Ativos</label>
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-1 opacity-20" size={22} />
            <input
              type="text"
              placeholder="PESQUISAR POR MODELO OU MARCA..."
              className="w-full h-16 bg-surface border border-border rounded-[24px] pl-16 pr-8 text-[11px] font-black uppercase tracking-[0.2em] text-text-1 outline-none focus:ring-4 focus:ring-black/5 transition-all placeholder:text-text-1 placeholder:opacity-20 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-[10px] font-black text-text-2 uppercase ml-6 mb-2 block tracking-[0.3em]">Matriz de Filtro</label>
          <div className="flex bg-surface border border-border p-1.5 rounded-[28px] shadow-sm overflow-x-auto">
              {['ALL', 'COLOR', 'MONO'].map(filter => (
                  <button
                      key={filter}
                      onClick={() => setActiveFilter(filter as any)}
                      className={cn(
                          "px-10 h-14 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                          activeFilter === filter 
                              ? "bg-primary text-black shadow-lg shadow-primary/20" 
                              : "text-text-1 hover:bg-black/5 opacity-40 hover:opacity-100"
                      )}
                  >
                      {filter === 'ALL' ? 'TUDO' : filter}
                  </button>
              ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {stats.map((s, i) => (
          <Card key={i} className="p-6 border border-border rounded-[30px] bg-surface shadow-sm group hover:-translate-y-1 transition-all duration-300">
             <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center text-text-1 group-hover:bg-black group-hover:text-primary transition-all">
                   <s.icon size={20} />
                </div>
             </div>
             <p className="text-[9px] font-black text-text-1 uppercase tracking-widest opacity-30 mb-1">{s.label}</p>
             <p className="text-2xl font-black text-text-1 italic tracking-tighter">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {consolidatedStock.map(model => (
          <Card key={model.id} className="p-8 border border-border rounded-[40px] bg-surface shadow-sm overflow-hidden group hover:border-primary/30 transition-all flex flex-col">
             <div className="flex justify-between items-start mb-6 border-b border-border/10 pb-6">
                <div className="min-w-0">
                   <div className="flex items-center gap-2 mb-2 leading-none flex-wrap">
                       <span className="text-[9px] font-black text-white bg-black px-2 py-0.5 rounded-md uppercase tracking-widest">{model.brand}</span>
                       <Badge variant="neutral" className="text-[8px] font-black opacity-40">{model.machineCount} ATIVOS</Badge>
                       <span className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded-md",
                          model.pendingCount > 0 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                       )}>
                          {model.syncedCount}/{model.machineCount} SINCRONIZADOS
                       </span>
                   </div>
                   <h3 className="text-2xl font-black text-text-1 uppercase italic tracking-tighter leading-none mb-3 truncate">{model.name}</h3>
                   <div className="flex flex-col gap-1">
                       <p className="text-[7px] font-black text-text-1 opacity-20 uppercase tracking-[0.3em]">ÚLTIMA ATUALIZAÇÃO GLOBAL</p>
                       <p className="text-[10px] font-black text-text-1 uppercase italic tracking-widest truncate">
                          {model.lastSyncAt ? new Date(model.lastSyncAt).toLocaleString('pt-BR') : 'SEM REGISTRO'}
                       </p>
                    </div>
                </div>
                <div className="w-12 h-12 rounded-[18px] bg-black/5 flex items-center justify-center text-text-1 opacity-20 group-hover:opacity-100 transition-all shrink-0">
                   <Box size={24} />
                </div>
             </div>

             <div className="space-y-6 flex-1">
                {/* Toners Section */}
                <div className="space-y-4">
                   <div className="text-[9px] font-black text-text-1 uppercase tracking-[0.2em] opacity-30 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary" /> TONERS
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <StockMetric label="BLACK" value={model.totals.k} color="K" />
                      {model.is_color && (
                        <>
                          <StockMetric label="CYAN" value={model.totals.c} color="C" />
                          <StockMetric label="MAGENTA" value={model.totals.m} color="M" />
                          <StockMetric label="YELLOW" value={model.totals.y} color="Y" />
                        </>
                      )}
                   </div>
                </div>

                {/* Drums Section */}
                <div className="space-y-4">
                   <div className="text-[9px] font-black text-text-1 uppercase tracking-[0.2em] opacity-30 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary" /> CILINDROS
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <StockMetric label="BLACK" value={model.totals.drum_k} color="K" />
                      {model.is_color && (
                        <>
                          <StockMetric label="CYAN" value={model.totals.drum_c} color="C" />
                          <StockMetric label="MAGENTA" value={model.totals.drum_m} color="M" />
                          <StockMetric label="YELLOW" value={model.totals.drum_y} color="Y" />
                        </>
                      )}
                   </div>
                </div>
             </div>

             {/* Ver Detalhes Button */}
             <button
               onClick={() => setSelectedModelId(model.id)}
               className="mt-8 w-full h-12 flex items-center justify-center gap-2 border border-border rounded-[16px] text-[10px] font-black uppercase tracking-widest text-text-1 opacity-40 hover:opacity-100 hover:border-black hover:bg-black hover:text-white transition-all group/btn"
             >
               <span>Ver Detalhes</span>
               <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
             </button>
          </Card>
        ))}
      </div>

      {consolidatedStock.length === 0 && (
         <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fade">
            <div className="w-20 h-20 rounded-[30px] bg-black/5 flex items-center justify-center text-text-1 opacity-20 mb-6">
               <Search size={40} />
            </div>
            <h3 className="text-2xl font-black text-text-1 uppercase italic tracking-tighter mb-2">Zonas Sem Ativos</h3>
            <p className="text-[10px] font-black text-text-1 uppercase tracking-widest opacity-30">Nenhum modelo de equipamento corresponde aos critérios de pesquisa</p>
         </div>
      )}

      {/* Detail Modal */}
      {selectedModel && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-8 bg-black/70 backdrop-blur-xl animate-fade">
          <div className="w-full max-w-5xl bg-surface border border-border rounded-[48px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh] overflow-hidden relative z-[1000] animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[9px] font-black text-white bg-black px-3 py-1 rounded-lg uppercase tracking-widest">{selectedModel.brand}</span>
                  <span className="text-[10px] font-black text-text-1 opacity-30 uppercase tracking-widest">{selectedModel.machineCount} UNIDADES NO PARQUE</span>
                </div>
                <h3 className="text-4xl font-black text-text-1 uppercase italic tracking-tighter leading-none">{selectedModel.name}</h3>
                <div className="flex items-center gap-6 mt-3">
                  <span className={cn("text-[10px] font-black uppercase px-3 py-1 rounded-lg", selectedModel.pendingCount > 0 ? "bg-warning/10 text-warning" : "bg-success/10 text-success")}>
                    {selectedModel.syncedCount}/{selectedModel.machineCount} sincronizados
                  </span>
                  <span className="text-[9px] font-black text-text-1 opacity-20 uppercase tracking-widest">
                    {selectedModel.is_color ? '4 CORES' : 'MONO'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedModelId(null)}
                title="Fechar"
                className="w-14 h-14 rounded-full bg-black/5 hover:bg-danger hover:text-white transition-all flex items-center justify-center group shrink-0"
              >
                <X size={24} className="group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            {/* Totals Summary Bar */}
            <div className="px-10 py-5 bg-black/[0.02] border-b border-border/5 flex flex-wrap gap-6 shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-text-1 opacity-30 uppercase tracking-[0.3em]">SALDO TOTAL TONERS</span>
                <div className="flex gap-2">
                  {[
                    { type: 'K' as const, val: selectedModel.totals.k },
                    ...(selectedModel.is_color ? [
                      { type: 'C' as const, val: selectedModel.totals.c },
                      { type: 'M' as const, val: selectedModel.totals.m },
                      { type: 'Y' as const, val: selectedModel.totals.y },
                    ] : []),
                  ].map(({ type, val }) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <CMYKBadge type={type} />
                      <span className="text-[13px] font-black text-text-1 italic">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-px bg-border/30" />
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-text-1 opacity-30 uppercase tracking-[0.3em]">CILINDROS</span>
                <div className="flex gap-2">
                  {[
                    { type: 'K' as const, val: selectedModel.totals.drum_k },
                    ...(selectedModel.is_color ? [
                      { type: 'C' as const, val: selectedModel.totals.drum_c },
                      { type: 'M' as const, val: selectedModel.totals.drum_m },
                      { type: 'Y' as const, val: selectedModel.totals.drum_y },
                    ] : []),
                  ].map(({ type, val }) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <CMYKBadge type={type} className="border border-dashed bg-transparent" />
                      <span className="text-[13px] font-black text-text-1 italic opacity-60">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Per-Machine List */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
              <div className="flex items-center gap-3 mb-6">
                <Monitor size={18} className="text-text-1 opacity-20" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-text-1 opacity-40">Saldo por Unidade</h4>
              </div>

              {selectedModel.machineStocks.map(({ me, contract, latest, isSynced, lastSync }) => (
                <div key={me.id} className={cn(
                  "p-6 border rounded-[28px] transition-all",
                  isSynced ? "border-border bg-surface hover:border-black/20" : "border-dashed border-border/40 bg-black/[0.01] opacity-60"
                )}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0",
                        isSynced ? "bg-black text-white" : "bg-black/5 text-text-1 opacity-30"
                      )}>
                        {isSynced ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[12px] font-black text-text-1 uppercase italic tracking-tight leading-none">
                            {contract?.name || 'Contrato Desconhecido'}
                          </span>
                          {contract?.code && (
                            <span className="text-[8px] font-black bg-black text-white px-2 py-0.5 rounded uppercase tracking-widest">{contract.code}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-text-1 opacity-30 uppercase">
                            <Hash size={11} /> {me.serial_number || 'S/N —'}
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-text-1 opacity-30 uppercase">
                            <MapPin size={11} /> {me.location || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[8px] font-black text-text-1 opacity-20 uppercase tracking-[0.3em] mb-1">ÚLTIMA SINCRONIA</p>
                      <span className={cn(
                        "text-[10px] font-black uppercase italic tracking-widest px-3 py-1 rounded-lg",
                        isSynced ? "bg-success/10 text-success" : "bg-black/5 text-text-1 opacity-30"
                      )}>
                        {lastSync ? new Date(lastSync).toLocaleString('pt-BR') : 'SEM REGISTRO'}
                      </span>
                    </div>
                  </div>

                  {latest ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 pt-4 border-t border-border/10">
                      {/* Toners */}
                      <MiniStock label="Toner K" value={latest.toner_black} type="K" />
                      {latest.toner_cyan !== undefined && latest.toner_cyan > 0 && <MiniStock label="Toner C" value={latest.toner_cyan} type="C" />}
                      {latest.toner_magenta !== undefined && latest.toner_magenta > 0 && <MiniStock label="Toner M" value={latest.toner_magenta} type="M" />}
                      {latest.toner_yellow !== undefined && latest.toner_yellow > 0 && <MiniStock label="Toner Y" value={latest.toner_yellow} type="Y" />}
                      {/* Drums */}
                      {latest.drum_black !== undefined && latest.drum_black > 0 && <MiniStock label="Cil. K" value={latest.drum_black} type="K" isDrum />}
                      {latest.drum_cyan !== undefined && latest.drum_cyan > 0 && <MiniStock label="Cil. C" value={latest.drum_cyan} type="C" isDrum />}
                      {latest.drum_magenta !== undefined && latest.drum_magenta > 0 && <MiniStock label="Cil. M" value={latest.drum_magenta} type="M" isDrum />}
                      {latest.drum_yellow !== undefined && latest.drum_yellow > 0 && <MiniStock label="Cil. Y" value={latest.drum_yellow} type="Y" isDrum />}
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-border/10 flex items-center gap-2">
                      <Clock size={14} className="text-text-1 opacity-20" />
                      <span className="text-[10px] font-black text-text-1 opacity-20 uppercase tracking-widest italic">Aguardando primeira sincronização</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const StockMetric = ({ label, value, color }: { label: string, value: number, color: 'K' | 'C' | 'M' | 'Y' }) => {
  const colorClasses = {
    C: 'bg-[#00ADEF] text-white',
    M: 'bg-[#E10098] text-white',
    Y: 'bg-[#FFD600] text-black',
    K: 'bg-[#000000] text-white'
  };

  const activeClass = colorClasses[color] || 'bg-black text-white';

  return (
    <div className="bg-bg border border-border p-4 rounded-[20px] flex flex-col items-center justify-center shadow-inner group/metric hover:border-primary/20 transition-all">
       <div 
          className={cn(
             "w-6 h-6 rounded-md mb-2 flex items-center justify-center text-[9px] font-black border border-black/5 shadow-sm",
             activeClass
          )}
       >
          {color}
       </div>
       <span className="text-xl font-black text-text-1 italic tracking-tighter leading-none">{value}</span>
       <span className="text-[7px] font-black text-text-1 uppercase tracking-widest mt-1 opacity-20">{label}</span>
    </div>
  );
};

const MiniStock = ({ label, value, type, isDrum }: { label: string, value?: number, type: 'K' | 'C' | 'M' | 'Y', isDrum?: boolean }) => {
  const colorMap = {
    K: { solid: 'bg-black text-white', stroke: 'border-black/60 text-black' },
    C: { solid: 'bg-[#00ADEF] text-white', stroke: 'border-[#00ADEF] text-[#00ADEF]' },
    M: { solid: 'bg-[#E10098] text-white', stroke: 'border-[#E10098] text-[#E10098]' },
    Y: { solid: 'bg-[#FFD600] text-black', stroke: 'border-[#FFD600] text-[#FFD600]' },
  };
  const cls = isDrum ? colorMap[type].stroke : colorMap[type].solid;

  return (
    <div className="flex flex-col items-center gap-1.5 p-3 bg-bg border border-border rounded-[16px] hover:border-black/20 transition-all">
      <div className={cn(
        "w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black border",
        isDrum ? cn("bg-transparent border-dashed", cls) : cn("border-transparent", cls)
      )}>
        {type}
      </div>
      <span className="text-lg font-black text-text-1 italic leading-none">{value ?? '--'}</span>
      <span className="text-[7px] font-black text-text-1 opacity-20 uppercase tracking-tight text-center leading-none">{label}</span>
    </div>
  );
};
