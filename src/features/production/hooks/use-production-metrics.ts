import { useQuery } from '@tanstack/react-query';
import { fetchProductionMetrics } from '../api/production-api';
import type { ProductionMetrics, ProductionMetricsFilterParams } from '../types';

export function useProductionMetrics(params?: ProductionMetricsFilterParams) {
  return useQuery<ProductionMetrics, Error>({
    queryKey: ['production-metrics', params],
    queryFn: () => fetchProductionMetrics(params),
    staleTime: 30 * 1000,
  });
}

