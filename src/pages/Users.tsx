import { useState } from 'react';
import {
  Plus, Search, Edit2, User,
  X, UserCheck,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import type { Profile, UserRole } from '../types';
import { toast } from 'sonner';

export const Users = () => {
  const { users, addUser, updateUser, contracts, updateContract } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [techContracts, setTechContracts] = useState<string[]>([]);

  const [formData, setFormData] = useState<Omit<Profile, 'id' | 'created_at'>>({
    name: '', email: '', role: 'technician', active: true,
  });

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const getUserContracts = (userId: string) =>
    contracts.filter(c => c.technicianIds.includes(userId));

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', role: 'technician', active: true });
    setTechContracts([]);
    setIsModalOpen(true);
  };

  const openEditModal = (user: Profile) => {
    setEditingId(user.id);
    setFormData({ name: user.name, email: user.email, role: user.role, active: user.active });
    setTechContracts(contracts.filter(c => c.technicianIds.includes(user.id)).map(c => c.id));
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) return toast.error('Preencha os campos obrigatórios');
    
    if (editingId) {
      updateUser({ id: editingId, ...formData, created_at: users.find(u => u.id === editingId)!.created_at });
      // Update contracts tech links
      contracts.forEach(c => {
        const isLinked = techContracts.includes(c.id);
        const alreadyLinked = c.technicianIds.includes(editingId);
        if (isLinked && !alreadyLinked) {
          updateContract({ ...c, technicianIds: [...c.technicianIds, editingId] });
        } else if (!isLinked && alreadyLinked) {
          updateContract({ ...c, technicianIds: c.technicianIds.filter(id => id !== editingId) });
        }
      });
    } else {
      addUser(formData);
    }
    
    toast.success('Perfil atualizado com sucesso');
    setIsModalOpen(false);
  };

  const toggleTechContract = (id: string) => {
    setTechContracts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <div className="w-1.5 h-1.5 rounded-full bg-primary" />
             <p className="text-[8px] font-black text-text-2 uppercase tracking-widest leading-none">Controle de Identidade e Acesso</p>
           </div>
           <h2 className="text-xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
             Diretório <span className="text-text-2/40">de Usuários</span>
           </h2>
        </div>
        <button className="rdy-btn-primary h-9" onClick={openAddModal}>
          <Plus size={14} /> <span className="text-[10px] uppercase font-black tracking-wider">Convidar Usuário</span>
        </button>
      </div>

      <div className="card-xp overflow-hidden">
        <div className="px-4 py-2 bg-surface/30 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative max-w-sm w-full flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-2/40 group-focus-within:text-primary transition-colors" size={14} />
            <input
              type="text"
              placeholder="FILTRAR POR NOME OU E-MAIL..."
              className="rdy-input pl-10 bg-transparent border-none focus:ring-0 text-[10px] h-8 font-bold uppercase tracking-wider"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-[7px] font-black text-text-2 uppercase tracking-widest px-3 py-1 bg-surface rounded border border-border">
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-success" /> {users.filter(u => u.active).length} ATIVOS</span>
            <div className="w-px h-2 bg-border" />
            <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-text-2/20" /> {users.filter(u => !u.active).length} INATIVOS</span>
          </div>
        </div>

        <div className="overflow-x-auto scroll-elite">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-text-2 text-[7px] font-black uppercase tracking-widest bg-surface/30">
                <th className="px-4 py-2 opacity-50">Equipe</th>
                <th className="px-4 py-2 opacity-50">Cargo</th>
                <th className="px-4 py-2 opacity-50">Operações</th>
                <th className="px-4 py-2 opacity-50">Status</th>
                <th className="px-4 py-2 text-right opacity-50">Tarefa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredUsers.map(u => {
                const linked = getUserContracts(u.id);
                return (
                  <tr key={u.id} className="group hover:bg-white/5 transition-all text-[10px]">
                    <td className="px-4 py-1.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center text-text-2/20">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-text-1 uppercase tracking-tight leading-none">{u.name}</p>
                          <p className="text-[7px] text-text-2 uppercase font-black tracking-widest mt-1">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-1.5">
                      <span className="text-[7px] font-black text-text-2 uppercase tracking-widest px-2 py-0.5 border border-border rounded">{u.role}</span>
                    </td>
                    <td className="px-4 py-1.5">
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {linked.map(c => (
                          <span key={c.id} className="px-1.5 py-0.5 bg-surface border border-border rounded text-[7px] font-black text-text-2 uppercase">{c.code}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1 h-1 rounded-full ${u.active ? 'bg-success' : 'bg-text-2/20'}`} />
                        <span className={`text-[7px] font-black uppercase tracking-widest ${u.active ? 'text-text-1' : 'text-text-2/40'}`}>
                          {u.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-1.5 text-right">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-1 text-text-2/20 hover:text-primary transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/60 overflow-y-auto">
          <div className="w-full max-w-sm bg-surface border border-border rounded-lg shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-300 my-auto">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-black text-text-1 italic uppercase tracking-tighter leading-none">
                  {editingId ? 'Editar' : 'Novo'} <span className="text-primary">Perfil</span>
                </h3>
                <p className="text-[7px] font-black text-text-2 uppercase tracking-widest mt-1 opacity-40">Política de Segurança de Acesso</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-6 h-6 rounded bg-surface border border-border flex items-center justify-center text-text-2 hover:text-danger px-0 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block">Nome Completo</label>
                <input className="rdy-input h-9" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block">Identidade de E-mail</label>
                <input type="email" className="rdy-input h-9" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block">Nível de Acesso</label>
                  <select className="rdy-input h-9" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}>
                    <option value="technician">Técnico</option>
                    <option value="analyst">Analista</option>
                    <option value="admin">Administrador</option>
                    <option value="cto">CTO</option>
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block">Atividade</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    className={`w-full h-9 rounded border transition-all text-[8px] font-black uppercase tracking-widest ${formData.active ? 'bg-success/5 border-success/30 text-success' : 'bg-surface border-border text-text-2/40'}`}
                  >
                    {formData.active ? 'Ativo' : 'Suspenso'}
                  </button>
                </div>
              </div>

              {formData.role === 'technician' && (
                <div>
                  <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-2 block">Vínculos Operacionais</label>
                  <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto scroll-elite p-1 bg-bg/20 rounded border border-border">
                    {contracts.filter(c => c.active).map(c => (
                      <label key={c.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${techContracts.includes(c.id) ? 'bg-primary/10 text-text-1' : 'text-text-2/40 hover:bg-white/5'}`}>
                         <input type="checkbox" className="hidden" checked={techContracts.includes(c.id)} onChange={() => toggleTechContract(c.id)} />
                         <div className={`w-3 h-3 rounded-sm border flex items-center justify-center transition-all ${techContracts.includes(c.id) ? 'bg-primary border-primary' : 'border-border'}`}>
                            {techContracts.includes(c.id) && <UserCheck size={8} className="text-black" />}
                         </div>
                         <span className="text-[9px] font-bold uppercase truncate">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={handleSave} className="rdy-btn-primary w-full h-10 mt-2 text-[10px]">
                 Confirmar Alterações de Perfil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
