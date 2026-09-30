import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPositions, createPosition } from '../api/hr-api';
import type { PositionFormValues } from '../validation/hr-schemas';
import { useToast } from '@/components/feedback/use-toast';

export const POSITIONS_QUERY_KEY = ['positions'] as const;

export function usePositions(departmentId?: string) {
  return useQuery({
    queryKey: [...POSITIONS_QUERY_KEY, departmentId || 'all'],
    queryFn: () => fetchPositions(departmentId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePosition() {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (values: PositionFormValues) => createPosition(values),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: POSITIONS_QUERY_KEY });
      success(`Đã thêm chức danh "${data.title}" thành công.`);
    },
    onError: (err: Error) => {
      error(err.message || 'Không thể tạo chức danh.');
    },
  });
}
