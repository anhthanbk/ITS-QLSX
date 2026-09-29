import React from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps {
  title?: string;
  description?: string;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  fluid?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  fluid = false,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        'w-full p-4 sm:p-6 lg:p-8',
        !fluid && 'mx-auto max-w-7xl',
        className,
      )}
    >
      {/* Breadcrumb slot if passed or page-level */}
      {breadcrumbs && <div className="mb-3">{breadcrumbs}</div>}

      {/* Header section if title or actions are provided */}
      {(title || actions) && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
        </div>
      )}

      {/* Main page content */}
      <main className="w-full">{children}</main>
    </div>
  );
};
