import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-20 text-center">
          <AlertTriangle size={48} className="text-danger mb-4 opacity-50" />
          <p className="font-black text-white uppercase tracking-widest text-sm">Erro ao carregar módulo</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-6 flex items-center gap-2 text-[10px] text-primary uppercase tracking-widest hover:opacity-70 transition-opacity"
          >
            <RefreshCw size={14} /> Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
