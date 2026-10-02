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
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      if (res?.mode === 'terminated') {
        success('Đã hủy tài khoản đăng nhập và chuyển trạng thái nhân viên sang Đã nghỉ việc để bảo toàn lịch sử dữ liệu.');
      } else {
        success('Đã xóa hoàn toàn nhân viên và hủy tài khoản đăng nhập thành công.');
      }
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa nhân viên.');
    },
  });
}

export const PENDING_REGISTRATIONS_KEY = ['pending_registrations'] as const;

export function usePendingRegistrations() {
  return useQuery({
    queryKey: PENDING_REGISTRATIONS_KEY,
    queryFn: () => import('../api/hr-api').then((m) => m.fetchPendingRegistrations()),
    staleTime: 30 * 1000,
  });
}

export function useApproveRegistration() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (params: import('../types').ApproveRegistrationParams) =>
      import('../api/hr-api').then((m) => m.approveRegistration(params)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PENDING_REGISTRATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
      success(`Đã duyệt hồ sơ và tạo mã nhân viên ${data.employee_code} thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể phê duyệt hồ sơ đăng ký.');
    },
  });
}

export function useRejectRegistration() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (params: import('../types').RejectRegistrationParams) =>
      import('../api/hr-api').then((m) => m.rejectRegistration(params)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_REGISTRATIONS_KEY });
      success('Đã từ chối hồ sơ đăng ký.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể từ chối hồ sơ.');
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

export function useDeleteRegistrationProfile() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (profileId: string) =>
      import('../api/hr-api').then((m) => m.deleteRegistrationProfile(profileId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_REGISTRATIONS_KEY });
      success('Đã xóa vĩnh viễn hồ sơ và tài khoản đăng ký thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa hồ sơ đăng ký.');
    },
  });
}


