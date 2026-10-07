import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProductionLines,
  createProductionLine,
  updateProductionLine,
  deleteProductionLine,
} from '../api/production-api';
import type { ProductionLine } from '../types';
import { useToast } from '@/components/feedback/use-toast';

export function useProductionLines() {
  return useQuery<ProductionLine[], Error>({
    queryKey: ['production-lines'],
    queryFn: fetchProductionLines,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProductionLine() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: Omit<ProductionLine, 'id' | 'created_at' | 'updated_at'>) =>
      createProductionLine(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-lines'] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      success(`Đã thiết lập dây chuyền mới: ${data.name} (${data.code})`, 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo dây chuyền sản xuất.', 'Lỗi thiết lập dây chuyền');
    },
  });
}

export function useUpdateProductionLine() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Partial<Omit<ProductionLine, 'id' | 'created_at' | 'updated_at'>>;
    }) => updateProductionLine(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-lines'] });
      success(`Đã cập nhật thông tin dây chuyền ${data.name}.`, 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật dây chuyền sản xuất.', 'Lỗi cập nhật');
    },
  });
}

export function useDeleteProductionLine() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteProductionLine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-lines'] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['production-plans'] });
      success('Đã xóa dây chuyền sản xuất thành công.', 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa dây chuyền sản xuất.', 'Lỗi xóa dây chuyền');
    },
  });
}

