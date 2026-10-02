import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWarehouses,
  fetchWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  fetchWarehouseMetrics,
  fetchWarehouseManagerOptions,
} from '../api/warehouse-api';
import type { WarehouseFilterParams } from '@/features/warehouse/types';
import type { WarehouseFormValues } from '../validation/warehouse-schemas';
import { useToast } from '@/components/feedback/use-toast';

export const WAREHOUSES_QUERY_KEY = ['warehouses'] as const;
export const WAREHOUSE_METRICS_QUERY_KEY = ['warehouse_metrics'] as const;
export const WAREHOUSE_MANAGERS_QUERY_KEY = ['warehouse_managers'] as const;

/**
 * Hook to fetch paginated list of warehouses
 */
export function useWarehouses(params: WarehouseFilterParams) {
  return useQuery({
    queryKey: [
      ...WAREHOUSES_QUERY_KEY,
      params.page,
      params.pageSize,
      params.search ?? '',
      params.warehouseType ?? 'all',
      params.status ?? 'all',
    ],
    queryFn: () => fetchWarehouses(params),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch a single warehouse by ID
 */
export function useWarehouse(id: string | null | undefined) {
  return useQuery({
    queryKey: [...WAREHOUSES_QUERY_KEY, 'detail', id],
    queryFn: () => (id ? fetchWarehouseById(id) : null),
    enabled: !!id,
  });
}

/**
 * Hook to fetch warehouse metrics
 */
export function useWarehouseMetrics() {
  return useQuery({
    queryKey: WAREHOUSE_METRICS_QUERY_KEY,
    queryFn: fetchWarehouseMetrics,
  });
}

/**
 * Hook to fetch manager options
 */
export function useWarehouseManagerOptions() {
  return useQuery({
    queryKey: WAREHOUSE_MANAGERS_QUERY_KEY,
    queryFn: fetchWarehouseManagerOptions,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a warehouse
 */
export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: WarehouseFormValues) =>
      createWarehouse({
        code: values.code,
        name: values.name,
        warehouse_type: values.warehouse_type,
        location: values.location,
        manager_employee_id: values.manager_employee_id || null,
        status: values.status,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_METRICS_QUERY_KEY });
      success(`Đã thêm kho "${data.name}" (${data.code}) thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo kho mới.');
    },
  });
}

/**
 * Hook to update a warehouse
 */
export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<WarehouseFormValues> }) =>
      updateWarehouse(id, {
        code: values.code,
        name: values.name,
        warehouse_type: values.warehouse_type,
        location: values.location,
        manager_employee_id: values.manager_employee_id,
        status: values.status,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_METRICS_QUERY_KEY });
      success(`Đã cập nhật kho "${data.name}" thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật kho.');
    },
  });
}

/**
 * Hook to delete a warehouse
 */
export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_METRICS_QUERY_KEY });
      success('Đã xóa kho thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa kho.');
    },
  });
}
