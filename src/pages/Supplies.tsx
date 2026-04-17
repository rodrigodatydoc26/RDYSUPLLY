import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Printer,
  X,
  Save,
  Box,
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
    brand: ''
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
      setEquipmentForm({ name: '', brand: '' });
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
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <p className="text-text-2 text-[9px] font-black uppercase tracking-[0.3em]">Catálogo Mestre de Recursos</p>
          </div>
          <h2 className="text-3xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            INSUMOS <span className="text-text-2/40 font-light not-italic">E ATIVOS</span>
          </h2>
        </div>
        {user?.role !== 'technician' && (
          <button 
            className="h-12 px-8 bg-primary text-black rounded-xl font-black italic uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
            onClick={openAddModal}
          >
            <Plus size={16} strokeWidth={3} />
            <span>Novo {activeTab === 'supplies' ? 'Insumo' : 'Equipamento'}</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs - Elite Style */}
      <div className="flex items-center gap-3 p-1.5 bg-surface/50 border border-border/40 rounded-2xl w-fit shadow-inner">
        <button 
          onClick={() => { setActiveTab('supplies'); setSearchTerm(''); }}
          className={`flex items-center gap-3 px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'supplies' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-2/60 hover:text-text-1 hover:bg-white/5'}`}
        >
          <Box size={16} strokeWidth={activeTab === 'supplies' ? 2.5 : 2} />
          Insumos
        </button>
        <button 
          onClick={() => { setActiveTab('equipment'); setSearchTerm(''); }}
          className={`flex items-center gap-3 px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'equipment' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-2/60 hover:text-text-1 hover:bg-white/5'}`}
        >
          <Printer size={16} strokeWidth={activeTab === 'equipment' ? 2.5 : 2} />
          Equipamentos
        </button>
      </div>

      {/* Content Container */}
      <div className="bg-white border border-border/60 rounded-[32px] overflow-hidden shadow-2xl">
        {/* Search Bar - Elite Style */}
        <div className="px-8 py-6 bg-surface/10 border-b border-border/40">
           <div className="relative group w-full max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-2/30 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="text"
                placeholder={`FILTRAR ${activeTab === 'supplies' ? 'INSUMOS' : 'MODELOS'}...`}
                className="w-full h-14 bg-surface/40 border border-hidden rounded-2xl pl-16 pr-8 text-[11px] uppercase font-bold tracking-[0.1em] text-text-1 placeholder-text-2/20 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* High Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-text-2 text-[8px] font-black uppercase tracking-[0.2em] bg-surface/20">
                <th className="px-8 py-5">{activeTab === 'supplies' ? 'Identificação' : 'Nome do Modelo'}</th>
                <th className="px-8 py-5">{activeTab === 'supplies' ? 'Categoria' : 'Fabricante'}</th>
                {activeTab === 'supplies' && <th className="px-8 py-5">Rendimento/Cap</th>}
                <th className="px-8 py-5 text-right">Tarefa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {activeTab === 'supplies' ? (
                filteredSupplies.map(supply => (
                  <tr key={supply.id} className="group hover:bg-black/[0.01] transition-all">
                    <td className="px-8 py-5">
                      <div>
                        <p className="font-black text-text-1 uppercase tracking-tight text-sm leading-tight">{supply.name}</p>
                        <p className="text-[9px] text-text-2 font-black uppercase tracking-widest mt-1 opacity-40">{supply.unit}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                         <div className="px-3 py-1 bg-surface border border-border rounded-lg text-text-2 text-[9px] font-black uppercase tracking-widest shadow-sm">
                            {supply.category} <span className="opacity-30 ml-2">{supply.color}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-black text-text-2/40 text-[11px] uppercase tracking-widest">
                      {supply.capacity} pg
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-3">
                         <button onClick={() => openEditModal(supply)} className="w-10 h-10 flex items-center justify-center text-text-2/20 hover:text-black hover:bg-surface rounded-xl border border-transparent hover:border-border transition-all">
                           <Edit2 size={16} />
                         </button>
                         <button onClick={() => deleteSupplyType(supply.id)} className="w-10 h-10 flex items-center justify-center text-text-2/20 hover:text-danger hover:bg-danger/5 rounded-xl border border-transparent hover:border-danger/20 transition-all">
                           <Trash2 size={16} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredEquipment.map(model => (
                  <tr key={model.id} className="group hover:bg-black/[0.01] transition-all">
                    <td className="px-8 py-5">
                      <p className="font-black text-text-1 uppercase tracking-tight text-sm leading-tight">{model.name}</p>
                    </td>
                    <td className="px-8 py-5 text-[11px] font-black text-text-2/60 uppercase tracking-widest">
                      {model.brand}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-3">
                         <button onClick={() => openEditModal(model)} className="w-10 h-10 flex items-center justify-center text-text-2/20 hover:text-black hover:bg-surface rounded-xl border border-transparent hover:border-border transition-all">
                           <Edit2 size={16} />
                         </button>
                         <button onClick={() => deleteEquipmentModel(model.id)} className="w-10 h-10 flex items-center justify-center text-text-2/20 hover:text-danger hover:bg-danger/5 rounded-xl border border-transparent hover:border-danger/20 transition-all">
                           <Trash2 size={16} />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60">
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
