import * as XLSX from 'xlsx';

export const ExcelService = {
  /**
   * Gera e baixa um template Excel para importação
   */
  downloadTemplate: (type: 'equipment' | 'catalogue') => {
    let headers: string[] = [];
    let exampleData: (string | number | boolean)[][] = [];
    let fileName = '';

    if (type === 'equipment') {
      headers = ['CONTRATO_CODIGO', 'MARCA', 'MODELO', 'SERIAL', 'LOCALIZACAO'];
      exampleData = [
        ['SC001', 'HP', 'LaserJet M177fw', 'ABC123456', 'Recepção'],
        ['SC001', 'Ricoh', 'MP 301', 'XYZ789012', 'Faturamento']
      ];
      fileName = 'template_equipamentos_rdy.xlsx';
    } else {
      headers = [
        'MARCA', 'MODELO', 'COLOR(S/N)', 'CILINDRO(S/N)', 
        'TONER_BLACK', 'TONER_CYAN', 'TONER_MAGENTA', 'TONER_YELLOW',
        'DRUM_BLACK', 'DRUM_CYAN', 'DRUM_MAGENTA', 'DRUM_YELLOW'
      ];
      exampleData = [
        ['HP', 'LaserJet M177fw', 'S', 'N', 'CF350A', 'CF351A', 'CF352A', 'CF353A', '', '', '', ''],
        ['Ricoh', 'MP 301', 'N', 'S', '841711', '', '', '', 'D1272110', '', '', '']
      ];
      fileName = 'template_catalogo_rdy.xlsx';
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
