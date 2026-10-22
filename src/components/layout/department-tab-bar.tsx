import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Layers } from 'lucide-react';
import { PORTAL_DEPARTMENT_GROUPS } from '@/features/portal/portal-data';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { cn } from '@/lib/utils';

export const DepartmentTabBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasPermission, hasRole } = useAuth();

  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
    }
    if (isDeptDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDeptDropdownOpen]);

  // Lọc các phòng ban theo quyền
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
      return { ...group, functions: allowedFunctions };
    }).filter((g) => g.functions.length > 0);
  }, [hasPermission, hasRole]);

  // Xác định phòng ban hiện tại dựa trên URL
  const currentDept = useMemo(() => {
    const path = location.pathname;

    if (path.startsWith('/production')) {
      return authorizedGroups.find((g) => g.id === 'production') || null;
    }
    if (path.startsWith('/warehouse')) {
      return authorizedGroups.find((g) => g.id === 'warehouse') || null;
    }
    if (path.startsWith('/maintenance')) {
      return authorizedGroups.find((g) => g.id === 'maintenance') || null;
    }
    if (path.startsWith('/sales') || path.startsWith('/procurement')) {
      return authorizedGroups.find((g) => g.id === 'sales') || null;
    }
    if (path.startsWith('/hr')) {
      return authorizedGroups.find((g) => g.id === 'hr') || null;
    }
    if (path.startsWith('/executive')) {
      return authorizedGroups.find((g) => g.id === 'executive') || null;
    }
    if (path.startsWith('/admin') || path.startsWith('/system')) {
      return authorizedGroups.find((g) => g.id === 'system') || null;
    }

    return null;
  }, [location.pathname, authorizedGroups]);

  // Nếu không thuộc phòng ban nào (hoặc ở trang chủ /), không render thanh tab
  if (!currentDept) return null;

  const DeptIcon = currentDept.deptIcon;
  const currentFullPath = location.pathname + location.search;

  return (
    <div className="sticky top-0 z-20 w-full border-b border-border/80 bg-card/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Tên phòng ban & Bộ chuyển đổi nhanh phòng ban (Dropdown) */}
        <div className="relative shrink-0 py-2.5 pr-4 border-r border-border/70" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDeptDropdownOpen((prev) => !prev)}
            aria-expanded={isDeptDropdownOpen}
            className="flex items-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-2.5 py-1.5 text-xs font-extrabold text-foreground hover:bg-muted transition-all cursor-pointer shadow-2xs group"
          >
            <div className={cn('p-1 rounded-lg shrink-0', currentDept.iconBg)}>
              <DeptIcon className={cn('h-4 w-4', currentDept.iconColor)} />
            </div>
            <span className="hidden sm:inline font-bold">{currentDept.shortName}</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground transition-transform',
                isDeptDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown Menu chuyển nhanh 7 phòng ban */}
          {isDeptDropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-64 rounded-2xl border border-border bg-card p-1.5 text-card-foreground shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Chuyển phòng ban</span>
                <Layers className="h-3 w-3" />
              </div>

              <div className="space-y-0.5">
                {authorizedGroups.map((group) => {
                  const Icon = group.deptIcon;
                  const isCurrent = group.id === currentDept.id;

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => {
                        setIsDeptDropdownOpen(false);
                        // Điều hướng sang thao tác đầu tiên của phòng ban đó
                        if (group.functions[0]) {
                          navigate(group.functions[0].path);
                        }
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl p-2 text-left text-xs transition-colors cursor-pointer',
                        isCurrent
                          ? 'bg-primary/10 text-primary font-bold'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={cn('p-1 rounded-lg', group.iconBg)}>
                          <Icon className={cn('h-3.5 w-3.5', group.iconColor)} />
                        </div>
                        <span>{group.shortName}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {group.functions.length} mục
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Center / Right: Danh sách các Tab Thao Tác Ngang (Horizontal Tabs) */}
        <div className="flex flex-1 items-center gap-1 overflow-x-auto pl-3 no-scrollbar py-1">
          {currentDept.functions.map((fn) => {
            const IconComponent = fn.icon;
            const isTabActive = fn.path.includes('?')
              ? currentFullPath === fn.path
              : location.pathname === fn.path.split('?')[0];

            return (
              <NavLink
                key={fn.id}
                to={fn.path}
                className={cn(
                  'group flex items-center gap-2 whitespace-nowrap px-3.5 py-2 text-xs font-semibold transition-all border-b-2 shrink-0 cursor-pointer select-none rounded-t-lg',
                  isTabActive
                    ? 'border-primary text-primary bg-primary/5 font-extrabold shadow-2xs'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                <IconComponent
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isTabActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span>{fn.title}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
};
