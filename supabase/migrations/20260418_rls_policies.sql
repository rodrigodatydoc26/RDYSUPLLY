-- RDY Supply: RLS Policies para todas as tabelas
-- Permite que usuários autenticados leiam e escrevam em tudo

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "rdy_profiles_select" ON profiles;
DROP POLICY IF EXISTS "rdy_profiles_insert" ON profiles;
DROP POLICY IF EXISTS "rdy_profiles_update" ON profiles;
DROP POLICY IF EXISTS "rdy_profiles_delete" ON profiles;

CREATE POLICY "rdy_profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "rdy_profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "rdy_profiles_update" ON profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rdy_profiles_delete" ON profiles FOR DELETE TO authenticated USING (true);

-- ============================================================
-- CONTRACTS
-- ============================================================
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rdy_contracts_select" ON contracts;
DROP POLICY IF EXISTS "rdy_contracts_insert" ON contracts;
DROP POLICY IF EXISTS "rdy_contracts_update" ON contracts;
DROP POLICY IF EXISTS "rdy_contracts_delete" ON contracts;

CREATE POLICY "rdy_contracts_select" ON contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "rdy_contracts_insert" ON contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "rdy_contracts_update" ON contracts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rdy_contracts_delete" ON contracts FOR DELETE TO authenticated USING (true);

-- ============================================================
-- CONTRACT_TECHNICIANS
-- ============================================================
ALTER TABLE contract_technicians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rdy_contract_technicians_all" ON contract_technicians;

CREATE POLICY "rdy_contract_technicians_all" ON contract_technicians FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- EQUIPMENT_MODELS
-- ============================================================
ALTER TABLE equipment_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rdy_equipment_models_select" ON equipment_models;
DROP POLICY IF EXISTS "rdy_equipment_models_insert" ON equipment_models;
DROP POLICY IF EXISTS "rdy_equipment_models_update" ON equipment_models;
DROP POLICY IF EXISTS "rdy_equipment_models_delete" ON equipment_models;

CREATE POLICY "rdy_equipment_models_select" ON equipment_models FOR SELECT TO authenticated USING (true);
CREATE POLICY "rdy_equipment_models_insert" ON equipment_models FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "rdy_equipment_models_update" ON equipment_models FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rdy_equipment_models_delete" ON equipment_models FOR DELETE TO authenticated USING (true);

-- ============================================================
-- CONTRACT_EQUIPMENT
-- ============================================================
ALTER TABLE contract_equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rdy_contract_equipment_all" ON contract_equipment;

CREATE POLICY "rdy_contract_equipment_all" ON contract_equipment FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- EQUIPMENT_MIN_STOCK
-- ============================================================
ALTER TABLE equipment_min_stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rdy_equipment_min_stock_all" ON equipment_min_stock;

CREATE POLICY "rdy_equipment_min_stock_all" ON equipment_min_stock FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- EQUIPMENT_STOCK_ENTRIES
-- ============================================================
ALTER TABLE equipment_stock_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rdy_equipment_stock_entries_all" ON equipment_stock_entries;

CREATE POLICY "rdy_equipment_stock_entries_all" ON equipment_stock_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- PAPER_STOCK_ENTRIES
-- ============================================================
ALTER TABLE paper_stock_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rdy_paper_stock_entries_all" ON paper_stock_entries;

CREATE POLICY "rdy_paper_stock_entries_all" ON paper_stock_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- STOCK_ALERTS
-- ============================================================
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rdy_stock_alerts_all" ON stock_alerts;

CREATE POLICY "rdy_stock_alerts_all" ON stock_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- USER_CONFIGS
-- ============================================================
ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rdy_user_configs_all" ON user_configs;

CREATE POLICY "rdy_user_configs_all" ON user_configs FOR ALL TO authenticated USING (true) WITH CHECK (true);
