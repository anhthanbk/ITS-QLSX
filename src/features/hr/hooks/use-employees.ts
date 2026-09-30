import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEmployees,
  fetchEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../api/hr-api';
import type { EmployeeFilterParams } from '../types';
import type { EmployeeFormValues } from '../validation/hr-schemas';
import { useToast } from '@/components/feedback/use-toast';

export const EMPLOYEES_QUERY_KEY = ['employees'] as const;

export function useEmployees(params: EmployeeFilterParams) {
  return useQuery({
    queryKey: [
      ...EMPLOYEES_QUERY_KEY,
      params.page,
      params.pageSize,
      params.search || '',
      params.departmentId || 'all',
      params.positionId || 'all',
      params.status || 'all',
    ],
    queryFn: () => fetchEmployees(params),
    placeholderData: (previousData) => previousData, // smooth pagination transition
  });
}

export function useEmployee(id: string | null | undefined) {
  return useQuery({
    queryKey: [...EMPLOYEES_QUERY_KEY, 'detail', id],
    queryFn: () => (id ? fetchEmployeeById(id) : null),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: EmployeeFormValues) => createEmployee(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      success(`Đã thêm nhân viên ${data.first_name} ${data.last_name} (${data.employee_code}).`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo nhân viên.');
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: EmployeeFormValues }) =>
      updateEmployee(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      success(`Đã cập nhật nhân viên ${data.first_name} ${data.last_name}.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật nhân viên.');
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      success('Đã xóa nhân viên thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa nhân viên (có thể đang có dữ liệu tham chiếu).');
    },
  });
}
