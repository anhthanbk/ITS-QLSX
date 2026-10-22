import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Landmark } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { PORTAL_DEPARTMENT_GROUPS } from '@/features/portal/portal-data';
import { MobileNav } from './mobile-nav';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const { hasPermission, hasRole } = useAuth();
  const location = useLocation();

  // Lọc các chức năng theo quyền truy cập của người dùng
  const authorizedGroups = useMemo(() => {
    return PORTAL_DEPARTMENT_GROUPS.map((group) => {
      const allowedFunctions = group.functions.filter((fn) => {
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

      return {
        ...group,
        functions: allowedFunctions,
      };
    }).filter((group) => group.functions.length > 0);
  }, [hasPermission, hasRole]);

  // Danh sách các phòng ban (bỏ mục điều hành vì đã đưa lên nút trực tiếp ở trên)
  const departmentNavGroups = useMemo(
    () => authorizedGroups.filter((g) => g.id !== 'executive'),
    [authorizedGroups],
  );

  const isExecutiveActive =
    location.pathname === '/' || location.pathname.startsWith('/executive');

  return (
    <>
      {/* ======================================================== */}
      {/* 1. DESKTOP SIDEBAR: CỐ ĐỊNH BÊN TRÁI, MƯỢT MÀ, KHÔNG MẤT  */}
      {/* ======================================================== */}
      <aside
        id="desktop-sidebar"
        role="navigation"
        aria-label="Thanh điều hướng chính"
        className="hidden md:flex flex-col shrink-0 border-r border-border bg-card/80 backdrop-blur-xs transition-all duration-200 select-none h-full overflow-hidden z-20 w-64 lg:w-72"
      >

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-2 pt-3 space-y-1">
          {/* Direct link to Điều hành (Executive) - Không có nút xổ xuống */}
          <NavLink
            to="/"
            className={cn(
              'w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold transition-all cursor-pointer mb-2',
              isExecutiveActive
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-foreground hover:bg-muted font-semibold',
            )}
          >
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                isExecutiveActive
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
              )}
            >
              <Landmark className="h-4 w-4" />
            </div>
            <span className="truncate">Điều hành</span>
          </NavLink>

          <div className="my-1 border-t border-border/60" />

          {/* Các Phòng Ban: Nút trực tiếp đến màn hình thao tác, KHÔNG XỔ XUỐNG */}
          {departmentNavGroups.map((group) => {
            const DeptIcon = group.deptIcon;
            const deptPath = `/${group.id}`;
            const isGroupActive =
              location.pathname === deptPath ||
              location.pathname.startsWith(`${deptPath}/`) ||
              group.functions.some((fn) => {
                const basePath = fn.path.split('?')[0] || fn.path;
                return location.pathname === fn.path || location.pathname.startsWith(basePath);
              });

            return (
              <NavLink
                key={group.id}
                to={deptPath}
                className={cn(
                  'w-full flex items-center gap-2.5 p-2 rounded-xl text-xs transition-all cursor-pointer',
                  isGroupActive
                    ? 'bg-primary/10 text-primary font-bold shadow-2xs'
                    : 'text-foreground hover:bg-muted font-semibold',
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-2xs ring-1 ring-border/40',
                    group.iconBg,
                  )}
                >
                  <DeptIcon className={cn('h-3.5 w-3.5', group.iconColor)} />
                </div>
                <span className="truncate">{group.shortName}</span>
              </NavLink>
            );
          })}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MOBILE BOTTOM NAVBAR (5 NÚT + NÚT THÊM & TÙY CHỈNH)     */}
      {/* ======================================================== */}
      <MobileNav />
    </>
  );
};

