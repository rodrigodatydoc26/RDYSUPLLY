import { useNavigate } from 'react-router-dom';
import { Users, FileText, AlertCircle, CheckCircle2, ArrowRight, Box, ShieldCheck, ArrowUpRight, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDataStore } from '../store/useDataStore';
import { format, subDays } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { contracts, users, stockEntries, contractSupplies, supplyTypes, resolvedAlertIds } = useDataStore();

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

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--rdy-primary-rgb),0.6)]" />
            <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.3em] leading-none opacity-40">Catálogo Mestre de Recursos</p>
          </div>
          <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            STATUS <span className="text-text-2/40 font-light not-italic uppercase">OPERACIONAL</span>
          </h2>
          <p className="text-[10px] font-black text-text-2/40 uppercase tracking-[0.2em] mt-2">Interface de Inteligência de Ativos RDY</p>
        </div>
        <div className="flex bg-surface p-1 rounded-xl border border-border">
          <div className="px-5 py-2 flex items-center gap-3">
            <Box size={12} className="text-primary/60" />
            <p className="text-[9px] font-black text-text-1 uppercase tracking-widest">{contracts.length} Operações</p>
          </div>
          <div className="w-px h-5 my-auto bg-border" />
          <div className="px-5 py-2 flex items-center gap-3">
            <ShieldCheck size={12} className="text-primary/60" />
            <p className="text-[9px] font-black text-text-1 uppercase tracking-widest">Fluxo Ativo</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <div key={i} className="group relative">
            <div className={`p-0.5 w-full bg-surface rounded-3xl border border-border transition-all duration-700 hover:shadow-xl hover:shadow-primary/5 group-hover:-translate-y-1`}>
              <div className="p-6 rounded-[1.4rem]">
                 <div className="flex justify-between items-start mb-6">
                    <div className={`text-text-2 group-hover:text-text-1 transition-colors duration-700`}>
                      <kpi.icon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
                 </div>
                 <p className="text-[9px] font-black text-text-2 uppercase tracking-[0.2em] mb-2 opacity-40">{kpi.label}</p>
                 <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-text-1 italic tracking-tighter leading-none">{kpi.value}</p>
                    <ArrowUpRight size={14} className="text-text-2/20 group-hover:text-primary transition-all group-hover:translate-x-1 group-hover:-translate-y-1" strokeWidth={3} />
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="bg-surface border border-border rounded-[40px] p-8 hover:shadow-xl hover:shadow-primary/5 transition-all">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                 <Activity size={16} className="text-primary" />
                 <p className="text-[10px] font-black text-text-1 uppercase tracking-widest">OUTFLOW MATRIX / PERFORMANCE</p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--rdy-primary-rgb),0.5)]" />
                    <span className="text-[9px] font-black text-text-2 uppercase tracking-widest">MÉDIA DE ENTRADA</span>
                 </div>
              </div>
           </div>
           <div className="h-[280px] w-full relative">
             {isMounted && (
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-border)" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-2)', fontWeight: '900' }} dy={10} />
                  <YAxis stroke="var(--color-border)" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: 'var(--color-text-2)', fontWeight: '900' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '24px', padding: '20px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)' }} 
                    itemStyle={{ color: 'var(--color-text-1)', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase' }} 
                    labelStyle={{ color: 'var(--color-text-2)', fontSize: '9px', fontWeight: '900', marginBottom: '8px', letterSpacing: '0.1em' }}
                  />
                  <Area type="monotone" dataKey="saldo" stroke="var(--color-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorSaldo)" connectNulls name="Média de Estoque" dot={{ fill: 'var(--color-primary)', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-text-1)' }} />
                </AreaChart>
              </ResponsiveContainer>
             )}
           </div>
        </div>

        <div className="bg-surface border border-border rounded-[40px] p-8 hover:shadow-xl hover:shadow-primary/5 transition-all">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-danger/10 flex items-center justify-center text-danger">
                    <AlertCircle size={20} strokeWidth={2.5} />
                 </div>
                 <div>
                    <p className="text-[11px] font-black text-text-1 uppercase tracking-widest leading-none">CRITICAL BUFFER ALERT</p>
                    <p className="text-[8px] font-black text-text-2/60 uppercase tracking-[0.2em] mt-2">Reposição imediata obrigatória</p>
                 </div>
              </div>
              <button 
                onClick={() => navigate('/estoque')}
                className="px-6 h-10 bg-bg border border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-text-1 hover:bg-primary hover:text-black transition-all flex items-center gap-2 group"
              >
                GESTÃO COMPLETA
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="border-b border-border text-text-2 text-[9px] font-black uppercase tracking-widest opacity-40">
                       <th className="px-4 py-4">UNIDADE / CONTRATO</th>
                       <th className="px-4 py-4 text-center">SALDO ATUAL</th>
                       <th className="px-4 py-4 text-right">GATILHO MÍNIMO</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                    {criticalStockItems.length > 0 ? (
                      criticalStockItems.map((item, i) => (
                        <tr 
                          key={i} 
                          onClick={() => navigate('/estoque')}
                          className="group cursor-pointer hover:bg-bg/50 transition-colors"
                        >
                           <td className="px-4 py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-1 h-6 bg-danger/20 rounded-full group-hover:bg-danger transition-colors" />
                                 <p className="text-sm font-black text-text-1 uppercase italic tracking-tight">{item.contractName}</p>
                              </div>
                           </td>
                           <td className="px-4 py-6 text-center">
                              <span className="text-lg font-black text-danger italic leading-none">{item.stock}</span>
                              <span className="text-[9px] font-black text-text-2 uppercase ml-2 opacity-20">{item.unit}</span>
                           </td>
                           <td className="px-4 py-6 text-right font-black text-text-2/40 text-sm italic">
                              {item.min}
                           </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-20 text-center">
                           <div className="flex flex-col items-center gap-4 opacity-10">
                              <ShieldCheck size={48} />
                              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Nenhum alerta crítico detectado</p>
                           </div>
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};
