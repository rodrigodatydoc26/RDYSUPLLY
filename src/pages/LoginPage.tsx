import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useDataStore } from '../store/useDataStore';
import { Loader2, Mail, Lock, ChevronRight, Package } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const { users } = useDataStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha e-mail e senha');
      return;
    }
    
    authFlow(email, password);
  };

  const authFlow = async (uEmail: string, uPass: string) => {
    try {
      const foundUser = users.find(u => 
        u.email.toLowerCase() === uEmail.toLowerCase() && 
        u.password === uPass
      );

      if (!foundUser) {
        return toast.error('Perfil não identificado.');
      }

      if (!foundUser.active) {
        return toast.error('Acesso suspenso.');
      }

      await login(foundUser);
      toast.success(`Operador autenticado: ${foundUser.name}`);
      navigate(foundUser.role === 'technician' ? '/tecnico' : '/');
    } catch (error) {
      toast.error('GDC Connection Error.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans selection:bg-primary selection:text-black">
      <div className="w-full max-w-[440px] border border-white/5 rounded-[40px] px-8 py-12 flex flex-col items-center shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-primary/10 blur-[100px] pointer-events-none" />

        {/* Top Icon Area */}
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          <div className="w-20 h-20 bg-primary rounded-[24px] flex items-center justify-center shadow-[0_0_30px_rgba(245,200,0,0.4)] relative">
            <Package size={40} strokeWidth={2.5} className="text-black" />
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-12">
          <h1 className="text-[38px] font-black tracking-tighter leading-none mb-3 flex items-center justify-center gap-2">
            <span className="text-white">RDY</span>
            <span className="text-primary italic">SUPPLY</span>
          </h1>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] leading-none text-center w-full">
            Investment & Performance
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleLogin} className="w-full space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2 mb-2 block">Terminal de Acesso</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  className="w-full h-16 rounded-[20px] bg-[#0A0A0A] border border-white/5 pl-14 pr-6 text-sm text-white font-bold focus:border-primary/40 focus:bg-[#0F0F0F] outline-none transition-all placeholder:text-white/10" 
                  placeholder="Seu ID Corporativo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2 mb-2 block">Chave de Segurança</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20">
                  <Lock size={20} />
                </div>
                <input 
                  type="password" 
                  className="w-full h-16 rounded-[20px] bg-[#0A0A0A] border border-white/5 pl-14 pr-6 text-sm text-white font-bold focus:border-primary/40 focus:bg-[#0F0F0F] outline-none transition-all placeholder:text-white/10" 
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-16 bg-primary hover:bg-primary/95 text-black text-xs font-black uppercase tracking-[0.2em] rounded-[20px] shadow-[0_15px_40px_-10px_rgba(245,200,0,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 relative group overflow-hidden"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  Autenticar
                  <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Branding */}
        <div className="mt-12 text-center">
          <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">
            Conexão Segura RDY Global Data Center
          </p>
        </div>
      </div>
    </div>
  );
};
