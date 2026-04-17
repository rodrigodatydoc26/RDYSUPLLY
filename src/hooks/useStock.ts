import { useDataStore } from '../store/useDataStore';

export const useStock = () => {
  const { stockAlerts, equipmentStockEntries } = useDataStore();
  return { stockAlerts, equipmentStockEntries };
};
