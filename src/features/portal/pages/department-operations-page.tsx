import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PORTAL_DEPARTMENT_GROUPS, type PortalDepartmentGroup, type PortalFunctionItem } from '../portal-data';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { cn } from '@/lib/utils';

interface DepartmentOperationsPageProps {
  departmentId?: string;
}

export const DepartmentOperationsPage: React.FC<DepartmentOperationsPageProps> = ({
  departmentId,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole, hasPermission } = useAuth();

  // Find department by prop or pathname
  const department: PortalDepartmentGroup | undefined = React.useMemo(() => {
    if (departmentId) {
      return PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === departmentId);
    }
    const path = location.pathname;
    if (path.startsWith('/production')) {
      return PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'production');
    }
    if (path.startsWith('/warehouse')) {
      return PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'warehouse');
    }
    if (path.startsWith('/maintenance')) {
      return PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'maintenance');
    }
    if (path.startsWith('/sales') || path.startsWith('/procurement')) {
      return PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'sales');
    }
    if (path.startsWith('/hr')) {
      return PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'hr');
    }
    if (path.startsWith('/system') || path.startsWith('/admin')) {
      return PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'system');
    }
    return undefined;
  }, [departmentId, location.pathname]);

  if (!department) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Không tìm thấy thông tin phòng ban.
      </div>
    );
  }

  // Filter functions by user authorization
  const allowedFunctions = department.functions.filter((fn) => {
    if (fn.requiredRole) {
      const roles = Array.isArray(fn.requiredRole) ? fn.requiredRole : [fn.requiredRole];
      if (!roles.some((r) => hasRole(r))) return false;
    }
    if (fn.requiredPermission) {
      const perms = Array.isArray(fn.requiredPermission)
        ? fn.requiredPermission
        : [fn.requiredPermission];
      if (!perms.some((p) => hasPermission(p))) return false;
    }
    return true;
  });

  return (
    <div className="w-full px-3 py-3 sm:px-6 sm:py-4 animate-in fade-in duration-150">
      {/* Grid of Minimal Operation Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
        {allowedFunctions.map((fn: PortalFunctionItem) => {
          const FnIcon = fn.icon;
          return (
            <button
              key={fn.id}
              type="button"
              onClick={() => navigate(fn.path)}
              className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-card p-4 sm:p-5 text-center shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md hover:bg-accent/40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 shadow-2xs',
                  fn.iconBg,
                )}
              >
                <FnIcon className={cn('h-6 w-6', fn.iconColor)} />
              </div>

              <span className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-full">
                {fn.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

