import { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  X,
  Cpu,
  Type,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import type { EquipmentModel } from '../types';
import { toast } from 'sonner';
import { cn, Button, Input, Card, Badge, CMYKBadge } from '../components/ui/Base';

export const Supplies = () => {
  const { 
    equipmentModels, 
    addEquipmentModel, 
    updateEquipmentModel,
    // deleteEquipmentModel // Not implemented in store yet, but we'll stick to what we have
  } = useDataStore();
  const { user } = useAuthStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<Omit<EquipmentModel, 'id' | 'created_at'>>({
    name: '',
    brand: '',
    is_color: false,
    has_drum: false,
    toner_black: '',
    toner_cyan: '',
    toner_magenta: '',
    toner_yellow: '',
    drum_black: '',
    drum_cyan: '',
    drum_magenta: '',
    drum_yellow: '',
    capacity_toner_black: 0,
    capacity_toner_cyan: 0,
    capacity_toner_magenta: 0,
    capacity_toner_yellow: 0,
    capacity_drum_black: 0,
    capacity_drum_cyan: 0,
    capacity_drum_magenta: 0,
    capacity_drum_yellow: 0,
  });

  const filteredEquipment = equipmentModels.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      name: '',
      brand: '',
      is_color: false,
      has_drum: false,
      toner_black: '',
      toner_cyan: '',
      toner_magenta: '',
      toner_yellow: '',
      drum_black: '',
      drum_cyan: '',
      drum_magenta: '',
      drum_yellow: '',
      capacity_toner_black: 0,
      capacity_toner_cyan: 0,
      capacity_toner_magenta: 0,
      capacity_toner_yellow: 0,
      capacity_drum_black: 0,
      capacity_drum_cyan: 0,
      capacity_drum_magenta: 0,
      capacity_drum_yellow: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (model: EquipmentModel) => {
    setEditingId(model.id);
    setForm({ ...model });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.brand) return toast.error('Nome e Fabricante são obrigatórios');
    
    try {
      if (editingId) {
        await updateEquipmentModel({ id: editingId, ...form } as EquipmentModel);
        toast.success('Modelo atualizado no catálogo');
      } else {
        await addEquipmentModel(form);
        toast.success('Novo modelo registrado com sucesso');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Erro ao salvar no catálogo');
    }
  };

  return (
    <div className="space-y-6 animate-fade pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary" />
            <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.3em] leading-none">Estrutura de Ativos</p>
          </div>
          <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            CATÁLOGO <span className="text-text-2 font-light not-italic  text-3xl">DE MODELOS</span>
          </h2>
        </div>
        {user?.role !== 'technician' && (
          <Button 
            className="h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-xl shadow-primary/10"
            onClick={openAddModal}
          >
            <Plus size={18} strokeWidth={3} />
            Novo Modelo
          </Button>
        )}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-2 group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="PESQUISAR NO CATÁLOGO MESTRE..."
            className="w-full h-14 bg-surface border border-border rounded-2xl pl-14 pr-8 text-xs font-bold uppercase tracking-widest text-text-1 outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-text-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Equipment List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.map(model => (
          <Card key={model.id} className="group relative overflow-visible">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                   <Badge variant="neutral" className="mb-2">{model.brand}</Badge>
                   <h3 className="text-xl font-black text-text-1 uppercase tracking-tight italic">{model.name}</h3>
                </div>
                <div className="flex gap-1">
                   {model.is_color && <Badge variant="info">Color</Badge>}
                   {model.has_drum && <Badge variant="warning">Drum</Badge>}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-text-2 uppercase tracking-widest">
                  <span>Part Numbers</span>
                  <div className="flex gap-1">
                    <CMYKBadge type="K" />
                    {model.is_color && (
                      <>
                        <CMYKBadge type="C" />
                        <CMYKBadge type="M" />
                        <CMYKBadge type="Y" />
                      </>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-1">
                  <p className="text-[11px] font-bold text-text-1 truncate bg-bg py-1 px-2 rounded border border-border/50">
                    Toner: <span className="text-text-2 ml-2">{model.toner_black || '—'}</span>
                  </p>
                  {model.has_drum && (
                    <p className="text-[11px] font-bold text-text-1 truncate bg-bg py-1 px-2 rounded border border-border/50">
                      Drum: <span className="text-text-2 ml-2">{model.drum_black || '—'}</span>
                    </p>
                  )}
                </div>
              </div>

              {user?.role !== 'technician' && (
                <div className="mt-6 pt-6 border-t border-border flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(model)}>
                    <Edit2 size={12} className="mr-2" /> Editar
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
        
        {filteredEquipment.length === 0 && (
          <div className="col-span-full py-20 text-center bg-surface border-2 border-dashed border-border rounded-3xl">
             <Cpu size={48} className="mx-auto text-text-2 mb-4" />
             <p className="text-xs font-bold text-text-2 uppercase tracking-widest">Nenhum modelo encontrado no catálogo</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-secondary/80">
          <div className="w-full max-w-2xl bg-surface border border-border rounded-[40px] shadow-2xl overflow-hidden animate-fade">
            <div className="px-10 py-8 border-b border-border flex justify-between items-center bg-bg/50">
              <h3 className="text-2xl font-black text-text-1 italic uppercase tracking-tighter">
                {editingId ? 'Parametrizar' : 'Novo'} <span className="text-primary italic">Modelo</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-2xl bg-surface border border-border flex items-center justify-center text-text-2 hover:text-danger transition-all"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <Input 
                  label="Fabricante / Marca"
                  placeholder="Ex: HP, Brother, Ricoh"
                  value={form.brand}
                  onChange={e => setForm({...form, brand: e.target.value.toUpperCase()})}
                />
                <Input 
                  label="Nome do Modelo"
                  placeholder="Ex: LaserJet M177fw"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="p-5 bg-bg rounded-[24px] border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-1">Sistema Colorido</span>
                    <button 
                      onClick={() => setForm({...form, is_color: !form.is_color})}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative px-1 flex items-center",
                        form.is_color ? "bg-primary" : "bg-border"
                      )}
                    >
                      <div className={cn("w-4 h-4 bg-white rounded-full transition-all", form.is_color ? "translate-x-6" : "translate-x-0")} />
                    </button>
                  </div>
                  <p className="text-[9px] font-medium text-text-2/50 leading-relaxed italic">Habilita os campos para Cyan, Magenta e Yellow na ficha técnica e portal do técnico.</p>
                </div>

                <div className="p-5 bg-bg rounded-[24px] border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-1">Possui Cilindro</span>
                    <button 
                      onClick={() => setForm({...form, has_drum: !form.has_drum})}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative px-1 flex items-center",
                        form.has_drum ? "bg-primary" : "bg-border"
                      )}
                    >
                      <div className={cn("w-4 h-4 bg-white rounded-full transition-all", form.has_drum ? "translate-x-6" : "translate-x-0")} />
                    </button>
                  </div>
                  <p className="text-[9px] font-medium text-text-2/50 leading-relaxed italic">Habilita campos de monitoramento para Unidades de Imagem / Fotocondutores.</p>
                </div>
              </div>

              {/* Toners Section */}
              <div className="space-y-6 mb-10">
                <div className="flex items-center gap-3 border-b border-border pb-2">
                  <Type size={16} className="text-primary" />
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-1">Especificações de Toner</h4>
                </div>
                
                <div className="bg-bg p-6 rounded-[32px] border border-border grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CMYKBadge type="K" />
                      <Input label="PN Toner Black" value={form.toner_black || ''} onChange={e => setForm({...form, toner_black: e.target.value})} />
                    </div>
                  </div>
                  
                  {form.is_color && (
                    <div className="space-y-4 border-l border-border pl-6">
                      <div className="flex items-center gap-2">
                        <CMYKBadge type="C" />
                        <Input label="PN Toner Cyan" value={form.toner_cyan || ''} onChange={e => setForm({...form, toner_cyan: e.target.value})} />
                      </div>
                      <div className="flex items-center gap-2">
                        <CMYKBadge type="M" />
                        <Input label="PN Toner Magenta" value={form.toner_magenta || ''} onChange={e => setForm({...form, toner_magenta: e.target.value})} />
                      </div>
                      <div className="flex items-center gap-2">
                        <CMYKBadge type="Y" />
                        <Input label="PN Toner Yellow" value={form.toner_yellow || ''} onChange={e => setForm({...form, toner_yellow: e.target.value})} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Drums Section */}
              {form.has_drum && (
                <div className="space-y-6 mb-10">
                  <div className="flex items-center gap-3 border-b border-border pb-2">
                    <Cpu size={16} className="text-warning" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-1">Especificações de Cilindro</h4>
                  </div>
                  
                  <div className="bg-bg p-6 rounded-[32px] border border-border grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-4">
                       <div className="flex items-center gap-2">
                         <CMYKBadge type="K" />
                         <Input label="PN Drum Black" value={form.drum_black || ''} onChange={e => setForm({...form, drum_black: e.target.value})} />
                       </div>
                     </div>
                     
                     {form.is_color && (
                       <div className="space-y-4 border-l border-border pl-6">
                         <div className="flex items-center gap-2">
                           <CMYKBadge type="C" />
                           <Input label="PN Drum Cyan" value={form.drum_cyan || ''} onChange={e => setForm({...form, drum_cyan: e.target.value})} />
                         </div>
                         <div className="flex items-center gap-2">
                           <CMYKBadge type="M" />
                           <Input label="PN Drum Magenta" value={form.drum_magenta || ''} onChange={e => setForm({...form, drum_magenta: e.target.value})} />
                         </div>
                         <div className="flex items-center gap-2">
                           <CMYKBadge type="Y" />
                           <Input label="PN Drum Yellow" value={form.drum_yellow || ''} onChange={e => setForm({...form, drum_yellow: e.target.value})} />
                         </div>
                       </div>
                     )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-10 py-8 bg-bg border-t border-border flex justify-end">
               <Button 
                 onClick={handleSave}
                 className="h-14 px-12 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary"
               >
                 Salvar no Catálogo
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

