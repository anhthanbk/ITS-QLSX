import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchWorkOrders,
  createWorkOrder,
  updateWorkOrder,
  updateWorkOrderStatus,
  deleteWorkOrder,
  fetchTechnicianOptions,
} from '../api/maintenance-api';
import type { WorkOrderFilterParams } from '../types';
import type {
  WorkOrderFormValues,
  WorkOrderStatusUpdateValues,
} from '../validation/maintenance-schemas';
import { useToast } from '@/components/feedback/use-toast';
import { MAINTENANCE_METRICS_KEY, MACHINES_QUERY_KEY } from './use-machines';

export const WORK_ORDERS_QUERY_KEY = ['work_orders'] as const;
export const TECHNICIANS_QUERY_KEY = ['technicians'] as const;

export function useWorkOrders(params: WorkOrderFilterParams) {
  return useQuery({
    queryKey: [
      ...WORK_ORDERS_QUERY_KEY,
      params.page,
      params.pageSize,
      params.search || '',
      params.machineId || 'all',
      params.status || 'all',
      params.priority || 'all',
      params.type || 'all',
    ],
    queryFn: () => fetchWorkOrders(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useTechnicianOptions() {
  return useQuery({
    queryKey: TECHNICIANS_QUERY_KEY,
    queryFn: fetchTechnicianOptions,
    staleTime: 60000,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: WorkOrderFormValues) => createWorkOrder(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_METRICS_KEY });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEY });
      success(`Đã lập phiếu sửa chữa "${data.work_order_number}" thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo phiếu sửa chữa.');
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<WorkOrderFormValues> }) =>
      updateWorkOrder(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_METRICS_KEY });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEY });
      success(`Đã cập nhật phiếu "${data.work_order_number}".`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật phiếu sửa chữa.');
    },
  });
}

export function useUpdateWorkOrderStatus() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: WorkOrderStatusUpdateValues }) =>
      updateWorkOrderStatus(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_METRICS_KEY });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEY });
      success(`Đã cập nhật trạng thái phiếu "${data.work_order_number}".`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật trạng thái phiếu.');
    },
  });
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteWorkOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORK_ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_METRICS_KEY });
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEY });
      success('Đã xóa phiếu sửa chữa thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa phiếu sửa chữa.');
    },
  });
}
