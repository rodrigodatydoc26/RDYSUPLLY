import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const exportToExcel = (data: any[]) => {
  const worksheetData = data.flatMap(contract => 
    contract.machines.map((m: any) => ({
      'CONTRATO': contract.name.toUpperCase(),
      'CÓDIGO': contract.code,
      'EQUIPAMENTO': m.model?.name || 'N/A',
      'SÉRIE': m.serial_number,
      'LOCALIZAÇÃO': m.location || 'N/A',
      'TONER K': m.latestStock?.toners.K ?? 0,
      'TONER C': m.latestStock?.toners.C ?? 0,
      'TONER M': m.latestStock?.toners.M ?? 0,
      'TONER Y': m.latestStock?.toners.Y ?? 0,
      'CILINDRO K': m.latestStock?.drums.K ?? 0,
      'CILINDRO C': m.latestStock?.drums.C ?? 0,
      'CILINDRO M': m.latestStock?.drums.M ?? 0,
      'CILINDRO Y': m.latestStock?.drums.Y ?? 0,
      'PAPEL (RESMAS)': contract.latestPaper?.reams_current ?? 0,
      'ÚLTIMA SINCRONIA': contract.lastSyncAt ? format(new Date(contract.lastSyncAt), 'dd/MM/yyyy HH:mm') : 'NUNCA'
    }))
  );

  const ws = XLSX.utils.json_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventario_RDY");
  
  XLSX.writeFile(wb, `RDY_SUPPLY_RELATORIO_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
};

export const exportToPDF = (data: any[]) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm');

  // Header RDY
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, 297, 25, 'F');
  
  doc.setFontSize(22);
  doc.setTextColor(255, 214, 0); // Primary Yellow
  doc.setFont('helvetica', 'bold');
  doc.text('RDY SUPPLY', 15, 15);
  
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('ESTRUTURA HIERÁRQUICA DE INVENTÁRIO | FECHAMENTO E AUDITORIA', 15, 20);
  doc.text(`EMITIDO EM: ${timestamp}`, 240, 15);

  let startY = 35;

  data.forEach((contract) => {
    if (startY > 180) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`CONTRATO: ${contract.name.toUpperCase()} (ID: ${contract.code})`, 15, startY);
    
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`SALDO GERAL PAPEL: ${contract.latestPaper?.reams_current ?? 0} RESMAS`, 15, startY + 5);

    const tableRows = contract.machines.map((m: any) => [
      m.model?.name || 'N/A',
      m.serial_number,
      m.latestStock?.toners.K ?? 0,
      m.latestStock?.toners.C ?? 0,
      m.latestStock?.toners.M ?? 0,
      m.latestStock?.toners.Y ?? 0,
      m.latestStock?.drums.K ?? 0,
      m.latestStock?.drums.C ?? 0,
      m.latestStock?.drums.M ?? 0,
      m.latestStock?.drums.Y ?? 0
    ]);

    autoTable(doc, {
      startY: startY + 8,
      head: [['EQUIPAMENTO', 'SÉRIE', 'TK', 'TC', 'TM', 'TY', 'CK', 'CC', 'CM', 'CY']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 214, 0], fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 2 }
    });

    startY = (doc as any).lastAutoTable.finalY + 15;
  });

  doc.save(`RDY_SUPPLY_INVENTARIO_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

export const exportHistoryToExcel = (data: any[]) => {
  const worksheetData = data.map(entry => ({
    'DATA/HORA': format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm:ss'),
    'EQUIPAMENTO': entry.equipmentName.toUpperCase(),
    'SÉRIE': entry.serialNumber || 'PENDENTE',
    'CONTRATO': entry.contractName.toUpperCase(),
    'UNIDADE': entry.location || 'N/A',
    'TONER K': entry.toner_k ?? '-',
    'TONER C': entry.toner_c ?? '-',
    'TONER M': entry.toner_m ?? '-',
    'TONER Y': entry.toner_y ?? '-',
    'RESPONSÁVEL': entry.technicianName.toUpperCase(),
    'LOG': `Leitura realizada por ${entry.technicianName} em ${format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm:ss')}`
  }));

  const ws = XLSX.utils.json_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Historico_RDY");
  
  XLSX.writeFile(wb, `RDY_HISTORICO_LEITURAS_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
};

export const exportHistoryToPDF = (data: any[]) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm');

  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, 297, 25, 'F');
  
  doc.setFontSize(22);
  doc.setTextColor(255, 214, 0); 
  doc.setFont('helvetica', 'bold');
  doc.text('RDY SUPPLY', 15, 15);
  
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('AUDIT TRAIL | HISTÓRICO COMPLETO DE LEITURAS E MOVIMENTAÇÃO', 15, 20);
  doc.text(`EMITIDO EM: ${timestamp}`, 240, 15);

  const tableRows = data.map(entry => [
    format(new Date(entry.timestamp), 'dd/MM HH:mm'),
    entry.equipmentName,
    entry.contractName,
    entry.toner_k ?? '-',
    entry.toner_c ?? '-',
    entry.toner_m ?? '-',
    entry.toner_y ?? '-',
    entry.technicianName,
    `Atualizado em ${format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm')}`
  ]);

  autoTable(doc, {
    startY: 35,
    head: [['DATA', 'EQUIPAMENTO', 'CONTRATO', 'TK', 'TC', 'TM', 'TY', 'RESPONSÁVEL', 'LOG DE ATUALIZAÇÃO']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 214, 0], fontSize: 7 },
    styles: { fontSize: 7, cellPadding: 2 },
  });

  doc.save(`RDY_HISTORICO_AUDITORIA_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};
