import { useState, useMemo } from 'react';
import {
  Plus,
  Monitor,
  X,
  UserPlus,
  Package,
  Settings2,
  Check,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import type { Contract } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { Button, Input, Card, Badge } from '../components/ui/Base';

export const Contracts = () => {
  const {
    contracts,
    users,
    equipmentModels,
    contractEquipment,
    equipmentMinStock,
    addContract,
    updateContract,
    deleteContract,
    addEquipmentToContract,
    removeEquipmentFromContract,
    updateEquipmentMinStock,
    updateContractTechnicians,
  } = useDataStore();
  const { user } = useAuthStore();
  
  const [searchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modal Form State for Contract
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    code: '',
    active: true,
    technicianIds: [] as string[],
  });

  // Machine Addition State
  const [selectedModelId, setSelectedModelId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('');

  const filteredContracts = contracts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const technicians = users.filter(p => p.role === 'technician' || p.role === 'admin');

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', client: '', code: '', active: true, technicianIds: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (contract: Contract) => {
    setEditingId(contract.id);
    setFormData({
      name: contract.name,
      client: contract.client,
      code: contract.code,
      active: contract.active,
      technicianIds: contract.technicianIds || [],
    });
    setIsModalOpen(true);
  };

  const handleSaveContract = async () => {
    if (!formData.name || !formData.client || !formData.code) return toast.error('Preencha os campos obrigatórios');
    
    try {
      if (editingId) {
        await updateContract({ id: editingId, ...formData } as Contract);
        await updateContractTechnicians(editingId, formData.technicianIds);
        toast.success('Contrato atualizado');
      } else {
        await addContract(formData);
        toast.success('Contrato criado com sucesso');
      }
      setIsModalOpen(false);
    } catch {
      toast.error('Erro ao salvar contrato');
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

  const handleAddMachine = async () => {
    if (!editingId) return;
    if (!selectedModelId || !serialNumber) return toast.error('Selecione o modelo e o serial');
    
    const model = equipmentModels.find(m => m.id === selectedModelId);
    if (!model) return;

    try {
      await addEquipmentToContract(
        { contract_id: editingId, equipment_model_id: selectedModelId, serial_number: serialNumber.toUpperCase(), location, active: true },
        {
          toner_black_min: 2,
          toner_cyan_min: model.is_color ? 2 : 0,
          toner_magenta_min: model.is_color ? 2 : 0,
          toner_yellow_min: model.is_color ? 2 : 0,
          drum_black_min: model.has_drum ? 1 : 0,
          drum_cyan_min: model.has_drum && model.is_color ? 1 : 0,
          drum_magenta_min: model.has_drum && model.is_color ? 1 : 0,
          drum_yellow_min: model.has_drum && model.is_color ? 1 : 0,
        }
      );
      setSerialNumber('');
      setLocation('');
      setSelectedModelId('');
      toast.success('Equipamento vinculado');
    } catch {
      toast.error('Erro ao vincular');
    }
  };

  const machinesInContract = useMemo(() => {
    if (!editingId) return [];
    return contractEquipment.filter(ce => ce.contract_id === editingId);
  }, [editingId, contractEquipment]);

  return (
    <div className="space-y-6 animate-fade pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary" />
            <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.3em]">Gestão de Unidades</p>
          </div>
          <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            CONTRATOS <span className="text-text-2 font-light not-italic text-3xl">E PARQUE</span>
          </h2>
        </div>
        {user?.role !== 'technician' && (
          <Button 
            className="rdy-btn-primary h-12 px-8"
            onClick={openAddModal}
          >
            <Plus size={18} strokeWidth={3} />
            Novo Contrato
          </Button>
        )}
      </div>

      {/* Grid of Contracts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContracts.map((contract) => {
          const machinesCount = contractEquipment.filter(ce => ce.contract_id === contract.id).length;
          
          return (
            <Card key={contract.id} className="rdy-card group hover:scale-[1.02] transition-all p-8 flex flex-col justify-between h-[300px]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={contract.active ? 'success' : 'neutral'}>
                    {contract.active ? 'Ativo' : 'Pausado'}
                  </Badge>
                  <span className="text-[10px] font-black text-text-2 tracking-widest uppercase italic">{contract.code}</span>
                </div>
                <h3 className="text-2xl font-black text-text-1 uppercase tracking-tight mb-1 leading-tight">{contract.name}</h3>
                <p className="text-[10px] font-bold text-text-2 uppercase tracking-widest truncate">{contract.client}</p>
              </div>
              
              <div className="pt-6 border-t border-border mt-auto flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] font-black uppercase text-text-2">
                   <div className="flex items-center gap-1.5">
                      <Monitor size={14} className="text-primary" />
                      {machinesCount} Máquinas
                   </div>
                </div>
                <Button 
                   variant="ghost" 
                   className="h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all"
                   onClick={() => openEditModal(contract)}
                >
                  <Settings2 size={16} />
                  Parametrizar
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* PARAMETRIZAR CONTRATO MODAL (Premium Mockup Style) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 backdrop-blur-2xl bg-secondary/90 overflow-y-auto">
          <div className="w-full max-w-6xl bg-surface border border-border rounded-[48px] shadow-2xl animate-fade overflow-hidden flex flex-col my-auto border-t-8 border-t-primary">
            {/* Header */}
            <div className="px-10 py-10 border-b border-border flex justify-between items-center bg-bg/20">
              <div className="space-y-1">
                 <h3 className="text-4xl font-black text-text-1 italic uppercase tracking-tighter leading-none">
                    PARAMETRIZAR <span className="text-primary">CONTRATO</span>
                 </h3>
                 <p className="text-[10px] font-bold text-text-2 uppercase tracking-[0.3em]">Configuração granular de ativos e regras de estoque</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                title="Fechar Modal"
                className="w-14 h-14 rounded-3xl bg-surface border border-border flex items-center justify-center text-text-2 hover:bg-danger hover:text-white hover:border-danger transition-all rotate-0 hover:rotate-90"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>
            
            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-full">
               
               {/* Left Column: Info & Techs */}
               <div className="lg:col-span-5 p-10 space-y-10 border-r border-border bg-bg/10">
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <Input label="Código RDY" placeholder="Ex: SC001" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                        <div className="flex flex-col">
                           <label className="text-[10px] font-black text-text-2 uppercase tracking-widest block mb-2 px-1">Status</label>
                           <button 
                             onClick={() => setFormData({...formData, active: !formData.active})}
                             className={cn(
                               "h-12 rounded-2xl flex items-center justify-center gap-2 px-6 transition-all font-black text-[10px] uppercase tracking-widest",
                               formData.active ? "bg-success/10 text-success border border-success/30" : "bg-border/20 text-text-2 border border-border"
                             )}
                           >
                              <div className={cn("w-2 h-2 rounded-full", formData.active ? "bg-success" : "bg-text-2")} />
                              {formData.active ? "Contrato Ativo" : "Contrato Pausado"}
                           </button>
                        </div>
                     </div>
                     <Input label="Nome Identificador" placeholder="HOSPITAL SANTA CASA" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                     <Input label="Portal do Cliente / Razão Social" placeholder="FUNDAÇÃO SANTA CASA..." value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} />
                  </div>

                  {/* Tech Selection */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 mb-2">
                        <UserPlus size={16} className="text-primary" />
                        <h4 className="text-xs font-black text-text-1 uppercase tracking-widest">Equipe Técnica</h4>
                     </div>
                     <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 scroll-elite">
                        {technicians.map(tech => {
                           const isSelected = formData.technicianIds.includes(tech.id);
                           return (
                              <button 
                                 key={tech.id}
                                 onClick={() => handleToggleTech(tech.id)}
                                 className={cn(
                                    "p-4 rounded-2xl flex items-center justify-between border transition-all text-left",
                                    isSelected 
                                       ? "bg-primary/10 border-primary text-text-1" 
                                       : "bg-surface border-border text-text-2 hover:border-text-2/30"
                                 )}
                              >
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-inherit">{tech.name}</span>
                                    <span className="text-[9px] font-medium">{tech.email}</span>
                                 </div>
                                 {isSelected && <Check size={14} className="text-primary" strokeWidth={4} />}
                              </button>
                           )
                        })}
                     </div>
                  </div>
               </div>

               {/* Right Column: Insumos & Equipamentos */}
               <div className="lg:col-span-7 p-10 space-y-10 h-full overflow-y-auto scroll-elite bg-bg/5">
                  
                  {/* Supplies Dashboard */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Package size={20} className="text-primary" />
                          <h4 className="text-lg font-black text-text-1 uppercase tracking-tight italic">CATÁLOGO DE <span className="text-primary">INSUMOS</span></h4>
                       </div>
                       <Button variant="outline" className="h-10 text-[9px] uppercase font-black tracking-widest">Vincular Insumos <Plus size={12} className="ml-1" /></Button>
                    </div>
                    {/* Placeholder Supply List until further implementation */}
                    <div className="space-y-3">
                       <div className="p-5 rounded-3xl bg-surface border border-border flex items-center justify-between group hover:border-primary transition-all shadow-xl shadow-black/[0.02]">
                          <div>
                             <h5 className="text-[11px] font-black uppercase text-text-1">PAPEL A4 REPROGRAF</h5>
                             <p className="text-[9px] font-bold text-text-2 uppercase">Papelaria / Outros</p>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="text-right">
                                <p className="text-[8px] font-black uppercase text-text-2">Mínimo</p>
                                 <Input className="h-10 w-20 text-center font-black text-lg p-0" value="10" />
                              </div>
                              <button 
                                title="Remover Insumo"
                                className="text-text-2 hover:text-danger p-2 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <X size={16} />
                              </button>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Machines (Equipments) Section */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Monitor size={20} className="text-primary" />
                          <h4 className="text-lg font-black text-text-1 uppercase tracking-tight italic">PARQUE DE <span className="text-primary">MÁQUINAS</span></h4>
                       </div>
                    </div>

                    {/* New Machine Form Inline */}
                    <Card className="p-6 bg-secondary border-none rounded-[32px] space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                           <select 
                             className="bg-surface border border-border rounded-2xl h-12 px-4 text-[10px] font-black uppercase outline-none focus:border-primary text-text-1"
                             title="Selecionar Modelo de Equipamento"
                             value={selectedModelId}
                             onChange={e => setSelectedModelId(e.target.value)}
                           >
                             <option value="">SELECIONAR MODELO...</option>
                             {equipmentModels.map(m => (
                               <option key={m.id} value={m.id}>{m.brand} {m.name}</option>
                             ))}
                          </select>
                           <Input 
                              placeholder="NS (EX: SERIAL123)" 
                              className="bg-surface h-12 rounded-2xl border border-border px-4" 
                              value={serialNumber} 
                              onChange={e => setSerialNumber(e.target.value.toUpperCase())} 
                           />
                       </div>
                       <div className="flex gap-4">
                           <Input 
                              placeholder="LOCALIZAÇÃO (EX: RECEPÇÃO)" 
                              className="bg-surface flex-1 h-12 rounded-2xl border border-border px-4" 
                              value={location} 
                              onChange={e => setLocation(e.target.value)} 
                           />
                          <Button className="rdy-btn-primary h-12 px-8" onClick={handleAddMachine}>VINCULAR</Button>
                       </div>
                    </Card>

                    {/* Linked Machines List */}
                    <div className="space-y-4">
                       {machinesInContract.map(machine => {
                          const model = equipmentModels.find(m => m.id === machine.equipment_model_id);
                          const rules = equipmentMinStock.find(ms => ms.contract_equipment_id === machine.id);

                          return (
                             <div key={machine.id} className="p-6 bg-surface border border-border rounded-[32px] shadow-xl shadow-black/[0.02] flex flex-col gap-6 group hover:border-primary/50 transition-all">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                                         <Monitor size={24} />
                                      </div>
                                      <div>
                                         <div className="flex items-center gap-2">
                                            <Badge variant="neutral" className="bg-primary text-black border-none text-[8px]">{model?.brand}</Badge>
                                            <h5 className="text-sm font-black uppercase text-text-1">{model?.name}</h5>
                                         </div>
                                         <p className="text-[10px] font-bold text-text-2 uppercase tracking-widest">{machine.serial_number} • {machine.location}</p>
                                      </div>
                                   </div>
                                    <button 
                                       onClick={() => removeEquipmentFromContract(machine.id)}
                                       title="Remover Equipamento do Contrato"
                                       className="text-text-2 hover:text-danger p-2 transition-colors"
                                    >
                                       <X size={18} />
                                    </button>
                                </div>

                                {/* TONER RULES SECTION (Regras do Toner) */}
                                <div className="bg-bg/50 rounded-2xl p-5 space-y-4 border border-border/50">
                                   <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-black text-text-1 uppercase tracking-widest flex items-center gap-2">
                                         <Settings2 size={12} className="text-primary" />
                                         REGRAS DE ESTOQUE (MÍNIMO)
                                      </span>
                                      {model?.is_color ? <Badge variant="info" className="text-[8px]">Colorida</Badge> : <Badge variant="neutral" className="text-[8px]">Monocromática</Badge>}
                                   </div>
                                   
                                   <div className="grid grid-cols-4 gap-4">
                                      <div className="space-y-1">
                                         <p className="text-[8px] font-black text-center text-text-2">PRETO (K)</p>
                                         <div className="relative group/field">
                                             <Input 
                                                type="number" 
                                                className="h-10 text-center font-black bg-surface rounded-xl border border-border focus:border-primary w-full" 
                                                value={rules?.toner_black_min || 0}
                                                onChange={e => updateEquipmentMinStock(machine.id, 'toner_black_min', Number(e.target.value))}
                                             />
                                            <div className="absolute inset-y-0 left-0 w-1 bg-black rounded-l-xl opacity-50" />
                                         </div>
                                      </div>
                                      {model?.is_color && (
                                         <>
                                            <div className="space-y-1">
                                               <p className="text-[8px] font-black text-center text-text-2">CIANO (C)</p>
                                               <div className="relative group/field">
                                                   <Input 
                                                      type="number" 
                                                      className="h-10 text-center font-black bg-surface rounded-xl border border-border focus:border-cyan w-full" 
                                                      value={rules?.toner_cyan_min || 0}
                                                      onChange={e => updateEquipmentMinStock(machine.id, 'toner_cyan_min', Number(e.target.value))}
                                                   />
                                                  <div className="absolute inset-y-0 left-0 w-1 bg-cyan rounded-l-xl opacity-50" />
                                               </div>
                                            </div>
                                            <div className="space-y-1">
                                               <p className="text-[8px] font-black text-center text-text-2">MAGENTA (M)</p>
                                               <div className="relative group/field">
                                                   <Input 
                                                      type="number" 
                                                      className="h-10 text-center font-black bg-surface rounded-xl border border-border focus:border-magenta w-full" 
                                                      value={rules?.toner_magenta_min || 0}
                                                      onChange={e => updateEquipmentMinStock(machine.id, 'toner_magenta_min', Number(e.target.value))}
                                                   />
                                                  <div className="absolute inset-y-0 left-0 w-1 bg-magenta rounded-l-xl opacity-50" />
                                               </div>
                                            </div>
                                            <div className="space-y-1">
                                               <p className="text-[8px] font-black text-center text-text-2">YELLOW (Y)</p>
                                               <div className="relative group/field">
                                                   <Input 
                                                      type="number" 
                                                      className="h-10 text-center font-black bg-surface rounded-xl border border-border focus:border-primary w-full" 
                                                      value={rules?.toner_yellow_min || 0}
                                                      onChange={e => updateEquipmentMinStock(machine.id, 'toner_yellow_min', Number(e.target.value))}
                                                   />
                                                  <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-l-xl opacity-50" />
                                               </div>
                                            </div>
                                         </>
                                      )}
                                   </div>
                                </div>
                             </div>
                          )
                       })}
                    </div>
                  </div>

               </div>
            </div>

            {/* Sticky Footer */}
            <div className="px-10 py-8 bg-bg border-t border-border flex justify-between items-center bg-bg/40">
               <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black text-text-2 uppercase">Criado em</span>
                     <span className="text-[10px] font-medium text-text-1">18/04/2026</span>
                  </div>
                  <div className="h-8 w-[1px] bg-border" />
                  {editingId && (
                     <button 
                        onClick={() => { if(confirm('Excluir contrato Permanentemente?')) deleteContract(editingId).then(() => setIsModalOpen(false)); }}
                        className="text-[9px] font-black uppercase text-danger hover:underline"
                     >
                        Excluir Contrato
                     </button>
                  )}
               </div>
               <Button 
                  onClick={handleSaveContract} 
                  className="rdy-btn-primary h-16 px-16 text-[12px] shadow-2xl"
               >
                 SALVAR PARÂMETROS DE CONTRATO
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
