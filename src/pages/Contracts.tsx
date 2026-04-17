import { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Package,
  X,
  Trash2,
  Check,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import type { Contract } from '../types';
import { toast } from 'sonner';

export const Contracts = () => {
  const { 
    contracts, 
    users, 
    supplyTypes, 
    contractSupplies, 
    updateContract, 
    addContract, 
    deleteContract,
    updateContractSupplies 
  } = useDataStore();
  const { user } = useAuthStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [supplySearch, setSupplySearch] = useState('');
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    code: '',
    active: true,
    technicianIds: [] as string[],
    supplies: [] as { supply_type_id: string; min_stock: number }[]
  });

  const filteredContracts = contracts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      client: '',
      code: '',
      active: true,
      technicianIds: [],
      supplies: []
    });
    setIsModalOpen(true);
  };

  const openEditModal = (contract: Contract) => {
    setEditingId(contract.id);
    const existingSupplies = contractSupplies
      .filter(cs => cs.contract_id === contract.id)
      .map(cs => ({ supply_type_id: cs.supply_type_id, min_stock: cs.min_stock }));

    setFormData({
      name: contract.name,
      client: contract.client,
      code: contract.code,
      active: contract.active,
      technicianIds: contract.technicianIds ?? [],
      supplies: existingSupplies
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.client || !formData.code) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    if (editingId) {
      updateContract({
        id: editingId,
        ...formData,
        created_at: contracts.find(c => c.id === editingId)?.created_at || new Date().toISOString()
      });
      updateContractSupplies(editingId, formData.supplies.map(s => ({ ...s, contract_id: editingId })));
      toast.success('Contrato atualizado!');
    } else {
      addContract({ ...formData });
      toast.success('Contrato criado!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este contrato?')) {
      deleteContract(id);
      toast.success('Contrato excluído.');
    }
  };

  const toggleSupply = (supplyId: string) => {
    const exists = formData.supplies.find(s => s.supply_type_id === supplyId);
    if (exists) {
      setFormData({ ...formData, supplies: formData.supplies.filter(s => s.supply_type_id !== supplyId) });
    } else {
      setFormData({ ...formData, supplies: [...formData.supplies, { supply_type_id: supplyId, min_stock: 10 }] });
    }
  };

  const updateMinStock = (supplyId: string, value: number) => {
    setFormData({
      ...formData,
      supplies: formData.supplies.map(s => s.supply_type_id === supplyId ? { ...s, min_stock: value } : s)
    });
  };

  const toggleTechnician = (techId: string) => {
    const exists = formData.technicianIds.includes(techId);
    if (exists) {
      setFormData({ ...formData, technicianIds: formData.technicianIds.filter(id => id !== techId) });
    } else {
      setFormData({ ...formData, technicianIds: [...formData.technicianIds, techId] });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--rdy-primary-rgb),0.6)]" />
            <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.3em] leading-none opacity-40">Catálogo Mestre de Recursos</p>
          </div>
          <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            GESTÃO <span className="text-text-2 font-light not-italic opacity-20">DE CONTRATOS</span>
          </h2>
        </div>
        {user?.role !== 'technician' && (
          <button 
            className="h-12 px-8 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/10 hover:scale-105 transition-all flex items-center gap-2"
            onClick={openAddModal}
          >
            <Plus size={16} strokeWidth={3} />
            <span>Novo Contrato</span>
          </button>
        )}
      </div>

      <div className="bg-surface border border-border rounded-[32px] overflow-hidden shadow-xl shadow-black/[0.02]">
        <div className="px-10 py-8 bg-bg border-b border-border">
           <div className="relative group w-full max-w-2xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-2 opacity-20 group-focus-within:opacity-100 transition-colors" size={18} />
              <input
                type="text"
                placeholder="PESQUISAR CONTRATOS OU UNIDADES..."
                className="w-full h-14 bg-surface border border-border rounded-[20px] pl-16 pr-8 text-[10px] font-black uppercase tracking-widest text-text-1 outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-text-2/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-text-2/40 text-[8px] font-black uppercase tracking-widest bg-bg/50">
                <th className="px-10 py-5">Identidade do Contrato</th>
                <th className="px-10 py-5">Portal do Cliente</th>
                <th className="px-10 py-5">Equipe Técnica</th>
                <th className="px-10 py-5">Recursos</th>
                <th className="px-10 py-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredContracts.map((contract) => (
                <tr key={contract.id} className="group hover:bg-bg/50 transition-all">
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-bg flex items-center justify-center text-text-2/40 font-black italic border border-border text-sm shadow-sm group-hover:bg-primary group-hover:text-black transition-all">
                        {contract.code.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-black text-text-1 uppercase tracking-tight text-[12px] leading-tight">{contract.name}</p>
                        <p className="text-[8px] text-text-2/40 font-black uppercase tracking-widest mt-1.5">{contract.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-5">
                    <p className="text-[10px] font-bold text-text-2/40 uppercase tracking-wide">{contract.client}</p>
                  </td>
                  <td className="px-10 py-5">
                    <div className="flex -space-x-3">
                      {(contract.technicianIds ?? []).slice(0, 4).map((tid) => {
                        const u = users.find(u => u.id === tid);
                        return (
                          <div key={tid} className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-[8px] font-black text-text-1 hover:z-10 transition-transform cursor-help uppercase" title={u?.name}>
                            {u?.name?.charAt(0)}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-2 text-text-2/20 group-hover:text-text-1 transition-colors">
                       <Package size={14} />
                       <span className="text-[8px] font-black uppercase tracking-widest">
                          {contractSupplies.filter(cs => cs.contract_id === contract.id).length} ITENS
                       </span>
                    </div>
                  </td>
                  <td className="px-10 py-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                       <button onClick={() => openEditModal(contract)} className="w-10 h-10 flex items-center justify-center text-text-2/20 hover:text-text-1 transition-colors">
                         <Edit2 size={15} />
                       </button>
                       <button onClick={() => handleDelete(contract.id)} className="w-10 h-10 flex items-center justify-center text-text-2/20 hover:text-danger transition-colors">
                         <Trash2 size={15} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/80">
          <div className="w-full max-w-4xl bg-surface border border-border rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-text-1 italic uppercase tracking-tighter leading-none">
                  {editingId ? 'Parametrizar' : 'Configurar'} <span className="text-primary">Contrato</span>
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl bg-bg border border-border flex items-center justify-center text-text-2/20 hover:text-danger transition-all">
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[8px] font-black text-text-2 uppercase tracking-widest block mb-1">Nome Identificador</label>
                  <input className="rdy-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  <label className="text-[8px] font-black text-text-2 uppercase tracking-widest block mb-1">Portal do Cliente</label>
                  <input className="rdy-input" value={formData.client} onChange={e => setFormData({ ...formData, client: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] font-black text-text-2 uppercase tracking-widest block mb-1">Código RDY</label>
                    <input className="rdy-input text-primary" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} />
                  </div>
                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} className="hidden" />
                      <div className={`w-9 h-5 rounded-full relative transition-all ${formData.active ? 'bg-success' : 'bg-bg'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.active ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                      <span className="text-[8px] font-black text-text-2 uppercase">Ativo</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black text-text-2 uppercase tracking-widest block mb-2">Equipe Técnica</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto scroll-elite">
                    {users.filter(u => u.role === 'technician').map(tech => (
                      <button key={tech.id} onClick={() => toggleTechnician(tech.id)} className={`p-2 rounded border text-[9px] font-bold text-left transition-all ${formData.technicianIds.includes(tech.id) ? 'bg-primary/20 border-primary text-text-1' : 'bg-bg/50 border-border text-text-2/40'}`}>
                        {tech.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[8px] font-black text-text-2 uppercase tracking-widest">Catálogo de Insumos</label>
                  <button onClick={() => setIsSupplyModalOpen(true)} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[8px] font-black uppercase hover:bg-primary hover:text-black transition-all">
                    Vincular Insumos
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto scroll-elite pr-2">
                  {formData.supplies.map(selected => {
                    const supply = supplyTypes.find(s => s.id === selected.supply_type_id);
                    if (!supply) return null;
                    return (
                      <div key={supply.id} className="p-3 rounded bg-bg border border-border flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase">{supply.name}</p>
                          <p className="text-[7px] text-text-2 uppercase opacity-40">{supply.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[7px] font-black text-primary uppercase">Min:</span>
                          <input type="number" className="w-12 h-6 bg-surface border border-border rounded text-[10px] text-center text-text-1" value={selected.min_stock} onChange={e => updateMinStock(supply.id, parseInt(e.target.value) || 0)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={handleSave} className="rdy-btn-primary w-full h-12 uppercase font-black tracking-widest mt-4">
                  Salvar Contrato
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSupplyModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md bg-black/80 text-text-1">
          <div className="w-full max-w-md bg-surface border border-border rounded p-6 space-y-4">
             <div className="flex justify-between items-center border-b border-border pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest">Selecionar Insumos</h3>
                <button onClick={() => setIsSupplyModalOpen(false)}><X size={18} /></button>
             </div>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-2/40" size={14} />
                <input className="rdy-input h-9 pl-10" placeholder="Pesquisar..." value={supplySearch} onChange={e => setSupplySearch(e.target.value)} />
             </div>
             <div className="max-h-60 overflow-y-auto scroll-elite space-y-1">
                {supplyTypes.filter(s => s.name.toLowerCase().includes(supplySearch.toLowerCase())).map(supply => {
                   const isSelected = !!formData.supplies.find(item => item.supply_type_id === supply.id);
                   return (
                     <div key={supply.id} onClick={() => toggleSupply(supply.id)} className={`p-3 rounded border cursor-pointer flex justify-between items-center transition-all ${isSelected ? 'bg-primary/20 border-primary' : 'bg-bg/50 border-border opacity-50'}`}>
                        <span className="text-[10px] font-bold uppercase">{supply.name}</span>
                        {isSelected && <Check size={14} className="text-primary" />}
                     </div>
                   );
                })}
             </div>
             <button onClick={() => setIsSupplyModalOpen(false)} className="rdy-btn-primary w-full h-10">Confirmar</button>
          </div>
        </div>
      )}
    </div>
  );
};
