import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type {
  Contract,
  Profile,
  EquipmentModel,
  ContractEquipment,
  EquipmentMinStock,
  EquipmentStockEntry,
  PaperStockEntry,
  StockAlert,
} from '../types';

interface DataState {
  contracts: Contract[];
  users: Profile[];
  equipmentModels: EquipmentModel[];
  contractEquipment: ContractEquipment[];
  equipmentMinStock: EquipmentMinStock[];
  equipmentStockEntries: EquipmentStockEntry[];
  paperStockEntries: PaperStockEntry[];
  stockAlerts: StockAlert[];
  isLoading: boolean;
  _hasHydrated: boolean;

  fetchInitialData: () => Promise<void>;
  setHasHydrated: (v: boolean) => void;

  addContract: (data: Omit<Contract, 'id' | 'created_at' | 'technicianIds'>) => Promise<void>;
  updateContract: (contract: Contract) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  addEquipmentToContract: (data: Omit<ContractEquipment, 'id' | 'created_at'>, minStock?: Omit<EquipmentMinStock, 'id' | 'contract_equipment_id'>) => Promise<void>;

  addUser: (data: Omit<Profile, 'id' | 'created_at'>) => Promise<void>;
  updateUser: (user: Profile) => Promise<void>;

  addEquipmentModel: (data: Omit<EquipmentModel, 'id' | 'created_at'>) => Promise<void>;
  updateEquipmentModel: (model: EquipmentModel) => Promise<void>;
  deleteEquipmentModel: (id: string) => Promise<void>;

  addStockEntry: (data: Omit<EquipmentStockEntry, 'id' | 'created_at'>) => Promise<void>;
  addPaperEntry: (data: Omit<PaperStockEntry, 'id' | 'created_at'>) => Promise<void>;
  updateMinStock: (contractEquipmentId: string, field: string, value: number) => Promise<void>;

  wipeDatabase: () => Promise<void>;
  resetToDefaults: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  contracts: [],
  users: [],
  equipmentModels: [],
  contractEquipment: [],
  equipmentMinStock: [],
  equipmentStockEntries: [],
  paperStockEntries: [],
  stockAlerts: [],
  isLoading: false,
  _hasHydrated: false,

  setHasHydrated: (v) => set({ _hasHydrated: v }),

  fetchInitialData: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const [
        { data: contractsRaw },
        { data: profiles },
        { data: equipModels },
        { data: ceRaw },
        { data: minStockRaw },
        { data: stockEntriesRaw },
        { data: paperEntriesRaw },
        { data: alertsRaw },
        { data: contractTechs },
      ] = await Promise.all([
        supabase.from('contracts').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('name'),
        supabase.from('equipment_models').select('*').order('name'),
        supabase.from('contract_equipment').select('*').order('created_at', { ascending: false }),
        supabase.from('equipment_min_stock').select('*'),
        supabase.from('equipment_stock_entries').select('*').order('created_at', { ascending: false }),
        supabase.from('paper_stock_entries').select('*').order('created_at', { ascending: false }),
        supabase.from('stock_alerts').select('*').eq('resolved', false).order('triggered_at', { ascending: false }),
        supabase.from('contract_technicians').select('*'),
      ]);

      const contracts: Contract[] = (contractsRaw || []).map(c => ({
        ...c,
        active: c.active ?? true,
        created_at: c.created_at ?? new Date().toISOString(),
        technicianIds: (contractTechs || [])
          .filter(ct => ct.contract_id === c.id)
          .map(ct => ct.technician_id),
      }));

      const contractEquipment: ContractEquipment[] = (ceRaw || []).map(ce => ({
        id: ce.id,
        contract_id: ce.contract_id ?? '',
        equipment_model_id: ce.equipment_model_id ?? '',
        serial_number: ce.serial_number ?? '',
        location: ce.location ?? '',
        active: ce.active ?? true,
        created_at: ce.created_at ?? new Date().toISOString(),
      }));

      const equipmentMinStock: EquipmentMinStock[] = (minStockRaw || []).map(ms => ({
        id: ms.id,
        contract_equipment_id: ms.contract_equipment_id ?? '',
        toner_black_min: ms.toner_black_min ?? 0,
        toner_cyan_min: ms.toner_cyan_min ?? 0,
        toner_magenta_min: ms.toner_magenta_min ?? 0,
        toner_yellow_min: ms.toner_yellow_min ?? 0,
        drum_black_min: ms.drum_black_min ?? 0,
        drum_cyan_min: ms.drum_cyan_min ?? 0,
        drum_magenta_min: ms.drum_magenta_min ?? 0,
        drum_yellow_min: ms.drum_yellow_min ?? 0,
      }));

      const equipmentStockEntries: EquipmentStockEntry[] = (stockEntriesRaw || []).map(e => ({
        id: e.id,
        contract_equipment_id: e.contract_equipment_id ?? '',
        technician_id: e.technician_id ?? '',
        entry_date: e.entry_date,
        toner_black: e.toner_black ?? undefined,
        toner_cyan: e.toner_cyan ?? undefined,
        toner_magenta: e.toner_magenta ?? undefined,
        toner_yellow: e.toner_yellow ?? undefined,
        drum_black: e.drum_black ?? undefined,
        drum_cyan: e.drum_cyan ?? undefined,
        drum_magenta: e.drum_magenta ?? undefined,
        drum_yellow: e.drum_yellow ?? undefined,
        toner_black_in: e.toner_black_in ?? 0,
        toner_black_out: e.toner_black_out ?? 0,
        toner_cyan_in: e.toner_cyan_in ?? 0,
        toner_cyan_out: e.toner_cyan_out ?? 0,
        toner_magenta_in: e.toner_magenta_in ?? 0,
        toner_magenta_out: e.toner_magenta_out ?? 0,
        toner_yellow_in: e.toner_yellow_in ?? 0,
        toner_yellow_out: e.toner_yellow_out ?? 0,
        drum_black_in: e.drum_black_in ?? 0,
        drum_black_out: e.drum_black_out ?? 0,
        drum_cyan_in: e.drum_cyan_in ?? 0,
        drum_cyan_out: e.drum_cyan_out ?? 0,
        drum_magenta_in: e.drum_magenta_in ?? 0,
        drum_magenta_out: e.drum_magenta_out ?? 0,
        drum_yellow_in: e.drum_yellow_in ?? 0,
        drum_yellow_out: e.drum_yellow_out ?? 0,
        notes: e.notes ?? undefined,
        created_at: e.created_at ?? new Date().toISOString(),
      }));

      const paperStockEntries: PaperStockEntry[] = (paperEntriesRaw || []).map(p => ({
        id: p.id,
        contract_id: p.contract_id ?? '',
        technician_id: p.technician_id ?? '',
        entry_date: p.entry_date,
        reams_current: p.reams_current,
        reams_in: p.reams_in ?? 0,
        reams_out: p.reams_out ?? 0,
        notes: p.notes ?? undefined,
        created_at: p.created_at ?? new Date().toISOString(),
      }));

      const stockAlerts: StockAlert[] = (alertsRaw || []).map(a => ({
        id: a.id,
        contract_id: a.contract_id ?? '',
        contract_equipment_id: a.contract_equipment_id ?? undefined,
        alert_type: a.alert_type,
        current_value: a.current_value ?? 0,
        min_value: a.min_value ?? 0,
        triggered_at: a.triggered_at ?? new Date().toISOString(),
        resolved: a.resolved ?? false,
        notified_email: a.notified_email ?? false,
      }));

      set({
        contracts,
        users: (profiles || []) as Profile[],
        equipmentModels: (equipModels || []) as EquipmentModel[],
        contractEquipment,
        equipmentMinStock,
        equipmentStockEntries,
        paperStockEntries,
        stockAlerts,
        _hasHydrated: true,
      });
    } catch (err) {
      console.error('fetchInitialData error:', err);
      set({ _hasHydrated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  addContract: async (data) => {
    const { data: row, error } = await supabase
      .from('contracts')
      .insert({ name: data.name, client: data.client, code: data.code, active: data.active })
      .select()
      .single();
    if (error) throw error;
    const c: Contract = { ...row, active: row.active ?? true, created_at: row.created_at ?? new Date().toISOString(), technicianIds: [] };
    set(state => ({ contracts: [c, ...state.contracts] }));
  },

  updateContract: async (contract) => {
    const { error } = await supabase
      .from('contracts')
      .update({ name: contract.name, client: contract.client, code: contract.code, active: contract.active })
      .eq('id', contract.id);
    if (error) throw error;
    await supabase.from('contract_technicians').delete().eq('contract_id', contract.id);
    if (contract.technicianIds?.length > 0) {
      await supabase.from('contract_technicians').insert(
        contract.technicianIds.map(tid => ({ contract_id: contract.id, technician_id: tid }))
      );
    }
    set(state => ({ contracts: state.contracts.map(c => c.id === contract.id ? contract : c) }));
  },

  deleteContract: async (id) => {
    const { error } = await supabase.from('contracts').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ contracts: state.contracts.filter(c => c.id !== id) }));
  },

  addEquipmentToContract: async (data, minStock) => {
    const { data: row, error } = await supabase
      .from('contract_equipment')
      .insert({
        contract_id: data.contract_id,
        equipment_model_id: data.equipment_model_id,
        serial_number: data.serial_number,
        location: data.location,
        active: data.active,
      })
      .select()
      .single();
    if (error) throw error;
    const ce: ContractEquipment = {
      id: row.id,
      contract_id: row.contract_id ?? '',
      equipment_model_id: row.equipment_model_id ?? '',
      serial_number: row.serial_number ?? '',
      location: row.location ?? '',
      active: row.active ?? true,
      created_at: row.created_at ?? new Date().toISOString(),
    };
    set(state => ({ contractEquipment: [...state.contractEquipment, ce] }));
    if (minStock) {
      const { data: msRow } = await supabase
        .from('equipment_min_stock')
        .insert({ contract_equipment_id: ce.id, ...minStock })
        .select()
        .single();
      if (msRow) {
        const ms: EquipmentMinStock = {
          id: msRow.id, contract_equipment_id: ce.id,
          toner_black_min: msRow.toner_black_min ?? 0, toner_cyan_min: msRow.toner_cyan_min ?? 0,
          toner_magenta_min: msRow.toner_magenta_min ?? 0, toner_yellow_min: msRow.toner_yellow_min ?? 0,
          drum_black_min: msRow.drum_black_min ?? 0, drum_cyan_min: msRow.drum_cyan_min ?? 0,
          drum_magenta_min: msRow.drum_magenta_min ?? 0, drum_yellow_min: msRow.drum_yellow_min ?? 0,
        };
        set(state => ({ equipmentMinStock: [...state.equipmentMinStock, ms] }));
      }
    }
  },

  addUser: async (data) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password || 'RDY@2024!',
      options: { data: { name: data.name } },
    });
    if (authError) throw authError;
    if (!authData.user) throw new Error('Falha ao criar usuário');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: authData.user.id, name: data.name, email: data.email, role: data.role, active: data.active });
    if (profileError) throw profileError;
    const newProfile: Profile = {
      id: authData.user.id, name: data.name, email: data.email,
      role: data.role, active: data.active, created_at: new Date().toISOString(),
    };
    set(state => ({ users: [...state.users, newProfile] }));
  },

  updateUser: async (user) => {
    const { error } = await supabase
      .from('profiles')
      .update({ name: user.name, email: user.email, role: user.role, active: user.active })
      .eq('id', user.id);
    if (error) throw error;
    set(state => ({ users: state.users.map(u => u.id === user.id ? user : u) }));
  },

  addEquipmentModel: async (data) => {
    const { data: row, error } = await supabase
      .from('equipment_models')
      .insert({
        name: data.name, brand: data.brand,
        is_color: data.is_color ?? false, has_drum: data.has_drum ?? false,
        toner_black: data.toner_black, toner_cyan: data.toner_cyan,
        toner_magenta: data.toner_magenta, toner_yellow: data.toner_yellow,
        drum_black: data.drum_black, drum_cyan: data.drum_cyan,
        drum_magenta: data.drum_magenta, drum_yellow: data.drum_yellow,
        capacity_toner_black: data.capacity_toner_black, capacity_toner_cyan: data.capacity_toner_cyan,
        capacity_toner_magenta: data.capacity_toner_magenta, capacity_toner_yellow: data.capacity_toner_yellow,
        capacity_drum_black: data.capacity_drum_black, capacity_drum_cyan: data.capacity_drum_cyan,
        capacity_drum_magenta: data.capacity_drum_magenta, capacity_drum_yellow: data.capacity_drum_yellow,
      })
      .select()
      .single();
    if (error) throw error;
    set(state => ({ equipmentModels: [...state.equipmentModels, row as EquipmentModel] }));
  },

  updateEquipmentModel: async (model) => {
    const { error } = await supabase
      .from('equipment_models')
      .update({
        name: model.name, brand: model.brand,
        is_color: model.is_color, has_drum: model.has_drum,
        toner_black: model.toner_black, toner_cyan: model.toner_cyan,
        toner_magenta: model.toner_magenta, toner_yellow: model.toner_yellow,
        drum_black: model.drum_black, drum_cyan: model.drum_cyan,
        drum_magenta: model.drum_magenta, drum_yellow: model.drum_yellow,
        capacity_toner_black: model.capacity_toner_black, capacity_toner_cyan: model.capacity_toner_cyan,
        capacity_toner_magenta: model.capacity_toner_magenta, capacity_toner_yellow: model.capacity_toner_yellow,
        capacity_drum_black: model.capacity_drum_black, capacity_drum_cyan: model.capacity_drum_cyan,
        capacity_drum_magenta: model.capacity_drum_magenta, capacity_drum_yellow: model.capacity_drum_yellow,
      })
      .eq('id', model.id);
    if (error) throw error;
    set(state => ({ equipmentModels: state.equipmentModels.map(m => m.id === model.id ? model : m) }));
  },

  deleteEquipmentModel: async (id) => {
    const { error } = await supabase.from('equipment_models').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ equipmentModels: state.equipmentModels.filter(m => m.id !== id) }));
  },

  addStockEntry: async (data) => {
    const { data: row, error } = await supabase
      .from('equipment_stock_entries')
      .insert({
        contract_equipment_id: data.contract_equipment_id,
        technician_id: data.technician_id,
        entry_date: data.entry_date,
        toner_black: data.toner_black, toner_cyan: data.toner_cyan,
        toner_magenta: data.toner_magenta, toner_yellow: data.toner_yellow,
        drum_black: data.drum_black, drum_cyan: data.drum_cyan,
        drum_magenta: data.drum_magenta, drum_yellow: data.drum_yellow,
        toner_black_in: data.toner_black_in, toner_black_out: data.toner_black_out,
        toner_cyan_in: data.toner_cyan_in, toner_cyan_out: data.toner_cyan_out,
        toner_magenta_in: data.toner_magenta_in, toner_magenta_out: data.toner_magenta_out,
        toner_yellow_in: data.toner_yellow_in, toner_yellow_out: data.toner_yellow_out,
        drum_black_in: data.drum_black_in, drum_black_out: data.drum_black_out,
        drum_cyan_in: data.drum_cyan_in, drum_cyan_out: data.drum_cyan_out,
        drum_magenta_in: data.drum_magenta_in, drum_magenta_out: data.drum_magenta_out,
        drum_yellow_in: data.drum_yellow_in, drum_yellow_out: data.drum_yellow_out,
        notes: data.notes,
      })
      .select()
      .single();
    if (error) throw error;
    const entry: EquipmentStockEntry = { ...data, id: row.id, created_at: row.created_at ?? new Date().toISOString() };
    set(state => ({ equipmentStockEntries: [entry, ...state.equipmentStockEntries] }));
  },

  addPaperEntry: async (data) => {
    const { data: row, error } = await supabase
      .from('paper_stock_entries')
      .insert({
        contract_id: data.contract_id, technician_id: data.technician_id,
        entry_date: data.entry_date, reams_current: data.reams_current,
        reams_in: data.reams_in, reams_out: data.reams_out, notes: data.notes,
      })
      .select()
      .single();
    if (error) throw error;
    const entry: PaperStockEntry = { ...data, id: row.id, created_at: row.created_at ?? new Date().toISOString() };
    set(state => ({ paperStockEntries: [entry, ...state.paperStockEntries] }));
  },

  updateMinStock: async (contractEquipmentId, field, value) => {
    const existing = get().equipmentMinStock.find(ms => ms.contract_equipment_id === contractEquipmentId);
    if (existing) {
      await supabase.from('equipment_min_stock').update({ [field]: value }).eq('contract_equipment_id', contractEquipmentId);
      set(state => ({
        equipmentMinStock: state.equipmentMinStock.map(ms =>
          ms.contract_equipment_id === contractEquipmentId ? { ...ms, [field]: value } : ms
        ),
      }));
    } else {
      const { data: row, error } = await supabase
        .from('equipment_min_stock')
        .insert({ contract_equipment_id: contractEquipmentId, [field]: value })
        .select()
        .single();
      if (error) throw error;
      const ms: EquipmentMinStock = {
        id: row.id, contract_equipment_id: contractEquipmentId,
        toner_black_min: row.toner_black_min ?? 0, toner_cyan_min: row.toner_cyan_min ?? 0,
        toner_magenta_min: row.toner_magenta_min ?? 0, toner_yellow_min: row.toner_yellow_min ?? 0,
        drum_black_min: row.drum_black_min ?? 0, drum_cyan_min: row.drum_cyan_min ?? 0,
        drum_magenta_min: row.drum_magenta_min ?? 0, drum_yellow_min: row.drum_yellow_min ?? 0,
      };
      set(state => ({ equipmentMinStock: [...state.equipmentMinStock, ms] }));
    }
  },

  wipeDatabase: async () => {
    const NEVER = '00000000-0000-0000-0000-000000000000';
    await Promise.all([
      supabase.from('equipment_stock_entries').delete().neq('id', NEVER),
      supabase.from('paper_stock_entries').delete().neq('id', NEVER),
      supabase.from('stock_alerts').delete().neq('id', NEVER),
      supabase.from('equipment_min_stock').delete().neq('id', NEVER),
      supabase.from('contract_equipment').delete().neq('id', NEVER),
      supabase.from('contract_technicians').delete().neq('contract_id', NEVER),
      supabase.from('contracts').delete().neq('id', NEVER),
    ]);
    await get().fetchInitialData();
  },

  resetToDefaults: () => {
    get().fetchInitialData();
  },
}));
