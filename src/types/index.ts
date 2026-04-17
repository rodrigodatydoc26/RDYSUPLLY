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

export interface EquipmentModel {
  id: string;
  name: string;
  brand: string;
}

export interface SupplyType {
  id: string;
  name: string;
  category: 'Papel' | 'Toner' | 'Cilindro';
  color?: 'black' | 'cyan' | 'magenta' | 'yellow';
  capacity?: number;
  equipment_model_id?: string;
  unit: string;
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
  technician_id: string;
  entry_date: string; // YYYY-MM-DD
  current_stock: number;
  entries_in: number;
  entries_out: number;
  notes?: string;
  created_at: string;
}

export interface StockAdjustment {
  id: string;
  stock_entry_id: string;
  adjusted_by: string;
  old_value: number;
  new_value: number;
  reason: string;
  created_at: string;
}

export interface StockAlert {
  id: string;
  contract_id: string;
  supply_type_id: string;
  triggered_at: string;
  current_stock: number;
  min_stock: number;
  resolved: boolean;
  notified_email: boolean;
}
