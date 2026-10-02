import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMachineAdjustments,
  createMachineAdjustment,
  updateMachineAdjustment,
  deleteMachineAdjustment,
} from '../api/maintenance-api';
import type { MachineAdjustmentFilterParams } from '../types';
import type { MachineAdjustmentFormValues } from '../validation/maintenance-schemas';
import { useToast } from '@/components/feedback/use-toast';
import { MACHINES_QUERY_KEY, MAINTENANCE_METRICS_KEY } from './use-machines';

export const MACHINE_ADJUSTMENTS_QUERY_KEY = ['machine_adjustments'] as const;

export function useMachineAdjustments(params: MachineAdjustmentFilterParams = {}) {
  return useQuery({
    queryKey: [
      ...MACHINE_ADJUSTMENTS_QUERY_KEY,
      params.machineId || 'all',
      params.search || '',
      params.page ?? 1,
      params.pageSize ?? 20,
    ],
    queryFn: () => fetchMachineAdjustments(params),
  });
}

export function useCreateMachineAdjustment() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: MachineAdjustmentFormValues) => createMachineAdjustment(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: MACHINE_ADJUSTMENTS_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: [...MACHINES_QUERY_KEY, 'detail', data.machine_id],
      });
      queryClient.invalidateQueries({
        queryKey: MACHINES_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: MAINTENANCE_METRICS_KEY,
      });
      success('Đã lưu nhật ký điều chỉnh, cải tiến thiết bị thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể lưu nhật ký điều chỉnh thiết bị.');
    },
  });
}

export function useUpdateMachineAdjustment() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<MachineAdjustmentFormValues> }) =>
      updateMachineAdjustment(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: MACHINE_ADJUSTMENTS_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: [...MACHINES_QUERY_KEY, 'detail', data.machine_id],
      });
      queryClient.invalidateQueries({
        queryKey: MACHINES_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: MAINTENANCE_METRICS_KEY,
      });
      success('Đã cập nhật nhật ký điều chỉnh, cải tiến thiết bị thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật nhật ký điều chỉnh thiết bị.');
    },
  });
}

export function useDeleteMachineAdjustment() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteMachineAdjustment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: MACHINE_ADJUSTMENTS_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: MACHINES_QUERY_KEY,
      });
      queryClient.invalidateQueries({
        queryKey: MAINTENANCE_METRICS_KEY,
      });
      success('Đã xóa bản ghi điều chỉnh, cải tiến thiết bị thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa bản ghi điều chỉnh thiết bị.');
    },
  });
}
