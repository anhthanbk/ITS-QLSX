import React, { useMemo, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PORTAL_DEPARTMENT_GROUPS } from '@/features/portal/portal-data';
import { AuthContext } from '@/features/auth/context/auth-context';

export const DepartmentViewTabBar: React.FC = () => {
  const location = useLocation();
  const authContext = useContext(AuthContext);

  // Detect current department (hook at top level)
  const currentDept = useMemo(() => {
    const p = location.pathname;
    if (p === '/') return null;
    if (p.startsWith('/production')) {
      return PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'production') || null;
    }
    if (p.startsWith('/warehouse')) {
      return PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'warehouse') || null;
    }
    if (p.startsWith('/maintenance')) {
      return PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'maintenance') || null;
    }
    if (p.startsWith('/sales') || p.startsWith('/procurement')) {
      return PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'sales') || null;
    }
    if (p.startsWith('/hr')) {
      return PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'hr') || null;
    }
    if (p.startsWith('/executive')) {
      return PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'executive') || null;
    }
    if (p.startsWith('/system') || p.startsWith('/admin')) {
      return PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'system') || null;
    }
    return null;
  }, [location.pathname]);

  // Filter allowed functions and deduplicate by path (hook at top level)
  const visibleTabs = useMemo(() => {
    if (!currentDept) return [];
    const hasRole = authContext?.hasRole ?? (() => true);
    const hasPermission = authContext?.hasPermission ?? (() => true);
    const seenPaths = new Set<string>();

    return currentDept.functions
      .filter((fn) => {
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
      })
      .filter((fn) => {
        if (seenPaths.has(fn.path)) return false;
        seenPaths.add(fn.path);
        return true;
      });
  }, [currentDept, authContext]);

  const isDepartmentLanding = [
    '/production',
    '/warehouse',
    '/maintenance',
    '/sales',
    '/procurement',
    '/hr',
    '/system',
    '/admin',
  ].includes(location.pathname);

  // Early returns strictly after all hooks have executed
  if (
    location.pathname === '/' ||
    isDepartmentLanding ||
    !currentDept ||
    visibleTabs.length === 0
  ) {
    return null;
  }

  return (
    <div className="sticky top-0 z-30 w-full border-b border-border/80 bg-card/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 sm:px-6 overflow-x-auto no-scrollbar py-1">
        {visibleTabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive =
            location.pathname === tab.path ||
            (location.pathname.startsWith(tab.path) && tab.path !== '/');

          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all shrink-0 cursor-pointer',
                isActive
                  ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border border-emerald-500/30 shadow-2xs'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent',
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-md shrink-0 transition-colors',
                  isActive ? 'bg-emerald-600 text-white dark:bg-emerald-500' : tab.iconBg,
                )}
              >
                <TabIcon
                  className={cn(
                    'h-3.5 w-3.5',
                    isActive ? 'text-white' : tab.iconColor,
                  )}
                />
              </div>
              <span>{tab.title}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
