import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  FileSpreadsheet,
  Filter
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { format, subDays } from 'date-fns';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Button, Card, CMYKBadge } from '../components/ui/Base';
import { History as HistoryIcon } from 'lucide-react';

const PAGE_SIZE = 15;

export const History = () => {
  const { 
    equipmentStockEntries, 
    contracts, 
    equipmentModels, 
    contractEquipment, 
    users,
    fetchInitialData 
  } = useDataStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContract, setSelectedContract] = useState('all');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const tableData = useMemo(() => {
    return equipmentStockEntries.map(entry => {
      const machine = contractEquipment.find(ce => ce.id === entry.contract_equipment_id);
      const model = machine ? equipmentModels.find(m => m.id === machine.equipment_model_id) : null;
      const contract = machine ? contracts.find(c => c.id === machine.contract_id) : null;
      const technician = users.find(u => u.id === entry.technician_id);

      return {
        ...entry,
        machineName: model?.name || '—',
        serial: machine?.serial_number || '—',
        contractName: contract?.name || '—',
        techName: technician?.name || 'Sistema',
        is_color: model?.is_color || false,
        has_drum: model?.has_drum || false,
      };
    }).filter(row => {
      const matchesSearch = 
        row.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.contractName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const machine = contractEquipment.find(ce => ce.id === row.contract_equipment_id);
      const matchesContract = selectedContract === 'all' || machine?.contract_id === selectedContract;
      const matchesDate = row.entry_date >= dateFrom && row.entry_date <= dateTo;

      return matchesSearch && matchesContract && matchesDate;
    }).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [equipmentStockEntries, contracts, equipmentModels, contractEquipment, users, searchTerm, selectedContract, dateFrom, dateTo]);

  const totalPages = Math.ceil(tableData.length / PAGE_SIZE);
  const pagedData = tableData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportToExcel = () => {
    const data = tableData.map(row => ({
      Data: format(new Date(row.entry_date), 'dd/MM/yyyy'),
      Contrato: row.contractName,
      Máquina: row.machineName,
      Serial: row.serial,
      'Toner K': row.toner_black,
      'Toner C': row.toner_cyan || 0,
      'Toner M': row.toner_magenta || 0,
      'Toner Y': row.toner_yellow || 0,
      Técnico: row.techName
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico V2');
    XLSX.writeFile(wb, `RDY_Audit_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
    toast.success('Documento Excel gerado.');
  };

  return (
    <div className="space-y-6 animate-fade pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary" />
            <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.3em]">Audit Trail / Operações</p>
          </div>
          <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            HISTÓRICO <span className="text-text-2 font-light not-italic  text-3xl">DE LEITURAS</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
           <Button variant="outline" className="h-10 text-[9px] uppercase font-black tracking-widest gap-2" onClick={exportToExcel}>
              <FileSpreadsheet size={14} className="text-success" />
              Exportar Excel
           </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface border border-border p-6 rounded-[32px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shadow-sm">
         <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-2 group-focus-within:text-primary transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="PESQUISAR..." 
              className="w-full h-11 bg-bg border border-border rounded-xl pl-11 pr-4 text-xs font-bold text-text-1 outline-none focus:border-primary transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
         <select 
           className="h-11 bg-bg border border-border rounded-xl px-4 text-xs font-bold text-text-1 outline-none focus:border-primary transition-all"
           value={selectedContract}
           onChange={e => setSelectedContract(e.target.value)}
         >
            <option value="all">TODOS OS CONTRATOS</option>
            {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
         </select>
         <div className="flex gap-2">
            <input type="date" className="flex-1 h-11 bg-bg border border-border rounded-xl px-3 text-[10px] font-bold text-text-1 outline-none" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <input type="date" className="flex-1 h-11 bg-bg border border-border rounded-xl px-3 text-[10px] font-bold text-text-1 outline-none" value={dateTo} onChange={e => setDateTo(e.target.value)} />
         </div>
         <div className="flex items-center justify-center bg-bg border border-border rounded-xl">
            <Filter size={14} className="text-text-2" />
         </div>
      </div>

      {/* Records Table */}
      <Card className="overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-bg/50 border-b border-border text-[9px] font-black uppercase tracking-widest text-text-2">
                     <th className="px-8 py-5">Cronologia</th>
                     <th className="px-8 py-5">Equipamento</th>
                     <th className="px-8 py-5">Unidade / Contrato</th>
                     <th className="px-8 py-5">Resultados (Saldo)</th>
                     <th className="px-8 py-5 text-right">Técnico</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-border">
                  {pagedData.map(row => (
                    <tr key={row.id} className="hover:bg-bg transition-colors group">
                       <td className="px-8 py-6">
                          <p className="text-xs font-black text-text-1 italic uppercase">{format(new Date(row.entry_date + 'T00:00:00'), 'dd/MM/yyyy')}</p>
                          <p className="text-[8px] font-bold text-text-2 uppercase tracking-widest mt-1">{format(new Date(row.created_at || ''), 'HH:mm')}</p>
                       </td>
                       <td className="px-8 py-6">
                          <p className="text-sm font-black text-text-1 uppercase italic tracking-tight">{row.machineName}</p>
                          <p className="text-[8px] font-bold text-text-2 uppercase tracking-widest mt-1">S/N: {row.serial}</p>
                       </td>
                       <td className="px-8 py-6">
                          <p className="text-xs font-black text-text-2 uppercase tracking-tight">{row.contractName}</p>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex gap-2">
                             <CMYKValue type="K" value={row.toner_black} />
                             {row.is_color && (
                               <>
                                 <CMYKValue type="C" value={row.toner_cyan} />
                                 <CMYKValue type="M" value={row.toner_magenta} />
                                 <CMYKValue type="Y" value={row.toner_yellow} />
                               </>
                             )}
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <p className="text-[10px] font-black text-text-1 uppercase italic">{row.techName}</p>
                          <p className="text-[8px] font-bold text-text-2 uppercase tracking-widest mt-1">FIELD UNIT</p>
                       </td>
                    </tr>
                  ))}
                  
                  {pagedData.length === 0 && (
                    <tr>
                       <td colSpan={5} className="py-24 text-center">
                          <HistoryIcon size={40} className="mx-auto text-text-2/10 mb-4" />
                          <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.4em]">Nenhum registro no período</p>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
         
         {/* Pagination */}
         {totalPages > 1 && (
           <div className="px-8 py-6 bg-bg/50 border-t border-border flex items-center justify-between">
              <span className="text-[9px] font-black text-text-2 uppercase">Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                 <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Anterior
                 </Button>
                 <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Próximo
                 </Button>
              </div>
           </div>
         )}
      </Card>
    </div>
  );
};

// Mini badge for values
const CMYKValue = ({ type, value }: { type: 'C' | 'M' | 'Y' | 'K', value?: number }) => (
  <div className="flex items-center gap-1.5 px-2 py-1 bg-bg border border-border rounded-lg">
     <CMYKBadge type={type} className="scale-50 origin-left" />
     <span className="text-[10px] font-black text-text-1">{value || 0}</span>
  </div>
);

