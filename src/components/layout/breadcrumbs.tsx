import React, { useState, useRef, useEffect, useMemo, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Home, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PORTAL_DEPARTMENT_GROUPS,
  type PortalFunctionItem,
} from '@/features/portal/portal-data';
import { AuthContext } from '@/features/auth/context/auth-context';

const ROUTE_LABELS: Record<string, string> = {
  '': 'Trang chủ',
  profile: 'Hồ sơ cá nhân',
  forbidden: 'Không có quyền truy cập',
  'admin-only': 'Hệ thống',
  executive: 'Điều hành',
  overview: 'Dashboard Điều Hành',
  oee: 'Giám sát OEE & Sản lượng',
  approvals: 'Phê duyệt & Đề xuất',
  reports: 'Báo cáo điều hành',
  production: 'Sản xuất',
  'annual-plan': 'Kế hoạch',
  plans: 'Kế hoạch sản xuất',
  shifts: 'Nhập liệu',
  patrols: 'Tuần kiểm',
  incidents: 'Downtime',
  norms: 'Định mức KT - KT',
  batches: 'Lô thành phẩm',
  warehouse: 'Kho vận',
  stock: 'Báo cáo tồn kho tổng hợp',
  transactions: 'Biên bản giao nhận & Nhập xuất',
  products: 'Sản phẩm & Thành phẩm',
  materials: 'Danh mục vật tư & NVL',
  inventory: 'Kiểm kê kho định kỳ',
  locations: 'Danh mục kho lưu trữ',
  'material-dashboard': 'Dashboard Vật tư & NVL',
  maintenance: 'Bảo trì',
  machines: 'Danh mục thiết bị máy móc',
  schedules: 'Lịch bảo dưỡng định kỳ',
  orders: 'Phiếu sửa chữa (Work Orders)',
  adjustments: 'Cải tiến & hiệu chỉnh thiết bị',
  spares: 'Kho phụ tùng & spares',
  sales: 'Kinh doanh',
  dashboard: 'Dashboard kinh doanh & mua sắm',
  customers: 'Tệp khách hàng công nghiệp',
  procurement: 'Mua sắm vật tư',
  requests: 'Đề xuất mua sắm (PR)',
  suppliers: 'Danh mục nhà cung cấp',
  hr: 'Nhân sự',
  employees: 'Danh sách nhân viên',
  departments: 'Cơ cấu phòng ban & tổ đội',
  positions: 'Chức danh & vị trí công tác',
  system: 'Hệ thống',
  users: 'Người dùng & phân quyền (RBAC)',
  logs: 'Nhật ký thao tác hệ thống',
};

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface BreadcrumbsProps {
  customCrumbs?: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ customCrumbs, className }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);

  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const deptDropdownRef = useRef<HTMLLIElement>(null);
  const viewDropdownRef = useRef<HTMLLIElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptOpen(false);
      }
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target as Node)) {
        setIsViewOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setIsDeptOpen(false);
    setIsViewOpen(false);
  }, [location.pathname]);

  // Close dropdowns on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDeptOpen(false);
        setIsViewOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter department groups by role/permissions
  const authorizedGroups = useMemo(() => {
    const hasRole = authContext?.hasRole ?? (() => true);
    const hasPermission = authContext?.hasPermission ?? (() => true);
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
  }, [authContext]);

  // If custom crumbs provided, use them directly
  if (customCrumbs && customCrumbs.length > 0) {
    return (
      <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs', className)}>
        <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
          <li>
            <Link
              to="/"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only">Trang chủ</span>
            </Link>
          </li>
          {customCrumbs.map((crumb, idx) => {
            const isLast = idx === customCrumbs.length - 1;
            return (
              <li key={`${crumb.label}-${idx}`} className="flex items-center gap-1.5">
                <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                {crumb.path && !isLast ? (
                  <Link
                    to={crumb.path}
                    className="hover:text-foreground transition-colors font-medium"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      'font-medium',
                      isLast ? 'text-foreground font-semibold' : 'text-muted-foreground',
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  // Root path '/'
  if (location.pathname === '/') {
    return (
      <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs', className)}>
        <ol className="flex items-center gap-1.5 text-muted-foreground">
          <li className="flex items-center gap-1 text-foreground font-medium">
            <Home className="h-3.5 w-3.5" />
            <span>Trang chủ</span>
          </li>
        </ol>
      </nav>
    );
  }

  // Detect current department from URL path
  const currentDept = (() => {
    const p = location.pathname;
    if (p.startsWith('/production')) {
      return authorizedGroups.find((g) => g.id === 'production') || PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'production') || null;
    }
    if (p.startsWith('/warehouse')) {
      return authorizedGroups.find((g) => g.id === 'warehouse') || PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'warehouse') || null;
    }
    if (p.startsWith('/maintenance')) {
      return authorizedGroups.find((g) => g.id === 'maintenance') || PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'maintenance') || null;
    }
    if (p.startsWith('/sales') || p.startsWith('/procurement')) {
      return authorizedGroups.find((g) => g.id === 'sales') || PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'sales') || null;
    }
    if (p.startsWith('/hr')) {
      return authorizedGroups.find((g) => g.id === 'hr') || PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'hr') || null;
    }
    if (p.startsWith('/executive')) {
      return authorizedGroups.find((g) => g.id === 'executive') || PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'executive') || null;
    }
    if (p.startsWith('/system') || p.startsWith('/admin')) {
      return authorizedGroups.find((g) => g.id === 'system') || PORTAL_DEPARTMENT_GROUPS.find((g) => g.id === 'system') || null;
    }
    return null;
  })();

  // If inside a recognizable department: Render Interactive Dropdowns
  if (currentDept) {
    const DeptIcon = currentDept.deptIcon;

    // Detect current view/function within department
    const segments = location.pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    let currentFunction: { title: string; path: string; icon?: React.ElementType; badge?: string } | null = null;

    // Match exact path or prefix in current department functions
    const matchedFn =
      currentDept.functions.find((fn) => fn.path === location.pathname) ||
      [...currentDept.functions]
        .sort((a, b) => b.path.length - a.path.length)
        .find((fn) => location.pathname.startsWith(fn.path));

    if (lastSegment && ROUTE_LABELS[lastSegment]) {
      currentFunction = {
        title: ROUTE_LABELS[lastSegment],
        path: location.pathname,
        icon: matchedFn?.icon,
        badge: matchedFn?.badge,
      };
    } else if (matchedFn) {
      currentFunction = {
        title: matchedFn.title,
        path: matchedFn.path,
        icon: matchedFn.icon,
        badge: matchedFn.badge,
      };
    } else {
      currentFunction = {
        title: currentDept.functions[0]?.title || currentDept.shortName,
        path: currentDept.functions[0]?.path || location.pathname,
        icon: currentDept.functions[0]?.icon,
      };
    }

    const ViewIcon = currentFunction.icon;

    return (
      <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs', className)}>
        <ol className="flex items-center gap-1.5 text-muted-foreground">
          {/* Home Icon */}
          <li className="shrink-0">
            <Link
              to="/"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/60"
              title="Về Cổng phòng ban (Trang chủ)"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only">Trang chủ</span>
            </Link>
          </li>

          <li className="shrink-0">
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          </li>

          {/* Segment 1: PHÒNG BAN (Dropdown chuyển đổi giữa 7 phòng ban) */}
          <li className="relative shrink-0" ref={deptDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsDeptOpen((prev) => !prev);
                setIsViewOpen(false);
              }}
              aria-expanded={isDeptOpen}
              aria-haspopup="true"
              title="Click để đổi sang phòng ban khác"
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer shadow-2xs',
                isDeptOpen
                  ? 'border-primary/50 bg-accent text-foreground ring-2 ring-primary/20'
                  : 'border-border/80 bg-background/80 hover:bg-accent/60 text-foreground',
              )}
            >
              <div className={cn('p-0.5 rounded shrink-0', currentDept.iconBg)}>
                <DeptIcon className={cn('h-3.5 w-3.5', currentDept.iconColor)} />
              </div>
              <span>{currentDept.id === 'production' ? 'Sản xuất' : currentDept.shortName}</span>
              <ChevronDown
                className={cn(
                  'h-3 w-3 text-muted-foreground transition-transform duration-200',
                  isDeptOpen && 'rotate-180',
                )}
              />
            </button>

            {/* Department Dropdown Menu */}
            {isDeptOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-border/80 bg-popover/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border/50 mb-1">
                  <span>Chuyển Đổi Phòng Ban</span>
                  <span className="text-[10px] text-muted-foreground/80 font-normal">7 Phòng</span>
                </div>
                <div className="max-h-[320px] overflow-y-auto space-y-0.5">
                  {authorizedGroups.map((group) => {
                    const GroupIcon = group.deptIcon;
                    const isCurrent = group.id === currentDept.id;
                    const primaryPath = group.functions[0]?.path || '/';

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => {
                          setIsDeptOpen(false);
                          navigate(primaryPath);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer',
                          isCurrent
                            ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-500/30'
                            : 'text-foreground hover:bg-muted/70',
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn('p-1 rounded-md shrink-0', group.iconBg)}>
                            <GroupIcon className={cn('h-3.5 w-3.5', group.iconColor)} />
                          </div>
                          <span className="truncate">{group.shortName}</span>
                        </div>
                        {isCurrent && <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </li>

          <li className="shrink-0">
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          </li>

          {/* Segment 2: THAO TÁC / VIEW (Dropdown chuyển qua các view thao tác khác) */}
          <li className="relative shrink-0" ref={viewDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsViewOpen((prev) => !prev);
                setIsDeptOpen(false);
              }}
              aria-expanded={isViewOpen}
              aria-haspopup="true"
              aria-current="page"
              title="Click để chuyển sang view thao tác khác"
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer shadow-2xs',
                isViewOpen
                  ? 'border-emerald-600 bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/30'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20',
              )}
            >
              {ViewIcon && <ViewIcon className="h-3.5 w-3.5 shrink-0" />}
              <span aria-current="page" className="truncate max-w-[200px] sm:max-w-none">
                {currentFunction.title}
              </span>
              <ChevronDown
                className={cn(
                  'h-3 w-3 text-emerald-700 dark:text-emerald-400 transition-transform duration-200',
                  isViewOpen && 'rotate-180',
                )}
              />
            </button>

            {/* Operations Dropdown Menu */}
            {isViewOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-80 rounded-xl border border-border/80 bg-popover/95 p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between border-b border-border/50 mb-1">
                  <span>Thao Tác & Chức Năng</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground font-semibold">
                    {currentDept.shortName}
                  </span>
                </div>
                <div className="max-h-[360px] overflow-y-auto space-y-1">
                  {currentDept.functions.map((fn: PortalFunctionItem) => {
                    const FnIcon = fn.icon;
                    const isCurrent =
                      fn.path === location.pathname ||
                      (location.pathname.startsWith(fn.path) && fn.path !== '/');

                    return (
                      <button
                        key={fn.id}
                        type="button"
                        onClick={() => {
                          setIsViewOpen(false);
                          navigate(fn.path);
                        }}
                        className={cn(
                          'flex w-full items-center justify-between gap-2.5 rounded-lg p-2 text-left text-xs transition-colors cursor-pointer group',
                          isCurrent
                            ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-500/30'
                            : 'text-foreground hover:bg-muted/70',
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn('p-1.5 rounded-lg shrink-0 transition-colors', fn.iconBg)}>
                            <FnIcon className={cn('h-3.5 w-3.5', fn.iconColor)} />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{fn.title}</div>
                            {fn.subtitle && (
                              <div className="truncate text-[10px] text-muted-foreground font-normal">
                                {fn.subtitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCurrent && (
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </li>
        </ol>
      </nav>
    );
  }

  // Fallback for non-department paths (e.g. /profile, /forbidden)
  const pathSegments = location.pathname.split('/').filter(Boolean);
  let accumulatedPath = '';
  const crumbs: BreadcrumbItem[] = pathSegments.map((segment) => {
    accumulatedPath += `/${segment}`;
    const label = ROUTE_LABELS[segment] || decodeURIComponent(segment);
    return {
      label,
      path: accumulatedPath,
    };
  });

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center text-xs', className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
        <li>
          <Link
            to="/"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/60"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Trang chủ</span>
          </Link>
        </li>
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li key={crumb.path || idx} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
              {crumb.path && !isLast ? (
                <Link
                  to={crumb.path}
                  className="hover:text-foreground transition-colors font-medium"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'font-medium truncate max-w-[200px]',
                    isLast ? 'text-foreground font-semibold' : 'text-muted-foreground',
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
