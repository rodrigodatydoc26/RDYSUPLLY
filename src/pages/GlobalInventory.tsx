import { useMemo, useState } from 'react';
import { 
  Package, 
  BarChart3, 
  Layers, 
  Box,
  Monitor,
  Calendar,
  Search
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { cn } from '../lib/utils';
import { Card, Badge } from '../components/ui/Base';
import { format } from 'date-fns';

export const GlobalInventory = () => {
  const { 
    equipmentModels, 
    contractEquipment, 
    equipmentStockEntries,
  } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'COLOR' | 'MONO'>('ALL');

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
        // Find all machines of this model
        const machines = contractEquipment.filter(me => me.equipment_model_id === model.id && me.active);
        
        const machineStocks = machines.map(me => {
          // Find latest entry for this specific machine
          const latest = [...equipmentStockEntries]
            .filter(e => e.contract_equipment_id === me.id)
            .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
          
          return {
            me,
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
          grandTotal
        };
      }).sort((a, b) => b.grandTotal - a.grandTotal);
  }, [equipmentModels, contractEquipment, equipmentStockEntries, searchTerm, activeFilter]);

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
      
      {/* V2 Filter & Search Bar - Replicated from Inventory */}
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
          <Card key={model.id} className="p-8 border border-border rounded-[40px] bg-surface shadow-sm overflow-hidden group hover:border-primary/30 transition-all">
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

             <div className="space-y-6">
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

                {/* Others/Supplies Section */}
                <div className="space-y-4">
                   <div className="text-[9px] font-black text-text-1 uppercase tracking-[0.2em] opacity-30 flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-primary" /> COMPONENTES
                   </div>
                   <div className="grid grid-cols-1 gap-2">
                      <SuppliesRow label="Resíduo" value={model.totals.waste} icon={Box} />
                      <SuppliesRow label="Fusor" value={model.totals.fuser} icon={Monitor} />
                   </div>
                </div>
             </div>
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

const SuppliesRow = ({ label, value, icon: Icon }: { label: string, value: number, icon: any }) => (
  <div className="flex items-center justify-between p-3 bg-bg/50 rounded-xl border border-border/5">
     <div className="flex items-center gap-2">
        <Icon size={14} className="text-text-1 opacity-20" />
        <span className="text-[9px] font-black text-text-1 uppercase tracking-tight opacity-40">{label}</span>
     </div>
     <span className="text-[13px] font-black text-text-1 italic">{value} <span className="text-[8px] opacity-20 not-italic">UN</span></span>
  </div>
);
