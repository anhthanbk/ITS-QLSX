import { createContext } from 'react';
import type { LayoutContextValue } from './layout-types';

export const LayoutContext = createContext<LayoutContextValue | null>(null);
