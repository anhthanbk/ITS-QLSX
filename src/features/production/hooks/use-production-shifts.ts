import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProductionShifts,
  fetchProductionShiftById,
  createProductionShift,
  updateProductionShift,
  verifyProductionShift,
  deleteProductionShift,
  createShiftDowntime,
  fetchShiftPlanContext,
} from '../api/production-api';
import type { ProductionShiftFilterParams } from '../types';
import type {
  ProductionShiftFormValues,
  ShiftDowntimeFormValues,
} from '../validation/production-schemas';
import { useToast } from '@/components/feedback/use-toast';

export function useShiftPlanContext(lineId: string, shiftDate: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['shift-plan-context', lineId, shiftDate],
    queryFn: () => fetchShiftPlanContext(lineId, shiftDate),
    enabled: enabled && !!lineId && !!shiftDate,
    staleTime: 60 * 1000,
  });
}

export function useProductionShifts(params: ProductionShiftFilterParams) {
  return useQuery({
    queryKey: ['production-shifts', params],
    queryFn: () => fetchProductionShifts(params),
    staleTime: 30 * 1000,
  });
}

export function useProductionShiftDetail(id: string | null) {
  return useQuery({
    queryKey: ['production-shift-detail', id],
    queryFn: () => (id ? fetchProductionShiftById(id) : null),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateProductionShift() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: ProductionShiftFormValues) => createProductionShift(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      success(`Đã ghi nhận ca sản xuất: ${data.shift_code}`, 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo bản ghi ca sản xuất.', 'Lỗi ghi nhận ca');
    },
  });
}

export function useUpdateProductionShift() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<ProductionShiftFormValues> }) =>
      updateProductionShift(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['production-shift-detail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      success(`Đã cập nhật ca: ${data.shift_code}`, 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật ca sản xuất.', 'Lỗi cập nhật');
    },
  });
}

export function useVerifyProductionShift() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => verifyProductionShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['production-shift-detail'] });
      success('Số liệu ca sản xuất đã được kiểm tra và xác nhận.', 'Đã xác nhận');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xác nhận ca sản xuất.', 'Lỗi xác nhận');
    },
  });
}

export function useDeleteProductionShift() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteProductionShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      success('Đã xóa bản ghi ca sản xuất.', 'Đã xóa');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa ca sản xuất.', 'Lỗi xóa ca');
    },
  });
}

export function useCreateShiftDowntime() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: ShiftDowntimeFormValues) => createShiftDowntime(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['production-shift-detail', data.shift_id] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      success(`Đã lưu sự cố dừng máy (${data.duration_minutes} phút).`, 'Ghi nhận dừng máy');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể thêm sự kiện dừng máy.', 'Lỗi ghi nhận dừng máy');
    },
  });
}

