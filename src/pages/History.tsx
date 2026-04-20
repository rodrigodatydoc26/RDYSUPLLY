import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  FileText,
  Download,
  History as HistoryIcon
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import { Button, Card, CMYKBadge } from '../components/ui/Base';
import { exportHistoryToExcel, exportHistoryToPDF } from '../utils/reportExporter';

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
        location: machine?.location || '—',
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

  const handleExportExcel = () => {
    const data = tableData.map(row => ({
      timestamp: row.created_at || (row.entry_date + 'T00:00:00Z'),
      equipmentName: row.machineName,
      serialNumber: row.serial,
      contractName: row.contractName,
      location: row.location || 'N/A',
      toner_k: row.toner_black,
      toner_c: row.toner_cyan,
      toner_m: row.toner_magenta,
      toner_y: row.toner_yellow,
      technicianName: row.techName
    }));
    exportHistoryToExcel(data);
    toast.success('Documento Excel gerado com log de auditoria.');
  };

  const handleExportPDF = () => {
    const data = tableData.map(row => ({
      timestamp: row.created_at || (row.entry_date + 'T00:00:00Z'),
      equipmentName: row.machineName,
      serialNumber: row.serial,
      contractName: row.contractName,
      location: row.location || 'N/A',
      toner_k: row.toner_black,
      toner_c: row.toner_cyan,
      toner_m: row.toner_magenta,
      toner_y: row.toner_yellow,
      technicianName: row.techName
    }));
    exportHistoryToPDF(data);
    toast.success('Relatório PDF gerado com log de auditoria.');
  };

  return (
    <div className="space-y-6 animate-fade pb-10 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary" />
            <p className="text-[9px] font-black text-text-2 uppercase tracking-[0.3em]">Audit Trail / Operações</p>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            HISTÓRICO <span className="text-text-2 font-light not-italic text-xl">DE LEITURAS</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
           <Button 
              variant="outline" 
              className="h-11 px-5 text-[10px] uppercase font-black tracking-widest gap-2 bg-surface border-border hover:border-danger hover:text-danger transition-all rounded-xl shadow-sm" 
              onClick={handleExportPDF}
           >
              <FileText size={16} />
              PDF
           </Button>
           <Button 
              variant="outline" 
              className="h-11 px-5 text-[10px] uppercase font-black tracking-widest gap-2 bg-surface border-border hover:border-success hover:text-success transition-all rounded-xl shadow-sm" 
              onClick={handleExportExcel}
           >
              <Download size={16} />
              Excel
           </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface border border-border p-4 md:p-6 rounded-[28px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1.5fr_2fr_50px] gap-4 md:gap-6 shadow-sm items-end">
         <div className="relative group">
            <label className="text-[9px] font-black text-text-2 uppercase ml-2 mb-1 block tracking-widest font-black">Busca Tática</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-2 opacity-30" size={16} />
              <input 
                id="history-search"
                type="text" 
                placeholder="PROCURAR..." 
                className="w-full h-12 bg-bg border border-border rounded-xl pl-11 pr-4 text-[10px] font-bold text-text-1 outline-none focus:border-primary transition-all placeholder:opacity-20 uppercase"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
         </div>
         
         <div className="relative group">
            <label className="text-[9px] font-black text-text-2 uppercase ml-2 mb-1 block tracking-widest font-black">Contrato</label>
            <select 
              id="contract-filter"
              title="Selecionar Contrato"
              className="w-full h-12 bg-bg border border-border rounded-xl px-4 text-[10px] font-bold text-text-1 outline-none focus:border-primary transition-all appearance-none cursor-pointer uppercase"
              value={selectedContract}
              onChange={e => setSelectedContract(e.target.value)}
            >
               <option value="all">TODOS OS CONTRATOS</option>
               {contracts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
         </div>

         <div className="grid grid-cols-2 gap-3">
            <div className="flex-1">
               <label className="text-[9px] font-black text-text-2 uppercase ml-2 mb-1 block tracking-widest font-black">De</label>
               <input type="date" title="Data Inicial" className="w-full h-12 bg-bg border border-border rounded-xl px-4 text-[10px] font-bold text-text-1 outline-none focus:border-primary transition-all font-black" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="flex-1">
               <label className="text-[9px] font-black text-text-2 uppercase ml-2 mb-1 block tracking-widest font-black">Até</label>
               <input type="date" title="Data Final" className="w-full h-12 bg-bg border border-border rounded-xl px-4 text-[10px] font-bold text-text-1 outline-none focus:border-primary transition-all font-black" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
         </div>

         <div className="hidden lg:flex h-12 w-12 items-center justify-center bg-bg border border-border rounded-xl text-text-2 hover:bg-black hover:text-primary transition-all cursor-pointer">
            <Filter size={18} />
         </div>
      </div>

      {/* Main Records Control */}
      <div className="space-y-4">
        {/* Desktop Table View */}
        <Card className="hidden lg:block overflow-hidden border-border bg-surface shadow-xl rounded-[40px]">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-black/5 flex-none border-b border-border text-[9px] font-black uppercase tracking-widest text-text-2">
                       <th className="px-10 py-6">Cronologia</th>
                       <th className="px-10 py-6">Equipamento</th>
                       <th className="px-10 py-6">Unidade / Contrato</th>
                       <th className="px-10 py-6">Valores Técnica</th>
                       <th className="px-10 py-6 text-right">Responsável</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border/10">
                    {pagedData.map(row => (
                      <tr key={row.id} className="hover:bg-black/[0.01] transition-colors group">
                         <td className="px-10 py-6">
                            <p className="text-sm font-black text-text-1 italic uppercase">{row.entry_date ? format(new Date(row.entry_date + 'T00:00:00'), 'dd/MM/yyyy') : '—'}</p>
                            <p className="text-[9px] font-bold text-text-1 opacity-20 uppercase tracking-widest mt-1">{row.created_at ? format(new Date(row.created_at), 'HH:mm:ss') : '—'}</p>
                         </td>
                         <td className="px-10 py-6">
                            <p className="text-base font-black text-text-1 uppercase italic tracking-tighter">{row.machineName}</p>
                            <p className="text-[9px] font-black text-text-1 opacity-30 mt-1 uppercase tracking-widest">S/N: {row.serial}</p>
                         </td>
                         <td className="px-10 py-6">
                            <p className="text-[11px] font-black text-text-1 uppercase tracking-tight italic opacity-60">{row.contractName}</p>
                         </td>
                         <td className="px-10 py-6">
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
                         <td className="px-10 py-6 text-right">
                            <p className="text-[11px] font-black text-text-1 uppercase italic tracking-tighter">{row.techName}</p>
                            <p className="text-[8px] font-bold text-primary uppercase tracking-[0.2em] mt-1 italic">UNIDADE DE CAMPO</p>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </Card>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden space-y-4">
          {pagedData.map(row => (
            <Card key={row.id} className="p-6 border border-border rounded-[30px] bg-surface space-y-6">
               <div className="flex justify-between items-start border-b border-border/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black border border-border flex flex-col items-center justify-center">
                       <span className="text-[10px] font-black text-primary leading-none">{row.entry_date ? format(new Date(row.entry_date + 'T00:00:00'), 'dd') : ''}</span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-text-1 uppercase italic leading-none">{row.machineName}</h4>
                      <p className="text-[8px] font-black text-text-1 opacity-30 uppercase tracking-widest mt-1">{row.serial}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[8px] font-black text-text-1 opacity-20 uppercase tracking-widest mb-1">UNIDADE</p>
                     <p className="text-[9px] font-black text-text-1 uppercase tracking-tight">{row.contractName}</p>
                  </div>
               </div>

               <div className="flex flex-wrap gap-2">
                  <CMYKValue type="K" value={row.toner_black} />
                  {row.is_color && (
                    <>
                      <CMYKValue type="C" value={row.toner_cyan} />
                      <CMYKValue type="M" value={row.toner_magenta} />
                      <CMYKValue type="Y" value={row.toner_yellow} />
                    </>
                  )}
               </div>

               <div className="flex items-center justify-between pt-4 border-t border-border/5">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-black text-[10px] border border-primary/20">{row.techName.charAt(0)}</div>
                     <span className="text-[10px] font-black text-text-1 uppercase italic tracking-tighter">{row.techName}</span>
                  </div>
                  <span className="text-[8px] font-black text-primary uppercase tracking-widest opacity-60">Sincronizado</span>
               </div>
            </Card>
          ))}
        </div>

        {pagedData.length === 0 && (
           <div className="py-20 text-center bg-surface/50 border border-border border-dashed rounded-[40px]">
              <HistoryIcon size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-[10px] font-black text-text-1 uppercase tracking-[0.4em] opacity-40">Nenhum registro localizado no período operacional</p>
           </div>
        )}
         
        {/* Pagination Responsive */}
        {totalPages > 1 && (
          <div className="px-6 py-6 md:px-10 bg-surface border-t border-border flex flex-col md:flex-row items-center justify-between gap-6 rounded-[32px] md:rounded-[48px] shadow-sm">
             <span className="text-[10px] font-black text-text-1 opacity-30 uppercase tracking-widest">Página {page} de {totalPages}</span>
             <div className="flex gap-3 w-full md:w-auto">
                <Button variant="outline" className="flex-1 md:flex-none h-12 md:h-14 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest border-border bg-white text-text-1" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                   ANTERIOR
                </Button>
                <Button variant="outline" className="flex-1 md:flex-none h-12 md:h-14 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest border-border bg-white text-text-1" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                   PRÓXIMO
                </Button>
             </div>
          </div>
        )}
      </div>
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

