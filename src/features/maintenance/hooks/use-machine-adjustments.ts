import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMachineAdjustments,
  createMachineAdjustment,
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
        queryKey: [...MACHINE_ADJUSTMENTS_QUERY_KEY, data.machine_id],
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
