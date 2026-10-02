import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMaintenancePlans,
  createMaintenancePlan,
  updateMaintenancePlan,
  deleteMaintenancePlan,
} from '../api/maintenance-api';
import type { MaintenancePlanFilterParams } from '../types';
import type { MaintenancePlanFormValues } from '../validation/maintenance-schemas';
import { useToast } from '@/components/feedback/use-toast';
import { MAINTENANCE_METRICS_KEY } from './use-machines';

export const MAINTENANCE_PLANS_QUERY_KEY = ['maintenance_plans'] as const;

export function useMaintenancePlans(params: MaintenancePlanFilterParams) {
  return useQuery({
    queryKey: [
      ...MAINTENANCE_PLANS_QUERY_KEY,
      params.page,
      params.pageSize,
      params.search || '',
      params.machineId || 'all',
      params.isActive ?? 'all',
    ],
    queryFn: () => fetchMaintenancePlans(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateMaintenancePlan() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: MaintenancePlanFormValues) => createMaintenancePlan(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_PLANS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_METRICS_KEY });
      success(`Đã tạo kế hoạch bảo dưỡng "${data.title}" (${data.plan_code}).`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo kế hoạch bảo dưỡng.');
    },
  });
}

export function useUpdateMaintenancePlan() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<MaintenancePlanFormValues> }) =>
      updateMaintenancePlan(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_PLANS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_METRICS_KEY });
      success(`Đã cập nhật kế hoạch "${data.title}".`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật kế hoạch bảo dưỡng.');
    },
  });
}

export function useDeleteMaintenancePlan() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteMaintenancePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_PLANS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_METRICS_KEY });
      success('Đã xóa kế hoạch bảo dưỡng thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa kế hoạch bảo dưỡng.');
    },
  });
}
