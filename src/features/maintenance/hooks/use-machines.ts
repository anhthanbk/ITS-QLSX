import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMachines,
  fetchMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
  fetchMaintenanceMetrics,
  fetchMachineOptions,
  fetchProductionLines,
} from '../api/maintenance-api';
import type { MachineFilterParams } from '../types';
import type { MachineFormValues } from '../validation/maintenance-schemas';
import { useToast } from '@/components/feedback/use-toast';

export const MACHINES_QUERY_KEY = ['machines'] as const;
export const MAINTENANCE_METRICS_KEY = ['maintenance_metrics'] as const;
export const PRODUCTION_LINES_KEY = ['production_lines'] as const;

export function useMachines(params: MachineFilterParams) {
  return useQuery({
    queryKey: [
      ...MACHINES_QUERY_KEY,
      params.page,
      params.pageSize,
      params.search || '',
      params.status || 'all',
      params.departmentId || 'all',
    ],
    queryFn: () => fetchMachines(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useMachine(id: string | null | undefined) {
  return useQuery({
    queryKey: [...MACHINES_QUERY_KEY, 'detail', id],
    queryFn: () => (id ? fetchMachineById(id) : null),
    enabled: !!id,
  });
}

export function useMaintenanceMetrics() {
  return useQuery({
    queryKey: MAINTENANCE_METRICS_KEY,
    queryFn: fetchMaintenanceMetrics,
    staleTime: 30000,
  });
}

export function useMachineOptions() {
  return useQuery({
    queryKey: [...MACHINES_QUERY_KEY, 'options'],
    queryFn: fetchMachineOptions,
    staleTime: 60000,
  });
}

export function useProductionLines() {
  return useQuery({
    queryKey: PRODUCTION_LINES_KEY,
    queryFn: fetchProductionLines,
    staleTime: 60000,
  });
}

export function useCreateMachine() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: MachineFormValues) => createMachine(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_METRICS_KEY });
      success(`Đã thêm thiết bị "${data.name}" (${data.machine_code}) thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo thiết bị mới.');
    },
  });
}

export function useUpdateMachine() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<MachineFormValues> }) =>
      updateMachine(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_METRICS_KEY });
      success(`Đã cập nhật thiết bị "${data.name}" thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật thiết bị.');
    },
  });
}

export function useDeleteMachine() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteMachine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MACHINES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_METRICS_KEY });
      success('Đã xóa thiết bị thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa thiết bị.');
    },
  });
}
