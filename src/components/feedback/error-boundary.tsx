import React, { Component, type ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; reset: () => void }) => ReactNode);
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production, report to error tracking (e.g. Sentry / Datadog)
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    this.handleReset();
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error,
            reset: this.handleReset,
          });
        }
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/60">
            <AlertOctagon className="h-7 w-7 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100">
            Đã xảy ra sự cố không mong muốn
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-slate-600 dark:text-slate-400">
            Hệ thống đã ghi nhận lỗi này. Bạn có thể thử tải lại thành phần hoặc quay trở về bảng
            điều khiển chính.
          </p>

          {this.state.error.message && (
            <div className="mt-4 max-w-lg rounded-lg border border-red-200 bg-red-50/50 p-3 text-left dark:border-red-900/50 dark:bg-red-950/30">
              <p className="font-mono text-xs text-red-800 dark:text-red-300">
                {this.state.error.message}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Thử lại
            </Button>
            <Button size="sm" onClick={this.handleGoHome} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Về trang chủ
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
