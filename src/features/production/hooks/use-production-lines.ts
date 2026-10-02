import { useQuery } from '@tanstack/react-query';
import { fetchProductionLines } from '../api/production-api';
import type { ProductionLine } from '../types';

export function useProductionLines() {
  return useQuery<ProductionLine[], Error>({
    queryKey: ['production-lines'],
    queryFn: fetchProductionLines,
    staleTime: 5 * 60 * 1000,
  });
}
