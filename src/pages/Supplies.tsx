import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Search,
  Edit2,
  X,
  Cpu,
  Type,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import type { EquipmentModel, EquipmentModelType } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { Button, Input, Card, Badge, CMYKBadge } from '../components/ui/Base';
import { ImportModal } from '../components/features/ImportModal';

const EMPTY_FORM: Omit<EquipmentModel, 'id' | 'created_at'> = {
  name: '', brand: '', type: 'equipment', is_color: false, has_drum: false,
  toner_black: '', toner_cyan: '', toner_magenta: '', toner_yellow: '',
  drum_black: '', drum_cyan: '', drum_magenta: '', drum_yellow: '',
  capacity_toner_black: 0, capacity_toner_cyan: 0, capacity_toner_magenta: 0, capacity_toner_yellow: 0,
  capacity_drum_black: 0, capacity_drum_cyan: 0, capacity_drum_magenta: 0, capacity_drum_yellow: 0,
};

export const Supplies = () => {
  const {
    equipmentModels,
    addEquipmentModel,
    updateEquipmentModel,
    importCatalogue,
  } = useDataStore();
  const { user } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [catalogFilter, setCatalogFilter] = useState<'all' | EquipmentModelType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<EquipmentModel, 'id' | 'created_at'>>(EMPTY_FORM);

  const filteredCatalogue = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return equipmentModels.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(lower) || e.brand.toLowerCase().includes(lower);
        const matchesType = catalogFilter === 'all' || e.type === catalogFilter;
        return matchesSearch && matchesType;
    });
  }, [equipmentModels, searchTerm, catalogFilter]);

  const openAddModal = (type: EquipmentModelType) => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, type });
    setIsModalOpen(true);
  };

  const openEditModal = (model: EquipmentModel) => {
    setEditingId(model.id);
    setForm({ ...model });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.brand) {
      toast.error('Fabricante e Nome são obrigatórios');
      return;
    }
    
    const savePromise = editingId 
      ? updateEquipmentModel({ id: editingId, ...form } as EquipmentModel)
      : addEquipmentModel(form);

    toast.promise(savePromise, {
      loading: 'Sincronizando...',
      success: () => {
        setIsModalOpen(false);
        return 'Sincronizado com sucesso!';
      },
      error: (err: any) => `Erro: ${err.message || 'Sincronização falhou'}`
    });
  };

  const getTypeIcon = (type: EquipmentModelType) => {
    switch(type) {
      case 'equipment': return <Cpu size={14} />;
      case 'supply': return <Type size={14} />;
      case 'part': return <Layers size={14} />;
      default: return null;
    }
  };

  const getTypeLabel = (type: EquipmentModelType) => {
    switch(type) {
      case 'equipment': return 'MÁQUINA';
      case 'supply': return 'INSUMO';
      case 'part': return 'PEÇA';
      default: return '';
    }
  };

  const getTypeTheme = (type: EquipmentModelType | 'all') => {
    switch(type) {
        case 'equipment': return 'bg-primary text-black border-primary';
        case 'supply': return 'bg-cyan text-white border-cyan';
        case 'part': return 'bg-white text-black border-white';
        case 'all': return 'bg-text-1 text-surface border-text-1';
        default: return 'bg-surface text-text-1 border-border';
    }
  };

  return (
    <div className="space-y-8 animate-fade pb-10 px-4">
      {/* V2 Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/50" />
            <p className="text-[11px] font-black text-text-1 uppercase tracking-[0.4em] leading-none">Estrutura de Ativos</p>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            CATÁLOGO <span className="font-light not-italic text-text-1 opacity-20">MESTRE</span>
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
           {user?.role !== 'technician' && (
             <Button 
               variant="outline"
               className="flex-1 md:flex-initial h-12 md:h-14 px-6 md:px-10 rounded-xl md:rounded-[20px] text-[10px] md:text-[11px] font-black uppercase tracking-widest gap-2 md:gap-3 border-border hover:bg-black hover:text-white transition-all bg-surface shadow-sm"
               onClick={() => setIsImportModalOpen(true)}
             >
               <FileSpreadsheet size={18} />
               <span className="hidden sm:inline">Importar Lote</span>
               <span className="sm:hidden">Importar</span>
             </Button>
           )}
            {user?.role !== 'technician' && (
              <Button onClick={() => setIsSelectorOpen(true)} className="flex-1 md:flex-initial h-14 px-12 rdy-btn-elite text-[11px]">
                <Plus size={20} />
                <span className="hidden sm:inline">NOVO CADASTRO</span>
                <span className="sm:hidden">NOVO</span>
              </Button>
            )}
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex-1 relative w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-1 opacity-20" size={20} />
          <input
            type="text"
            placeholder="PESQUISAR NO CATÁLOGO..."
            className="w-full h-16 bg-surface border border-border rounded-[24px] pl-16 pr-8 text-[11px] font-black uppercase tracking-[0.2em] text-text-1 outline-none focus:ring-4 focus:ring-black/5 transition-all placeholder:text-text-1 placeholder:opacity-20 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Toolbar */}
        <div className="flex p-1.5 bg-surface border border-border rounded-[24px] shadow-sm overflow-x-auto no-scrollbar max-w-full">
            {(['all', 'equipment', 'supply', 'part'] as const).map(type => {
                const isActive = catalogFilter === type;
                return (
                    <button
                        key={type}
                        onClick={() => setCatalogFilter(type)}
                        className={cn(
                            "h-12 px-6 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2",
                            isActive 
                                ? getTypeTheme(type)
                                : "text-text-2 hover:text-text-1"
                        )}
                    >
                        {type === 'all' ? <Search size={14} /> : getTypeIcon(type as EquipmentModelType)}
                        {type === 'all' ? 'TODOS' : getTypeLabel(type as EquipmentModelType)}
                    </button>
                )
            })}
        </div>
      </div>

      {/* Catalogue List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCatalogue.map(model => (
          <Card key={model.id} className="group relative overflow-visible border border-border rounded-[32px] hover:border-primary/50 transition-all hover:shadow-xl bg-surface">
            {/* Type Badge Floating */}
            <div className={cn(
                "absolute -top-3 left-8 h-7 px-4 rounded-full flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] shadow-lg border",
                getTypeTheme(model.type)
            )}>
                {getTypeIcon(model.type)}
                {getTypeLabel(model.type)}
            </div>

            <div className="p-7 pt-9">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <Badge variant="primary" className="mb-2 bg-black text-white border-none text-[8px] px-2 py-0.5 rounded-md">
                      {model.brand}
                   </Badge>
                   <h3 className="text-xl font-black text-text-1 uppercase tracking-tighter italic leading-none">{model.name}</h3>
                </div>
                <div className="flex gap-1.5">
                   {model.type === 'equipment' && model.is_color && <Badge variant="info" className="bg-cyan/10 text-cyan border-none text-[7px] px-1.5">COLOR</Badge>}
                   {model.type === 'equipment' && model.has_drum && <Badge variant="warning" className="bg-primary/10 text-black border-none text-[7px] px-1.5">DRUM</Badge>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-[9px] font-black text-text-1 uppercase tracking-widest opacity-20">
                   <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-primary" /> PN REPOSIÇÃO
                   </div>
                   <div className="flex gap-1 opacity-100">
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
                
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between bg-bg/50 p-3 rounded-xl border border-border/10">
                    <span className="text-[8px] font-black text-text-1 uppercase opacity-30 tracking-wider">Toner / Insumo Princ.</span>
                    <span className="text-[11px] font-black text-text-1">{model.toner_black || '—'}</span>
                  </div>
                  {(model.has_drum || model.type === 'part') && (
                    <div className="flex items-center justify-between bg-bg/50 p-3 rounded-xl border border-border/10">
                      <span className="text-[8px] font-black text-text-1 uppercase opacity-30 tracking-wider">Cilindro / Peça Princ.</span>
                      <span className="text-[11px] font-black text-text-1">{model.drum_black || '—'}</span>
                    </div>
                  )}
                </div>
              </div>

              {user?.role !== 'technician' && (
                <div className="mt-6 pt-5 border-t border-border/10 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(model)} className="h-10 px-6 rounded-2xl border-border text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                    <Edit2 size={12} className="mr-2" /> Parametrizar
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
        
        {filteredCatalogue.length === 0 && (
          <div className="col-span-full py-40 text-center animate-fade bg-surface/50 border border-border border-dashed rounded-[50px]">
             <div className="relative inline-block mb-8">
               <Cpu size={80} className="text-text-1 relative z-10 opacity-10" />
               <div className="absolute inset-0 bg-black/5 blur-[50px] -z-0 rounded-full" />
             </div>
             <p className="text-[12px] font-black text-text-1 uppercase tracking-[0.6em] mb-4">Catálogo Sem Registros</p>
             <p className="text-[10px] font-black text-text-1 uppercase tracking-widest opacity-20">Nenhum item localizado no filtro atual</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-xl animate-fade">
          <div className="w-full max-w-4xl bg-surface border border-border rounded-[48px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[92vh] my-auto relative z-[1000] animate-slide-up">
            <form onSubmit={e => { e.preventDefault(); handleSave(); }} className="flex flex-col h-full bg-surface">
              <div className="px-10 py-8 border-b border-border flex justify-between items-center">
                <div className="space-y-1">
                   <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-[10px] font-black text-text-1 uppercase tracking-[0.4em] opacity-30">Editor de Parametrização</span>
                   </div>
                   <h3 className="text-2xl font-black text-text-1 uppercase italic tracking-tighter leading-none">
                      {editingId ? 'EDITAR' : 'NOVO'}&nbsp;<span className="text-primary italic">
                        {getTypeLabel(form.type)}
                      </span>
                   </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => { setIsModalOpen(false); setIsSelectorOpen(true); }}
                  className="w-14 h-14 rounded-full bg-black/5 hover:bg-danger hover:text-white transition-all flex items-center justify-center group"
                  title="Fechar Editor"
                >
                  <X size={24} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="p-10 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-6">
                  <Input 
                    label="Fabricante / Marca"
                    placeholder="DIGITE A MARCA..."
                    value={form.brand}
                    required
                    onChange={e => setForm({...form, brand: e.target.value.toUpperCase()})}
                    className="h-14 rounded-xl bg-bg/50 border-border text-[10px] font-black uppercase"
                  />
                  <Input 
                    label={form.type === 'equipment' ? 'Modelo do Ativo' : 'Nome do Ativo'}
                    placeholder="DIGITE O NOME..."
                    value={form.name}
                    required
                    onChange={e => setForm({...form, name: e.target.value.toUpperCase()})}
                    className="h-14 rounded-xl bg-bg/50 border-border text-[10px] font-black uppercase"
                  />
                </div>

                {/* Technical Toggles (Only for Equipment) */}
                {form.type === 'equipment' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className={cn(
                        "p-5 md:p-6 rounded-2xl md:rounded-[25px] border transition-all flex items-center justify-between",
                        form.is_color ? "bg-cyan/[0.03] border-cyan/30" : "bg-bg/50 border-border"
                    )}>
                      <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-1 leading-none">Arquitetura Color</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setForm({...form, is_color: !form.is_color})}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                          form.is_color ? "bg-cyan" : "bg-black/10"
                        )}
                        title="Alternar Arquitetura Color"
                      >
                        <div className={cn("w-4 h-4 bg-white rounded-full transition-all shadow-md", form.is_color ? "translate-x-6" : "translate-x-0")} />
                      </button>
                    </div>

                    <div className={cn(
                        "p-5 md:p-6 rounded-2xl md:rounded-[25px] border transition-all flex items-center justify-between",
                        form.has_drum ? "bg-primary/[0.03] border-primary/30" : "bg-bg/50 border-border"
                    )}>
                      <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-text-1 leading-none">Unidade de Cilindro Separada</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setForm({...form, has_drum: !form.has_drum})}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative flex items-center px-1",
                          form.has_drum ? "bg-primary" : "bg-black/10"
                        )}
                        title="Alternar Unidade de Cilindro Separada"
                      >
                        <div className={cn("w-4 h-4 bg-white rounded-full transition-all shadow-md", form.has_drum ? "translate-x-6" : "translate-x-0")} />
                      </button>
                    </div>
                  </div>
                )}

                {/* PN Mapping */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 opacity-30">
                    {getTypeIcon(form.type)}
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">MAPEAMENTO DE CONSUMÍVEIS (PN + CAPACIDADE)</h4>
                  </div>

                  {/* Toner Black / Primary Supply */}
                  {(form.type === 'equipment' || form.type === 'supply') && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input label={form.type === 'supply' ? 'PART NUMBER (PN)' : 'PN TONER BLACK'} value={form.toner_black || ''} onChange={e => setForm({...form, toner_black: e.target.value.toUpperCase()})} className="h-14" />
                      <Input label="CAPACIDADE (PÁGINAS)" type="number" value={form.capacity_toner_black || ''} onChange={e => setForm({...form, capacity_toner_black: Number(e.target.value)})} className="h-14" />
                    </div>
                  )}

                  {/* Drum Black / Primary Part */}
                  {(form.type === 'part' || (form.type === 'equipment' && form.has_drum)) && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input label={form.type === 'part' ? 'PART NUMBER (PN)' : 'PN DRUM BLACK'} value={form.drum_black || ''} onChange={e => setForm({...form, drum_black: e.target.value.toUpperCase()})} className="h-14" />
                      <Input label="VIDA ÚTIL (PÁGINAS)" type="number" value={form.capacity_drum_black || ''} onChange={e => setForm({...form, capacity_drum_black: Number(e.target.value)})} className="h-14" />
                    </div>
                  )}

                  {/* Color CMY (Only for Color Equipment) */}
                  {form.type === 'equipment' && form.is_color && (
                    <div className="space-y-4 p-5 md:p-6 bg-black/[0.02] border border-border rounded-2xl md:rounded-[30px]">
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="PN TONER CYAN" value={form.toner_cyan || ''} onChange={e => setForm({...form, toner_cyan: e.target.value.toUpperCase()})} className="h-14" />
                        <Input label="CAP. CYAN" type="number" value={form.capacity_toner_cyan || ''} onChange={e => setForm({...form, capacity_toner_cyan: Number(e.target.value)})} className="h-14" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="PN TONER MAGENTA" value={form.toner_magenta || ''} onChange={e => setForm({...form, toner_magenta: e.target.value.toUpperCase()})} className="h-14" />
                        <Input label="CAP. MAGENTA" type="number" value={form.capacity_toner_magenta || ''} onChange={e => setForm({...form, capacity_toner_magenta: Number(e.target.value)})} className="h-14" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="PN TONER YELLOW" value={form.toner_yellow || ''} onChange={e => setForm({...form, toner_yellow: e.target.value.toUpperCase()})} className="h-14" />
                        <Input label="CAP. YELLOW" type="number" value={form.capacity_toner_yellow || ''} onChange={e => setForm({...form, capacity_toner_yellow: Number(e.target.value)})} className="h-14" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-10 py-8 bg-black/[0.02] border-t border-border flex justify-end gap-4">
                 <Button 
                   type="button"
                   variant="outline"
                   onClick={() => { setIsModalOpen(false); setIsSelectorOpen(true); }}
                   className="h-14 px-10 rounded-[20px] text-[10px] font-black uppercase tracking-widest border-border bg-white text-text-1"
                 >
                   DESCARTAR
                 </Button>
                 <Button 
                   type="submit"
                   className="h-14 px-12 rdy-btn-elite text-[10px]"
                 >
                   SINCRONIZAR CATÁLOGO
                 </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isImportModalOpen && (
        <ImportModal 
          type="catalogue"
          onClose={() => setIsImportModalOpen(false)}
          onImport={importCatalogue}
        />
      )}

      {/* Selector Modal */}
      {isSelectorOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-2xl animate-fade">
          <div className="w-full max-w-4xl space-y-8 my-auto">
            <div className="text-center space-y-2">
               <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Escolha o <span className="text-primary">Tipo de Cadastro</span></h3>
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Selecione a categoria para novas parametrizações</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {(['equipment', 'supply', 'part'] as const).map((type) => (
                 <button
                   key={type}
                   onClick={() => {
                     setIsSelectorOpen(false);
                     openAddModal(type);
                   }}
                   className="group p-8 bg-surface border border-border rounded-[40px] hover:border-primary transition-all text-left space-y-6 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2"
                 >
                    <div className="w-16 h-16 rounded-[24px] bg-black flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                       {getTypeIcon(type)}
                    </div>
                    <div>
                       <h4 className="text-2xl font-black text-text-1 uppercase italic tracking-tighter">{getTypeLabel(type)}</h4>
                       <p className="text-[10px] font-black text-text-1 opacity-30 mt-1 uppercase tracking-widest">
                           {type === 'equipment' ? 'Máquinas e Multifuncionais' : type === 'supply' ? 'Toners, Tintas e Resinas' : 'Cilindros e Fusores'}
                       </p>
                    </div>
                 </button>
               ))}
            </div>

            <div className="flex justify-center">
               <button 
                 onClick={() => setIsSelectorOpen(false)}
                 className="flex items-center gap-3 text-white/40 hover:text-white transition-colors"
               >
                 <X size={20} />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em]">Cancelar Operação</span>
               </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
