import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Check,
  Search,
} from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import type { Profile, UserRole } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { Button, Card } from '../components/ui/Base';

export const Users = () => {
  const { user } = useAuthStore();
  const { users, addUser, updateUser, deleteUser, contracts, updateContract } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [techContracts, setTechContracts] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(true);

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

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name || !formData.email) return toast.error('Preencha os campos obrigatórios');
    if (!editingId && !formData.password) return toast.error('Defina uma Chave de Acesso inicial');

    setIsSaving(true);
    try {
      if (editingId) {
        const existing = users.find(u => u.id === editingId);
        if (!existing) return;
        await updateUser({ id: editingId, ...formData, created_at: existing.created_at });
        await Promise.all(contracts.map(c => {
          const isLinked = techContracts.includes(c.id);
          const alreadyLinked = c.technicianIds?.includes(editingId) ?? false;
          if (isLinked && !alreadyLinked) {
            return updateContract({ ...c, technicianIds: [...(c.technicianIds ?? []), editingId] });
          } else if (!isLinked && alreadyLinked) {
            return updateContract({ ...c, technicianIds: (c.technicianIds ?? []).filter(id => id !== editingId) });
          }
        }));
        await useDataStore.getState().updateUserConfig(editingId, {
          reminder_times: reminders.times,
          operation_days: reminders.days,
        });
        toast.success('Perfil atualizado com sucesso!');
      } else {
        await addUser(formData);
        toast.success('Usuário criado com sucesso!');
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade pb-10 px-4">
      {/* V2 Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/50" />
            <p className="text-[11px] font-black text-text-1 uppercase tracking-[0.4em] leading-none">Gestão de Inteligência</p>
          </div>
          <h2 className="text-5xl font-black text-text-1 italic tracking-tighter uppercase leading-none">
            ESTRUTURA <span className="font-light not-italic text-text-1 opacity-20">DE EQUIPE</span>
          </h2>
        </div>
        <Button onClick={openAddModal} className="h-14 px-12 rdy-btn-elite text-[11px]">
          <Plus size={20} />
          Convidar Usuário
        </Button>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-1 opacity-20" size={20} />
            <input
              type="text"
              placeholder="FILTRAR POR NOME OU E-MAIL..."
              className="w-full h-16 bg-surface border border-border rounded-[24px] pl-16 pr-8 text-[11px] font-black uppercase tracking-[0.2em] text-text-1 outline-none focus:ring-4 focus:ring-black/5 transition-all placeholder:text-text-1 placeholder:opacity-20"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-6 text-[10px] font-black text-text-1 uppercase tracking-widest px-8 h-16 bg-surface border border-border rounded-[24px] shadow-sm">
            <span className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-success shadow-lg shadow-success/20" /> 
              {users.filter(u => u.active).length} ATIVOS
            </span>
            <div className="w-px h-10 bg-border/40" />
            <span className="flex items-center gap-2.5 opacity-20">
              <div className="w-2.5 h-2.5 rounded-full bg-black/40" /> 
              {users.filter(u => !u.active).length} INATIVOS
            </span>
          </div>
        </div>

        {/* Users List Control */}
        <div className="space-y-4">
          {/* Desktop Table View */}
          <Card className="hidden lg:block rounded-[40px] border border-border overflow-hidden bg-surface shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                 <tr className="border-b border-border text-text-1 text-[10px] font-black uppercase tracking-[0.2em] bg-black/[0.02]">
                    <th className="px-10 py-6">Perfil Operacional</th>
                    <th className="px-10 py-6">Nível de Acesso</th>
                    <th className="px-10 py-6">Carteira de Ativos</th>
                    <th className="px-10 py-6">Status</th>
                    <th className="px-10 py-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {filteredUsers.map(u => {
                    const linked = getUserContracts(u.id);
                    return (
                      <tr key={u.id} className="group hover:bg-black/[0.01] transition-all">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-[18px] bg-black/[0.03] flex items-center justify-center text-text-1 group-hover:bg-black group-hover:text-white transition-all">
                               <User size={22} />
                            </div>
                            <div>
                               <p className="text-[13px] font-black text-text-1 uppercase tracking-tight leading-none">{u.name}</p>
                               <p className="text-[10px] text-text-1 opacity-20 uppercase font-bold tracking-widest mt-2">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <span className="text-[10px] font-black text-text-1 uppercase tracking-widest px-3 py-1.5 bg-black/[0.03] border border-border rounded-xl">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex flex-wrap gap-2 max-w-[250px]">
                            {linked.length > 0 ? linked.map(c => (
                              <span key={c.id} className="px-2.5 py-1 bg-primary/10 border border-primary/20 rounded text-[9px] font-black text-text-1 uppercase tracking-tight">
                                 {c.code}
                              </span>
                            )) : <span className="text-[9px] font-black text-text-1 opacity-10 uppercase italic">Nenhum vínculo</span>}
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-2.5 h-2.5 rounded-full transition-all",
                                u.active ? 'bg-success shadow-lg shadow-success/20' : 'bg-black/10'
                            )} />
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                u.active ? 'text-text-1' : 'opacity-20'
                            )}>
                              {u.active ? 'ATIVO' : 'INATIVO'}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button
                            onClick={() => openEditModal(u)}
                            title="Editar Usuário"
                            className="w-10 h-10 rounded-xl bg-black/5 text-text-1 inline-flex items-center justify-center hover:bg-black hover:text-white transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredUsers.map(u => {
              const linked = getUserContracts(u.id);
              return (
                <Card key={u.id} className="p-6 border border-border rounded-[30px] bg-surface space-y-6">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-black/[0.03] flex items-center justify-center text-text-1">
                          <User size={22} />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-text-1 uppercase italic leading-none">{u.name}</h4>
                          <p className="text-[10px] text-text-1 opacity-30 uppercase font-black tracking-widest mt-2">{u.email}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border",
                        u.active ? "bg-success/10 border-success/20 text-success" : "bg-black/5 border-border text-text-1 opacity-20"
                      )}>
                        {u.active ? 'ATIVO' : 'INATIVO'}
                      </div>
                   </div>

                   <div className="flex items-center justify-between py-4 border-y border-border/10">
                      <div>
                         <p className="text-[8px] font-black text-text-1 opacity-20 uppercase tracking-[0.2em] mb-1">NÍVEL DE ACESSO</p>
                         <span className="text-[10px] font-black text-text-1 uppercase tracking-widest">{u.role}</span>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] font-black text-text-1 opacity-20 uppercase tracking-[0.2em] mb-1">CARTEIRA</p>
                         <span className="text-[10px] font-black text-text-1 uppercase tracking-widest">{linked.length} CONTRATOS</span>
                      </div>
                   </div>

                   <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                         {linked.slice(0, 3).map(c => (
                           <div key={c.id} className="w-8 h-8 rounded-lg bg-black border border-primary/20 flex items-center justify-center text-[8px] font-black text-primary uppercase">
                              {c.code.slice(0, 3)}
                           </div>
                         ))}
                         {linked.length > 3 && (
                           <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-[8px] font-black text-text-1 opacity-40">
                              +{linked.length - 3}
                           </div>
                         )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditModal(u)}
                        className="h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest bg-black text-white hover:bg-primary hover:text-black transition-all"
                      >
                         Gerenciar Perfil
                      </Button>
                   </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {user?.role === 'admin' && (
        <div className="mt-16 pt-10 border-t border-border/10 space-y-6">
          <div className="flex items-center gap-4 px-2">
            <div className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse shadow-lg shadow-danger/50" />
            <p className="text-[10px] font-black text-danger uppercase tracking-[0.6em] leading-none">ZONA DE PERIGO OPERACIONAL</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-black/5 border border-border p-8 rounded-[35px] flex flex-col justify-between hover:border-danger transition-all">
              <div>
                <h3 className="text-xl font-black text-text-1 uppercase italic tracking-tighter">Limpeza Total</h3>
                <p className="text-[10px] text-text-1 opacity-40 font-bold uppercase tracking-widest mt-4 leading-relaxed">
                  Apaga todos os contratos, insumos e histórico. <br/>
                  <span className="text-danger italic">Apenas administradores serão preservados.</span>
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                   if(window.confirm("ATENÇÃO: Ação irreversível. Deseja zerar o sistema?")) {
                      useDataStore.getState().wipeDatabase();
                   }
                }}
                className="mt-8 h-14 w-full border-danger/30 text-danger text-[10px] font-black uppercase tracking-widest rounded-[18px] hover:bg-danger hover:text-white transition-all shadow-xl shadow-danger/5"
              >
                Resetar Ecossistema
              </Button>
            </Card>

            <Card className="bg-black/5 border border-border p-8 rounded-[35px] flex flex-col justify-between hover:border-primary transition-all">
              <div>
                <h3 className="text-xl font-black text-text-1 uppercase italic tracking-tighter">Restaurar Padrões</h3>
                <p className="text-[10px] text-text-1 opacity-40 font-bold uppercase tracking-widest mt-4 leading-relaxed">
                  Restaura o sistema para o estado inicial com dados de demonstração. <br/>
                  Útil para treinamento.
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => {
                  if(window.confirm("Deseja restaurar os dados de exemplo?")) {
                    useDataStore.getState().resetToDefaults();
                  }
                }}
                className="mt-8 h-14 w-full border-black/10 text-text-1 text-[10px] font-black uppercase tracking-widest rounded-[18px] hover:bg-black hover:text-white transition-all"
              >
                 Injetar Dados de Fábrica
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-xl animate-fade">
           <div className="w-full max-w-lg bg-surface border border-border rounded-[40px] shadow-2xl overflow-hidden p-10 space-y-8 my-auto relative z-[1000] animate-slide-up">
              <div className="flex justify-between items-start border-b border-border/10 pb-6">
                 <div>
                    <h3 className="text-2xl font-black text-text-1 italic uppercase tracking-tighter leading-none">
                       Governança <span className="text-primary italic">de Acesso</span>
                    </h3>
                    <p className="text-[9px] font-black text-text-1 opacity-20 uppercase tracking-[0.4em] mt-2">Protocolo de Identidade v2</p>
                 </div>
                 <div className="flex items-center gap-4">
                    {editingId && (
                      <button 
                        onClick={() => {
                          if(window.confirm("CONFIRMAR EXCLUSÃO? Esta ação removerá o perfil do terminal.")) {
                            deleteUser(editingId);
                            setIsModalOpen(false);
                            toast.success('Perfil removido da base de dados');
                          }
                        }}
                        className="w-12 h-12 rounded-full border border-danger/20 text-danger hover:bg-danger hover:text-white transition-all flex items-center justify-center bg-danger/5"
                        title="Excluir Perfil"
                      >
                         <Trash2 size={20} />
                      </button>
                    )}
                    <button onClick={() => setIsModalOpen(false)} title="Fechar Modal" className="w-12 h-12 rounded-full bg-black/5 hover:bg-black hover:text-white transition-all flex items-center justify-center border border-border">
                        <Check size={20} />
                    </button>
                 </div>
              </div>

              <div className="space-y-6">
                 {/* Status Toggle */}
                 <div className="flex items-center justify-between p-4 bg-black/5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-black text-text-1 uppercase tracking-widest leading-none">Status da Conta</p>
                    <button 
                       onClick={() => setFormData({...formData, active: !formData.active})}
                       className={cn(
                          "h-10 px-6 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                          formData.active ? "bg-success text-white shadow-lg shadow-success/20" : "bg-black text-white opacity-40"
                       )}
                    >
                       {formData.active ? 'OPERANTE' : 'RESTRITO'}
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black text-text-1 uppercase tracking-widest opacity-30 ml-2">Nível de Governança</label>
                        <select 
                           className="w-full h-14 rounded-xl bg-bg/50 border border-border px-4 text-[10px] font-black text-text-1 uppercase focus:border-primary transition-all outline-none appearance-none"
                           value={formData.role}
                           title="Nível de Acesso"
                           onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                        >
                           <option value="technician">Técnico Operacional</option>
                           <option value="analyst">Analista de Suprimentos</option>
                           <option value="admin">Administrador Geral</option>
                           <option value="cto">Diretor de Tecnologia (CTO)</option>
                        </select>
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black text-text-1 uppercase tracking-widest opacity-30 ml-2">Identidade Visual</label>
                        <input className="w-full h-14 rounded-xl bg-bg/50 border border-border px-4 text-[10px] font-black text-text-1 uppercase focus:border-primary transition-all outline-none" placeholder="NOME DO USUÁRIO..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black text-text-1 uppercase tracking-widest opacity-30 ml-2">E-mail Operacional</label>
                        <input className="w-full h-14 rounded-xl bg-bg/50 border border-border px-4 text-[10px] font-black text-text-1 focus:border-primary transition-all outline-none" placeholder="EMAIL@RDY.COM..." value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                     </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black text-text-1 uppercase tracking-widest opacity-30 ml-2">Chave de Segurança</label>
                        <div className="relative">
                           <input 
                              type={showPassword ? "text" : "password"} 
                              className="w-full h-14 rounded-xl bg-bg/50 border border-border px-4 text-[10px] font-black text-text-1 focus:border-primary transition-all outline-none" 
                              placeholder="DEFINIR NOVA CHAVE..." 
                              value={formData.password} 
                              onChange={e => setFormData({...formData, password: e.target.value})} 
                           />
                           <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-1 opacity-20 hover:opacity-100 transition-all"
                           >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                           </button>
                        </div>
                     </div>
                 </div>

                 <div className="pt-4">
                    <Button onClick={handleSave} disabled={isSaving} className="w-full h-16 rdy-btn-elite text-[11px]">
                       {isSaving ? 'Salvando...' : editingId ? 'Sincronizar Atualizações' : 'Validar Novo Usuário'}
                    </Button>
                 </div>
              </div>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};
