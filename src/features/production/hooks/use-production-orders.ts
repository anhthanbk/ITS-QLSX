import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProductionOrders,
  fetchProductionBatches,
  createProductionOrder,
  updateProductionOrder,
  deleteProductionOrder,
  createProductionBatch,
} from '../api/production-api';
import type { ProductionOrderFilterParams } from '../types';
import type {
  ProductionOrderFormValues,
  ProductionBatchFormValues,
} from '../validation/production-schemas';
import { useToast } from '@/components/feedback/use-toast';

export function useProductionOrders(params: ProductionOrderFilterParams) {
  return useQuery({
    queryKey: ['production-orders', params],
    queryFn: () => fetchProductionOrders(params),
    staleTime: 30 * 1000,
  });
}

export function useProductionBatches(orderId: string | null) {
  return useQuery({
    queryKey: ['production-batches', orderId],
    queryFn: () => (orderId ? fetchProductionBatches(orderId) : []),
    enabled: !!orderId,
    staleTime: 30 * 1000,
  });
}

export function useCreateProductionOrder() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: ProductionOrderFormValues) => createProductionOrder(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      success(`Đã tạo lệnh sản xuất: ${data.order_number}`, 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo lệnh sản xuất.', 'Lỗi tạo lệnh');
    },
  });
}

export function useUpdateProductionOrder() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<ProductionOrderFormValues> }) =>
      updateProductionOrder(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      success(`Đã cập nhật lệnh sản xuất: ${data.order_number}`, 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật lệnh sản xuất.', 'Lỗi cập nhật');
    },
  });
}

export function useDeleteProductionOrder() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteProductionOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['production-metrics'] });
      success('Đã xóa lệnh sản xuất thành công.', 'Đã xóa');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa lệnh sản xuất.', 'Lỗi xóa lệnh');
    },
  });
}

export function useCreateProductionBatch() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: ProductionBatchFormValues) => createProductionBatch(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['production-batches', data.production_order_id],
      });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      success(`Đã tạo lô sản xuất: ${data.batch_number}`, 'Thành công');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo lô sản xuất.', 'Lỗi tạo lô');
    },
  });
}
