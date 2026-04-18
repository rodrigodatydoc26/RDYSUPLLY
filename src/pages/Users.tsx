import { useState } from 'react';
import {
  Plus, Search, Edit2, User,
  X, Eye, EyeOff, Building2, Check, Clock,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import type { Profile, UserRole } from '../types';
import { toast } from 'sonner';

export const Users = () => {
  const { user } = useAuthStore();
  const { users, addUser, updateUser, contracts, updateContract } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [techContracts, setTechContracts] = useState<string[]>([]);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [contractSearch, setContractSearch] = useState('');

  const [formData, setFormData] = useState<Omit<Profile, 'id' | 'created_at'>>({
    name: '', email: '', role: 'technician', active: true, password: '',
  });
  const [reminders, setReminders] = useState<{ times: string[], days: number[] }>({
    times: [],
    days: [1, 2, 3, 4, 5]
  });

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const getUserContracts = (userId: string) =>
    contracts.filter(c => c.technicianIds?.includes(userId));

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', role: 'technician', active: true, password: '' });
    setReminders({ times: [], days: [1, 2, 3, 4, 5] });
    setTechContracts([]);
    setIsModalOpen(true);
  };

  const openEditModal = (user: Profile) => {
    setEditingId(user.id);
    setFormData({ name: user.name, email: user.email, role: user.role, active: user.active, password: user.password || '' });
    setTechContracts(contracts.filter(c => c.technicianIds?.includes(user.id)).map(c => c.id));
    
    // Load existing config
    const config = useDataStore.getState().userConfigs.find(c => c.user_id === user.id);
    setReminders({ 
      times: config?.reminder_times || [], 
      days: config?.operation_days || [1, 2, 3, 4, 5] 
    });
    
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) return toast.error('Preencha os campos obrigatórios');
    
    if (editingId) {
      updateUser({ id: editingId, ...formData, created_at: users.find(u => u.id === editingId)!.created_at });
      // Update contracts tech links
      contracts.forEach(c => {
        const isLinked = techContracts.includes(c.id);
        const alreadyLinked = c.technicianIds?.includes(editingId) ?? false;
        if (isLinked && !alreadyLinked) {
          updateContract({ ...c, technicianIds: [...(c.technicianIds ?? []), editingId] });
        } else if (!isLinked && alreadyLinked) {
          updateContract({ ...c, technicianIds: (c.technicianIds ?? []).filter(id => id !== editingId) });
        }
      });
    } else {
      addUser(formData);
    }

    if (editingId) {
      useDataStore.getState().updateUserConfig(editingId, { 
        reminder_times: reminders.times,
        operation_days: reminders.days 
      });
    }
    
    toast.success('Perfil atualizado com sucesso');
    setIsModalOpen(false);
  };

  const toggleTechContract = (id: string) => {
    setTechContracts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--rdy-primary-rgb),0.6)]" />
             <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.3em] leading-none">Catálogo Mestre de Recursos</p>
           </div>
           <h2 className="text-4xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
             GESTÃO <span className="text-text-2 font-light not-italic uppercase">DE EQUIPE</span>
           </h2>
        </div>
        <button 
          onClick={openAddModal}
          className="h-12 px-8 bg-primary hover:bg-primary/90 text-black text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/10 transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={3} />
          Convidar Usuário
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-2 group-focus-within:text-text-1 transition-colors" size={16} />
            <input
              type="text"
              placeholder="FILTRAR POR NOME OU E-MAIL..."
              className="w-full h-14 bg-surface border border-border rounded-[20px] pl-14 pr-6 text-[10px] font-black uppercase tracking-widest text-text-1 focus:bg-bg outline-none transition-all placeholder:text-text-2"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-[8px] font-black text-text-1 uppercase tracking-[0.2em] px-5 h-14 bg-surface rounded-[20px] border border-border">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success" /> 
              {users.filter(u => u.active).length} ATIVOS
            </span>
            <div className="w-px h-3 bg-border" />
            <span className="flex items-center gap-2 text-text-2">
              <div className="w-1.5 h-1.5 rounded-full bg-text-2" /> 
              {users.filter(u => !u.active).length} INATIVOS
            </span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-[32px] overflow-hidden shadow-xl shadow-black/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
               <tr className="border-b border-border text-text-2 text-[8px] font-black uppercase tracking-widest bg-bg/50">
                  <th className="px-8 py-5">Perfil Operacional</th>
                  <th className="px-8 py-5">Nível de Acesso</th>
                  <th className="px-8 py-5">Contratos Ativos</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map(u => {
                  const linked = getUserContracts(u.id);
                  return (
                    <tr key={u.id} className="group hover:bg-bg/50 transition-all">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center text-text-2">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-text-1 uppercase tracking-tight leading-none">{u.name}</p>
                            <p className="text-[8px] text-text-2 uppercase font-bold tracking-widest mt-1.5">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[8px] font-black text-text-1 uppercase tracking-widest px-2.5 py-1 bg-bg border border-border rounded-lg">{u.role}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {linked.map(c => (
                            <span key={c.id} className="px-2 py-0.5 bg-bg border border-border rounded text-[8px] font-black text-text-2 uppercase">{c.code}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-success shadow-[0_0_8px_rgba(var(--rdy-success-rgb),0.4)]' : 'bg-black/10'}`} />
                          <span className={`text-[8px] font-black uppercase tracking-widest ${u.active ? 'text-text-1' : 'text-text-2'}`}>
                            {u.active ? 'ATIVO' : 'INATIVO'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => openEditModal(u)}
                          className="w-8 h-8 rounded-lg text-text-2 hover:text-text-1 transition-colors"
                          title="Editar Perfil"
                          aria-label={`Editar perfil de ${u.name}`}
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black overflow-y-auto">
          <div className="w-full max-w-sm bg-surface border border-border rounded-lg shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-300 my-auto">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-black text-text-1 italic uppercase tracking-tighter leading-none">
                  {editingId ? 'Editar' : 'Novo'} <span className="text-primary">Perfil</span>
                </h3>
                <p className="text-[7px] font-black text-text-2 uppercase tracking-widest mt-1 ">Política de Segurança de Acesso</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-6 h-6 rounded bg-surface border border-border flex items-center justify-center text-text-2 hover:text-danger px-0 transition-colors"
                title="Fechar"
                aria-label="Fechar janela de perfil"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="user-name" className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block cursor-pointer">Nome Completo</label>
                  <input id="user-name" className="rdy-input h-9" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="user-email" className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block cursor-pointer">Identidade de E-mail</label>
                  <input id="user-email" type="email" className="rdy-input h-9" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>

              <div>
                <label htmlFor="user-password" className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block cursor-pointer">Credencial de Acesso (Senha)</label>
                <div className="relative">
                  <input 
                    id="user-password"
                    type={showPassword ? "text" : "password"} 
                    className="rdy-input h-9 pr-10" 
                    value={formData.password} 
                    onChange={e => setFormData({ ...formData, password: e.target.value })} 
                    placeholder="Definir nova senha operacional..."
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-2 hover:text-primary transition-colors"
                    title={showPassword ? "Esconder senha" : "Ver senha"}
                    aria-label={showPassword ? "Esconder senha" : "Ver senha"}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
               <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="user-role" className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 mb-1.5 block cursor-pointer">Nível de Acesso</label>
                  <select id="user-role" className="rdy-input h-9" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}>
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
                    className={`w-full h-9 rounded border transition-all text-[8px] font-black uppercase tracking-widest ${formData.active ? 'bg-success/5 border-success text-success' : 'bg-surface border-border text-text-2'}`}
                  >
                    {formData.active ? 'Ativo' : 'Suspenso'}
                  </button>
                </div>
              </div>

              {formData.role === 'technician' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[8px] font-black text-text-2 uppercase tracking-widest ml-1 block">Vínculos Operacionais</label>
                    <button 
                      type="button"
                      onClick={() => setIsContractModalOpen(true)}
                      className="text-[8px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      Ver todos / Gerenciar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1 max-h-24 overflow-y-auto scroll-elite p-1 bg-bg rounded border border-border">
                    {contracts.filter(c => techContracts.includes(c.id)).length > 0 ? (
                      contracts.filter(c => techContracts.includes(c.id)).map(c => (
                        <div key={c.id} className="flex items-center gap-2 p-1.5 rounded bg-primary/10 text-primary border border-primary">
                           <Building2 size={10} />
                           <span className="text-[9px] font-bold uppercase truncate">{c.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-[8px] font-black uppercase">Nenhum contrato vinculado</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
               {formData.role === 'technician' && (
                <div className="space-y-4 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={12} className="text-primary" />
                    <p className="text-[10px] font-black text-text-1 uppercase italic tracking-tighter">Lembretes Táticos</p>
                  </div>
                  
                  {/* Days */}
                  <div className="flex justify-between gap-1">
                    {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReminders(prev => ({
                          ...prev,
                          days: prev.days.includes(i) ? prev.days.filter(d => d !== i) : [...prev.days, i]
                        }))}
                        className={`w-8 h-8 rounded-lg border text-[8px] font-black transition-all ${reminders.days.includes(i) ? 'bg-primary border-primary text-black' : 'bg-surface border-border text-text-2'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  {/* Times */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {reminders.times.map((time, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-bg border border-border rounded-xl">
                          <span className="text-[10px] font-black text-text-1">{time}</span>
                          <button 
                            type="button"
                            onClick={() => setReminders(prev => ({ ...prev, times: prev.times.filter((_, idx) => idx !== i) }))}
                            className="text-text-2 hover:text-danger"
                            title="Remover horário"
                            aria-label={`Remover lembrete das ${time}`}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const time = prompt('Digite o horário (HH:MM):', '08:00');
                          if (time && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
                            setReminders(prev => ({ ...prev, times: [...prev.times, time].sort() }));
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-dashed border-border rounded-xl text-text-2 hover:border-primary hover:text-primary transition-all"
                      >
                        <Plus size={10} />
                        <span className="text-[8px] font-black uppercase">Adicionar Hora</span>
                      </button>
                    </div>
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
      {/* Modal de Seleção de Contratos */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-md bg-black/80">
          <div className="w-full max-w-md bg-surface border border-border rounded-lg shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-black text-text-1 italic uppercase tracking-tighter leading-none">
                  Vincular <span className="text-primary">Contratos</span>
                </h3>
                <p className="text-[7px] font-black text-text-2 uppercase tracking-widest mt-1 ">Gestão de Carteira do Técnico</p>
              </div>
              <button 
                onClick={() => setIsContractModalOpen(false)} 
                className="w-6 h-6 rounded bg-surface border border-border flex items-center justify-center text-text-2 hover:text-danger px-0 transition-colors"
                title="Fechar"
                aria-label="Fechar janela de seleção de contratos"
              >
                <X size={14} />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-2" size={14} />
              <input 
                className="rdy-input h-9 pl-10" 
                placeholder="PROCURAR CONTRATO OU CLIENTE..."
                value={contractSearch}
                onChange={e => setContractSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto scroll-elite p-1 bg-bg rounded border border-border">
              {contracts
                .filter(c => c.active && (c.name.toLowerCase().includes(contractSearch.toLowerCase()) || c.client.toLowerCase().includes(contractSearch.toLowerCase())))
                .map(c => (
                  <label 
                    key={c.id} 
                    className={`flex items-center justify-between p-3 rounded cursor-pointer transition-all border ${
                      techContracts.includes(c.id) ? 'bg-primary/5 border-primary text-text-1' : 'bg-surface border-border text-text-2 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${techContracts.includes(c.id) ? 'bg-primary border-primary' : 'border-border'}`}>
                        {techContracts.includes(c.id) && <Check size={10} className="text-black" />}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase leading-none">{c.name}</p>
                        <p className="text-[7px] font-black uppercase tracking-widest mt-1 ">{c.client}</p>
                      </div>
                    </div>
                    <input type="checkbox" className="hidden" checked={techContracts.includes(c.id)} onChange={() => toggleTechContract(c.id)} />
                  </label>
                ))}
            </div>

            <button 
              onClick={() => setIsContractModalOpen(false)}
              className="rdy-btn-primary w-full h-10 mt-2 text-[10px]"
            >
               Confirmar Seleção ({techContracts.length})
            </button>
          </div>
        </div>
      )}
      {user?.role === 'admin' && (
        <div className="mt-16 pt-10 border-t border-danger/10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-danger animate-pulse shadow-[0_0_10px_rgba(255,82,82,0.8)]" />
            <p className="text-[10px] font-black text-danger uppercase tracking-[0.4em] leading-none">ZONA DE PERIGO OPERACIONAL</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black border border-white/5 p-10 rounded-[32px] flex flex-col justify-between group hover:border-danger transition-all shadow-2xl">
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Limpeza Total</h3>
                <p className="text-[9px] text-white font-bold uppercase tracking-widest mt-4 leading-relaxed max-w-[80%]">
                  Apaga todos os contratos, insumos, histórico de estoque e movimentações. 
                  <span className="text-danger italic ml-1">Apenas perfis de Administrador serão preservados.</span>
                </p>
              </div>
              <button 
                onClick={() => {
                  if(window.confirm("ATENÇÃO: Você está prestes a apagar TODOS os dados operacionais do sistema. Esta ação não pode ser desfeita. Deseja continuar?")) {
                    if(window.confirm("CONFIRMAÇÃO FINAL: Tenha certeza de que deseja zerar o banco completamente.")) {
                      const { wipeDatabase } = useDataStore.getState();
                      wipeDatabase();
                    }
                  }
                }}
                className="mt-10 h-12 w-full border border-danger text-danger text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-danger hover:text-white transition-all active:scale-95"
              >
                Zerar Banco de Dados
              </button>
            </div>

            <div className="bg-black border border-white/5 p-10 rounded-[32px] flex flex-col justify-between group hover:border-primary transition-all shadow-2xl">
              <div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Restaurar Padrões</h3>
                <p className="text-[9px] text-white font-bold uppercase tracking-widest mt-4 leading-relaxed max-w-[80%]">
                  Restaura o sistema para o estado inicial com dados fictícios de demonstração.
                  Útil para resetar o ambiente de treinamento.
                </p>
              </div>
              <button 
                onClick={() => {
                  if(window.confirm("Deseja restaurar os dados de exemplo de fábrica?")) {
                    const { resetToDefaults } = useDataStore.getState();
                    resetToDefaults();
                  }
                }}
                className="mt-10 h-12 w-full border border-primary text-primary text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-primary hover:text-black transition-all active:scale-95"
              >
                Restaurar Dados de Exemplo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

