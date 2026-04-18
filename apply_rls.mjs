// Script temporário para aplicar políticas RLS via Supabase Management API
// Uso: node apply_rls.mjs SEU_PERSONAL_ACCESS_TOKEN

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const token = process.argv[2];
const projectRef = 'wicalvdvrhakleldaswf';

if (!token) {
  console.error('❌  Forneça o Personal Access Token como argumento.');
  console.error('    Acesse: https://app.supabase.com/account/tokens');
  console.error('    Uso: node apply_rls.mjs SEU_TOKEN\n');
  process.exit(1);
}

const sql = readFileSync(join(__dirname, 'supabase/migrations/20260418_rls_policies.sql'), 'utf-8');

console.log('🔧  Aplicando políticas RLS no Supabase...');

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

const body = await res.json().catch(() => res.text());

if (!res.ok) {
  console.error('❌  Erro ao aplicar policies:', JSON.stringify(body, null, 2));
  process.exit(1);
}

console.log('✅  Políticas RLS aplicadas com sucesso!');
console.log('    Agora todos os dados serão salvos no Supabase corretamente.\n');
