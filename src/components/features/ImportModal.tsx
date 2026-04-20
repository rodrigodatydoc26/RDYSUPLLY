import { useState } from 'react';
import { X, Download, UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Card } from '../ui/Base';
import { ExcelService } from '../../lib/excel';

interface ImportModalProps {
  type: 'equipment' | 'catalogue';
  onClose: () => void;
  onImport: (data: Record<string, unknown>[]) => Promise<void>;
}

export const ImportModal = ({ type, onClose, onImport }: ImportModalProps) => {
  const [data, setData] = useState<Record<string, unknown>[] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const parsedData = await ExcelService.parseFile(file);
      if (parsedData.length === 0) throw new Error('O arquivo está vazio');
      setData(parsedData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao ler arquivo';
      setError(message);
    }
  };

  const executeImport = async () => {
    if (!data) return;
    setIsUploading(true);
    try {
      await onImport(data);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao processar importação';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl bg-black/90">
      <div className="w-full max-w-2xl bg-surface border border-border rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-10 py-8 border-b border-border flex justify-between items-center bg-bg/50">
          <div>
            <h3 className="text-2xl font-black text-text-1 italic uppercase tracking-tighter">
              Importar <span className="text-primary italic">{type === 'equipment' ? 'Parque de Máquinas' : 'Catálogo de Modelos'}</span>
            </h3>
            <p className="text-[8px] font-black text-text-2 uppercase tracking-widest mt-1">Sincronização em Massa via XLSX</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-surface border border-border flex items-center justify-center text-text-2 hover:text-danger transition-all"
            title="Fechar"
            aria-label="Fechar janela de importação"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div className="p-10 space-y-8">
          {/* Step 1: Template */}
          <div className="flex items-center justify-between p-6 bg-secondary border border-border rounded-3xl group hover:border-primary/50 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Download size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-text-1 uppercase italic tracking-tight leading-none">Baixar Modelo</p>
                <p className="text-[9px] font-bold text-text-2 uppercase tracking-widest mt-1.5">Use nosso padrão para evitar erros</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl border-border px-6"
              onClick={() => ExcelService.downloadTemplate(type)}
            >
              Documento XLSX
            </Button>
          </div>

          {/* Step 2: Upload */}
          {!data ? (
            <div className="relative">
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                title="Selecione um arquivo Excel para importar"
                aria-label="Upload de arquivo XLSX"
              />
              <div className="border-2 border-dashed border-border rounded-[32px] p-12 flex flex-col items-center justify-center gap-4 bg-bg/30 hover:bg-bg/50 hover:border-primary/30 transition-all group">
                <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center text-text-2 group-hover:text-primary transition-colors">
                  <UploadCloud size={32} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-text-1 uppercase tracking-widest">Arraste ou clique para enviar</p>
                  <p className="text-[8px] font-bold text-text-2 uppercase tracking-[0.2em] mt-2">Formatos suportados: .XLSX, .CSV</p>
                </div>
              </div>
            </div>
          ) : (
            <Card className="p-0 border-primary/30 overflow-hidden">
              <div className="px-6 py-4 bg-primary/5 border-b border-primary/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-primary" />
                  <span className="text-[10px] font-black text-text-1 uppercase tracking-widest">{data.length} Linhas identificadas</span>
                </div>
                <button 
                  onClick={() => setData(null)}
                  className="text-[10px] font-black text-danger uppercase underline tracking-widest"
                >
                  Substituir Arquivo
                </button>
              </div>
              <div className="max-h-[200px] overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface border-b border-border">
                    <tr>
                      {Object.keys(data[0]).map(k => (
                        <th key={k} className="px-4 py-2 text-[8px] font-black text-text-2 uppercase">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-border/30">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-4 py-2 text-[10px] font-medium text-text-1">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.length > 5 && (
                <div className="p-4 text-center bg-bg/50">
                  <p className="text-[8px] font-bold text-text-2 uppercase">E mais {data.length - 5} linhas...</p>
                </div>
              )}
            </Card>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/20 rounded-2xl text-danger animate-in slide-in-from-top-2">
              <AlertCircle size={18} />
              <p className="text-[10px] font-black uppercase tracking-tight">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-8 bg-bg border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>Cancelar</Button>
          <Button 
            onClick={executeImport} 
            disabled={!data || isUploading}
            className="h-12 px-10 rounded-2xl shadow-xl shadow-primary/20 min-w-[180px]"
          >
            {isUploading ? 'Processando...' : 'Confirmar Importação'}
          </Button>
        </div>
      </div>
    </div>
  );
};
