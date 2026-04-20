import { useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertCircle,
  ArrowUpRight,
  Activity,
  Monitor,
  Truck
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDataStore } from '../store/useDataStore';
import { format, subDays } from 'date-fns';
import { useMemo, useState, useEffect, memo } from 'react';
import { Card, Button } from '../components/ui/Base';
import { cn } from '../lib/utils';

export const Dashboard = memo(() => {
  const navigate = useNavigate();
  const contracts = useDataStore(s => s.contracts);
  const contractEquipment = useDataStore(s => s.contractEquipment);
  const equipmentStockEntries = useDataStore(s => s.equipmentStockEntries);
  const stockAlerts = useDataStore(s => s.stockAlerts);

  const kpis = useMemo(() => {
    const activeContracts = contracts.filter(c => c.active).length;
    const machinesCount = contractEquipment.filter(e => e.active).length;
    const activeAlerts = stockAlerts.filter(a => !a.resolved).length;
    
    return [
      { label: 'Unidades Ativas', value: activeContracts, icon: FileText, color: 'primary' },
      { label: 'Parque Instalado', value: machinesCount, icon: Monitor, color: 'primary' },
      { label: 'Alertas de Estoque', value: activeAlerts, icon: AlertCircle, color: 'danger' },
      { label: 'Pendências Técnicas', value: 12, icon: Truck, color: 'primary' },
    ];
  }, [contracts, contractEquipment, stockAlerts]);

  const chartData = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const date = subDays(new Date(), 13 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = equipmentStockEntries.filter(e => e.created_at && format(new Date(e.created_at), 'yyyy-MM-dd') === dateStr);
      const totalOut = dayEntries.reduce((sum, e) => sum + (e.toner_black_out || 0) + (e.toner_cyan_out || 0) + (e.toner_magenta_out || 0) + (e.toner_yellow_out || 0), 0);
      return { name: format(date, 'dd/MM'), value: totalOut };
    });
  }, [equipmentStockEntries]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="space-y-8 animate-fade pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50" />
            <p className="text-[10px] font-black text-text-1 uppercase tracking-[0.4em] opacity-40 leading-none">INTELIGÊNCIA DE ATIVOS</p>
          </div>
          <h2 className="text-5xl font-black text-text-1 tracking-tighter uppercase leading-none flex items-baseline gap-3">
            STATUS <span className="text-text-1 opacity-10">OPERACIONAL</span>
          </h2>
          <p className="text-[10px] font-black text-text-1 uppercase tracking-[0.2em] mt-3 opacity-30 italic">Terminal de Performance RDY Supply</p>
        </div>
        <div className="flex bg-surface px-5 py-2.5 rounded-full border border-border gap-3 shadow-sm">
           <Activity size={16} className="text-text-1 opacity-20" />
           <p className="text-[10px] font-black text-text-1 uppercase tracking-widest">{format(new Date(), 'dd.MM HH:mm')}</p>
        </div>
      </header>

      {/* KPI GRID - V2 Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
        {kpis.map((kpi, i) => (
          <Card 
            key={i} 
            className="group hover:-translate-y-1 transition-all duration-300 border border-border rounded-[28px] overflow-hidden bg-surface shadow-sm hover:shadow-xl"
          >
             <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                   <div className={cn(
                       "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                       kpi.color === 'danger' ? "bg-danger/10 text-danger" : "bg-black/5 text-text-1 group-hover:bg-black group-hover:text-white"
                   )}>
                      <kpi.icon size={22} />
                   </div>
                </div>
                <p className="text-[9px] font-black text-text-1 uppercase tracking-[0.1em] opacity-30 mb-0.5">{kpi.label}</p>
                <div className="flex items-baseline gap-1.5">
                   <p className="text-3xl font-black text-text-1 italic tracking-tighter leading-none">{kpi.value}</p>
                   <ArrowUpRight size={14} className="text-text-1 opacity-10 group-hover:opacity-100 transition-opacity" />
                </div>
             </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-12 px-4">
        {/* Outflow Matrix Chart */}
        <Card className="p-8 border border-border rounded-[40px] bg-surface shadow-sm overflow-hidden min-h-[450px]">
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-magenta/10 flex items-center justify-center text-magenta">
                    <Activity size={24} strokeWidth={3} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-text-1 uppercase italic tracking-tighter">OUTFLOW MATRIX / PERFORMANCE</h3>
                    <p className="text-[10px] font-black text-text-1 uppercase tracking-widest mt-1 opacity-20">Análise de Vazão Operacional e Eficiência</p>
                 </div>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2 bg-black/5 rounded-full border border-border/5">
                 <div className="w-2 h-2 rounded-full bg-magenta animate-pulse" />
                 <span className="text-[9px] font-black text-text-1 uppercase tracking-widest">MÉDIA DE ENTRADA</span>
              </div>
           </div>
           
           <div className="h-[300px] w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--rdy-magenta)" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="var(--rdy-magenta)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="var(--rdy-border)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--rdy-text-1)', fontSize: 9, fontWeight: 900 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--rdy-text-1)', fontSize: 9, fontWeight: 900 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px' }}
                      itemStyle={{ color: 'var(--rdy-magenta)', fontSize: '10px', fontWeight: '900' }}
                      labelStyle={{ color: '#fff', fontSize: '9px', opacity: 0.5 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="var(--rdy-magenta)" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      dot={{ r: 3, fill: 'var(--rdy-magenta)', strokeWidth: 2, stroke: 'var(--rdy-surface)' }}
                      activeDot={{ r: 6, fill: 'var(--rdy-magenta)', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
           </div>
        </Card>

        {/* Critical Buffer Alert Section */}
        <Card className="p-8 border border-border rounded-[40px] bg-surface shadow-sm overflow-hidden">
           <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-6">
                 <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-danger/10 flex items-center justify-center text-danger border-[3px] border-danger/10">
                        <AlertCircle size={28} />
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger rounded-full border-2 border-surface animate-ping" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-text-1 uppercase italic tracking-tighter">CRITICAL BUFFER ALERT</h3>
                    <p className="text-[10px] font-black text-danger uppercase tracking-[0.3em] mt-0.5 opacity-60">REPOSIÇÃO IMEDIATA OBRIGATÓRIA</p>
                 </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/inventory')}
                className="h-14 px-10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-border flex items-center gap-3 hover:bg-black hover:text-white transition-all shadow-lg"
              >
                GESTÃO COMPLETA <ArrowUpRight size={16} />
              </Button>
           </div>

           <div className="grid grid-cols-[2fr_1fr_1fr] px-8 pb-6 border-b border-border">
              <span className="text-[10px] font-black text-text-1 opacity-20 uppercase tracking-[0.4em]">UNIDADE / CONTRATO</span>
              <span className="text-[10px] font-black text-text-1 opacity-20 uppercase tracking-[0.4em] text-center">SALDO</span>
              <span className="text-[10px] font-black text-text-1 opacity-20 uppercase tracking-[0.4em] text-right">GATILHO</span>
           </div>

           <div className="divide-y divide-border/10">
              {contracts.slice(0, 4).map((contract, idx) => (
                <div key={contract.id} className="grid grid-cols-[2fr_1fr_1fr] px-8 py-5 items-center hover:bg-black/[0.02] transition-all rounded-[20px] mt-1 group">
                   <div className="flex items-center gap-5">
                      <div className="w-2.5 h-2.5 rounded-full bg-danger shadow-md shadow-danger/40 transition-transform group-hover:scale-125" />
                      <div>
                        <span className="text-[14px] font-black text-text-1 uppercase italic tracking-tight block leading-tight">{contract.name}</span>
                        <span className="text-[8px] font-black text-text-2 uppercase tracking-widest opacity-40">{contract.code}</span>
                      </div>
                   </div>
                   <div className="text-center font-black text-3xl text-text-1 italic tracking-tighter">
                      {84 + idx * 5} <span className="text-[10px] opacity-20 not-italic ml-1">UN</span>
                   </div>
                   <div className="text-right font-black text-3xl text-danger italic tracking-tighter">
                      100 <span className="text-[10px] opacity-20 not-italic ml-1">UN</span>
                   </div>
                </div>
              ))}
           </div>
        </Card>
      </div>
    </div>
  );
});
