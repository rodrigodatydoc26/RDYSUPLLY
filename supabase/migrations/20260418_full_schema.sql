-- RDY Supply v2: Schema Completo + RLS Policies
-- Projeto: fcwjvdbtitwjpqzurdge

-- ============================================================
-- TABELAS
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('admin', 'analyst', 'technician', 'cto')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_technicians (
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (contract_id, technician_id)
);

CREATE TABLE IF NOT EXISTS equipment_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  is_color BOOLEAN DEFAULT false,
  has_drum BOOLEAN DEFAULT false,
  toner_black TEXT DEFAULT '',
  toner_cyan TEXT DEFAULT '',
  toner_magenta TEXT DEFAULT '',
  toner_yellow TEXT DEFAULT '',
  drum_black TEXT DEFAULT '',
  drum_cyan TEXT DEFAULT '',
  drum_magenta TEXT DEFAULT '',
  drum_yellow TEXT DEFAULT '',
  capacity_toner_black INTEGER DEFAULT 0,
  capacity_toner_cyan INTEGER DEFAULT 0,
  capacity_toner_magenta INTEGER DEFAULT 0,
  capacity_toner_yellow INTEGER DEFAULT 0,
  capacity_drum_black INTEGER DEFAULT 0,
  capacity_drum_cyan INTEGER DEFAULT 0,
  capacity_drum_magenta INTEGER DEFAULT 0,
  capacity_drum_yellow INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  equipment_model_id UUID REFERENCES equipment_models(id),
  serial_number TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment_min_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_equipment_id UUID REFERENCES contract_equipment(id) ON DELETE CASCADE UNIQUE,
  toner_black_min INTEGER DEFAULT 0,
  toner_cyan_min INTEGER DEFAULT 0,
  toner_magenta_min INTEGER DEFAULT 0,
  toner_yellow_min INTEGER DEFAULT 0,
  drum_black_min INTEGER DEFAULT 0,
  drum_cyan_min INTEGER DEFAULT 0,
  drum_magenta_min INTEGER DEFAULT 0,
  drum_yellow_min INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS equipment_stock_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_equipment_id UUID REFERENCES contract_equipment(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES profiles(id),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  toner_black INTEGER,
  toner_cyan INTEGER,
  toner_magenta INTEGER,
  toner_yellow INTEGER,
  drum_black INTEGER,
  drum_cyan INTEGER,
  drum_magenta INTEGER,
  drum_yellow INTEGER,
  toner_black_in INTEGER DEFAULT 0,
  toner_black_out INTEGER DEFAULT 0,
  toner_cyan_in INTEGER DEFAULT 0,
  toner_cyan_out INTEGER DEFAULT 0,
  toner_magenta_in INTEGER DEFAULT 0,
  toner_magenta_out INTEGER DEFAULT 0,
  toner_yellow_in INTEGER DEFAULT 0,
  toner_yellow_out INTEGER DEFAULT 0,
  drum_black_in INTEGER DEFAULT 0,
  drum_black_out INTEGER DEFAULT 0,
  drum_cyan_in INTEGER DEFAULT 0,
  drum_cyan_out INTEGER DEFAULT 0,
  drum_magenta_in INTEGER DEFAULT 0,
  drum_magenta_out INTEGER DEFAULT 0,
  drum_yellow_in INTEGER DEFAULT 0,
  drum_yellow_out INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paper_stock_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES profiles(id),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reams_current INTEGER NOT NULL DEFAULT 0,
  reams_in INTEGER DEFAULT 0,
  reams_out INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  contract_equipment_id UUID REFERENCES contract_equipment(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  current_value INTEGER DEFAULT 0,
  min_value INTEGER DEFAULT 0,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  notified_email BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS user_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  push_subscription JSONB,
  reminder_days INTEGER[] DEFAULT '{1,5}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_equipment_stock_entries_ce ON equipment_stock_entries(contract_equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_stock_entries_date ON equipment_stock_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_paper_stock_entries_contract ON paper_stock_entries(contract_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_resolved ON stock_alerts(resolved, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_contract_equipment_contract ON contract_equipment(contract_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_min_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "rdy_profiles_all" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Contracts
CREATE POLICY "rdy_contracts_all" ON contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Contract Technicians
CREATE POLICY "rdy_contract_technicians_all" ON contract_technicians FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Equipment Models
CREATE POLICY "rdy_equipment_models_all" ON equipment_models FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Contract Equipment
CREATE POLICY "rdy_contract_equipment_all" ON contract_equipment FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Equipment Min Stock
CREATE POLICY "rdy_equipment_min_stock_all" ON equipment_min_stock FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Equipment Stock Entries
CREATE POLICY "rdy_equipment_stock_entries_all" ON equipment_stock_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Paper Stock Entries
CREATE POLICY "rdy_paper_stock_entries_all" ON paper_stock_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Stock Alerts
CREATE POLICY "rdy_stock_alerts_all" ON stock_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- User Configs
CREATE POLICY "rdy_user_configs_all" ON user_configs FOR ALL TO authenticated USING (true) WITH CHECK (true);
