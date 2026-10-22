import { useQuery } from '@tanstack/react-query';
import { fetchMaterialDashboardData } from '../api/warehouse-api';

export const MATERIAL_DASHBOARD_QUERY_KEY = ['material_dashboard'] as const;

/**
 * Hook to fetch aggregated data for Materials Inventory Dashboard
 */
export function useMaterialDashboardData() {
  return useQuery({
    queryKey: MATERIAL_DASHBOARD_QUERY_KEY,
    queryFn: fetchMaterialDashboardData,
    staleTime: 60 * 1000, // 1 minute
  });
}
