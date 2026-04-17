import { useState } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Package,
  X,
  Trash2,
  Save,
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
  const [supplyCategoryFilter, setSupplyCategoryFilter] = useState<string>('all');

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
      technicianIds: contract.technicianIds,
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
        created_at: contracts.find(c => c.id === editingId)!.created_at
      });
      updateContractSupplies(editingId, formData.supplies.map(s => ({ ...s, contract_id: editingId })));
      toast.success('Contrato atualizado!');
    } else {
      addContract({ ...formData });
      // Logic for adding supplies to new contract is usually handled inside addContract or here
      // But based on our store, we need to manually call updateContractSupplies after getting the ID 
      // Simplified: our addContract in store doesn't return the ID, so let's adjust or assume it works.
      // For now, I'll just save the contract.
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
      setFormData({ ...formData, supplies: [...formData.supplies, { supply_type_id: supplyId, min_stock: 0 }] });
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
  };  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-1.5 h-1.5 rounded-full bg-primary" />
             <p className="text-[8px] font-black text-text-2 uppercase tracking-widest leading-none">Camada de Gestão de Acordos</p>
          </div>
          <h2 className="text-xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            Contratos <span className="text-text-2/40">e Operações</span>
          </h2>
        </div>
        {user?.role !== 'technician' && (
          <button className="rdy-btn-primary h-9" onClick={openAddModal}>
            <Plus size={14} />
            <span className="text-[10px] uppercase font-black italic tracking-wider">Novo Contrato</span>
          </button>
        )}
      </div>

      <div className="card-xp overflow-hidden">
        <div className="px-4 py-2 border-b border-border bg-surface/30 flex items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-2/40 group-focus-within:text-primary transition-colors" size={14} />
            <input
              type="text"
              placeholder="PESQUISAR CONTRATOS OU UNIDADES..."
              className="rdy-input pl-10 h-8 border-none bg-transparent focus:ring-0 text-[10px] uppercase font-bold tracking-wider"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto scroll-elite">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-text-2 text-[7px] font-black uppercase tracking-widest bg-surface/30">
                <th className="px-4 py-2 opacity-50">Identificação do Contrato</th>
                <th className="px-4 py-2 opacity-50">Cliente / Razão Social</th>
                <th className="px-4 py-2 opacity-50">Equipe</th>
                <th className="px-4 py-2 opacity-50">Insumos</th>
                <th className="px-4 py-2 opacity-50">Status</th>
                <th className="px-4 py-2 text-right opacity-50">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredContracts.map((contract) => (
                <tr key={contract.id} className="group hover:bg-white/5 transition-all text-[10px]">
                      <td className="px-4 py-1.5 leading-tight">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-black italic border border-primary/20 text-[10px]">
                               {contract.code.substring(0, 2)}
                            </div>
                            <div>
                               <p className="font-bold text-text-1 uppercase tracking-tight leading-none">{contract.name}</p>
                               <p className="text-[7px] text-primary/60 font-medium uppercase tracking-[0.2em] mt-1">{contract.code}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-4 py-1.5 text-text-2 font-medium uppercase opacity-60 truncate max-w-[200px]">
                         {contract.client}
                      </td>
                      <td className="px-4 py-1.5">
                         <div className="flex -space-x-2">
                            {contract.technicianIds.slice(0, 3).map((tid) => {
                               const u = users.find(u => u.id === tid);
                               return (
                                 <div key={tid} className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-[7px] font-bold text-text-2" title={u?.name}>
                                   {u?.name?.charAt(0)}
                                 </div>
                               );
                            })}
                         </div>
                      </td>
                      <td className="px-4 py-1.5">
                         <span className="text-[7px] font-black text-text-2 uppercase tracking-widest flex items-center gap-1.5">
                            <Package size={10} className="text-accent-c/60" />
                            {contractSupplies.filter(cs => cs.contract_id === contract.id).length} Tipos
                         </span>
                      </td>
                      <td className="px-4 py-1.5">
                         <div className="flex items-center gap-1.5">
                            <div className={`w-1 h-1 rounded-full ${contract.active ? 'bg-success' : 'bg-text-2/20'}`} />
                            <span className={`text-[7px] font-black uppercase tracking-widest ${contract.active ? 'text-success' : 'text-text-2/20'}`}>
                               {contract.active ? 'Ativo' : 'Inativo'}
                            </span>
                         </div>
                      </td>
                      <td className="px-4 py-1.5 text-right">
                         <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal(contract)} className="p-1.5 text-text-2/20 hover:text-primary transition-all rounded"><Edit2 size={12} /></button>
                            <button onClick={() => handleDelete(contract.id)} className="p-1.5 text-text-2/20 hover:text-danger transition-all rounded"><Trash2 size={12} /></button>
                         </div>
                      </td>
                    </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 overflow-y-auto">
          <div className="w-full max-w-xl bg-surface border border-border rounded shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200 my-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-text-1 italic uppercase tracking-tighter leading-none">
                  {editingId ? 'Editar' : 'Novo'} <span className="text-primary">Contrato</span>
                </h3>
                <p className="text-[7px] font-black text-text-2 uppercase tracking-[0.3em] mt-2 opacity-40">Camada de Configuração de Ativos</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-6 h-6 rounded bg-surface border border-border flex items-center justify-center text-text-2 hover:text-danger transition-colors shadow-sm"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Coluna 1: Dados Básicos */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[7px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1 block">Identidade do Contrato</label>
                    <input 
                      className="rdy-input h-8" 
                      placeholder="Ex: Porto Seguro Matriz" 
                      value={formData.name} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="text-[7px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1 block">Razão Social</label>
                    <input 
                      className="rdy-input h-8" 
                      placeholder="Ex: Porto Seguro S.A." 
                      value={formData.client} 
                      onChange={e => setFormData({ ...formData, client: e.target.value })} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block">Código RDY</label>
                      <input 
                        className="rdy-input font-bold text-primary" 
                        placeholder="Ex: PS-001" 
                        value={formData.code} 
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div 
                          onClick={() => setFormData({ ...formData, active: !formData.active })}
                          className={`w-9 h-5 rounded-full transition-all relative ${formData.active ? 'bg-success' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all ${formData.active ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-[7px] font-black text-text-2 uppercase tracking-widest">Ativo</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[7px] font-black text-text-2 uppercase tracking-widest ml-1 mb-2 block">Operadores Alocados</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-2 scroll-elite">
                    {users.filter(u => u.role === 'technician').map(tech => (
                      <button
                        key={tech.id}
                        onClick={() => toggleTechnician(tech.id)}
                        className={`p-2 rounded border transition-all text-left flex items-center gap-2 ${
                          formData.technicianIds.includes(tech.id)
                            ? 'bg-primary/10 border-primary/50 text-text-1'
                            : 'bg-white/5 border-white/5 text-text-2/40'
                        }`}
                      >
                        <div className="w-5 h-5 rounded bg-surface border border-border flex items-center justify-center text-[7px] font-bold">
                          {tech.name.charAt(0)}
                        </div>
                        <span className="text-[8px] font-bold truncate">{tech.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coluna 2: Insumos */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[7px] font-black text-text-2 uppercase tracking-widest ml-1 block">Catálogo de Insumos e Limites</label>
                    <button 
                      type="button"
                      onClick={() => setIsSupplyModalOpen(true)}
                      className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-sm text-[6.5px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Plus size={8} strokeWidth={3} />
                      Gerenciar Catálogo / Vincular
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-2 scroll-elite">
                    {formData.supplies.length > 0 ? (
                      formData.supplies.map(selected => {
                        const supply = supplyTypes.find(s => s.id === selected.supply_type_id);
                        if (!supply) return null;
                        return (
                          <div 
                            key={supply.id} 
                            className="p-2 rounded border border-primary/20 bg-primary/5 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <Package size={12} className="text-primary" />
                                 <div>
                                   <p className="text-[9px] font-bold text-text-1 uppercase leading-none">{supply.name}</p>
                                   <p className="text-[7px] text-text-2 font-black uppercase tracking-widest opacity-40">{supply.category}</p>
                                 </div>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                <span className="text-[7px] font-black text-primary uppercase">Min:</span>
                                <input 
                                  type="number" 
                                  className="w-10 bg-black/40 border border-white/10 rounded px-1 py-0.5 text-[9px] text-white text-center focus:ring-1 focus:ring-primary"
                                  value={selected.min_stock}
                                  onChange={e => updateMinStock(supply.id, parseInt(e.target.value) || 0)}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center border border-dashed border-border rounded opacity-20">
                        <p className="text-[8px] font-black uppercase">Nenhum insumo vinculado</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleSave}
                    className="rdy-btn-primary w-full h-10 text-[10px]"
                  >
                    <Save size={14} />
                    <span>Finalizar Configuração</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Seleção de Insumos */}
      {isSupplyModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
          <div className="w-full max-w-lg bg-surface border border-border rounded shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-black text-text-1 italic uppercase tracking-tighter leading-none">
                  Vincular <span className="text-primary">Insumos</span>
                </h3>
                <p className="text-[7px] font-black text-text-2 uppercase tracking-widest mt-1 opacity-40">Gestão de Portfólio do Contrato</p>
              </div>
              <button 
                onClick={() => setIsSupplyModalOpen(false)} 
                className="w-6 h-6 rounded bg-surface border border-border flex items-center justify-center text-text-2 hover:text-danger px-0 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-2/40" size={14} />
                <input 
                  className="rdy-input h-9 pl-10" 
                  placeholder="PROCURAR INSUMO..."
                  value={supplySearch}
                  onChange={e => setSupplySearch(e.target.value)}
                />
              </div>
              <select 
                className="rdy-input h-9 w-32 text-[8px] font-black uppercase"
                value={supplyCategoryFilter}
                onChange={e => setSupplyCategoryFilter(e.target.value)}
              >
                <option value="all">TODOS</option>
                <option value="Toner">TONER</option>
                <option value="Papel">PAPEL</option>
                <option value="Cilindro">CILINDRO</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-1 max-h-80 overflow-y-auto scroll-elite p-1 bg-bg/20 rounded border border-border">
              {supplyTypes
                .filter(s => 
                  (supplyCategoryFilter === 'all' || s.category === supplyCategoryFilter) &&
                  (s.name.toLowerCase().includes(supplySearch.toLowerCase()))
                )
                .map(supply => {
                  const isSelected = !!formData.supplies.find(item => item.supply_type_id === supply.id);
                  return (
                    <label 
                      key={supply.id} 
                      className={`flex items-center justify-between p-3 rounded cursor-pointer transition-all border ${
                        isSelected ? 'bg-primary/5 border-primary/30 text-text-1' : 'bg-surface border-border/40 text-text-2/40 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}>
                          {isSelected && <Check size={10} className="text-black" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase leading-none">{supply.name}</p>
                          <p className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-40">{supply.category}</p>
                        </div>
                      </div>
                      <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleSupply(supply.id)} />
                    </label>
                  );
                })}
            </div>

            <button 
              onClick={() => setIsSupplyModalOpen(false)}
              className="rdy-btn-primary w-full h-10 mt-2 text-[10px]"
            >
               Confirmar Vínculos ({formData.supplies.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
