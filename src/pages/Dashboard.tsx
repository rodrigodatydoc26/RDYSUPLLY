import { Users, FileText, AlertCircle, CheckCircle2, BarChart3, ArrowRight, Box, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDataStore } from '../store/useDataStore';
import { format, subDays } from 'date-fns';
import { useState, useMemo } from 'react';

export const Dashboard = () => {
  const { contracts, users, stockEntries, contractSupplies, supplyTypes, resolvedAlertIds } = useDataStore();

  const [contractFilter, setContractFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [chartContractId] = useState('all');
  const [chartSupplyId] = useState('all');

  const today = format(new Date(), 'yyyy-MM-dd');

  const kpis = useMemo(() => {
    const activeContracts = contracts?.filter(c => c.active)?.length || 0;
    const activeTechs = users?.filter(u => u.role === 'technician' && u.active)?.length || 0;
    const activeAlerts = stockEntries?.filter(entry => {
      if (resolvedAlertIds?.includes(entry.id)) return false;
      const cs = contractSupplies?.find(cs => cs.contract_id === entry.contract_id && cs.supply_type_id === entry.supply_type_id);
      return cs && entry.current_stock <= cs.min_stock;
    })?.length || 0;
    const updatedToday = new Set(stockEntries?.filter(e => e.entry_date === today)?.map(e => e.contract_id))?.size || 0;
    const updateRate = activeContracts > 0 ? Math.round((updatedToday / activeContracts) * 100) : 0;
    return [
      { label: 'Contratos Ativos', value: activeContracts, icon: FileText, color: 'primary' },
      { label: 'Técnicos Ativos', value: activeTechs, icon: Users, color: 'primary' },
      { label: 'Alertas Críticos', value: activeAlerts, icon: AlertCircle, color: 'danger' },
      { label: 'Atualizado Hoje', value: `${updateRate}%`, icon: CheckCircle2, color: 'success' },
    ];
  }, [contracts, users, stockEntries, contractSupplies, resolvedAlertIds, today]);

  const criticalStockItems = useMemo(() => {
    return (stockEntries || [])
      .filter(entry => {
        if (resolvedAlertIds?.includes(entry.id)) return false;
        const cs = contractSupplies?.find(cs => cs.contract_id === entry.contract_id && cs.supply_type_id === entry.supply_type_id);
        return cs && entry.current_stock <= cs.min_stock;
      })
      .map(entry => {
        const contract = contracts?.find(c => c.id === entry.contract_id);
        const supply = supplyTypes?.find(s => s.id === entry.supply_type_id);
        const cs = contractSupplies?.find(cs => cs.contract_id === entry.contract_id && cs.supply_type_id === entry.supply_type_id);
        return {
          contractName: contract?.name || '—',
          stock: entry.current_stock,
          unit: supply?.unit || '',
          min: cs?.min_stock || 0
        };
      });
  }, [stockEntries, contracts, supplyTypes, contractSupplies, resolvedAlertIds]);


  const chartData = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const date = subDays(new Date(), 13 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const filtered = stockEntries.filter(e => e.entry_date === dateStr);
      const saldo = filtered.length ? Math.round(filtered.reduce((s, e) => s + e.current_stock, 0) / filtered.length) : null;
      return { name: format(date, 'dd/MM'), saldo };
    });
  }, [stockEntries]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <p className="text-text-2 text-[9px] font-black uppercase tracking-[0.4em]">Painel Inteligente em Tempo Real</p>
          </div>
            <h2 className="text-xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
              Status <span className="text-text-2/40">Operacional</span>
            </h2>
            <p className="text-[9px] font-black text-text-2 uppercase tracking-widest mt-1 opacity-60">Plataforma de Inteligência RDY</p>
          </div>
          <div className="flex bg-surface/50 p-0.5 rounded border border-border">
             <div className="px-3 py-1 flex items-center gap-2">
                <Box size={10} className="text-primary/60" />
                <p className="text-[8px] font-black text-text-2 uppercase tracking-wide">{contracts.length} Operações</p>
             </div>
             <div className="w-px h-3 my-auto bg-border" />
             <div className="px-3 py-1 flex items-center gap-2">
                <ShieldCheck size={10} className="text-primary/60" />
                <p className="text-[8px] font-black text-text-2 uppercase tracking-wide">Fluxo Ativo</p>
             </div>
          </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <div key={i} className="group relative">
            <div className={`p-0.5 w-full bg-surface/50 rounded-2xl border border-border transition-all duration-700 group-hover:bg-primary/5 group-hover:-translate-y-1`}>
              <div className="bg-surface/40 p-4 rounded-[0.9rem] backdrop-blur-xl">
                 <div className="flex justify-between items-start mb-4">
                    <div className={`text-text-2 group-hover:text-${kpi.color} transition-colors duration-700`}>
                      <kpi.icon size={16} strokeWidth={1.5} />
                    </div>
                    <div className="w-1 h-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
                 </div>
                 <p className="text-[8px] font-black text-text-2 uppercase tracking-[0.2em] mb-1.5">{kpi.label}</p>
                 <div className="flex items-baseline gap-1.5">
                    <p className="text-2xl font-black text-text-1 italic tracking-tighter">{kpi.value}</p>
                    <ArrowRight size={10} className="text-text-2/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="card-xp p-4">
             <div className="flex items-center justify-between mb-4">
                <p className="text-[8px] font-black text-text-2 uppercase tracking-wider">Outflow Matrix / Performance</p>
                <div className="flex gap-2">
                   <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-primary" /><span className="text-[7px] font-black text-text-2 uppercase">Input</span></div>
                </div>
             </div>
             <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5C800" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#F5C800" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="var(--color-border-subtle)" />
                  <XAxis dataKey="name" stroke="var(--color-text-2)" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-2)', fontWeight: 'black' }} />
                  <YAxis stroke="var(--color-text-2)" fontSize={9} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-2)', fontWeight: 'black' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '16px' }} 
                    itemStyle={{ color: '#F5C800', fontWeight: 'black', fontSize: '10px', textTransform: 'uppercase' }} 
                    labelStyle={{ color: 'var(--color-text-2)', fontSize: '9px', fontWeight: 'black', marginBottom: '8px' }}
                  />
                  <Area type="monotone" dataKey="saldo" stroke="#F5C800" strokeWidth={2} fillOpacity={1} fill="url(#colorSaldo)" connectNulls name="Média de Estoque" dot={{ fill: '#F5C800', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>
        </div>
        <div className="card-xp p-4 h-full flex flex-col">
             <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded bg-danger/10 flex items-center justify-center text-danger"><AlertCircle size={12} /></div>
                <p className="text-[8px] font-black text-text-2 uppercase tracking-widest">Critical Buffer Alert</p>
             </div>
             <div className="flex-1 overflow-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b border-border/50 text-text-2 text-[7px] font-black uppercase">
                         <th className="py-1">Contract</th>
                         <th className="py-1">Stock</th>
                         <th className="py-1 text-right">Trigger</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border/20">
                      {criticalStockItems.map((item, i) => (
                         <tr key={i} className="text-[9px]">
                            <td className="py-1.5 font-bold text-text-1 uppercase truncate max-w-[80px]">{item.contractName}</td>
                            <td className="py-1.5 text-danger font-black">{item.stock} <span className="text-[7px] opacity-20">{item.unit}</span></td>
                            <td className="py-1.5 text-right text-text-2 opacity-40">{item.min}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
      </div>
    </div>
  );
};
