import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  X,
  Package,
  Settings2,
  Check,
  Search,
  Cpu,
  FileSpreadsheet,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import type { Contract, EquipmentModelType } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { Button, Input, Card, Badge } from '../components/ui/Base';
import { ImportModal } from '../components/features/ImportModal';

export const Contracts = () => {
  const {
    contracts,
    users,
    equipmentModels,
    contractSupplies,
    contractEquipment,
    addContract,
    updateContract,
    deleteContract,
    updateContractTechnicians,
    addContractSupply,
    removeContractSupply,
    addEquipmentToContract,
    removeEquipmentFromContract,
    equipmentStockEntries,
    importContracts,
  } = useDataStore();
  const { user } = useAuthStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLinkerOpen, setIsLinkerOpen] = useState(false);
  const [isTechSelectorOpen, setIsTechSelectorOpen] = useState(false);
  const [linkerFilter, setLinkerFilter] = useState<EquipmentModelType>('equipment');
  const [linkerSearch, setLinkerSearch] = useState('');
  const [linkerLockedType, setLinkerLockedType] = useState<EquipmentModelType | null>(null);
  const [techSearch, setTechSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modal Form State for Contract
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    code: '',
    active: true,
    technicianIds: [] as string[],
    equipmentModelIds: [] as string[],
    supplyConfigs: [] as { modelId: string; minStock: number }[],
  });

  const filteredContracts = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return contracts.filter(c =>
      c.name.toLowerCase().includes(lower) ||
      c.client.toLowerCase().includes(lower) ||
      c.code.toLowerCase().includes(lower)
    );
  }, [contracts, searchTerm]);

  const techniciansList = useMemo(() => users.filter(p => p.role === 'technician'), [users]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ 
      name: '', client: '', code: '', active: true, 
      technicianIds: [], equipmentModelIds: [], supplyConfigs: [] 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (contract: Contract) => {
    const existingEq = contractEquipment.filter(ce => ce.contract_id === contract.id).map(ce => ce.equipment_model_id);
    const existingSu = contractSupplies.filter(cs => cs.contract_id === contract.id).map(cs => ({ modelId: cs.supply_type_id, minStock: cs.min_stock }));

    setEditingId(contract.id);
    setFormData({
      name: contract.name,
      client: contract.client,
      code: contract.code,
      active: contract.active,
      technicianIds: contract.technicianIds || [],
      equipmentModelIds: existingEq,
      supplyConfigs: existingSu,
    });
    setIsModalOpen(true);
  };

  const handleSaveContract = async () => {
    if (!formData.name || !formData.client || !formData.code) return toast.error('Preencha os campos obrigatórios');
    
    const savingToast = toast.loading('Processando parâmetros...');
    try {
      let contractId: string;

      if (editingId) {
        const original = contracts.find(c => c.id === editingId);
        await updateContract({ 
            ...original, 
            ...formData, 
            id: editingId,
            technicianIds: formData.technicianIds 
        } as Contract);
        contractId = editingId;
      } else {
        const newContract = await addContract({
          name: formData.name,
          client: formData.client,
          code: formData.code,
          active: formData.active
        });
        contractId = newContract.id;
      }

      await updateContractTechnicians(contractId, formData.technicianIds);

      // Reconcile Equipment
      const existingCE = contractEquipment.filter(ce => ce.contract_id === contractId);
      const toAddCE = formData.equipmentModelIds.filter(mid => !existingCE.some(ce => ce.equipment_model_id === mid));
      const toRemCE = existingCE.filter(ce => !formData.equipmentModelIds.includes(ce.equipment_model_id));

      await Promise.all([
        ...toRemCE.map(ce => removeEquipmentFromContract(ce.id)),
        ...toAddCE.map(mid => addEquipmentToContract({
          contract_id: contractId,
          equipment_model_id: mid,
          serial_number: 'PENDENTE',
          location: 'NÃO DEFINIDO',
          active: true
        }))
      ]);

      // Reconcile Supplies
      const existingCS = contractSupplies.filter(cs => cs.contract_id === contractId);
      const toAddCS = formData.supplyConfigs.filter(sc => !existingCS.some(cs => cs.supply_type_id === sc.modelId));
      const toRemCS = existingCS.filter(cs => !formData.supplyConfigs.some(sc => sc.modelId === cs.supply_type_id));

      await Promise.all([
        ...toRemCS.map(cs => removeContractSupply(cs.id)),
        ...toAddCS.map(sc => addContractSupply({
          contract_id: contractId,
          supply_type_id: sc.modelId,
          min_stock: sc.minStock
        }))
      ]);

      toast.success('Contrato atualizado com sucesso!', { id: savingToast });
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar', { id: savingToast });
    }
  };

  const handleToggleTech = (techId: string) => {
    setFormData(prev => ({
      ...prev,
      technicianIds: prev.technicianIds.includes(techId)
        ? prev.technicianIds.filter(id => id !== techId)
        : [...prev.technicianIds, techId]
    }));
  };

  const handleLinkItem = (modelId: string, type: EquipmentModelType) => {
    const isLinked = type === 'equipment' 
      ? formData.equipmentModelIds.includes(modelId) 
      : formData.supplyConfigs.some(sc => sc.modelId === modelId);

    if (isLinked) {
      removePendingAsset(modelId, type);
    } else {
      if (type === 'equipment') {
        setFormData(prev => ({ ...prev, equipmentModelIds: [...prev.equipmentModelIds, modelId] }));
      } else {
        setFormData(prev => ({ ...prev, supplyConfigs: [...prev.supplyConfigs, { modelId, minStock: 0 }] }));
      }
    }
  };

  const removePendingAsset = (modelId: string, type: EquipmentModelType) => {
    if (type === 'equipment') {
      setFormData(prev => ({ ...prev, equipmentModelIds: prev.equipmentModelIds.filter(id => id !== modelId) }));
    } else {
      setFormData(prev => ({ ...prev, supplyConfigs: prev.supplyConfigs.filter(sc => sc.modelId !== modelId) }));
    }
  };

  const filteredModels = useMemo(() => {
    return equipmentModels.filter(m => {
       const matchesType = m.type === linkerFilter;
       const matchesSearch = !linkerSearch || 
          m.name.toLowerCase().includes(linkerSearch.toLowerCase()) || 
          m.brand.toLowerCase().includes(linkerSearch.toLowerCase());
       return matchesType && matchesSearch;
    });
  }, [equipmentModels, linkerFilter, linkerSearch]);

  return (
    <div className="space-y-6 animate-fade pb-10">
      {/* Header */}
      <div className="flex justify-between items-end gap-6 px-4">
        <div className="space-y-1">
          <h2 className="text-4xl md:text-6xl font-black text-text-1 tracking-tighter uppercase italic leading-none">GESTÃO <span className="opacity-20 not-italic">DE CONTRATOS</span></h2>
        </div>
        <div className="flex items-center gap-3">
          {user?.role !== 'technician' && (
            <Button 
              variant="outline"
              className="h-14 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest gap-3 border-border hover:bg-black hover:text-white transition-all bg-surface shadow-sm"
              onClick={() => setIsImportModalOpen(true)}
            >
              <FileSpreadsheet size={18} />
              <span className="hidden sm:inline">Importar Lote</span>
            </Button>
          )}
          {user?.role !== 'technician' && (
            <Button className="h-14 px-10 rdy-btn-elite text-[11px]" onClick={openAddModal}>
              <Plus size={20} className="mr-2" /> NOVO CONTRATO
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <Card className="mx-4 rounded-[32px] md:rounded-[48px] overflow-hidden border-border bg-surface shadow-2xl">
         <div className="p-6 md:p-8 border-b border-border bg-bg/50">
            <div className="relative group max-w-2xl">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-1 opacity-20" size={20} />
               <input 
                  placeholder="PESQUISAR CONTRATOS..."
                  title="Pesquisar Contratos"
                  className="w-full h-16 bg-surface border border-border rounded-3xl pl-16 pr-8 text-[11px] font-black uppercase tracking-widest text-text-1 outline-none focus:ring-4 focus:ring-black/5 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
         </div>

         <div className="divide-y divide-border/10">
            {filteredContracts.map(contract => (
               <div key={contract.id} className="p-6 md:p-8 lg:px-10 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10 hover:bg-black/[0.02] transition-colors group">
                  <div className="flex-1 flex items-center gap-6">
                     <div className="w-14 h-14 rounded-2xl bg-black border border-border flex items-center justify-center text-primary font-black italic text-lg shadow-inner group-hover:bg-primary group-hover:text-black transition-all">
                        {contract.name.substring(0, 2).toUpperCase()}
                     </div>
                     <div>
                        <h4 className="text-base font-black text-text-1 uppercase leading-tight">{contract.name}</h4>
                        <span className="text-[10px] font-black text-text-1 uppercase tracking-widest opacity-30">{contract.code}</span>
                     </div>
                  </div>
                  <div className="hidden lg:block flex-1 text-center text-[11px] font-black text-text-1 uppercase">
                     {contract.client}
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                     <button onClick={() => openEditModal(contract)} title="Gerenciar Contrato" className="flex-1 md:flex-none h-12 bg-surface border border-border rounded-xl flex items-center justify-center px-4 hover:bg-black hover:text-white transition-all">
                        <Settings2 size={18} />
                        <span className="ml-2 text-[9px] font-black uppercase">Gerenciar</span>
                     </button>
                     <button onClick={() => { if(confirm('Excluir?')) deleteContract(contract.id); }} title="Excluir Contrato" className="h-12 px-4 border border-border rounded-xl text-danger hover:bg-danger hover:text-white transition-all flex items-center justify-center">
                        <X size={18} />
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </Card>

      {/* PARAMETRIZAR MODAL */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-xl">
          <div className="w-full max-w-6xl bg-surface border border-border rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 md:px-10 py-6 md:py-8 border-b border-border flex justify-between items-center bg-bg/20">
               <h3 className="text-2xl md:text-4xl font-black text-text-1 italic uppercase tracking-tighter">
                  {editingId ? 'PARAMETRIZAR' : 'NOVO'} <span className="text-primary italic">CONTRATO</span>
               </h3>
               <button onClick={() => setIsModalOpen(false)} title="Fechar Modal" className="w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-3xl border border-border flex items-center justify-center hover:bg-danger hover:text-white transition-all">
                  <X size={24} strokeWidth={3} />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:grid lg:grid-cols-12 custom-scrollbar">
                <div className="lg:col-span-4 p-6 md:p-10 space-y-8 md:space-y-10 border-b lg:border-b-0 lg:border-r border-border bg-bg/10">
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                         <Input label="Código" placeholder="EX: SC001" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest px-1">Status</label>
                            <button 
                               onClick={() => setFormData({...formData, active: !formData.active})}
                               title={formData.active ? "Contrato Ativo - Clique para Pausar" : "Contrato Pausado - Clique para Ativar"}
                               className={cn("h-12 w-full rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase border transition-all", formData.active ? "bg-success/10 text-success border-success/30" : "bg-border/20 text-text-2 border-border")}
                            >
                               <div className={cn("w-2 h-2 rounded-full", formData.active ? "bg-success" : "bg-text-2")} />
                               {formData.active ? "Ativo" : "Pausado"}
                            </button>
                         </div>
                      </div>
                      <Input label="Identificação" placeholder="NOME DA UNIDADE..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                      <Input label="Cliente / Portal" placeholder="RAZÃO SOCIAL..." value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} />
                   </div>
                   
                   <div className="space-y-4 pt-6 border-t border-border/10">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-text-1">Equipe Técnica</h4>
                      <div className="flex flex-wrap gap-2">
                         <button onClick={() => setIsTechSelectorOpen(true)} title="Adicionar Técnico" className="w-10 h-10 rounded-full border border-dashed border-border flex items-center justify-center hover:border-primary hover:text-primary transition-all">
                            <Plus size={18} />
                         </button>
                         {formData.technicianIds.map(id => {
                           const t = users.find(u => u.id === id);
                           return <Badge key={id} variant="neutral" className="bg-black/5 px-3 py-2 rounded-xl text-[9px] font-black uppercase">{t?.name}</Badge>
                         })}
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-8 overflow-y-auto custom-scrollbar bg-bg/5 p-4 md:p-8 space-y-8">
                   {/* Machines */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-3">
                         <Cpu size={18} className="text-primary" />
                         <h4 className="text-[13px] font-black text-text-1 uppercase italic border-l-4 border-primary pl-4 tracking-tighter">PARQUE DE <span className="text-primary italic">MÁQUINAS</span></h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {formData.equipmentModelIds.length === 0 ? (
                            <button onClick={() => { setLinkerFilter('equipment'); setLinkerLockedType('equipment'); setIsLinkerOpen(true); }} title="Vincular Máquina" className="col-span-full py-8 md:py-12 border-2 border-dashed border-border rounded-[28px] bg-black/5 hover:bg-black/10 transition-all group">
                               <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-20 group-hover:opacity-100 italic">CLIQUE PARA VINCULAR MÁQUINAS</p>
                            </button>
                         ) : (
                            <>
                               {formData.equipmentModelIds.map(mid => {
                                  const m = equipmentModels.find(em => em.id === mid);
                                  const isAlreadySynced = contractEquipment.some(ce => ce.contract_id === editingId && ce.equipment_model_id === mid);
                                  const ce = contractEquipment.find(ce => ce.contract_id === editingId && ce.equipment_model_id === mid);
                                  const lastEntry = ce ? equipmentStockEntries.find((e: any) => e.contract_equipment_id === ce.id) : null;
                                  const lastQty = lastEntry ? (lastEntry.toner_black || 0) : null;

                                  return (
                                     <div key={mid} className="p-5 rounded-[24px] bg-surface border border-border flex flex-col gap-2 group hover:border-danger/30 transition-all relative">
                                        <button 
                                           onClick={() => removePendingAsset(mid, 'equipment')} 
                                           title="Desvincular Máquina" 
                                           className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 text-text-2 hover:bg-danger hover:text-white transition-all flex items-center justify-center border border-border/10 z-10"
                                        >
                                           <X size={16} />
                                        </button>
                                        <div className="flex justify-between items-start">
                                           <div>
                                              <h5 className="text-[12px] font-black uppercase text-text-1 leading-none pr-8">{m?.name}</h5>
                                              <p className="text-[10px] font-bold text-text-2 uppercase mt-2 opacity-40">{m?.brand}</p>
                                           </div>
                                           {isAlreadySynced && (
                                              <div className="flex flex-col items-end gap-1 px-4">
                                                 <span className="bg-primary/20 text-primary text-[7px] font-black px-2 py-1 rounded-md uppercase tracking-widest border border-primary/30">SINCRONIZADO</span>
                                                 {lastQty !== null && (
                                                    <span className="text-[9px] font-black text-text-1 opacity-60 uppercase">Último: {lastQty} UN</span>
                                                 )}
                                              </div>
                                           )}
                                        </div>
                                     </div>
                                  )
                               })}
                               <button 
                                  onClick={() => { setLinkerFilter('equipment'); setLinkerLockedType('equipment'); setIsLinkerOpen(true); }} 
                                  title="Adicionar Mais Máquinas"
                                  className="p-5 rounded-[24px] border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary transition-all group min-h-[100px]"
                               >
                                  <Plus size={20} className="text-primary group-hover:scale-125 transition-all" />
                                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">Adicionar Mais</span>
                               </button>
                            </>
                         )}
                      </div>
                   </div>

                   {/* Supplies */}
                   <div className="space-y-6">
                      <div className="flex items-center gap-3">
                         <Package size={18} className="text-primary" />
                         <h4 className="text-[13px] font-black text-text-1 uppercase italic border-l-4 border-primary pl-4 tracking-tighter">INSUMOS & <span className="text-primary italic">PEÇAS</span></h4>
                      </div>
                      <div className="space-y-3">
                         {formData.supplyConfigs.length === 0 ? (
                            <button onClick={() => { setLinkerFilter('supply'); setLinkerLockedType('supply'); setIsLinkerOpen(true); }} title="Vincular Insumo" className="w-full py-8 md:py-12 border-2 border-dashed border-border rounded-[28px] bg-black/5 hover:bg-black/10 transition-all group">
                               <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-20 group-hover:opacity-100 italic">CLIQUE PARA VINCULAR INSUMOS</p>
                            </button>
                         ) : (
                            <>
                               {formData.supplyConfigs.map(sc => {
                                   const m = equipmentModels.find(em => em.id === sc.modelId);
                                   const isAlreadySynced = contractSupplies.some(cs => cs.contract_id === editingId && cs.supply_type_id === sc.modelId);
                                   return (
                                      <div key={sc.modelId} className="p-4 rounded-[20px] bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-3 group hover:border-primary transition-all">
                                         <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                               <h5 className="text-[11px] font-black uppercase text-text-1 leading-none">{m?.name}</h5>
                                               {isAlreadySynced && (
                                                  <span className="bg-primary/20 text-primary text-[6px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border border-primary/20">SINC</span>
                                               )}
                                            </div>
                                            <p className="text-[9px] font-bold text-text-2 uppercase mt-1.5 opacity-40">{m?.brand} / {m?.type === 'supply' ? 'INSUMO' : 'PEÇA'}</p>
                                         </div>
                                         <div className="flex items-center gap-4 self-end md:self-auto">
                                            <div className="flex flex-col items-end">
                                               <span className="text-[8px] font-black opacity-20 uppercase mb-1">QTD MÍNIMA</span>
                                               <input 
                                                  type="number" 
                                                  title="Quantidade Mínima em Estoque"
                                                  placeholder="0"
                                                  className="h-10 w-16 bg-bg border border-border rounded-lg text-center font-black text-[11px] outline-none focus:border-primary" 
                                                  value={sc.minStock} 
                                                  onChange={e => setFormData(prev => ({...prev, supplyConfigs: prev.supplyConfigs.map(x => x.modelId === sc.modelId ? {...x, minStock: parseInt(e.target.value) || 0} : x)}))}
                                               />
                                            </div>
                                            <button onClick={() => removePendingAsset(sc.modelId, 'supply')} title="Desvincular Insumo" className="text-text-2 hover:text-danger transition-all flex items-center justify-center p-2"><X size={18} /></button>
                                         </div>
                                      </div>
                                   )
                               })}
                               <button 
                                  onClick={() => { setLinkerFilter('supply'); setLinkerLockedType('supply'); setIsLinkerOpen(true); }} 
                                  title="Adicionar Mais Insumos"
                                  className="w-full p-5 rounded-[20px] border-2 border-dashed border-border flex items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary transition-all group"
                               >
                                  <Plus size={18} className="text-primary" />
                                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100">Adicionar Mais Insumos</span>
                               </button>
                            </>
                         )}
                      </div>
                   </div>
                </div>
            </div>

            <div className="p-6 md:p-10 border-t border-border flex justify-end bg-bg/40">
               <Button onClick={handleSaveContract} className="w-full md:w-auto h-16 px-20 rdy-btn-elite text-[12px]">SALVAR PARÂMETROS</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* LINKER MODAL */}
      {isLinkerOpen && createPortal(
        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-3xl animate-fade">
          <div className="w-full max-w-xl bg-surface border border-border rounded-[32px] md:rounded-[40px] shadow-2xl flex flex-col max-h-[80vh] animate-slide-up overflow-hidden">
            <div className="p-5 md:p-8 border-b border-border flex justify-between items-center bg-bg/20">
                <h3 className="text-xl font-black text-text-1 uppercase italic tracking-tighter leading-none">CATÁLOGO <span className="text-primary italic">MESTRE</span></h3>
                <button onClick={() => { setIsLinkerOpen(false); setLinkerLockedType(null); }} title="Fechar Catálogo" className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-danger transition-all"><X size={18} /></button>
            </div>
            
            <div className="px-5 md:px-8 py-5 border-b border-border flex flex-col md:flex-row items-center gap-3 bg-black/5">
                 {!linkerLockedType && (
                   <div className="flex bg-white p-1 rounded-xl border border-border overflow-x-auto w-full md:w-auto">
                      {(['equipment', 'supply', 'part'] as const).map(type => (
                         <button key={type} onClick={() => { setLinkerFilter(type); setLinkerSearch(''); }} title={`Filtrar por ${type === 'equipment' ? 'Máquinas' : type === 'supply' ? 'Insumos' : 'Peças'}`} className={cn("h-9 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap", linkerFilter === type ? "bg-primary text-black" : "text-text-2 hover:text-text-1")}>
                            {type === 'equipment' ? 'Máquinas' : type === 'supply' ? 'Insumos' : 'Peças'}
                         </button>
                      ))}
                   </div>
                 )}
                 {linkerLockedType && (
                    <div className="h-9 px-6 bg-black/5 rounded-xl border border-border/50 flex items-center justify-center">
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-1 opacity-40">FILTRO ATIVO: {linkerFilter === 'equipment' ? 'MÁQUINAS' : 'INSUMOS & PEÇAS'}</span>
                    </div>
                 )}
                 <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-1 opacity-20" size={14} />
                    <input title="Pesquisar no Catálogo" placeholder="BUSCAR ITEM..." className="w-full h-10 bg-white border border-border rounded-xl pl-10 pr-4 text-[9px] font-black uppercase outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-inner" value={linkerSearch} onChange={e => setLinkerSearch(e.target.value)} />
                 </div>
              </div>
            
            <div className="p-3 md:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-2 bg-bg/10">
                {filteredModels.map(model => {
                    const isLinked = linkerFilter === 'equipment' ? formData.equipmentModelIds.includes(model.id) : formData.supplyConfigs.some(sc => sc.modelId === model.id);
                    return (
                        <button 
                            key={model.id} 
                            onClick={() => handleLinkItem(model.id, model.type)} 
                            title={isLinked ? "Remover do Contrato" : "Vincular no Contrato"} 
                            className={cn(
                                "w-full p-5 rounded-2xl border flex items-center justify-between transition-all group", 
                                isLinked 
                                    ? "bg-primary border-primary shadow-lg shadow-primary/20 scale-[0.98]" 
                                    : "bg-surface border-border hover:border-primary hover:shadow-lg active:scale-95"
                            )}
                        >
                            <div className="text-left">
                                <h4 className={cn("text-[11px] font-black uppercase", isLinked ? "text-black" : "text-text-1")}>{model.name}</h4>
                                <p className={cn("text-[9px] font-bold uppercase opacity-40", isLinked ? "text-black" : "text-text-2")}>{model.brand}</p>
                            </div>
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                isLinked ? "bg-black text-primary" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black"
                            )}>
                                {isLinked ? <Check size={16} strokeWidth={4} /> : <Plus size={18} />}
                            </div>
                        </button>
                    )
                })}
                {filteredModels.length === 0 && (
                  <div className="py-10 text-center opacity-20">
                     <p className="text-[10px] font-black uppercase tracking-widest italic">Nenhum item disponível nesta categoria</p>
                  </div>
                )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* TECH SELECTOR */}
      {isTechSelectorOpen && createPortal(
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-md">
           <div className="w-full max-w-sm bg-surface border border-border rounded-[40px] shadow-2xl p-6 md:p-10 space-y-6 animate-slide-up">
              <div className="flex justify-between items-center border-b border-border/10 pb-4">
                 <h4 className="text-base font-black text-text-1 uppercase italic tracking-tighter leading-none">CONVOCAR TIME</h4>
                 <button onClick={() => setIsTechSelectorOpen(false)} title="Fechar Seleção de Técnicos" className="p-2 hover:bg-black/5 rounded-full"><X size={20} /></button>
              </div>
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-1 opacity-20" size={16} />
                 <input title="Pesquisar Técnicos" placeholder="BUSCAR TÉCNICO PELO NOME..." className="w-full h-12 bg-black/5 border-transparent rounded-2xl pl-12 pr-4 text-[10px] font-black uppercase outline-none focus:ring-1 focus:ring-primary h-14 shadow-inner" value={techSearch} onChange={e => setTechSearch(e.target.value)} />
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                 {techniciansList.filter(t => !techSearch || t.name.toLowerCase().includes(techSearch.toLowerCase())).map(tech => {
                    const isSelected = formData.technicianIds.includes(tech.id);
                    return (
                       <button key={tech.id} onClick={() => handleToggleTech(tech.id)} title={isSelected ? "Remover Técnico" : "Selecionar Técnico"} className={cn("w-full p-5 rounded-2xl flex items-center justify-between border transition-all", isSelected ? "bg-primary border-primary text-black" : "bg-black/5 border-transparent text-text-2 hover:border-black/20")}>
                          <span className="text-[11px] font-black uppercase">{tech.name}</span>
                          {isSelected && <Check size={16} strokeWidth={4} />}
                       </button>
                    )
                 })}
              </div>
              <Button className="w-full h-14 rounded-2xl text-[11px] font-black uppercase shadow-lg" onClick={() => setIsTechSelectorOpen(false)}>CONCLUIR SELEÇÃO</Button>
           </div>
        </div>,
        document.body
      )}

      {isImportModalOpen && (
        <ImportModal 
          type="contracts"
          onClose={() => setIsImportModalOpen(false)}
          onImport={importContracts}
        />
      )}
    </div>
  );
};
