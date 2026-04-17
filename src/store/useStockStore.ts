import { create } from 'zustand';

export interface SupplyType {
  id: string;
  name: string;
  category: 'toner' | 'paper';
  color?: string;
  minStock: number;
  currentStock: number;
}

export interface Contract {
  id: string;
  name: string;
  client: string;
  code: string;
  status: 'active' | 'inactive';
  supplies: SupplyType[];
}

interface StockState {
  contracts: Contract[];
  alerts: any[];
  isLoading: boolean;
  fetchContracts: () => Promise<void>;
}

export const useStockStore = create<StockState>((set) => ({
  contracts: [],
  alerts: [],
  isLoading: false,
  fetchContracts: async () => {
    set({ isLoading: true });
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockContracts: Contract[] = [
      {
        id: '1',
        name: 'Hospital Central',
        client: 'Rede D\'Or',
        code: 'CNT-001',
        status: 'active',
        supplies: [
          { id: 's1', name: 'Toner HP CF217A', category: 'toner', color: 'black', minStock: 5, currentStock: 2 },
          { id: 's2', name: 'Papel A4 - Resma', category: 'paper', minStock: 20, currentStock: 45 }
        ]
      },
      {
        id: '2',
        name: 'Escola Americana',
        client: 'Grupo SEB',
        code: 'CNT-002',
        status: 'active',
        supplies: [
          { id: 's3', name: 'Toner Lexmark MS310', category: 'toner', color: 'black', minStock: 3, currentStock: 8 }
        ]
      }
    ];

    set({ contracts: mockContracts, isLoading: false });
  }
}));
