-- Tabela para insumos vinculados a contratos (papeis, outros materiais)
CREATE TABLE IF NOT EXISTS contract_supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  supply_type_id TEXT NOT NULL DEFAULT '',
  min_stock INTEGER DEFAULT 0
);

ALTER TABLE contract_supplies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rdy_contract_supplies_all" ON contract_supplies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
