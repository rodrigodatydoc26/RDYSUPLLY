import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import type { UserRole } from '../store/useAuthStore';
import { Mail, Loader2, Layers } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Preencha o e-mail');
      return;
    }
    
    try {
      await login(email, role);
      toast.success('Bem-vindo ao RDY Supply!');
      navigate(role === 'technician' ? '/tecnico' : '/');
    } catch (error) {
      toast.error('Erro ao entrar. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Branding Estrutural */}
      <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-6xl font-black text-primary tracking-tighter leading-none mb-2">RDY</h1>
        <p className="text-[10px] font-bold text-text-2 uppercase tracking-[0.5em] opacity-40">INVESTIMENTO E PERFORMANCE</p>
      </div>

      <div className="w-full max-w-md bg-[#111111] border border-white/5 rounded-3xl p-10 shadow-2xl animate-in fade-in zoom-in duration-500">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo</h2>
          <p className="text-xs text-text-2/60">Acesse sua conta para operar no modo Elite.</p>
        </header>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-text-2 uppercase tracking-widest ml-1 mb-2 block">E-MAIL CORPORATIVO</label>
              <div className="relative group">
                <input 
                  type="email" 
                  className="w-full h-14 rounded-xl bg-black border border-white/10 px-4 text-sm text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-white/10" 
                  placeholder="exemplo@rdy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-text-2 uppercase tracking-widest ml-1 mb-2 block">ACESSO OPERACIONAL</label>
              <div className="grid grid-cols-2 gap-2">
                {(['admin', 'analyst', 'technician', 'cto'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`h-10 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${
                      role === r 
                        ? 'bg-primary/10 text-primary border-primary/40' 
                        : 'bg-black text-white/20 border-white/5 hover:border-white/10'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-16 bg-primary hover:bg-primary/90 text-black text-sm font-black rounded-full shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Entrar na Plataforma'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-[10px] text-text-2/40">
            Novo por aqui? <span className="text-primary font-bold cursor-pointer hover:underline">Criar conta de membro</span>
          </p>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </div>
      </div>

      <footer className="mt-12 text-[8px] font-bold text-white/10 uppercase tracking-[0.4em]">
        Protocolo Elite &bull; Sistemas Operacionais RDY &bull; 2026
      </footer>
    </div>
  );
};
