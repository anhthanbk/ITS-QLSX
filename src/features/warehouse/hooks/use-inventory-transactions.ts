import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchInventoryTransactions,
  createInventoryTransaction,
  updateInventoryTransaction,
  deleteInventoryTransaction,
  createInventoryAdjustment,
} from '../api/warehouse-api';
import type { TransactionFilterParams } from '@/features/warehouse/types';
import type { TransactionFormValues, InventoryAdjustmentFormValues } from '../validation/warehouse-schemas';
import { STOCK_BALANCES_QUERY_KEY } from './use-stock-balances';
import { WAREHOUSE_METRICS_QUERY_KEY } from './use-warehouses';
import { useToast } from '@/components/feedback/use-toast';

export const INVENTORY_TRANSACTIONS_QUERY_KEY = ['inventory_transactions'] as const;

/**
 * Hook to fetch paginated inventory transactions
 */
export function useInventoryTransactions(params: TransactionFilterParams) {
  return useQuery({
    queryKey: [
      ...INVENTORY_TRANSACTIONS_QUERY_KEY,
      params.page,
      params.pageSize,
      params.search ?? '',
      params.warehouseId ?? 'all',
      params.transactionType ?? 'all',
      params.itemType ?? 'all',
      params.startDate ?? '',
      params.endDate ?? '',
    ],
    queryFn: () => fetchInventoryTransactions(params),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to create a new inventory transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: TransactionFormValues) =>
      createInventoryTransaction({
        warehouse_id: values.warehouse_id,
        item_type: values.item_type,
        item_id: values.item_id,
        transaction_type: values.transaction_type,
        quantity: values.quantity,
        unit_cost: values.unit_cost,
        notes: values.notes,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STOCK_BALANCES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_METRICS_QUERY_KEY });
      success(`Đã lập phiếu giao dịch "${data.transaction_number}" thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo giao dịch kho.');
    },
  });
}

/**
 * Hook to update an existing inventory transaction (admin / manager only)
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TransactionFormValues }) =>
      updateInventoryTransaction(id, {
        warehouse_id: values.warehouse_id,
        item_type: values.item_type,
        item_id: values.item_id,
        transaction_type: values.transaction_type,
        quantity: values.quantity,
        unit_cost: values.unit_cost,
        notes: values.notes,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STOCK_BALANCES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_METRICS_QUERY_KEY });
      success(`Đã cập nhật phiếu giao dịch "${data.transaction_number}" thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật giao dịch kho.');
    },
  });
}

/**
 * Hook to delete an inventory transaction (admin / manager only)
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteInventoryTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STOCK_BALANCES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_METRICS_QUERY_KEY });
      success('Đã xóa phiếu giao dịch kho và hoàn tác số dư tồn thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa phiếu giao dịch kho.');
    },
  });
}

/**
 * Hook to perform inventory adjustment
 */
export function useInventoryAdjustment() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: InventoryAdjustmentFormValues) =>
      createInventoryAdjustment({
        warehouse_id: values.warehouse_id,
        item_type: values.item_type,
        item_id: values.item_id,
        actual_quantity: values.actual_quantity,
        reason: values.reason,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INVENTORY_TRANSACTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: STOCK_BALANCES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_METRICS_QUERY_KEY });
      success(`Đã điều chỉnh kiểm kê (${data.transaction_number}) thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể thực hiện điều chỉnh kiểm kê.');
    },
  });
}
