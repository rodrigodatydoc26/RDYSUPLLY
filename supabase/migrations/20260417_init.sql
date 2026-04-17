-- RDY Supply: Initial Schema

-- Profiles (links to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'analyst', 'technician', 'cto')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technical link (N:N)
CREATE TABLE contract_technicians (
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (contract_id, technician_id)
);

-- Equipment Models
CREATE TABLE equipment_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supply Types
CREATE TABLE supply_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('toner', 'paper')),
  color TEXT,
  capacity INTEGER,
  equipment_model_id UUID REFERENCES equipment_models(id),
  unit TEXT DEFAULT 'un',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract Supplies Configuration
CREATE TABLE contract_supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  supply_type_id UUID REFERENCES supply_types(id) ON DELETE CASCADE,
  min_stock INTEGER DEFAULT 0,
  UNIQUE(contract_id, supply_type_id)
);

-- Stock Entries (Daily Logs)
CREATE TABLE stock_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id),
  supply_type_id UUID REFERENCES supply_types(id),
  technician_id UUID REFERENCES profiles(id),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_stock INTEGER NOT NULL,
  entries_in INTEGER DEFAULT 0,
  entries_out INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_id, supply_type_id, entry_date)
);

-- Indexes
CREATE INDEX idx_stock_entries_contract_date ON stock_entries(contract_id, entry_date);
CREATE INDEX idx_stock_entries_technician ON stock_entries(technician_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- RLS Examples
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ... additional policies as per role table in requirements
