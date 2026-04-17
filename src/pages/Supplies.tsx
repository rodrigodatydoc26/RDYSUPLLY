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
      {/* Header Section - Final Layout Standard */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--rdy-primary-rgb),0.6)]" />
            <p className="text-text-2 text-[10px] font-black uppercase tracking-[0.3em] leading-none">Catálogo Mestre de Recursos</p>
          </div>
          <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            INSUMOS <span className="text-text-2/40 font-light not-italic">E ATIVOS</span>
          </h2>
        </div>
        {user?.role !== 'technician' && (
          <button 
            className="h-12 px-10 bg-primary text-black rounded-2xl font-black italic uppercase text-[11px] tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
            onClick={openAddModal}
          >
            <Plus size={20} strokeWidth={3} />
            <span>+ Novo Insumo</span>
          </button>
        )}
      </div>

      {/* Control Bar - Layout Inicial Style */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 p-1 bg-surface/50 border border-border/40 rounded-xl w-fit backdrop-blur-md">
          <button 
            onClick={() => { setActiveTab('supplies'); setSearchTerm(''); }}
            className={`flex items-center gap-3 px-6 h-10 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'supplies' ? 'bg-primary text-black shadow-md shadow-primary/10' : 'text-text-2/60 hover:text-text-1 hover:bg-white/5'}`}
          >
            <Box size={14} strokeWidth={activeTab === 'supplies' ? 2.5 : 2} />
            Insumos
          </button>
          <button 
            onClick={() => { setActiveTab('equipment'); setSearchTerm(''); }}
            className={`flex items-center gap-3 px-6 h-10 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'equipment' ? 'bg-primary text-black shadow-md shadow-primary/10' : 'text-text-2/60 hover:text-text-1 hover:bg-white/5'}`}
          >
            <Printer size={14} strokeWidth={activeTab === 'equipment' ? 2.5 : 2} />
            Equipamentos
          </button>
        </div>

        <div className="flex-1 relative w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-2/30 group-focus-within:text-primary transition-colors" size={17} />
          <input
            type="text"
            placeholder="FILTRAR INSUMOS..."
            className="w-full h-12 bg-surface/40 border border-border/40 rounded-xl pl-14 pr-8 text-[11px] uppercase font-black tracking-[0.1em] text-text-1 placeholder-text-2/20 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* High Density Table Container */}
      <div className="bg-white border border-border/60 rounded-[28px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-text-2/30 text-[8.5px] font-black uppercase tracking-[0.4em] bg-white">
                <th className="px-10 py-5">Identificação</th>
                <th className="px-10 py-5">Categoria</th>
                {activeTab === 'supplies' && <th className="px-10 py-5">Rendimento/Cap</th>}
                <th className="px-10 py-5 text-right">Tarefa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {activeTab === 'supplies' ? (
                filteredSupplies.map(supply => (
                  <tr key={supply.id} className="group hover:bg-primary/[0.01] transition-all">
                    <td className="px-10 py-4">
                      <div>
                        <p className="font-black text-text-1 uppercase tracking-tight text-[13px] leading-tight">{supply.name}</p>
                        <p className="text-[8px] text-text-2 font-black uppercase tracking-[0.2em] mt-1 opacity-40">{supply.unit}</p>
                      </div>
                    </td>
                    <td className="px-10 py-4">
                      <div className="flex items-center gap-3">
                         <div className="px-3 py-1 bg-surface border border-border/60 rounded-lg text-text-2 text-[8px] font-black uppercase tracking-widest">
                            {supply.category} <span className="opacity-20 ml-2 font-medium">{supply.color}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-4 font-black text-text-2/60 text-[11px] tracking-tight">
                      {supply.capacity} pg
                    </td>
                    <td className="px-10 py-4">
                      <div className="flex items-center justify-end gap-1">
                         <button onClick={() => openEditModal(supply)} className="p-2.5 text-text-2/20 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                           <Edit2 size={15} strokeWidth={2.5} />
                         </button>
                         <button onClick={() => deleteSupplyType(supply.id)} className="p-2.5 text-text-2/20 hover:text-danger hover:bg-danger/10 rounded-xl transition-all">
                           <Trash2 size={15} strokeWidth={2.5} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredEquipment.map(model => (
                  <tr key={model.id} className="group hover:bg-primary/[0.01] transition-all">
                    <td className="px-10 py-4">
                      <p className="font-black text-text-1 uppercase tracking-tight text-[13px] leading-tight">{model.name}</p>
                    </td>
                    <td className="px-10 py-4 text-[11px] font-black text-text-2/60 uppercase tracking-widest">
                      {model.brand}
                    </td>
                    <td className="px-10 py-4">
                      <div className="flex items-center justify-end gap-1">
                         <button onClick={() => openEditModal(model)} className="p-2.5 text-text-2/20 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                           <Edit2 size={15} strokeWidth={2.5} />
                         </button>
                         <button onClick={() => deleteEquipmentModel(model.id)} className="p-2.5 text-text-2/20 hover:text-danger hover:bg-danger/10 rounded-xl transition-all">
                           <Trash2 size={15} strokeWidth={2.5} />
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
