import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../api/hr-api';
import type { DepartmentFormValues } from '../validation/hr-schemas';
import { useToast } from '@/components/feedback/use-toast';

export const DEPARTMENTS_QUERY_KEY = ['departments'] as const;

export function useDepartments() {
  return useQuery({
    queryKey: DEPARTMENTS_QUERY_KEY,
    queryFn: fetchDepartments,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: DepartmentFormValues) => createDepartment(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY });
      success(`Đã thêm phòng ban "${data.name}" thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo phòng ban.');
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: DepartmentFormValues }) =>
      updateDepartment(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY });
      success(`Đã cập nhật phòng ban "${data.name}" thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật phòng ban.');
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_QUERY_KEY });
      success('Đã xóa phòng ban thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa phòng ban.');
    },
  });
}

