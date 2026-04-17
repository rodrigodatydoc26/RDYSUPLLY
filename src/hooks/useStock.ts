import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { useMemo } from 'react';
import type { StockEntry } from '../types';

export const useStock = () => {
  const { stockEntries, addStockEntry, contractSupplies, contracts, supplyTypes } = useDataStore();
  const { user } = useAuthStore();

  const getAlerts = useMemo(() => {
    return stockEntries.filter(entry => {
      const relation = contractSupplies.find(
        cs => cs.contract_id === entry.contract_id && cs.supply_type_id === entry.supply_type_id
      );
      return relation && entry.current_stock <= relation.min_stock;
    }).map(alert => ({
      ...alert,
      contractName: contracts.find(c => c.id === alert.contract_id)?.name || 'Contrato',
      supplyName: supplyTypes.find(s => s.id === alert.supply_type_id)?.name || 'Insumo',
    }));
  }, [stockEntries, contractSupplies, contracts, supplyTypes]);

  const submitEntry = (entry: Omit<StockEntry, 'id' | 'created_at' | 'technician_id'>) => {
    if (!user) return;
    addStockEntry({
      ...entry,
      technician_id: user.id
    });
  };

  return {
    stockEntries,
    alerts: getAlerts,
    submitEntry,
  };
};
