import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export interface ProtectedRouteProps {
  requiredPermission?: string;
  requiredPermissions?: string[];
  requiredRole?: string;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredPermission,
  requiredPermissions,
  requiredRole,
  children,
}) => {
  const { user, isLoading, hasPermission, hasAnyPermission, hasRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        id="auth-loading-screen"
        className="flex min-h-screen items-center justify-center bg-slate-50"
      >
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xs font-medium tracking-wide text-slate-500">
            Đang tải phiên xác thực...
          </p>
        </div>
      </div>
    );
  }

  // 1. Unauthenticated -> Redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Permission check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/forbidden" state={{ from: location, requiredPermission }} replace />;
  }

  // 3. Multi-permission check
  if (
    requiredPermissions &&
    requiredPermissions.length > 0 &&
    !hasAnyPermission(requiredPermissions)
  ) {
    return (
      <Navigate
        to="/forbidden"
        state={{ from: location, requiredPermission: requiredPermissions.join(' hoặc ') }}
        replace
      />
    );
  }

  // 4. Role check
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/forbidden" state={{ from: location, requiredRole }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
