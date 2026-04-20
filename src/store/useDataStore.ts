import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
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
  UserConfig,
  ContractSupply,
} from '../types';

interface DataState {
  contracts: Contract[];
  users: Profile[];
  equipmentModels: EquipmentModel[];
  contractEquipment: ContractEquipment[];
  equipmentMinStock: EquipmentMinStock[];
  contractSupplies: ContractSupply[];
  equipmentStockEntries: EquipmentStockEntry[];
  paperStockEntries: PaperStockEntry[];
  stockAlerts: StockAlert[];
  userConfigs: UserConfig[];
  isLoading: boolean;
  _hasHydrated: boolean;

  fetchInitialData: () => Promise<void>;
  setHasHydrated: (v: boolean) => void;

  addContract: (data: Omit<Contract, 'id' | 'created_at' | 'technicianIds'>) => Promise<Contract>;
  updateContract: (contract: Contract) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;
  addEquipmentToContract: (data: Omit<ContractEquipment, 'id' | 'created_at'>, minStock?: Omit<EquipmentMinStock, 'id' | 'contract_equipment_id'>) => Promise<void>;

  addUser: (data: Omit<Profile, 'id' | 'created_at'>) => Promise<void>;
  updateUser: (user: Profile, passwordChanged?: boolean) => Promise<void>;

  addEquipmentModel: (data: Omit<EquipmentModel, 'id' | 'created_at'>) => Promise<void>;
  updateEquipmentModel: (model: EquipmentModel) => Promise<void>;
  deleteEquipmentModel: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

   addStockEntry: (data: Omit<EquipmentStockEntry, 'id' | 'created_at'>) => Promise<void>;
  addPaperEntry: (data: Omit<PaperStockEntry, 'id' | 'created_at'>) => Promise<void>;
  updateUserConfig: (userId: string, data: Partial<UserConfig>) => Promise<void>;

  addContractSupply: (data: Omit<ContractSupply, 'id'>) => Promise<void>;
  removeContractSupply: (id: string) => Promise<void>;
  removeEquipmentFromContract: (id: string) => Promise<void>;
  updateContractTechnicians: (contractId: string, technicianIds: string[]) => Promise<void>;
  updateEquipmentMinStock: (contractEquipmentId: string, field: string, value: number) => Promise<void>;

  importEquipment: (data: Record<string, unknown>[]) => Promise<void>;
  importCatalogue: (data: Record<string, unknown>[]) => Promise<void>;
  importContracts: (data: Record<string, unknown>[]) => Promise<void>;
  importUsers: (data: Record<string, unknown>[]) => Promise<void>;

  wipeDatabase: () => Promise<void>;
  resetToDefaults: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  contracts: [],
  users: [],
  equipmentModels: [],
  contractEquipment: [],
  equipmentMinStock: [],
  contractSupplies: [],
  equipmentStockEntries: [],
  paperStockEntries: [],
  stockAlerts: [],
  userConfigs: [],
  isLoading: false,
  _hasHydrated: false,

  setHasHydrated: (v) => set({ _hasHydrated: v }),

  fetchInitialData: async () => {
    if (get()._hasHydrated || get().isLoading) return;
    set({ isLoading: true });
    
    try {
      const fetchTable = async (query: PromiseLike<{ data: any[] | null; error: { message: string } | null }>): Promise<any[]> => {
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return data ?? [];
      };

      const [
        contractsRaw,
        profiles,
        equipModels,
        ceRaw,
        minStockRaw,
        stockEntriesRaw,
        paperEntriesRaw,
        alertsRaw,
        contractTechs,
        configsRaw,
        csRaw,
      ] = await Promise.all([
        fetchTable(supabase.from('contracts').select('*').order('created_at', { ascending: false })),
        fetchTable(supabase.from('profiles').select('*').order('name')),
        fetchTable(supabase.from('equipment_models').select('*').order('name')),
        fetchTable(supabase.from('contract_equipment').select('*').order('created_at', { ascending: false })),
        fetchTable(supabase.from('equipment_min_stock').select('*')),
        fetchTable(supabase.from('equipment_stock_entries').select('*').order('created_at', { ascending: false }).limit(500)),
        fetchTable(supabase.from('paper_stock_entries').select('*').order('created_at', { ascending: false }).limit(200)),
        fetchTable(supabase.from('stock_alerts').select('*').eq('resolved', false).order('triggered_at', { ascending: false })),
        fetchTable(supabase.from('contract_technicians').select('*')),
        fetchTable(supabase.from('user_configs').select('*')),
        fetchTable(supabase.from('contract_supplies').select('*')),
      ]);

      const techMap = new Map<string, string[]>();
      for (const ct of contractTechs) {
        const arr = techMap.get(ct.contract_id) ?? [];
        arr.push(ct.technician_id);
        techMap.set(ct.contract_id, arr);
      }

      const contracts: Contract[] = contractsRaw.map((c: any) => ({
        ...c,
        active: c.active ?? true,
        created_at: c.created_at ?? new Date().toISOString(),
        technicianIds: techMap.get(c.id) ?? [],
      }));

      const contractEquipment: ContractEquipment[] = ceRaw.map((ce: any) => ({
        id: ce.id,
        contract_id: ce.contract_id ?? '',
        equipment_model_id: ce.equipment_model_id ?? '',
        serial_number: ce.serial_number ?? '',
        location: ce.location ?? '',
        active: ce.active ?? true,
        created_at: ce.created_at ?? new Date().toISOString(),
      }));

      const equipmentMinStock: EquipmentMinStock[] = minStockRaw.map((ms: any) => ({
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

      const equipmentStockEntries: EquipmentStockEntry[] = stockEntriesRaw.map((e: any) => ({
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

      const paperStockEntries: PaperStockEntry[] = paperEntriesRaw.map((p: any) => ({
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

      const stockAlerts: StockAlert[] = alertsRaw.map((a: any) => ({
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

      const contractSupplies: ContractSupply[] = csRaw.map((cs: any) => ({
        id: cs.id,
        contract_id: cs.contract_id,
        supply_type_id: cs.supply_type_id,
        min_stock: Number(cs.min_stock) || 0,
      }));

      set({
        contracts,
        users: profiles as Profile[],
        equipmentModels: equipModels as EquipmentModel[],
        contractEquipment,
        equipmentMinStock,
        contractSupplies,
        equipmentStockEntries,
        paperStockEntries,
        stockAlerts,
        userConfigs: configsRaw as UserConfig[],
        _hasHydrated: true,
      });
    } catch (err: unknown) {
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
    return c;
  },

  updateContract: async (contract) => {
    const { data: updated, error } = await supabase
      .from('contracts')
      .update({ name: contract.name, client: contract.client, code: contract.code, active: contract.active })
      .eq('id', contract.id)
      .select();
    if (error) throw error;
    if (!updated || updated.length === 0) throw new Error('Sem permissão para atualizar este contrato');
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
    // Custom storageKey isolates this client's BroadcastChannel from the main client.
    // Without this, signUp broadcasts a SIGNED_IN event that replaces the admin's session.
    const tempClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'sb-admin-user-creation' } },
    );
    const pass = data.password || 'RDY@2024!';
    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: data.email,
      password: pass,
      options: { data: { name: data.name, role: data.role } },
    });
    if (authError) {
      if (authError.message === 'User already registered') {
        throw new Error('Este email já está cadastrado. Use outro email.');
      }
      throw authError;
    }
    if (!authData.user) throw new Error('Falha ao criar usuário');

    // Fix: Supabase leaves NULL on nullable token columns which causes 500 on login.
    // Also auto-confirm the email so the user can log in immediately.
    await supabase.rpc('fix_user_tokens', { target_user_id: authData.user.id }).catch(() => {
      // Fallback: patch directly via SQL through a raw query if rpc not available
    });
    // Patch via direct SQL to ensure tokens are not NULL
    await supabase.from('profiles').select('id').eq('id', authData.user.id).single()
      .then(async () => {
        // Use a raw update on auth schema via a service-level call
        await supabase.rpc('admin_confirm_user', { user_id: authData.user.id }).catch(() => undefined);
      }).catch(() => undefined);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: authData.user.id, name: data.name, email: data.email, role: data.role, active: data.active, password: pass });
    if (profileError) throw profileError;

    const newProfile: Profile = {
      id: authData.user.id, name: data.name, email: data.email,
      role: data.role, active: data.active, password: pass, created_at: new Date().toISOString(),
    };
    set(state => ({ users: [...state.users, newProfile] }));
  },

  updateUser: async (user, passwordChanged = false) => {
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ name: user.name, email: user.email, role: user.role, active: user.active })
      .eq('id', user.id)
      .select();

    if (error) throw error;
    if (!updated || updated.length === 0) throw new Error('Sem permissão para atualizar este usuário');

    // Only update auth password if user explicitly changed it
    if (passwordChanged && user.password) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.id === user.id) {
        const { error: authError } = await supabase.auth.updateUser({ password: user.password });
        if (authError) throw authError;
      } else {
        const { error: fnError } = await supabase.functions.invoke('admin_update_password', {
          body: { userId: user.id, password: user.password },
        });
        if (fnError) throw new Error(`Troca de senha requer edge function: ${fnError.message}`);
      }
      await supabase.from('profiles').update({ password: user.password }).eq('id', user.id);
    } else if (passwordChanged === false && user.password) {
      // Save updated password to profiles table if changed (keeps plain text in sync)
      // but only update profiles, not auth
      await supabase.from('profiles').update({ password: user.password }).eq('id', user.id);
    }

    set(state => ({ users: state.users.map(u => u.id === user.id ? user : u) }));
  },

  deleteUser: async (id) => {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ users: state.users.filter(u => u.id !== id) }));
  },

  addEquipmentModel: async (data) => {
    const { data: rows, error } = await supabase
      .from('equipment_models')
      .insert({
        name: data.name, brand: data.brand, type: data.type,
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
      .select();

    if (error) throw error;
    if (rows && rows.length > 0) {
      set(state => ({ equipmentModels: [...state.equipmentModels, rows[0] as EquipmentModel] }));
    }
  },

  updateEquipmentModel: async (model) => {
    const { data: rows, error } = await supabase
      .from('equipment_models')
      .update({
        name: model.name, brand: model.brand, type: model.type,
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
      .eq('id', model.id)
      .select();

    if (error) throw error;
    if (!rows || rows.length === 0) throw new Error('Não foi possível confirmar a atualização');
    set(state => ({ equipmentModels: state.equipmentModels.map(m => m.id === model.id ? rows[0] : m) }));
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
        photo_data: data.photo_data,
      })
      .select()
      .single();
    if (error) throw error;
    const entry: EquipmentStockEntry = { ...data, id: row.id, created_at: row.created_at ?? new Date().toISOString() };
    
    // Check stock levels for alerts
    const minStock = get().equipmentMinStock.find(ms => ms.contract_equipment_id === data.contract_equipment_id);
    if (minStock) {
      const contractId = get().contractEquipment.find(ce => ce.id === data.contract_equipment_id)?.contract_id ?? '';
      const supplies = [
        { type: 'Toner Black', current: data.toner_black ?? 0, min: minStock.toner_black_min },
        { type: 'Toner Cyan', current: data.toner_cyan ?? 0, min: minStock.toner_cyan_min },
        { type: 'Toner Magenta', current: data.toner_magenta ?? 0, min: minStock.toner_magenta_min },
        { type: 'Toner Yellow', current: data.toner_yellow ?? 0, min: minStock.toner_yellow_min },
        { type: 'Drum Black', current: data.drum_black ?? 0, min: minStock.drum_black_min },
        { type: 'Drum Cyan', current: data.drum_cyan ?? 0, min: minStock.drum_cyan_min },
        { type: 'Drum Magenta', current: data.drum_magenta ?? 0, min: minStock.drum_magenta_min },
        { type: 'Drum Yellow', current: data.drum_yellow ?? 0, min: minStock.drum_yellow_min },
      ];

      const triggered = supplies.filter(s => s.min > 0 && s.current <= s.min);
      if (triggered.length > 0) {
        const results = await Promise.all(
          triggered.map(s =>
            supabase.from('stock_alerts').insert({
              contract_id: contractId,
              contract_equipment_id: data.contract_equipment_id,
              alert_type: s.type,
              current_value: s.current,
              min_value: s.min,
            }).select().single()
          )
        );
        const newAlerts: StockAlert[] = [];
        for (const { data: alertRow } of results) {
          if (alertRow) {
            newAlerts.push({
              id: alertRow.id,
              contract_id: alertRow.contract_id ?? '',
              contract_equipment_id: alertRow.contract_equipment_id ?? undefined,
              alert_type: alertRow.alert_type,
              current_value: alertRow.current_value ?? 0,
              min_value: alertRow.min_value ?? 0,
              triggered_at: alertRow.triggered_at ?? new Date().toISOString(),
              resolved: false,
              notified_email: false,
            });
            supabase.functions.invoke('send-stock-alert', {
              body: { alert_id: alertRow.id, technician_id: data.technician_id }
            }).catch(() => undefined);
          }
        }
        if (newAlerts.length > 0) {
          set(state => ({ stockAlerts: [...newAlerts, ...state.stockAlerts] }));
        }
      }
    }

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

  updateEquipmentMinStock: async (contractEquipmentId, field, value) => {
    const existing = get().equipmentMinStock.find(ms => ms.contract_equipment_id === contractEquipmentId);
    if (existing) {
      const { data: updated, error } = await supabase
        .from('equipment_min_stock')
        .update({ [field]: value })
        .eq('contract_equipment_id', contractEquipmentId)
        .select();
      if (error) throw error;
      if (!updated || updated.length === 0) throw new Error('Update bloqueado por RLS ou linha não encontrada');
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

  addContractSupply: async (data) => {
    const { data: row, error } = await supabase.from('contract_supplies').insert(data).select().single();
    if (error) throw error;
    set(state => ({ contractSupplies: [...state.contractSupplies, { ...data, id: row.id }] }));
  },

  removeContractSupply: async (id) => {
    const { error } = await supabase.from('contract_supplies').delete().eq('id', id);
    if (error) throw error;
    set(state => ({ contractSupplies: state.contractSupplies.filter(s => s.id !== id) }));
  },

  removeEquipmentFromContract: async (id) => {
    const { error } = await supabase.from('contract_equipment').delete().eq('id', id);
    if (error) throw error;
    set(state => ({
      contractEquipment: state.contractEquipment.filter(e => e.id !== id),
      equipmentMinStock: state.equipmentMinStock.filter(ms => ms.contract_equipment_id !== id),
    }));
  },

  updateContractTechnicians: async (contractId, technicianIds) => {
    const { error: delError } = await supabase.from('contract_technicians').delete().eq('contract_id', contractId);
    if (delError) throw delError;
    if (technicianIds.length > 0) {
      const { error: insError } = await supabase.from('contract_technicians').insert(
        technicianIds.map(tid => ({ contract_id: contractId, technician_id: tid }))
      );
      if (insError) throw insError;
    }
    set(state => ({
      contracts: state.contracts.map(c => 
        c.id === contractId ? { ...c, technicianIds } : c
      )
    }));
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
    set({
      contracts: [], contractEquipment: [], equipmentMinStock: [],
      equipmentStockEntries: [], paperStockEntries: [], stockAlerts: [],
      contractSupplies: [], _hasHydrated: true,
    });
  },

  updateUserConfig: async (userId, data) => {
    const { error } = await supabase
      .from('user_configs')
      .upsert({ user_id: userId, ...data }, { onConflict: 'user_id' });
    if (error) throw error;
    set(state => ({
      userConfigs: state.userConfigs.some(c => c.user_id === userId)
        ? state.userConfigs.map(c => c.user_id === userId ? { ...c, ...data } : c)
        : [...state.userConfigs, { user_id: userId, ...data } as UserConfig]
    }));
  },

  resetToDefaults: () => {
    set({ _hasHydrated: false });
    get().fetchInitialData();
  },

  importEquipment: async (data: Record<string, unknown>[]) => {
    const { contracts, equipmentModels } = get();
    const equipmentToInsert = [];
    const minStockToInsert = [];

    for (const row of data) {
      // Find contract by name or code
      const contract = contracts.find(c => 
        c.code === String(row.CONTRATO_CODIGO) || 
        c.name === String(row.CONTRATO_NOME)
      );
      if (!contract) continue;

      // Find model by name
      const model = equipmentModels.find(m => 
        m.name.toLowerCase() === String(row.MODELO).toLowerCase()
      );
      if (!model) continue;

      equipmentToInsert.push({
        contract_id: contract.id,
        equipment_model_id: model.id,
        serial_number: String(row.SERIAL),
        location: row.LOCALIZACAO || '',
        active: true
      });
    }

    if (equipmentToInsert.length === 0) throw new Error('Nenhum dado válido para importar');

    const { data: insertedCE, error } = await supabase
      .from('contract_equipment')
      .insert(equipmentToInsert)
      .select();

    if (error) throw error;

    // Create default min stock for imported machines
    if (insertedCE) {
      for (const ce of insertedCE) {
        minStockToInsert.push({
          contract_equipment_id: ce.id,
          toner_black_min: 2,
          toner_cyan_min: 0,
          toner_magenta_min: 0,
          toner_yellow_min: 0,
        });
      }
      const { data: msRows } = await supabase.from('equipment_min_stock').insert(minStockToInsert).select();
      const newCE: ContractEquipment[] = insertedCE.map(ce => ({
        id: ce.id, contract_id: ce.contract_id ?? '', equipment_model_id: ce.equipment_model_id ?? '',
        serial_number: ce.serial_number ?? '', location: ce.location ?? '',
        active: ce.active ?? true, created_at: ce.created_at ?? new Date().toISOString(),
      }));
      const newMS: EquipmentMinStock[] = (msRows || []).map(ms => ({
        id: ms.id, contract_equipment_id: ms.contract_equipment_id ?? '',
        toner_black_min: ms.toner_black_min ?? 2, toner_cyan_min: ms.toner_cyan_min ?? 0,
        toner_magenta_min: ms.toner_magenta_min ?? 0, toner_yellow_min: ms.toner_yellow_min ?? 0,
        drum_black_min: ms.drum_black_min ?? 0, drum_cyan_min: ms.drum_cyan_min ?? 0,
        drum_magenta_min: ms.drum_magenta_min ?? 0, drum_yellow_min: ms.drum_yellow_min ?? 0,
      }));
      set(state => ({
        contractEquipment: [...state.contractEquipment, ...newCE],
        equipmentMinStock: [...state.equipmentMinStock, ...newMS],
      }));
    }
  },

  importCatalogue: async (data) => {
    const modelsToInsert = data.map(row => ({
      brand: String(row.MARCA).toUpperCase(),
      name: String(row.MODELO),
      type: (row.TIPO as any) || 'equipment',
      is_color: String(row['COLOR(S/N)']).toUpperCase() === 'S',
      has_drum: String(row['CILINDRO(S/N)']).toUpperCase() === 'S',
      toner_black: row.TONER_BLACK || '',
      toner_cyan: row.TONER_CYAN || '',
      toner_magenta: row.TONER_MAGENTA || '',
      toner_yellow: row.TONER_YELLOW || '',
      drum_black: row.DRUM_BLACK || '',
      drum_cyan: row.DRUM_CYAN || '',
      drum_magenta: row.DRUM_MAGENTA || '',
      drum_yellow: row.DRUM_YELLOW || '',
    }));

    const { data: rows, error } = await supabase.from('equipment_models').insert(modelsToInsert).select();
    if (error) throw error;
    if (rows) set(state => ({ equipmentModels: [...state.equipmentModels, ...rows] }));
  },

  importContracts: async (data) => {
    const contractsToInsert = data.map(row => ({
      code: String(row.CODIGO || row.CODE || ''),
      name: String(row.NOME || row.NAME || ''),
      client: String(row.CLIENTE || row.CLIENT || ''),
      active: String(row.ATIVO || row.ACTIVE || 'S').toUpperCase() === 'S'
    }));
    const { data: rows, error } = await supabase.from('contracts').insert(contractsToInsert).select();
    if (error) throw error;
    if (rows) set(state => ({ contracts: [...state.contracts, ...rows] }));
  },

  importUsers: async (data) => {
    const usersToInsert = data.map(row => ({
      name: String(row.NOME || row.NAME || ''),
      email: String(row.EMAIL || ''),
      role: (row.CARGO || row.ROLE || 'technician') as any,
      active: String(row.ATIVO || row.ACTIVE || 'S').toUpperCase() === 'S',
      // Default password for imported users
      password: 'mudar123'
    }));

    for (const u of usersToInsert) {
      const { data: profile, error } = await supabase.auth.signUp({
        email: u.email,
        password: u.password,
        options: { data: { name: u.name, role: u.role } }
      });
      if (error) console.error(`Erro ao criar usuário ${u.email}:`, error);
    }
  },
}));
