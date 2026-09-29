import { createContext } from 'react';
import type { LoadingContextValue } from './loading-types';

export const LoadingContext = createContext<LoadingContextValue | null>(null);
