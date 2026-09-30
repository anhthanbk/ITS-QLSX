import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute default cache
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
      retry: 1,
      refetchOnWindowFocus: false, // Avoid duplicate background requests
    },
  },
});
