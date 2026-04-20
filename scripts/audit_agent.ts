import * as fs from 'fs';
import * as path from 'path';

/**
 * RDY SUPPLY - AGENTE TÁTICO DE AUDITORIA V2 (NATIVO)
 * Finalidade: Varredura profunda sem dependências externas.
 */

const TARGET_DIRS = ['src', 'supabase'];
const IGNORE_PATTERNS = ['node_modules', 'dist', 'artifacts', '.git'];

interface Violation {
  file: string;
  line: number;
  content: string;
  rule: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

const RULES = [
  {
    name: 'ZERO_GRAY_POLICY',
    description: 'Uso proibido de tons de cinza (gray, slate, zinc, neutral, stone).',
    pattern: /(text|bg|border|ring)-(gray|slate|zinc|neutral|stone)/i,
    severity: 'HIGH'
  },
  {
    name: 'UNSAFE_DATE_FORMATTING',
    description: 'Uso de format(new Date(...)) sem verificação de nulidade.',
    pattern: /format\(new Date\([^?.]+\),/i,
    severity: 'HIGH'
  },
  {
    name: 'HARDCODED_WHITE',
    description: 'Uso de text-white ou bg-white fora de badges táticos.',
    pattern: /(text|bg|border)-white(?!.+CMYKBadge|Bell)/i,
    severity: 'MEDIUM'
  }
];

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!IGNORE_PATTERNS.some(p => fullPath.includes(p))) {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.sql')) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

async function runAudit() {
  console.log('🚀 INICIANDO AUDITORIA TÁTICA NATIVA...');
  const violations: Violation[] = [];
  let files: string[] = [];

  TARGET_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
      files = [...files, ...getAllFiles(dir)];
    }
  });

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((lineText, index) => {
      RULES.forEach(rule => {
        if (rule.pattern.test(lineText)) {
          violations.push({
            file,
            line: index + 1,
            content: lineText.trim(),
            rule: rule.name,
            severity: rule.severity as any
          });
        }
      });
    });
  });

  const reportPath = path.join(process.cwd(), 'audit_report_detailed.md');
  let report = `# 📊 Relatório Geral do Agente de Auditoria (LINT TÁTICO)\n\n`;
  report += `**Data:** ${new Date().toLocaleString()}\n`;
  report += `**Arquivos:** ${files.length}\n`;
  report += `**Violações:** ${violations.length}\n\n`;

  report += `## 🚨 Violações Críticas\n\n`;
  violations.filter(v => v.severity === 'HIGH').forEach(v => {
    report += `- [ ] **${v.rule}**: \`${v.file}:L${v.line}\`\n  - \`${v.content}\`\n`;
  });

  fs.writeFileSync(reportPath, report);
  console.log(`✅ AUDITORIA CONCLUÍDA! Relatório em: ${reportPath}`);
}

runAudit().catch(console.error);
