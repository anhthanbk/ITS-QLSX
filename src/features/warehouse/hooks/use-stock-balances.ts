import { useQuery } from '@tanstack/react-query';
import { fetchStockBalances, fetchItemOptions, fetchItemAggregatedStockBalances } from '../api/warehouse-api';
import type { StockBalanceFilterParams } from '@/features/warehouse/types';

export const STOCK_BALANCES_QUERY_KEY = ['stock_balances'] as const;
export const ITEM_OPTIONS_QUERY_KEY = ['item_options'] as const;
export const ITEM_AGGREGATED_BALANCES_QUERY_KEY = ['item_aggregated_stock_balances'] as const;

/**
 * Hook to fetch paginated inventory stock balance
 */
export function useStockBalances(params: StockBalanceFilterParams) {
  return useQuery({
    queryKey: [
      ...STOCK_BALANCES_QUERY_KEY,
      params.page,
      params.pageSize,
      params.search ?? '',
      params.warehouseId ?? 'all',
      params.itemType ?? 'all',
    ],
    queryFn: () => fetchStockBalances(params),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch materials and products for select options
 */
export function useItemOptions() {
  return useQuery({
    queryKey: ITEM_OPTIONS_QUERY_KEY,
    queryFn: fetchItemOptions,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch company-wide aggregated stock balance by material/item
 */
export function useItemAggregatedStockBalances() {
  return useQuery({
    queryKey: ITEM_AGGREGATED_BALANCES_QUERY_KEY,
    queryFn: fetchItemAggregatedStockBalances,
  });
}
