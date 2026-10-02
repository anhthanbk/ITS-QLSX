import { useQuery } from '@tanstack/react-query';
import { fetchMaintenanceSpareParts } from '../api/maintenance-api';
import type { MaintenanceSparePartFilterParams } from '../types';

export const SPARE_PARTS_QUERY_KEY = ['maintenance', 'spare_parts'] as const;

export function useMaintenanceSpareParts(params: MaintenanceSparePartFilterParams = {}) {
  return useQuery({
    queryKey: [
      ...SPARE_PARTS_QUERY_KEY,
      params.page ?? 1,
      params.pageSize ?? 20,
      params.search ?? '',
      params.status ?? 'all',
    ],
    queryFn: () => fetchMaintenanceSpareParts(params),
    placeholderData: (previousData) => previousData,
  });
}
