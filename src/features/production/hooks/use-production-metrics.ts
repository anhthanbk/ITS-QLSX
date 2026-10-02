import { useQuery } from '@tanstack/react-query';
import { fetchProductionMetrics } from '../api/production-api';
import type { ProductionMetrics } from '../types';

export function useProductionMetrics() {
  return useQuery<ProductionMetrics, Error>({
    queryKey: ['production-metrics'],
    queryFn: fetchProductionMetrics,
    staleTime: 60 * 1000,
  });
}
