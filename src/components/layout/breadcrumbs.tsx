import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROUTE_LABELS: Record<string, string> = {
  '': 'Trang chủ',
  profile: 'Hồ sơ cá nhân',
  forbidden: 'Không có quyền truy cập',
  'admin-only': 'Quản trị hệ thống',
  production: 'Sản xuất',
  plans: 'Kế hoạch sản xuất',
  shifts: 'Theo dõi ca & nhập liệu',
  norms: 'Định mức KT - KT',
  batches: 'Lô thành phẩm',
  warehouse: 'Kho & Vật tư',
  stock: 'Tồn kho & vật tư',
  transactions: 'Nhập / Xuất kho',
  maintenance: 'Thiết bị & Bảo trì',
  machines: 'Danh sách thiết bị',
  schedules: 'Lịch bảo dưỡng',
  mining: 'Khai thác mỏ',
  logs: 'Nhật ký vận chuyển',
  quality: 'Quản lý Chất lượng',
  hsse: 'An toàn & Môi trường',
  finance: 'Giá thành sản xuất',
  sales: 'Bán hàng & Đơn hàng',
  hr: 'Nhân sự & Tổ chức',
  admin: 'Quản trị hệ thống',
  audit: 'Nhật ký thao tác',
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

  // If custom crumbs provided, use them
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

  // Derive from location.pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length === 0) {
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
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
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
