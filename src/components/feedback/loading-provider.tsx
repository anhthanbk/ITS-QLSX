import React, { useState, useCallback, useMemo } from 'react';
import { LoadingContext } from './loading-context';
import { GlobalLoader } from './global-loader';

export interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState<number>(0);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const startLoading = useCallback((msg?: string) => {
    setLoadingCount((count) => count + 1);
    if (msg) setMessage(msg);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount((count) => Math.max(0, count - 1));
    setMessage(undefined);
  }, []);

  const isLoading = loadingCount > 0;

  const value = useMemo(
    () => ({
      isLoading,
      message,
      startLoading,
      stopLoading,
    }),
    [isLoading, message, startLoading, stopLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      <GlobalLoader isLoading={isLoading} message={message} />
      {children}
    </LoadingContext.Provider>
  );
};
