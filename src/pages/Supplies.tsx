import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Printer,
  X,
  Save,
  Layers,
  Box,
  Droplets,
  Package
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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <div className="w-1.5 h-1.5 rounded-full bg-primary" />
             <p className="text-[8px] font-black text-text-2 uppercase tracking-widest leading-none">Catálogo Mestre de Recursos</p>
           </div>
           <h2 className="text-xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
             Insumos <span className="text-text-2/40">e Ativos</span>
           </h2>
        </div>
        {user?.role !== 'technician' && (
          <button className="rdy-btn-primary h-9" onClick={openAddModal}>
            <Plus size={14} />
            <span className="uppercase tracking-wider">Novo {activeTab === 'supplies' ? 'Insumo' : 'Modelo'}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 p-0.5 bg-surface/50 border border-border rounded w-fit">
        <button 
          onClick={() => { setActiveTab('supplies'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-4 h-7 rounded text-[8px] font-black uppercase tracking-wider transition-all ${activeTab === 'supplies' ? 'bg-primary text-black' : 'text-text-2 hover:text-text-1'}`}
        >
          <Box size={12} />
          Insumos
        </button>
        <button 
          onClick={() => { setActiveTab('equipment'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-4 h-7 rounded text-[8px] font-black uppercase tracking-wider transition-all ${activeTab === 'equipment' ? 'bg-primary text-black' : 'text-text-2 hover:text-text-1'}`}
        >
          <Printer size={12} />
          Equipamentos
        </button>
      </div>

      <div className="relative group w-full xl:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-2/40 group-focus-within:text-primary transition-colors" size={14} />
        <input
          type="text"
          placeholder={`Filtrar ${activeTab === 'supplies' ? 'insumos' : 'modelos'}...`}
          className="rdy-input h-9 pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="card-xp overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-text-2 text-[7px] font-black uppercase tracking-widest bg-surface/30">
              <th className="px-4 py-2 opacity-50">{activeTab === 'supplies' ? 'Identificação' : 'Nome do Modelo'}</th>
              <th className="px-4 py-2 opacity-50">{activeTab === 'supplies' ? 'Categoria' : 'Fabricante'}</th>
              {activeTab === 'supplies' && <th className="px-4 py-2 opacity-50">Rendimento/Cap</th>}
              <th className="px-4 py-2 text-right opacity-50">Tarefa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {activeTab === 'supplies' ? (
              filteredSupplies.map(supply => (
                <tr key={supply.id} className="group/row hover:bg-white/5 transition-all text-[10px]">
                  <td className="px-4 py-1.5 focus-within:bg-primary/5">
                    <p className="font-bold text-text-1 uppercase tracking-tight">{supply.name}</p>
                    <p className="text-[7px] text-text-2 font-bold uppercase tracking-widest">{supply.unit}</p>
                  </td>
                  <td className="px-4 py-1.5">
                    <div className="flex items-center gap-2">
                       <span className="text-[7px] px-1.5 py-0.5 bg-border rounded text-text-2 font-black uppercase tracking-wider">{supply.category}</span>
                       <span className="text-[7px] text-text-2/20 uppercase font-black">{supply.color}</span>
                    </div>
                  </td>
                  <td className="px-4 py-1.5 font-medium text-text-2/40">
                    {supply.capacity} pg
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEditModal(supply)} className="text-text-2/20 hover:text-primary transition-colors"><Edit2 size={12} /></button>
                      <button onClick={() => deleteSupplyType(supply.id)} className="text-text-2/20 hover:text-danger transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              filteredEquipment.map(model => (
                <tr key={model.id} className="group/row hover:bg-white/5 transition-all text-[10px]">
                  <td className="px-4 py-1.5 font-bold text-text-1 uppercase tracking-tight">{model.name}</td>
                  <td className="px-4 py-1.5 text-[8px] font-black text-text-2 uppercase tracking-widest">{model.brand}</td>
                  <td className="px-4 py-1.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEditModal(model)} className="text-text-2/20 hover:text-primary transition-colors"><Edit2 size={12} /></button>
                      <button onClick={() => deleteEquipmentModel(model.id)} className="text-text-2/20 hover:text-danger transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
