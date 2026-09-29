import { useContext } from 'react';
import { LayoutContext } from './layout-context';
import type { LayoutContextValue } from './layout-types';

export function useLayout(): LayoutContextValue {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider or AppShell');
  }
  return context;
}
