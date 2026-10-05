import { useQuery } from '@tanstack/react-query';
import { fetchProductionMetrics } from '../api/production-api';
import type { ProductionMetrics, ProductionMetricsFilterParams } from '../types';

export function useProductionMetrics(params?: ProductionMetricsFilterParams) {
  return useQuery<ProductionMetrics, Error>({
    queryKey: ['production-metrics', params?.lineId ?? 'all', params?.year, params?.month],
    queryFn: () => fetchProductionMetrics(params),
    staleTime: 60 * 1000,
  });
}

