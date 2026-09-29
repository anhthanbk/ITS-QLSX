import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GlobalLoaderProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({ isLoading, message, className }) => {
  if (!isLoading) return null;

  return (
    <div
      role="progressbar"
      aria-label="Đang tải dữ liệu"
      aria-busy="true"
      className={cn('pointer-events-none fixed inset-x-0 top-0 z-50', className)}
    >
      {/* Top indeterminate animated progress bar */}
      <div className="h-1 w-full overflow-hidden bg-primary/20">
        <div className="h-full w-full origin-left animate-progress bg-primary" />
      </div>

      {/* Floating pill badge when message is provided */}
      {message && (
        <div className="flex justify-center pt-3">
          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background/90 px-4 py-1.5 shadow-md backdrop-blur-md">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="text-xs font-medium text-foreground">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
