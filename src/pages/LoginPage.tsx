import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, Lock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input } from '../components/ui/Base';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'technician' ? '/tecnico' : '/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Informe suas credenciais');
      return;
    }
    
    setIsAuthenticating(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
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
    } catch (err: any) {
      toast.error('Erro de conexão com o servidor');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 selection:bg-primary selection:text-secondary">
      <div className="w-full max-w-[480px] bg-surface border border-border rounded-[40px] px-10 py-16 shadow-2xl relative overflow-hidden flex flex-col items-center animate-fade">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary blur-[100px] pointer-events-none" />
        
        {/* Brand Icon */}
        <div className="relative mb-8">
           <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center text-primary shadow-2xl shadow-primary transition-transform hover:scale-105">
             <span className="font-black text-3xl italic tracking-tighter">RDY</span>
           </div>
           <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-secondary border-4 border-surface">
             <Lock size={14} strokeWidth={3} />
           </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tighter leading-none mb-3">
            RDY <span className="text-primary italic">SUPPLY</span>
          </h1>
          <p className="text-[10px] font-bold text-text-2 uppercase tracking-[0.5em]">Inventory Intelligence v2</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full space-y-6">
          <div className="space-y-4">
            <Input 
              label="E-mail Corporativo"
              type="email"
              placeholder="exemplo@rdy.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isAuthenticating}
              className="h-14 rounded-2xl"
            />
            
            <Input 
              label="Chave de Acesso"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isAuthenticating}
              className="h-14 rounded-2xl"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isAuthenticating}
            className="w-full h-16 rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary group"
          >
            {isAuthenticating ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <span className="flex items-center gap-2">
                Autenticar no Sistema
                <ChevronRight size={18} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-12 flex flex-col items-center gap-4">
           <p className="text-[9px] font-bold text-text-2 uppercase tracking-[0.2em] text-center">
             Protegido por RDY Security Gateway
           </p>
           <div className="flex items-center gap-2 opacity-50 grayscale">
             <div className="w-1.5 h-1.5 rounded-full bg-success" />
             <span className="text-[8px] font-bold text-text-1 uppercase tracking-widest">Servidor Local Online</span>
           </div>
        </div>
      </div>
    </div>
  );
};

