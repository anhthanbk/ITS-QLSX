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

export function useProvisionAccount() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (params: import('../types').ProvisionAccountParams) =>
      import('../api/hr-api').then((m) => m.provisionEmployeeAccount(params)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      success(`Đã cấp tài khoản (${data.email}) cho nhân viên thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cấp tài khoản cho nhân viên.');
    },
  });
}

export function useUnlinkAccount() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (employeeId: string) =>
      import('../api/hr-api').then((m) => m.unlinkEmployeeAccount(employeeId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      success('Đã hủy liên kết tài khoản khỏi nhân viên.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể hủy liên kết tài khoản.');
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'suspended' }) =>
      import('../api/hr-api').then((m) => m.toggleUserStatus(userId, status)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      success(
        variables.status === 'active'
          ? 'Đã mở khóa tài khoản người dùng.'
          : 'Đã tạm khóa tài khoản người dùng.',
      );
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể thay đổi trạng thái tài khoản.');
    },
  });
}

export function useChangeUserRole() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ userId, roleCode }: { userId: string; roleCode: string }) =>
      import('../api/hr-api').then((m) => m.changeUserRole(userId, roleCode)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      success('Đã cập nhật vai trò hệ thống thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể thay đổi vai trò.');
    },
  });
}

export function useResetUserPassword() {
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      import('../api/hr-api').then((m) => m.resetUserPassword(userId, newPassword)),
    onSuccess: () => {
      success('Đã đặt lại mật khẩu mới cho tài khoản thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể đặt lại mật khẩu.');
    },
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['system-roles'],
    queryFn: () => import('../api/hr-api').then((m) => m.fetchRoles()),
    staleTime: 60 * 60 * 1000,
  });
}

