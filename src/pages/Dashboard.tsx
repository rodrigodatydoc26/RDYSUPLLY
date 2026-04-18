import { useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
  Activity,
  Monitor
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDataStore } from '../store/useDataStore';
import { format, subDays } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import { Card, Badge, Button } from '../components/ui/Base';
import type { EquipmentStockEntry, EquipmentMinStock } from '../types';

export const Dashboard = () => {
  const navigate = useNavigate();
  const {
    contracts,
    contractEquipment,
    equipmentStockEntries,
    equipmentMinStock
  } = useDataStore();

  const today = format(new Date(), 'yyyy-MM-dd');

  const kpis = useMemo(() => {
    const activeContracts = contracts.filter(c => c.active).length;
    const machinesCount = contractEquipment.filter(e => e.active).length;
    
    // Count alerts across all machines
    const alertsCount = contractEquipment.filter(me => {
      const min = equipmentMinStock.find(ms => ms.contract_equipment_id === me.id);
      const latest = [...equipmentStockEntries]
        .filter(e => e.contract_equipment_id === me.id)
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
      
      return checkMachineAlerts(latest, min);
    }).length;

    const updatedToday = new Set(equipmentStockEntries.filter(e => format(new Date(e.created_at || ''), 'yyyy-MM-dd') === today).map(e => e.contract_equipment_id)).size;
    const syncRate = machinesCount > 0 ? Math.round((updatedToday / machinesCount) * 100) : 0;

    return [
      { label: 'Unidades Ativas', value: activeContracts, icon: FileText, color: 'primary' },
      { label: 'Parque Instalado', value: machinesCount, icon: Monitor, color: 'primary' },
      { label: 'Alertas de Máquina', value: alertsCount, icon: AlertCircle, color: 'danger' },
      { label: 'Sincronização', value: `${syncRate}%`, icon: CheckCircle2, color: 'success' },
    ];
  }, [contracts, contractEquipment, equipmentStockEntries, equipmentMinStock, today]);

  const criticalMachines = useMemo(() => {
    return contractEquipment
      .filter(me => {
        const min = equipmentMinStock.find(ms => ms.contract_equipment_id === me.id);
        const latest = [...equipmentStockEntries]
          .filter(e => e.contract_equipment_id === me.id)
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
        return checkMachineAlerts(latest, min);
      })
      .map(me => {
        const contract = contracts.find(c => c.id === me.contract_id);
        return {
          id: me.id,
          name: contract?.name || 'Unknown',
          serial: me.serial_number,
          location: me.location,
          status: 'Crítico'
        };
      })
      .slice(0, 5);
  }, [contractEquipment, contracts, equipmentStockEntries, equipmentMinStock]);

  const chartData = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const date = subDays(new Date(), 13 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = equipmentStockEntries.filter(e => format(new Date(e.created_at || ''), 'yyyy-MM-dd') === dateStr);
      const totalOut = dayEntries.reduce((sum, e) => sum + (e.toner_black_out || 0) + (e.toner_cyan_out || 0) + (e.toner_magenta_out || 0) + (e.toner_yellow_out || 0), 0);
      return { name: format(date, 'dd/MM'), consumo: totalOut };
    });
  }, [equipmentStockEntries]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-6 animate-fade pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary" />
            <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.3em] leading-none">Intelligence Dashboard v2</p>
          </div>
          <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            RDY <span className="text-text-2 font-light not-italic opacity-30">COMMAND CENTER</span>
          </h2>
        </div>
        <div className="flex bg-surface p-1 rounded-2xl border border-border">
          <div className="px-5 py-2 flex items-center gap-3">
             <Activity size={14} className="text-primary" />
             <p className="text-[10px] font-black text-text-1 uppercase tracking-widest">{format(new Date(), 'dd.MM HH:mm')}</p>
          </div>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card 
            key={i} 
            className="group hover:-translate-y-1 transition-transform cursor-pointer focus:ring-2 focus:ring-primary outline-none"
            onClick={() => navigate('/unidades')}
            role="button"
            tabIndex={0}
            aria-label={`Ver detalhes de ${kpi.label}: ${kpi.value}`}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/unidades')}
          >
             <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-bg border border-border flex items-center justify-center text-text-2 group-hover:bg-primary group-hover:text-secondary group-hover:border-transparent transition-all">
                      <kpi.icon size={24} strokeWidth={2.5} />
                   </div>
                   <div className="w-2 h-2 rounded-full bg-border group-hover:bg-primary transition-colors" />
                </div>
                <p className="text-[10px] font-black text-text-2 uppercase tracking-widest mb-2">{kpi.label}</p>
                <div className="flex items-baseline gap-2">
                   <p className="text-3xl font-black text-text-1 italic tracking-tighter leading-none">{kpi.value}</p>
                   <ArrowUpRight size={16} className="text-text-2 group-hover:text-primary transition-all" />
                </div>
             </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Chart */}
        <Card className="lg:col-span-2 p-10">
           <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                 <Activity size={20} className="text-primary" />
                 <h4 className="text-[11px] font-black text-text-1 uppercase tracking-[0.2em] italic">VOLUMETRIA DE CONSUMO (14 DIAS)</h4>
              </div>
           </div>
           <div className="h-[300px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-2)', fontWeight: '900' }} dy={10} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-2)', fontWeight: '900' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '24px' }}
                      itemStyle={{ color: 'var(--color-text-1)', fontWeight: '900', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="consumo" stroke="var(--color-primary)" strokeWidth={4} fill="url(#colorConsumo)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
           </div>
        </Card>

        {/* Critical Alerts List */}
        <Card className="p-10">
           <div className="flex items-center gap-3 mb-8">
              <AlertCircle size={20} className="text-danger" />
              <h4 className="text-[11px] font-black text-text-1 uppercase tracking-[0.2em] italic">EQUIPAMENTOS CRÍTICOS</h4>
           </div>
           
           <div className="space-y-4">
              {criticalMachines.length > 0 ? (
                criticalMachines.map((m, i) => (
                  <div 
                    key={i} 
                    className="p-5 bg-bg border border-border rounded-2xl hover:border-danger transition-all cursor-pointer group focus:ring-2 focus:ring-danger outline-none"
                    onClick={() => navigate('/estoque')}
                    role="button"
                    tabIndex={0}
                    aria-label={`Equipamento crítico em ${m.name}: Serial ${m.serial}`}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/estoque')}
                  >
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-black text-text-1 uppercase italic tracking-tight">{m.name}</p>
                        <Badge variant="danger" className="text-[8px]">REPOSIÇÃO</Badge>
                     </div>
                     <div className="flex items-center justify-between text-[9px] font-bold text-text-2 uppercase tracking-widest">
                        <span>S/N: {m.serial}</span>
                        <span>{m.location}</span>
                     </div>
                  </div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center opacity-10">
                   <ShieldCheck size={48} className="mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em]">SISTEMA NOMINAL</p>
                </div>
              )}
           </div>

           <Button 
            variant="outline" 
            className="w-full mt-8 h-12 text-[10px] font-black uppercase tracking-widest"
            onClick={() => navigate('/estoque')}
           >
             Ver Todo o Parque
           </Button>
        </Card>
      </div>
    </div>
  );
};

// Utility to check alerts
function checkMachineAlerts(entry: EquipmentStockEntry | undefined, min: EquipmentMinStock | undefined) {
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

