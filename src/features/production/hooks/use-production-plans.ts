import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProductionPlans,
  fetchProductionPlanById,
  fetchAnnualProductionPlan,
  saveAnnualProductionPlan,
  approveAnnualProductionPlan,
  deleteAnnualProductionPlan,
  createProductionPlan,
  updateProductionPlan,
  approveProductionPlan,
  deleteProductionPlan,
} from '../api/production-api';
import type { ProductionPlanFilterParams, AnnualPlanData } from '../types';
import type { ProductionPlanFormValues } from '../validation/production-schemas';
import { useToast } from '@/components/feedback/use-toast';

/** Query key prefix for the multi-line (aggregate) annual plan view. */
export const ALL_LINES_PLAN_KEY = 'annual-plans-all-lines-full';

export function useProductionPlans(params: ProductionPlanFilterParams) {
  return useQuery({
    queryKey: ['production-plans', params],
    queryFn: () => fetchProductionPlans(params),
    staleTime: 30 * 1000,
  });
}

export function useProductionPlanDetail(id: string | null) {
  return useQuery({
    queryKey: ['production-plan-detail', id],
    queryFn: () => (id ? fetchProductionPlanById(id) : null),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateProductionPlan() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: ProductionPlanFormValues) => createProductionPlan(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      success(`Đã tạo kế hoạch sản xuất: ${data.plan_code}`, 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo kế hoạch sản xuất.', 'Lỗi tạo kế hoạch');
    },
  });
}

export function useUpdateProductionPlan() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<ProductionPlanFormValues> }) =>
      updateProductionPlan(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-plan-detail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      success(`Đã cập nhật kế hoạch: ${data.plan_code}`, 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật kế hoạch sản xuất.', 'Lỗi cập nhật kế hoạch');
    },
  });
}

export function useApproveProductionPlan() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => approveProductionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-plan-detail'] });
      success('Kế hoạch sản xuất đã được phê duyệt.', 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể phê duyệt kế hoạch sản xuất.', 'Lỗi phê duyệt');
    },
  });
}

export function useDeleteProductionPlan() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteProductionPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      success('Đã xóa kế hoạch sản xuất thành công.', 'Đã xóa');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa kế hoạch sản xuất.', 'Lỗi xóa kế hoạch');
    },
  });
}

export function useAnnualProductionPlan(year: number, lineId: string) {
  return useQuery({
    queryKey: ['annual-production-plan', year, lineId],
    queryFn: () => fetchAnnualProductionPlan(year, lineId),
    enabled: !!lineId && year > 0,
    staleTime: 60 * 1000,
  });
}

export function useSaveAnnualProductionPlan() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (planData: AnnualPlanData) => saveAnnualProductionPlan(planData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['annual-production-plan', variables.year, variables.lineId],
      });
      queryClient.invalidateQueries({ queryKey: [ALL_LINES_PLAN_KEY, variables.year] });
      queryClient.invalidateQueries({ queryKey: ['production-plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      success(`Đã lưu kế hoạch sản xuất năm ${variables.year} thành công.`, 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể lưu kế hoạch sản xuất năm.', 'Lỗi lưu kế hoạch');
    },
  });
}

export function useApproveAnnualProductionPlan() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ year, lineId }: { year: number; lineId: string }) =>
      approveAnnualProductionPlan(year, lineId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['annual-production-plan', variables.year, variables.lineId],
      });
      queryClient.invalidateQueries({ queryKey: [ALL_LINES_PLAN_KEY, variables.year] });
      queryClient.invalidateQueries({ queryKey: ['production-plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      success(`Kế hoạch sản xuất năm ${variables.year} đã được phê duyệt.`, 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể phê duyệt kế hoạch sản xuất năm.', 'Lỗi phê duyệt');
    },
  });
}

export function useDeleteAnnualProductionPlan() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ year, lineId }: { year: number; lineId: string }) =>
      deleteAnnualProductionPlan(year, lineId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['annual-production-plan', variables.year, variables.lineId],
      });
      queryClient.invalidateQueries({ queryKey: [ALL_LINES_PLAN_KEY, variables.year] });
      queryClient.invalidateQueries({ queryKey: ['production-plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      success(`Đã xóa toàn bộ kế hoạch sản xuất năm ${variables.year} thành công.`, 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa kế hoạch sản xuất năm.', 'Lỗi xóa kế hoạch');
    },
  });
}

