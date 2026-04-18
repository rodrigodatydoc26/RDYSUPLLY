import { useState } from 'react';
import {
  Plus,
  Monitor,
  Hash,
  Settings2,
  X,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import type { Contract } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { Button, Input, Card, Badge, CMYKBadge } from '../components/ui/Base';

export const Contracts = () => {
  const {
    contracts,
    equipmentModels,
    contractEquipment,
    equipmentMinStock,
    addContract,
    updateContract,
    addEquipmentToContract,
  } = useDataStore();
  const { user } = useAuthStore();
  
  const [searchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Equipment Management state
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  
  // New Equipment Form
  const [eqForm, setEqForm] = useState({
    equipment_model_id: '',
    serial_number: '',
    location: '',
  });

  // Modal Form State for Contract
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    code: '',
    active: true,
  });

  const filteredContracts = contracts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', client: '', code: '', active: true });
    setIsModalOpen(true);
  };

  const handleSaveContract = async () => {
    if (!formData.name || !formData.client || !formData.code) return toast.error('Preencha os campos obrigatórios');
    
    try {
      if (editingId) {
        await updateContract({ id: editingId, ...formData } as Contract);
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

  const handleAddEquipment = async () => {
    if (!eqForm.equipment_model_id || !eqForm.serial_number) return toast.error('Selecione o modelo e informe o Serial');
    if (!selectedContractId) return;

    try {
      const model = equipmentModels.find(m => m.id === eqForm.equipment_model_id);
      if (!model) return;

      // Default min stock for new equipment
      const minStockData = {
        toner_black_min: 2,
        toner_cyan_min: model.is_color ? 2 : 0,
        toner_magenta_min: model.is_color ? 2 : 0,
        toner_yellow_min: model.is_color ? 2 : 0,
        drum_black_min: model.has_drum ? 1 : 0,
        drum_cyan_min: (model.has_drum && model.is_color) ? 1 : 0,
        drum_magenta_min: (model.has_drum && model.is_color) ? 1 : 0,
        drum_yellow_min: (model.has_drum && model.is_color) ? 1 : 0,
      };

      await addEquipmentToContract(
        { ...eqForm, contract_id: selectedContractId, active: true },
        minStockData
      );
      
      toast.success('Equipamento instalado no contrato');
      setIsEquipmentModalOpen(false);
      setEqForm({ equipment_model_id: '', serial_number: '', location: '' });
    } catch {
      toast.error('Erro ao instalar equipamento');
    }
  };

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
            CONTRATOS <span className="text-text-2 font-light not-italic  text-3xl">E PARQUE</span>
          </h2>
        </div>
        {user?.role !== 'technician' && (
          <Button 
            className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/10"
            onClick={openAddModal}
          >
            <Plus size={18} strokeWidth={3} />
            Novo Contrato
          </Button>
        )}
      </div>

      {/* Grid of Contracts */}
      <div className="grid grid-cols-1 gap-6">
        {filteredContracts.map((contract) => {
          const machines = contractEquipment.filter(ce => ce.contract_id === contract.id);
          
          return (
            <Card key={contract.id} className="overflow-hidden group">
              <div className="flex flex-col lg:flex-row h-full">
                {/* Contract Info Sidebar */}
                <div className="w-full lg:w-80 bg-bg p-8 border-r border-border flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant={contract.active ? 'success' : 'neutral'}>
                        {contract.active ? 'Ativo' : 'Pausado'}
                      </Badge>
                      <span className="text-[10px] font-black text-text-2 tracking-widest uppercase italic">{contract.code}</span>
                    </div>
                    <h3 className="text-xl font-black text-text-1 uppercase tracking-tight mb-2 leading-tight">{contract.name}</h3>
                    <p className="text-xs font-bold text-text-2 uppercase tracking-widest">{contract.client}</p>
                  </div>
                  
                  <div className="mt-8 space-y-3">
                     <Button 
                       variant="outline" 
                       className="w-full justify-between group/btn text-[10px] uppercase font-black"
                       onClick={() => { setSelectedContractId(contract.id); setIsEquipmentModalOpen(true); }}
                     >
                       Instalar Máquina
                       <Plus size={14} className="group-hover/btn:rotate-90 transition-transform" />
                     </Button>
                     <Button variant="ghost" className="w-full text-text-2 hover:text-text-1 text-[9px] uppercase font-bold" onClick={() => { setEditingId(contract.id); setFormData({...contract}); setIsModalOpen(true); }}>
                       Editar Contrato
                     </Button>
                  </div>
                </div>

                {/* Equipment List Area */}
                <div className="flex-1 p-8 bg-surface">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                         <Monitor size={18} className="text-primary" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-1">Parque de Máquinas ({machines.length})</span>
                      </div>
                   </div>

                   {machines.length === 0 ? (
                     <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-[32px] opacity-30">
                        <Monitor size={32} className="mb-3" />
                        <p className="text-[9px] font-black uppercase tracking-widest">Nenhuma máquina instalada</p>
                     </div>
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {machines.map(me => {
                           const model = equipmentModels.find(m => m.id === me.equipment_model_id);
                           void equipmentMinStock.find(ms => ms.contract_equipment_id === me.id);
                           
                           return (
                             <div key={me.id} className="p-5 rounded-2xl bg-bg border border-border group/card hover:border-primary transition-all">
                                <div className="flex justify-between items-start mb-4">
                                   <div>
                                      <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">{model?.brand}</p>
                                      <h4 className="text-sm font-black text-text-1 tracking-tight">{model?.name}</h4>
                                   </div>
                                   <Badge variant="neutral" className="text-[8px]">{me.location}</Badge>
                                </div>
                                
                                <div className="flex items-center gap-4 text-[10px] font-bold text-text-2 mb-4">
                                   <div className="flex items-center gap-1.5 uppercase">
                                      <Hash size={12} />
                                      {me.serial_number}
                                   </div>
                                </div>

                                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                                   <div className="flex gap-1">
                                      <CMYKBadge type="K" className="scale-75 origin-left" />
                                      {model?.is_color && <Badge variant="info" className="scale-75 origin-left">Color</Badge>}
                                   </div>
                                   <button 
                                      className="p-2 text-text-2 hover:text-text-1 transition-colors"
                                      title="Configurações da Máquina"
                                      aria-label="Ver mais detalhes e configurações"
                                    >
                                      <Settings2 size={14} />
                                   </button>
                                </div>
                             </div>
                           )
                        })}
                     </div>
                   )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Contract Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-secondary/80">
          <div className="w-full max-w-xl bg-surface border border-border rounded-[40px] shadow-2xl animate-fade">
            <div className="px-10 py-8 border-b border-border flex justify-between items-center bg-bg/50">
              <h3 className="text-2xl font-black text-text-1 italic uppercase tracking-tighter">
                {editingId ? 'Editar' : 'Novo'} <span className="text-primary italic">Contrato</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-2xl bg-surface border border-border flex items-center justify-center text-text-2 hover:text-danger transition-all"
                title="Fechar Modal"
                aria-label="Fechar janela de contrato"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>
            
            <div className="p-10 space-y-6">
               <div className="grid grid-cols-2 gap-6">
                 <Input label="Código RDY" placeholder="Ex: SC001" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                 <Input label="Unidade / Nome" placeholder="Ex: HOSPITAL SANTA CASA" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
               </div>
               <Input label="Razão Social / Cliente" placeholder="Ex: SANTA CASA DE MISERICÓRDIA S/A" value={formData.client} onChange={e => setFormData({...formData, client: e.target.value})} />
               
               <div className="flex items-center gap-3 p-4 bg-bg rounded-2xl border border-border">
                  <span className="text-[10px] font-black uppercase text-text-1">Contrato Ativo</span>
                  <button 
                    onClick={() => setFormData({...formData, active: !formData.active})}
                    title="Alternar Status do Contrato"
                    aria-label={formData.active ? "Desativar contrato" : "Ativar contrato"}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative px-1 flex items-center",
                      formData.active ? "bg-success" : "bg-border"
                    )}
                  >
                    <div className={cn("w-4 h-4 bg-white rounded-full transition-all", formData.active ? "translate-x-6" : "translate-x-0")} />
                  </button>
               </div>
            </div>

            <div className="px-10 py-8 bg-bg border-t border-border flex justify-end">
               <Button onClick={handleSaveContract} className="h-14 px-12 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary">
                 Salvar Alterações
               </Button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Installation Modal */}
      {isEquipmentModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-xl bg-secondary/80">
          <div className="w-full max-w-lg bg-surface border border-border rounded-[40px] shadow-2xl animate-fade">
             <div className="px-10 py-8 border-b border-border flex justify-between items-center bg-bg/50">
                <h3 className="text-2xl font-black text-text-1 italic uppercase tracking-tighter">
                  Instalar <span className="text-primary italic">Equipamento</span>
                </h3>
                <button 
                  onClick={() => setIsEquipmentModalOpen(false)} 
                  className="w-10 h-10 rounded-2xl bg-surface border border-border flex items-center justify-center text-text-2 hover:text-danger"
                  title="Fechar Modal"
                  aria-label="Fechar janela de instalação"
                >
                  <X size={20} strokeWidth={3} />
                </button>
             </div>

             <div className="p-10 space-y-6">
                <div>
                   <label 
                      htmlFor="machine-model-select"
                      className="text-[10px] font-black text-text-2 uppercase tracking-widest block mb-2 cursor-pointer"
                    >
                      Modelo do Catálogo
                    </label>
                   <select 
                     id="machine-model-select"
                     className="w-full h-14 bg-bg border border-border rounded-xl px-4 text-sm font-bold text-text-1 outline-none focus:border-primary"
                     value={eqForm.equipment_model_id}
                     onChange={e => setEqForm({...eqForm, equipment_model_id: e.target.value})}
                   >
                      <option value="">Selecione um modelo...</option>
                      {equipmentModels.map(m => (
                        <option key={m.id} value={m.id}>{m.brand} {m.name} {m.is_color ? '(Color)' : '(PB)'}</option>
                      ))}
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <Input 
                     label="Número de Série (NS)" 
                     placeholder="Ex: ABC123456" 
                     value={eqForm.serial_number} 
                     onChange={e => setEqForm({...eqForm, serial_number: e.target.value.toUpperCase()})} 
                   />
                   <Input 
                     label="Localização / Setor" 
                     placeholder="Ex: Recepção" 
                     value={eqForm.location} 
                     onChange={e => setEqForm({...eqForm, location: e.target.value})} 
                   />
                </div>
             </div>

             <div className="px-10 py-8 bg-bg border-t border-border flex justify-end">
                <Button onClick={handleAddEquipment} className="h-14 px-12 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary">
                   Confirmar Instalação
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

