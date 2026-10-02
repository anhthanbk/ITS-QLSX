import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProductsCatalog,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../api/warehouse-api';
import type { ProductCatalogFilterParams } from '@/features/warehouse/types';
import type { ProductFormValues } from '../validation/warehouse-schemas';
import { useToast } from '@/components/feedback/use-toast';
import { WAREHOUSE_METRICS_QUERY_KEY } from './use-warehouses';

export const PRODUCTS_CATALOG_QUERY_KEY = ['products_catalog'] as const;

/**
 * Hook to fetch paginated master catalog of products, finished goods & by-products
 */
export function useProductsCatalog(params: ProductCatalogFilterParams) {
  return useQuery({
    queryKey: [
      ...PRODUCTS_CATALOG_QUERY_KEY,
      params.page,
      params.pageSize,
      params.search ?? '',
      params.productType ?? 'all',
      params.status ?? 'all',
    ],
    queryFn: () => fetchProductsCatalog(params),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to create a product / finished good
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: ProductFormValues) => createProduct(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_CATALOG_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_METRICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['warehouse_items'] });
      success(`Đã thêm sản phẩm "${data.name}" (${data.sku}) thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo sản phẩm mới.');
    },
  });
}

/**
 * Hook to update an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: ProductFormValues }) =>
      updateProduct(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_CATALOG_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_METRICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['warehouse_items'] });
      success(`Đã cập nhật sản phẩm "${data.name}" (${data.sku}) thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật sản phẩm.');
    },
  });
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_CATALOG_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_METRICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['warehouse_items'] });
      success('Đã xóa sản phẩm khỏi danh mục thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa sản phẩm.');
    },
  });
}
