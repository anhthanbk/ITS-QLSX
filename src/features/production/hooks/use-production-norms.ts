import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTechnoEconomicNorms,
  createTechnoEconomicNorm,
  updateTechnoEconomicNorm,
  deleteTechnoEconomicNorm,
} from '../api/production-api';
import type { ProductionNormFilterParams } from '../types';
import type { TechnoEconomicNormFormValues } from '../validation/production-schemas';
import { useToast } from '@/components/feedback/use-toast';

export function useProductionNorms(params: ProductionNormFilterParams) {
  return useQuery({
    queryKey: ['production-norms', params],
    queryFn: () => fetchTechnoEconomicNorms(params),
    staleTime: 30 * 1000,
  });
}

export function useCreateProductionNorm() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: TechnoEconomicNormFormValues) => createTechnoEconomicNorm(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-norms'] });
      success(`Đã tạo định mức kinh tế kỹ thuật: ${data.norm_code}`, 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo định mức.', 'Lỗi tạo định mức');
    },
  });
}

export function useUpdateProductionNorm() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<TechnoEconomicNormFormValues> }) =>
      updateTechnoEconomicNorm(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-norms'] });
      success(`Đã cập nhật định mức: ${data.norm_code}`, 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật định mức.', 'Lỗi cập nhật');
    },
  });
}

export function useDeleteProductionNorm() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteTechnoEconomicNorm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-norms'] });
      success('Đã xóa định mức kỹ thuật thành công.', 'Đã xóa');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa định mức.', 'Lỗi xóa định mức');
    },
  });
}
