import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, ChevronRight, Eye, EyeOff, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input } from '../components/ui/Base';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { user } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'technician' ? '/tecnico' : '/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Informe suas credenciais');
      return;
    }
    
    setIsAuthenticating(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('E-mail ou senha incorretos');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Acesso autorizado!');
    } catch {
      toast.error('Erro de conexão com o servidor');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 selection:bg-primary selection:text-secondary">
      <div className="w-full max-w-[480px] bg-white border border-border rounded-[40px] px-10 py-16 shadow-2xl relative overflow-hidden flex flex-col items-center animate-fade">
        
        {/* Brand Icon (Matching Image) */}
        <div className="relative mb-10">
           <div className="w-24 h-24 bg-primary rounded-[32px] flex items-center justify-center text-black shadow-2xl shadow-primary/20 transition-transform hover:scale-105">
             <Package size={48} strokeWidth={2.5} />
           </div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-primary/20 blur-[60px] pointer-events-none -z-10" />
        </div>

        {/* Header (Zero Cinza) */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black tracking-tighter leading-none mb-4 flex items-center justify-center gap-2">
            <span className="text-black uppercase">RDY</span>
            <span className="text-primary italic uppercase">SUPPLY</span>
          </h1>
          <p className="text-[11px] font-black text-black uppercase tracking-[0.4em]">Investment - Performance</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-1">Email de Acesso</label>
               <Input 
                 type="email"
                 autoComplete="off"
                 placeholder=""
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 disabled={isAuthenticating}
                 className="h-16 rounded-[20px] bg-bg border-2 border-border text-black text-lg font-bold"
               />
            </div>
            
            <div className="space-y-2">
               <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] ml-1">Senha</label>
               <Input 
                 type={showPassword ? 'text' : 'password'}
                 autoComplete="off"
                 placeholder=""
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 disabled={isAuthenticating}
                 className="h-16 rounded-[20px] bg-bg border-2 border-border text-black text-lg font-bold"
                 suffix={
                   <button
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="p-3 text-black hover:text-primary transition-colors focus:outline-none"
                     title={showPassword ? 'Esconder senha' : 'Ver senha'}
                   >
                     {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                   </button>
                 }
               />
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative w-5 h-5 rounded-md border-2 border-border group-hover:border-primary transition-all flex items-center justify-center overflow-hidden bg-bg">
                  <input 
                    type="checkbox" 
                    className="peer absolute inset-0 opacity-0 cursor-pointer"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <div className="w-2.5 h-2.5 bg-primary rounded-sm scale-0 peer-checked:scale-100 transition-transform duration-200" />
                </div>
                <span className="text-[9px] font-black text-black uppercase tracking-widest opacity-60 group-hover:opacity-100">Manter Conectado</span>
              </label>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isAuthenticating}
            className="w-full h-20 rounded-[24px] bg-primary hover:bg-primary/90 text-black text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative flex items-center justify-center gap-3">
              {isAuthenticating ? (
                 <Loader2 className="animate-spin h-6 w-6" />
              ) : (
                <>
                  Autenticar
                  <ChevronRight size={20} strokeWidth={4} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </div>
          </Button>
        </form>

        {/* Footer (Zero Cinza) */}
        <div className="mt-16 text-center">
            <p className="text-[9px] font-black text-black uppercase tracking-[0.3em]">
              Conexão Segura RDY Global Data Center
            </p>
        </div>
      </div>
    </div>
  );
};

