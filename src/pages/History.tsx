import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  FileSpreadsheet,
  Package,
  ArrowRight,
  AlertTriangle,
  History as HistoryIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PAGE_SIZE = 20;

export const History = () => {
  const { stockEntries, contracts, supplyTypes, users, stockAdjustments, adjustStockEntry } = useDataStore();
  const { user } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTech, setSelectedTech] = useState('all');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [page, setPage] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const [adjustingEntry, setAdjustingEntry] = useState<any>(null);
  const [adjValue, setAdjValue] = useState(0);
  const [adjReason, setAdjReason] = useState('');

  const technicians = useMemo(() => (users || []).filter(u => u.role === 'technician'), [users]);

  const tableData = useMemo(() => {
    return (stockEntries || []).map(entry => {
      const contract = (contracts || []).find(c => c.id === entry.contract_id);
      const supply = (supplyTypes || []).find(s => s.id === entry.supply_type_id);
      const technician = (users || []).find(u => u.id === entry.technician_id);
      return {
        ...entry,
        contractName: contract?.name || 'Não identificado',
        supplyName: supply?.name || 'Não identificado',
        category: supply?.category || 'Insumo',
        techName: technician?.name || 'Sistema',
      };
    }).filter(row => {
      if ((row.contractName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) === false &&
          (row.supplyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) === false) return false;
      if (selectedContract !== 'all' && row.contract_id !== selectedContract) return false;
      if (selectedCategory !== 'all' && row.category !== selectedCategory) return false;
      if (selectedTech !== 'all' && row.technician_id !== selectedTech) return false;
      if (row.entry_date < dateFrom || row.entry_date > dateTo) return false;
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [stockEntries, contracts, supplyTypes, users, searchTerm, selectedContract, selectedCategory, selectedTech, dateFrom, dateTo]);

  const totalPages = Math.ceil(tableData.length / PAGE_SIZE);
  const pagedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return tableData.slice(start, start + PAGE_SIZE);
  }, [tableData, page]);

  const resetPage = () => setPage(1);

  const exportToExcel = () => {
    const data = tableData.map(row => ({
      Data: format(new Date(row.entry_date), 'dd/MM/yyyy'),
      Contrato: row.contractName,
      Insumo: row.supplyName,
      Categoria: row.category,
      Saldo: row.current_stock,
      Entrada: row.entries_in || 0,
      Saída: row.entries_out || 0,
      Técnico: row.techName
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico');
    XLSX.writeFile(wb, `RDY_Audit_Trail_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
    toast.success('Documento Excel gerado.');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('RDY SUPPLY - AUDIT TRAIL LOG', 14, 15);
    const data = tableData.map(row => [
      format(new Date(row.entry_date), 'dd/MM/yy'),
      row.contractName,
      row.supplyName,
      row.current_stock.toString(),
      row.techName
    ]);
    autoTable(doc, {
      head: [['Data', 'Contrato', 'Insumo', 'Saldo', 'Técnico']],
      body: data,
      startY: 20,
    });
    doc.save(`RDY_Security_Audit_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success('Documento PDF gerado.');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header Section - Padrão Layout Inicial */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--rdy-primary-rgb),0.6)]" />
            <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.3em] leading-none opacity-40">Catálogo Mestre de Recursos</p>
          </div>
          <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            HISTÓRICO <span className="text-text-2 font-light not-italic opacity-20">OPERACIONAL</span>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAdjustments(!showAdjustments)}
            className={`flex items-center gap-2 border px-6 h-10 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${
              showAdjustments 
                ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' 
                : 'bg-surface border-border text-text-1 hover:bg-bg'
            }`}
          >
            <HistoryIcon size={14} />
            {showAdjustments ? 'Operational Logs' : 'Audit Registry'}
          </button>
          <div className="flex items-center gap-2 bg-surface p-1 rounded-2xl border border-border">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 h-8 rounded-xl text-[9px] font-black text-text-1 uppercase tracking-wider hover:bg-bg transition-all"
            >
              <FileSpreadsheet size={14} className="text-success" />
              XLSX
            </button>
            <div className="w-px h-4 bg-border" />
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 h-8 rounded-xl text-[9px] font-black text-text-1 uppercase tracking-wider hover:bg-bg transition-all"
            >
              <Package size={14} className="text-danger" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Filters - Industrial Control Unit */}
      <div className="bg-surface border border-border p-8 rounded-[32px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 shadow-xl">
        <div className="col-span-1 md:col-span-2 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-2 opacity-20 group-focus-within:opacity-100 transition-colors" size={16} />
          <input
            type="text"
            placeholder="PESQUISAR NOS REGISTROS..."
            className="w-full h-12 bg-bg border border-border rounded-xl pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-text-1 outline-none focus:bg-surface transition-all placeholder:text-text-2/20"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); resetPage(); }}
          />
        </div>
        <select className="h-12 bg-bg border border-border rounded-xl px-4 text-[9px] font-black text-text-1 uppercase tracking-widest outline-none focus:bg-surface transition-all" value={selectedContract} onChange={e => { setSelectedContract(e.target.value); resetPage(); }}>
          <option value="all">TODOS OS CONTRATOS</option>
          {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="h-12 bg-bg border border-border rounded-xl px-4 text-[9px] font-black text-text-1 uppercase tracking-widest outline-none focus:bg-surface transition-all" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); resetPage(); }}>
          <option value="all">TODAS CATEGORIAS</option>
          <option value="Toner">TONER</option>
          <option value="Papel">PAPEL</option>
          <option value="Cilindro">CILINDRO</option>
        </select>
        <select className="h-12 bg-bg border border-border rounded-xl px-4 text-[9px] font-black text-text-1 uppercase tracking-widest outline-none focus:bg-surface transition-all" value={selectedTech} onChange={e => { setSelectedTech(e.target.value); resetPage(); }}>
          <option value="all">EQUIPE TÉCNICA</option>
          {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="date" className="flex-1 h-12 bg-bg border border-border rounded-xl px-3 text-[9px] font-black text-text-1 uppercase outline-none focus:bg-surface transition-all" value={dateFrom} onChange={e => { setDateFrom(e.target.value); resetPage(); }} />
          <input type="date" className="flex-1 h-12 bg-bg border border-border rounded-xl px-3 text-[9px] font-black text-text-1 uppercase outline-none focus:bg-surface transition-all" value={dateTo} onChange={e => { setDateTo(e.target.value); resetPage(); }} />
        </div>
      </div>

      {/* Chart (when contract selected) */}
      {selectedContract !== 'all' && tableData.length > 0 && (
        <div className="card-xp p-8">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6">
            Evolução de Saldo — {contracts.find(c => c.id === selectedContract)?.name}
          </h4>
          <div className="h-48 w-full relative">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...tableData].reverse()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="entry_date" hide />
                  <YAxis stroke="var(--color-text-2)" fontSize={10} tickLine={false} axisLine={false} tick={{ fontWeight: 'bold' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }} itemStyle={{ color: '#F5C800', fontWeight: 'bold', fontSize: '10px' }} labelStyle={{ display: 'none' }} />
                  <Line type="monotone" dataKey="current_stock" stroke="#F5C800" strokeWidth={3} dot={{ fill: '#F5C800', r: 3 }} activeDot={{ r: 5 }} name="Saldo" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Table - Superfécie Industrial Tática */}
      <div className="bg-surface border border-border rounded-[32px] overflow-hidden shadow-xl">
        {!showAdjustments ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-text-2/40 text-[8px] font-black uppercase tracking-widest bg-bg/50">
                  <th className="px-10 py-5 w-32">Cronologia</th>
                  <th className="px-10 py-5">Detalhes da Operação</th>
                  <th className="px-10 py-5">Saldo Atual</th>
                  <th className="px-10 py-5">Fluxo (C/D)</th>
                  <th className="px-10 py-5 text-right">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pagedData.length > 0 ? pagedData.map(row => (
                  <tr key={row.id} className="hover:bg-bg/50 transition-all group">
                    <td className="px-10 py-5 whitespace-nowrap">
                       <p className="font-black text-text-1 italic uppercase tracking-tighter leading-none text-[11px]">{format(new Date(row.entry_date), 'dd/MM/yy')}</p>
                       <p className="text-[8px] text-text-2/20 font-black tracking-widest mt-1.5">{format(new Date(row.created_at), 'HH:mm')}</p>
                    </td>
                    <td className="px-10 py-5">
                       <p className="font-black text-text-1 uppercase tracking-tight leading-none text-[12px]">{row.supplyName}</p>
                       <p className="text-[8px] font-black text-text-2/20 uppercase tracking-widest mt-1.5">{row.contractName}</p>
                    </td>
                    <td className="px-10 py-5">
                       <div className="flex items-center gap-3">
                         <span className="text-sm font-black text-text-1 italic tracking-tighter">{row.current_stock.toLocaleString()}</span>
                         {user?.role === 'admin' && (
                           <button onClick={() => { setAdjustingEntry(row); setAdjValue(row.current_stock); setAdjReason(''); }} className="px-2 py-1 bg-bg border border-border rounded text-[8px] font-black uppercase tracking-widest text-text-2/20 opacity-0 group-hover:opacity-100 transition-opacity hover:border-primary hover:text-text-1">Ajustar</button>
                         )}
                       </div>
                    </td>
                    <td className="px-10 py-5">
                       <div className="flex items-center gap-2 text-[10px] font-black">
                         <span className="text-success">↑ {row.entries_in || 0}</span>
                         <span className="text-danger">↓ {row.entries_out || 0}</span>
                       </div>
                    </td>
                    <td className="px-10 py-5 text-right">
                       <p className="text-[10px] font-black text-text-1 uppercase italic leading-none">{row.techName}</p>
                       <p className="text-[8px] text-text-2/20 uppercase tracking-widest mt-1">FIELD SERVICE</p>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-10 py-32 text-center opacity-20">
                      <Package size={48} className="mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-[0.5em]">Nenhum registro encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-text-2/40 text-[8px] font-black uppercase tracking-widest bg-bg/50">
                  <th className="px-10 py-5">Cronologia</th>
                  <th className="px-10 py-5">Escopo do Ajuste</th>
                  <th className="px-10 py-5">Transição de Saldo</th>
                  <th className="px-10 py-5">Justificativa Técnica</th>
                  <th className="px-10 py-5 text-right">Auditor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stockAdjustments.length > 0 ? stockAdjustments.map(adj => {
                  const mod = users.find(u => u.id === adj.adjusted_by);
                  const entry = stockEntries.find(e => e.id === adj.stock_entry_id);
                  const contract = contracts.find(c => c.id === entry?.contract_id);
                  const supply = supplyTypes.find(s => s.id === entry?.supply_type_id);
                  return (
                    <tr key={adj.id} className="hover:bg-bg/50 transition-all">
                      <td className="px-10 py-5 font-black text-text-1 text-[11px] italic">{format(new Date(adj.created_at), 'dd/MM/yyyy HH:mm')}</td>
                      <td className="px-10 py-5">
                        <p className="font-black text-text-1 text-[12px] uppercase italic">{supply?.name}</p>
                        <p className="text-[8px] text-text-2/20 uppercase tracking-widest mt-1.5">{contract?.name}</p>
                      </td>
                      <td className="px-10 py-5">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-danger line-through opacity-40 italic">{adj.old_value}</span>
                          <ArrowRight size={14} className="text-text-2/20" />
                          <span className="text-sm font-black text-success italic">{adj.new_value}</span>
                        </div>
                      </td>
                      <td className="px-10 py-5 max-w-xs">
                        <p className="text-[10px] text-text-2/40 italic truncate font-bold uppercase tracking-tight">"{adj.reason}"</p>
                      </td>
                      <td className="px-10 py-5 text-right text-[10px] font-black text-primary uppercase italic">{mod?.name}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="px-10 py-32 text-center opacity-20">
                      <AlertTriangle size={40} className="mx-auto mb-3" />
                      <p className="text-[10px] font-black uppercase tracking-[0.5em]">Nenhum ajuste registrado no Audit Trail</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination - Padrão Layout Inicial */}
        {!showAdjustments && totalPages > 1 && (
          <div className="px-10 py-6 border-t border-border flex items-center justify-between bg-bg/50">
            <span className="text-[9px] font-black text-text-2/40 uppercase tracking-widest px-4 py-2 bg-surface rounded-xl border border-border">
              {tableData.length} REGISTROS · PÁGINA {page}/{totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                disabled={page === 1}
                className="w-10 h-10 rounded-xl bg-surface border border-border text-text-1 hover:text-primary hover:border-primary transition-all disabled:opacity-20 flex items-center justify-center shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                      className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${p === page ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' : 'bg-surface border-border text-text-2/40 hover:border-border-active hover:text-text-1'}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
                disabled={page === totalPages}
                className="w-10 h-10 rounded-xl bg-surface border border-border text-text-1 hover:text-primary hover:border-primary transition-all disabled:opacity-20 flex items-center justify-center shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Adjustment Modal - Theme Polished */}
      {/* Adjustment Modal - ERP Scaled */}
      {adjustingEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
          <div className="w-full max-w-sm bg-surface border border-border rounded-lg shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="border-b border-border pb-3">
               <h3 className="text-lg font-black text-text-1 italic uppercase tracking-tighter leading-none">Ajuste de <span className="text-primary">Registro</span></h3>
               <p className="text-[7px] font-black text-text-2 uppercase tracking-widest mt-1 opacity-40">Registro de Auditoria de Conformidade</p>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-white/5 rounded border border-border">
                <p className="text-[7px] font-black text-text-2/40 uppercase tracking-widest mb-1">Ativo Impactado</p>
                <p className="text-[10px] font-black text-text-1 italic uppercase">{adjustingEntry.contractName} · {adjustingEntry.supplyName}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1 block">Base</label>
                  <div className="rdy-input flex items-center justify-center h-10 font-black italic text-text-2/40 bg-surface/50 border-white/5">{adjustingEntry.current_stock}</div>
                </div>
                <div>
                  <label className="text-[8px] font-black text-primary uppercase tracking-widest ml-1 mb-1 block">Corrigido</label>
                  <input type="number" className="rdy-input h-10 text-center font-black italic text-base" value={adjValue} onChange={e => setAdjValue(parseInt(e.target.value) || 0)} />
                </div>
              </div>
              
              <div>
                <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1 block">Código de Justificativa *</label>
                <textarea className="rdy-input h-20 resize-none p-3 text-[10px] font-medium" placeholder="Motivo da discrepância técnica..." value={adjReason} onChange={e => setAdjReason(e.target.value)} />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => setAdjustingEntry(null)} className="flex-1 rdy-btn-secondary h-10 rounded text-[9px] uppercase font-black tracking-widest">Cancelar</button>
                <button
                  onClick={() => {
                    if (!adjReason.trim()) return toast.error('Justificativa obrigatória');
                    adjustStockEntry({ stock_entry_id: adjustingEntry.id, adjusted_by: user!.id, old_value: adjustingEntry.current_stock, new_value: adjValue, reason: adjReason });
                    toast.success('Ajuste registrado.');
                    setAdjustingEntry(null);
                  }}
                  className="flex-1 rdy-btn-primary h-10 rounded text-[9px] uppercase font-black tracking-widest italic"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
