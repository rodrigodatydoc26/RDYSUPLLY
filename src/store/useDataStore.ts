import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import type {
  Contract,
  SupplyType,
  ContractSupply,
  StockEntry,
  EquipmentModel,
  Profile,
  StockAdjustment
} from '../types';

interface DataState {
  contracts: Contract[];
  supplyTypes: SupplyType[];
  contractSupplies: ContractSupply[];
  stockEntries: StockEntry[];
  equipmentModels: EquipmentModel[];
  users: Profile[];
  stockAdjustments: StockAdjustment[];
  resolvedAlertIds: string[];

  addStockEntry: (entry: Omit<StockEntry, 'id' | 'created_at'>) => void;
  adjustStockEntry: (adjustment: Omit<StockAdjustment, 'id' | 'created_at'>) => void;
  resolveAlert: (entryId: string) => void;

  updateContract: (contract: Contract) => void;
  addContract: (contract: Omit<Contract, 'id' | 'created_at'>) => void;
  deleteContract: (id: string) => void;

  updateUser: (user: Profile) => void;
  addUser: (user: Omit<Profile, 'id' | 'created_at'>) => void;

  updateSupplyType: (supply: SupplyType) => void;
  addSupplyType: (supply: Omit<SupplyType, 'id' | 'created_at'>) => void;

  updateEquipmentModel: (model: EquipmentModel) => void;
  addEquipmentModel: (model: Omit<EquipmentModel, 'id' | 'created_at'>) => void;
  deleteEquipmentModel: (id: string) => void;

  updateContractSupplies: (contractId: string, supplies: Omit<ContractSupply, 'id'>[]) => void;
  updateMinStock: (contractSupplyId: string, minStock: number) => void;
  deleteSupplyType: (id: string) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  wipeDatabase: () => void;
  resetToDefaults: () => void;
}

const uid = () => Math.random().toString(36).substring(7);

const initialData = {
  contracts: [
    { id: 'c1', name: 'HOSPITAL SANTA CASA', client: 'SANTA CASA DE MISERICÓRDIA', code: 'SC001', active: true, technicianIds: ['2'], created_at: new Date().toISOString() },
    { id: 'c2', name: 'ESCOLA MODELO', client: 'PREFEITURA MUNICIPAL', code: 'EM002', active: true, technicianIds: ['2'], created_at: new Date().toISOString() },
    { id: 'c3', name: 'INDÚSTRIA METAL', client: 'TECNO-STEEL S/A', code: 'IM003', active: true, technicianIds: ['2'], created_at: new Date().toISOString() },
  ],
  equipmentModels: [
    { id: 'e1', name: 'LaserJet M15w', brand: 'HP' },
    { id: 'e2', name: 'DCP-L5652DN', brand: 'Brother' },
    { id: 'e3', name: 'Universal / Outros', brand: 'Generic' },
  ],
  supplyTypes: [
    { id: 's1', name: 'Toner HP CF217A', category: 'Toner' as const, color: 'black' as const, capacity: 1600, unit: 'un', equipment_model_id: 'e1' },
    { id: 's2', name: 'Toner TN-3472', category: 'Toner' as const, color: 'black' as const, capacity: 12000, unit: 'un', equipment_model_id: 'e2' },
    { id: 's3', name: 'Papel A4 Chambril', category: 'Papel' as const, capacity: 0, unit: 'cx', equipment_model_id: 'e3' },
    { id: 's4', name: 'Cilindro DR-3440', category: 'Cilindro' as const, capacity: 30000, unit: 'un', equipment_model_id: 'e2' },
  ],
  contractSupplies: [
    { id: 'cs1', contract_id: 'c1', supply_type_id: 's1', min_stock: 5 },
    { id: 'cs2', contract_id: 'c1', supply_type_id: 's3', min_stock: 2 },
    { id: 'cs3', contract_id: 'c2', supply_type_id: 's2', min_stock: 3 },
    { id: 'cs4', contract_id: 'c3', supply_type_id: 's4', min_stock: 1 },
  ],
  users: [
    { id: '1', name: 'Rodrigo Daty', email: 'admin@rdy.com', password: 'admin', role: 'admin' as const, active: true, created_at: new Date().toISOString() },
    { id: '2', name: 'Tecnico Master', email: 'tecnico@rdy.com', password: '123', role: 'technician' as const, active: true, created_at: new Date().toISOString() },
  ],
  stockEntries: [
    { id: 'v1', contract_id: 'c1', supply_type_id: 's1', current_stock: 0, entries_in: 0, entries_out: 0, technician_id: '2', entry_date: format(new Date(), 'yyyy-MM-dd'), created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'v2', contract_id: 'c1', supply_type_id: 's3', current_stock: 0, entries_in: 0, entries_out: 0, technician_id: '2', entry_date: format(new Date(), 'yyyy-MM-dd'), created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'v3', contract_id: 'c2', supply_type_id: 's2', current_stock: 0, entries_in: 0, entries_out: 0, technician_id: '2', entry_date: format(new Date(), 'yyyy-MM-dd'), created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'v4', contract_id: 'c3', supply_type_id: 's4', current_stock: 0, entries_in: 0, entries_out: 0, technician_id: '2', entry_date: format(new Date(), 'yyyy-MM-dd'), created_at: new Date(Date.now() - 86400000).toISOString() },
  ],
  stockAdjustments: [] as StockAdjustment[],
  resolvedAlertIds: [] as string[],
};

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      ...initialData,

      addStockEntry: (entry) => set((state) => {
        const newEntry = { ...entry, id: uid(), created_at: new Date().toISOString() };
        const filtered = state.stockEntries.filter(
          e => !(e.contract_id === entry.contract_id && e.supply_type_id === entry.supply_type_id && e.entry_date === entry.entry_date)
        );
        return { stockEntries: [...filtered, newEntry] };
      }),

      adjustStockEntry: (adj) => set((state) => ({
        stockEntries: state.stockEntries.map(e => e.id === adj.stock_entry_id ? { ...e, current_stock: adj.new_value } : e),
        stockAdjustments: [...state.stockAdjustments, { ...adj, id: uid(), created_at: new Date().toISOString() }],
      })),

      resolveAlert: (entryId) => set((state) => ({
        resolvedAlertIds: [...state.resolvedAlertIds, entryId],
      })),

      updateContract: (contract) => set((state) => ({
        contracts: state.contracts.map(c => c.id === contract.id ? contract : c),
      })),

      addContract: (contract) => set((state) => ({
        contracts: [...state.contracts, { ...contract, id: uid(), created_at: new Date().toISOString() }],
      })),

      deleteContract: (id) => set((state) => ({
        contracts: state.contracts.filter(c => c.id !== id),
        contractSupplies: state.contractSupplies.filter(cs => cs.contract_id !== id),
      })),

      updateUser: (user) => set((state) => ({
        users: state.users.map(u => u.id === user.id ? user : u),
      })),

      addUser: (user) => set((state) => ({
        users: [...state.users, { ...user, id: uid(), created_at: new Date().toISOString() }],
      })),

      updateSupplyType: (supply) => set((state) => ({
        supplyTypes: state.supplyTypes.map(s => s.id === supply.id ? supply : s),
      })),

      addSupplyType: (supply) => set((state) => ({
        supplyTypes: [...state.supplyTypes, { ...supply, id: uid(), created_at: new Date().toISOString() }],
      })),

      updateEquipmentModel: (model) => set((state) => ({
        equipmentModels: state.equipmentModels.map(m => m.id === model.id ? model : m),
      })),

      addEquipmentModel: (model) => set((state) => ({
        equipmentModels: [...state.equipmentModels, { ...model, id: uid(), created_at: new Date().toISOString() }],
      })),

      deleteEquipmentModel: (id) => set((state) => ({
        equipmentModels: state.equipmentModels.filter(m => m.id !== id),
        supplyTypes: state.supplyTypes.filter(s => s.equipment_model_id !== id),
      })),

      deleteSupplyType: (id) => set((state) => ({
        supplyTypes: state.supplyTypes.filter(s => s.id !== id),
        contractSupplies: state.contractSupplies.filter(cs => cs.supply_type_id !== id),
        stockEntries: state.stockEntries.filter(e => e.supply_type_id !== id),
      })),

      updateContractSupplies: (contractId, supplies) => set((state) => {
        const filtered = state.contractSupplies.filter(cs => cs.contract_id !== contractId);
        return { contractSupplies: [...filtered, ...supplies.map(s => ({ ...s, id: uid() }))] };
      }),

      updateMinStock: (contractSupplyId, minStock) => set((state) => ({
        contractSupplies: state.contractSupplies.map(cs => 
          cs.id === contractSupplyId ? { ...cs, min_stock: minStock } : cs
        )
      })),

      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      wipeDatabase: () => set((state) => {
        const admins = state.users.filter(u => u.role === 'admin');
        const newData = {
          ...initialData,
          contracts: [],
          supplyTypes: [],
          contractSupplies: [],
          stockEntries: [],
          equipmentModels: [],
          stockAdjustments: [],
          resolvedAlertIds: [],
          users: admins.length > 0 ? admins : [{ id: '1', name: 'Rodrigo Daty', email: 'admin@rdy.com', password: 'admin', role: 'admin' as const, active: true, created_at: new Date().toISOString() }],
        };
        localStorage.setItem('rdy-supply-data', JSON.stringify({ state: newData, version: 2 }));
        set({ ...newData });
        window.location.reload();
      }),

      resetToDefaults: () => {
        localStorage.removeItem('rdy-supply-data');
        set({ ...initialData });
        window.location.reload();
      }
    }),
    {
      name: 'rdy-supply-data',
      version: 2,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
