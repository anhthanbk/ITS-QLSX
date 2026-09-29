import { useContext } from 'react';
import { LoadingContext } from './loading-context';
import type { LoadingContextValue } from './loading-types';

export function useLoading(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
