import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchMaterialsCatalog,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from '../api/warehouse-api';
import type { MaterialCatalogFilterParams } from '@/features/warehouse/types';
import type { MaterialFormValues } from '../validation/warehouse-schemas';
import { useToast } from '@/components/feedback/use-toast';
import { WAREHOUSE_METRICS_QUERY_KEY } from './use-warehouses';

export const MATERIALS_CATALOG_QUERY_KEY = ['materials_catalog'] as const;

/**
 * Hook to fetch paginated master catalog of materials & spare parts
 */
export function useMaterialsCatalog(params: MaterialCatalogFilterParams) {
  return useQuery({
    queryKey: [
      ...MATERIALS_CATALOG_QUERY_KEY,
      params.page,
      params.pageSize,
      params.search ?? '',
      params.category ?? 'all',
    ],
    queryFn: () => fetchMaterialsCatalog(params),
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to create a material
 */
export function useCreateMaterial() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: MaterialFormValues) => createMaterial(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_CATALOG_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_METRICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'spare_parts'] });
      success(`Đã thêm vật tư "${data.name}" (${data.code}) thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo vật tư mới.');
    },
  });
}

/**
 * Hook to update a material
 */
export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: MaterialFormValues }) =>
      updateMaterial(id, values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_CATALOG_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_METRICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'spare_parts'] });
      success(`Đã cập nhật vật tư "${data.name}" (${data.code}) thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể cập nhật vật tư.');
    },
  });
}

/**
 * Hook to delete a material
 */
export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteMaterial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MATERIALS_CATALOG_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_METRICS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'spare_parts'] });
      success('Đã xóa vật tư khỏi danh mục thành công.');
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể xóa vật tư.');
    },
  });
}
