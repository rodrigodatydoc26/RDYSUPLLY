export type UserRole = 'admin' | 'analyst' | 'technician' | 'cto';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  password?: string;
  created_at: string;
}

export interface Contract {
  id: string;
  name: string;
  client: string;
  code: string;
  active: boolean;
  technicianIds: string[];
  created_at: string;
}

export type SupplyCategory = 'Toner' | 'Cilindro' | 'Papel' | 'Outros';

export interface SupplyType {
  id: string;
  name: string;
  category: SupplyCategory;
  color?: 'black' | 'cyan' | 'magenta' | 'yellow';
  capacity: number;
  unit: string;
  equipment_model_id: string;
  created_at?: string;
}

export interface ContractSupply {
  id: string;
  contract_id: string;
  supply_type_id: string;
  min_stock: number;
}

export interface StockEntry {
  id: string;
  contract_id: string;
  supply_type_id: string;
  current_stock: number;
  entries_in: number;
  entries_out: number;
  technician_id: string;
  entry_date: string;
  created_at: string;
}

export interface StockAdjustment {
  id: string;
  stock_entry_id: string;
  old_value: number;
  new_value: number;
  reason: string;
  adjusted_by: string;
  created_at: string;
}

export type EquipmentModelType = 'equipment' | 'supply' | 'part';

export interface EquipmentModel {
  id: string;
  name: string;
  brand: string;
  type: EquipmentModelType;
  is_color?: boolean;
  has_drum?: boolean;
  toner_black?: string;
  toner_cyan?: string;
  toner_magenta?: string;
  toner_yellow?: string;
  drum_black?: string;
  drum_cyan?: string;
  drum_magenta?: string;
  drum_yellow?: string;
  capacity_toner_black?: number;
  capacity_toner_cyan?: number;
  capacity_toner_magenta?: number;
  capacity_toner_yellow?: number;
  capacity_drum_black?: number;
  capacity_drum_cyan?: number;
  capacity_drum_magenta?: number;
  capacity_drum_yellow?: number;
  created_at: string;
}

export interface ContractEquipment {
  id: string;
  contract_id: string;
  equipment_model_id: string;
  serial_number: string;
  location: string;
  active: boolean;
  created_at: string;
}

export interface EquipmentMinStock {
  id: string;
  contract_equipment_id: string;
  toner_black_min: number;
  toner_cyan_min: number;
  toner_magenta_min: number;
  toner_yellow_min: number;
  drum_black_min: number;
  drum_cyan_min: number;
  drum_magenta_min: number;
  drum_yellow_min: number;
}

export interface EquipmentStockEntry {
  id: string;
  contract_equipment_id: string;
  technician_id: string;
  entry_date: string;
  toner_black?: number;
  toner_cyan?: number;
  toner_magenta?: number;
  toner_yellow?: number;
  drum_black?: number;
  drum_cyan?: number;
  drum_magenta?: number;
  drum_yellow?: number;
  toner_black_in: number;
  toner_black_out: number;
  toner_cyan_in: number;
  toner_cyan_out: number;
  toner_magenta_in: number;
  toner_magenta_out: number;
  toner_yellow_in: number;
  toner_yellow_out: number;
  drum_black_in: number;
  drum_black_out: number;
  drum_cyan_in: number;
  drum_cyan_out: number;
  drum_magenta_in: number;
  drum_magenta_out: number;
  drum_yellow_in: number;
  drum_yellow_out: number;
  notes?: string;
  created_at: string;
}

export interface PaperStockEntry {
  id: string;
  contract_id: string;
  technician_id: string;
  entry_date: string;
  reams_current: number;
  reams_in: number;
  reams_out: number;
  notes?: string;
  created_at: string;
}

export interface StockAlert {
  id: string;
  contract_id: string;
  contract_equipment_id?: string;
  alert_type: string;
  current_value: number;
  min_value: number;
  triggered_at: string;
  resolved: boolean;
  notified_email: boolean;
}

export interface UserConfig {
  id: string;
  user_id: string;
  operation_days: number[];
  reminder_times: string[];
  push_subscription: unknown;
  created_at?: string;
  updated_at?: string;
}
