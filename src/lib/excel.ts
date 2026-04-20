import * as XLSX from 'xlsx';

export const ExcelService = {
  /**
   * Gera e baixa um template Excel para importação
   */
  downloadTemplate: (type: 'equipment' | 'catalogue' | 'contracts' | 'users') => {
    let headers: string[] = [];
    let exampleData: (string | number | boolean)[][] = [];
    let fileName = '';

    switch (type) {
      case 'equipment':
        headers = ['CONTRATO_CODIGO', 'MARCA', 'MODELO', 'SERIAL', 'LOCALIZACAO'];
        exampleData = [
          ['SC001', 'HP', 'LaserJet M177fw', 'ABC123456', 'Recepção'],
          ['SC001', 'Ricoh', 'MP 301', 'XYZ789012', 'Faturamento']
        ];
        fileName = 'template_maquinas_rdy.xlsx';
        break;
      case 'catalogue':
        headers = [
          'MARCA', 'MODELO', 'TIPO(equipment/supply/part)', 'COLOR(S/N)', 'CILINDRO(S/N)', 
          'TONER_BLACK', 'TONER_CYAN', 'TONER_MAGENTA', 'TONER_YELLOW',
          'DRUM_BLACK', 'DRUM_CYAN', 'DRUM_MAGENTA', 'DRUM_YELLOW'
        ];
        exampleData = [
          ['HP', 'LaserJet M177fw', 'equipment', 'S', 'N', 'CF350A', 'CF351A', 'CF352A', 'CF353A', '', '', '', ''],
          ['Ricoh', 'MP 301', 'equipment', 'N', 'S', '841711', '', '', '', 'D1272110', '', '', '']
        ];
        fileName = 'template_catalogo_rdy.xlsx';
        break;
      case 'contracts':
        headers = ['CODIGO', 'NOME', 'CLIENTE', 'ATIVO(S/N)'];
        exampleData = [
          ['SC001', 'Contrato Alfa', 'Cliente X', 'S'],
          ['SC002', 'Contrato Beta', 'Cliente Y', 'S']
        ];
        fileName = 'template_contratos_rdy.xlsx';
        break;
      case 'users':
        headers = ['NOME', 'EMAIL', 'CARGO(admin/analyst/technician/cto)', 'ATIVO(S/N)'];
        exampleData = [
          ['João Silva', 'joao@rdy.com.br', 'technician', 'S'],
          ['Maria Oliveira', 'maria@rdy.com.br', 'analyst', 'S']
        ];
        fileName = 'template_usuarios_rdy.xlsx';
        break;
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    XLSX.writeFile(wb, fileName);
  },

  /**
   * Lê um arquivo e retorna um array de objetos
   */
  parseFile: (file: File): Promise<Record<string, unknown>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }
};
