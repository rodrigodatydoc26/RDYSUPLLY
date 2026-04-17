import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const { users } = useDataStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha e-mail e senha');
      return;
    }
    
    try {
      const foundUser = users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
      );

      if (!foundUser) {
        return toast.error('E-mail ou senha incorretos.');
      }

      if (!foundUser.active) {
        return toast.error('Este perfil está suspenso.');
      }

      await login(foundUser);
      toast.success(`Bem-vindo, ${foundUser.name}!`);
      navigate(foundUser.role === 'technician' ? '/tecnico' : '/');
    } catch (error) {
      toast.error('Falha na autenticação.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700 flex flex-col items-center">
        <h1 className="text-6xl font-black text-primary tracking-tighter leading-none mb-2">RDY</h1>
        <p className="text-[10px] font-black text-text-2 uppercase tracking-[0.4em] opacity-60 leading-none">
          INVESTMENT PERFORMANCE
        </p>
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
              <label className="text-[10px] font-black text-text-2 uppercase tracking-widest ml-1 mb-2 block">SENHA OPERACIONAL</label>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full h-14 rounded-xl bg-black border border-white/10 px-4 text-sm text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-white/10" 
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-2/40 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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


      </div>

      <footer className="mt-12 text-[8px] font-bold text-white/10 uppercase tracking-[0.4em]">
        Protocolo Elite &bull; Sistemas Operacionais RDY &bull; 2026
      </footer>
    </div>
  );
};
