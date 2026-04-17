import { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Save,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import type { SupplyType, EquipmentModel } from '../types';
import { toast } from 'sonner';

export const Supplies = () => {
  const { 
    supplyTypes, 
    equipmentModels, 
    addSupplyType, 
    updateSupplyType, 
    deleteSupplyType,
    addEquipmentModel, 
    updateEquipmentModel,
    deleteEquipmentModel
  } = useDataStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'supplies' | 'equipment'>('supplies');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [supplyForm, setSupplyForm] = useState<Omit<SupplyType, 'id' | 'created_at'>>({
    name: '',
    category: 'Toner',
    unit: 'un',
    color: 'black',
    capacity: 0,
    equipment_model_id: ''
  });

  const [equipmentForm, setEquipmentForm] = useState<Omit<EquipmentModel, 'id' | 'created_at'>>({
    name: '',
    brand: '',
    is_color: false,
    has_drum: false,
  });

  const filteredSupplies = supplyTypes.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEquipment = equipmentModels.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingId(null);
    if (activeTab === 'supplies') {
      setSupplyForm({ name: '', category: 'Toner', unit: 'un', color: 'black', capacity: 0, equipment_model_id: '' });
    } else {
      setEquipmentForm({ name: '', brand: '', is_color: false, has_drum: false });
    }
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    if (activeTab === 'supplies') {
      setSupplyForm({ ...item });
    } else {
      setEquipmentForm({ ...item });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (activeTab === 'supplies') {
      if (!supplyForm.name) return toast.error('Nome é obrigatório');
      if (editingId) {
        updateSupplyType({ id: editingId, ...supplyForm } as SupplyType);
      } else {
        addSupplyType(supplyForm);
      }
    } else {
      if (!equipmentForm.name || !equipmentForm.brand) return toast.error('Preencha os campos');
      if (editingId) {
        updateEquipmentModel({ id: editingId, ...equipmentForm } as EquipmentModel);
      } else {
        addEquipmentModel(equipmentForm);
      }
    }
    toast.success('Salvo com sucesso');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-10">
      {/* Standardized 'Catálogo Mestre' Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--rdy-primary-rgb),0.6)]" />
            <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.3em] leading-none opacity-40">Catálogo Mestre de Recursos</p>
          </div>
          <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            INSUMOS <span className="text-text-2/40 font-light not-italic uppercase">E ATIVOS</span>
          </h2>
        </div>
        {user?.role !== 'technician' && (
          <button 
            className="h-12 px-8 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/10 hover:scale-105 transition-all flex items-center gap-2"
            onClick={openAddModal}
          >
            <Plus size={16} strokeWidth={3} />
            <span>+ Novo Insumo</span>
          </button>
        )}
      </div>

      {/* Control Bar - Tacit Tabs & Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex bg-surface p-1.5 rounded-[20px] border border-border">
          <button 
            onClick={() => { setActiveTab('supplies'); setSearchTerm(''); }}
            className={`px-8 h-11 rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === 'supplies' 
                ? 'bg-primary text-black shadow-md' 
                : 'text-text-2 opacity-30 hover:text-text-1 hover:bg-bg'
            }`}
          >
            Insumos
          </button>
          <button 
            onClick={() => { setActiveTab('equipment'); setSearchTerm(''); }}
            className={`px-8 h-11 rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === 'equipment' 
                ? 'bg-primary text-black shadow-md' 
                : 'text-text-2 opacity-30 hover:text-text-1 hover:bg-bg'
            }`}
          >
            Equipamentos
          </button>
        </div>

        <div className="flex-1 relative w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-2 opacity-20 group-focus-within:opacity-100 transition-colors" size={16} />
          <input
            type="text"
            placeholder={activeTab === 'supplies' ? "FILTRAR INSUMOS..." : "FILTRAR EQUIPAMENTOS..."}
            className="w-full h-14 bg-surface border border-border rounded-[20px] pl-14 pr-8 text-[10px] font-black uppercase tracking-widest text-text-1 focus:bg-bg outline-none transition-all placeholder:text-text-2/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* High Density Table Container - Padrão Layout Inicial */}
      <div className="bg-surface border border-border rounded-[32px] overflow-hidden shadow-xl shadow-black/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-text-2/40 text-[8px] font-black uppercase tracking-widest bg-bg/50">
                <th className="px-10 py-5">Identificação do Ativo</th>
                <th className="px-10 py-5">Categoria Operacional</th>
                {activeTab === 'supplies' && <th className="px-10 py-5">Rendimento (Ciclos)</th>}
                <th className="px-10 py-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeTab === 'supplies' ? (
                filteredSupplies.map(supply => (
                  <tr key={supply.id} className="group hover:bg-bg/50 transition-all">
                    <td className="px-10 py-5">
                      <div>
                        <p className="font-black text-text-1 uppercase tracking-tight text-[12px] leading-tight">{supply.name}</p>
                        <p className="text-[8px] text-text-2/40 font-black uppercase tracking-widest mt-1.5">{supply.unit}</p>
                      </div>
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex items-center gap-3">
                         <div className="px-3 py-1 bg-bg border border-border rounded-lg text-text-1 text-[8px] font-black uppercase tracking-widest">
                            {supply.category} <span className="text-text-2/40 ml-2 font-medium">{supply.color}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-5 font-black text-text-2/40 text-[10px] tracking-widest">
                      {supply.capacity.toLocaleString()} CICLOS
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex items-center justify-end gap-1">
                         <button onClick={() => openEditModal(supply)} className="w-9 h-9 flex items-center justify-center text-text-2/20 hover:text-text-1 transition-colors">
                           <Edit2 size={14} />
                         </button>
                         <button onClick={() => deleteSupplyType(supply.id)} className="w-9 h-9 flex items-center justify-center text-text-2/20 hover:text-danger transition-colors">
                           <Trash2 size={14} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredEquipment.map(model => (
                  <tr key={model.id} className="group hover:bg-bg/50 transition-all">
                    <td className="px-10 py-5">
                      <p className="font-black text-text-1 uppercase tracking-tight text-[12px] leading-tight">{model.name}</p>
                    </td>
                    <td className="px-10 py-5 text-[10px] font-black text-text-2/40 uppercase tracking-widest">
                      {model.brand}
                    </td>
                    <td className="px-10 py-5">
                      <div className="flex items-center justify-end gap-1">
                         <button onClick={() => openEditModal(model)} className="w-9 h-9 flex items-center justify-center text-text-2/20 hover:text-text-1 transition-colors">
                           <Edit2 size={14} />
                         </button>
                         <button onClick={() => deleteEquipmentModel(model.id)} className="w-9 h-9 flex items-center justify-center text-text-2/20 hover:text-danger transition-colors">
                           <Trash2 size={14} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
          <div className="w-full max-w-sm bg-surface border border-border rounded-lg shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-text-1 italic uppercase tracking-tighter leading-none">
                  {editingId ? 'Editar' : 'Novo'} <span className="text-primary">{activeTab === 'supplies' ? 'Ativo' : 'Modelo'}</span>
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-6 h-6 rounded bg-surface border border-border flex items-center justify-center text-text-2 hover:text-danger transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {activeTab === 'supplies' ? (
                <>
                  <div>
                    <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block">Nome do Insumo</label>
                    <input className="rdy-input" value={supplyForm.name} onChange={e => setSupplyForm({...supplyForm, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block">Categoria</label>
                      <select className="rdy-input" value={supplyForm.category} onChange={e => setSupplyForm({...supplyForm, category: e.target.value as any})}>
                        <option value="Toner">Toner</option>
                        <option value="Papel">Papel</option>
                        <option value="Cilindro">Cilindro</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block">Unidade</label>
                      <input className="rdy-input font-bold" value={supplyForm.unit} onChange={e => setSupplyForm({...supplyForm, unit: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block">Rendimento (pg)</label>
                      <input type="number" className="rdy-input" value={supplyForm.capacity} onChange={e => setSupplyForm({...supplyForm, capacity: parseInt(e.target.value) || 0})} />
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block">Modelo</label>
                      <select className="rdy-input" value={supplyForm.equipment_model_id} onChange={e => setSupplyForm({...supplyForm, equipment_model_id: e.target.value})}>
                        <option value="">Universal</option>
                        {equipmentModels.map(em => (
                          <option key={em.id} value={em.id}>{em.brand} {em.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block">Fabricante</label>
                    <input className="rdy-input" placeholder="Ex: HP" value={equipmentForm.brand} onChange={e => setEquipmentForm({...equipmentForm, brand: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block">Nome do Modelo</label>
                    <input className="rdy-input" placeholder="Ex: M15w" value={equipmentForm.name} onChange={e => setEquipmentForm({...equipmentForm, name: e.target.value})} />
                  </div>
                </>
              )}

                <button 
                  onClick={handleSave}
                  className="rdy-btn-primary w-full h-10 mt-2 text-[10px]"
                >
                  <Save size={14} />
                  <span>Cadastrar no Catálogo</span>
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
