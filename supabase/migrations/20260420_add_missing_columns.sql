-- Add columns missing from initial schema that code already expects
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT;

ALTER TABLE equipment_models ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'equipment'
  CHECK (type IN ('equipment', 'supply', 'part'));
