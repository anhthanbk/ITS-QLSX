import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Search,
  RotateCcw,
  ExternalLink,
  Warehouse,
  Boxes,
  ShieldCheck,
  TrendingDown,
  Coins,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMaintenanceSpareParts } from '../hooks/use-spare-parts';
import type { MaintenanceSpareStatus } from '../types';

export const SparePartsTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceSpareStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading, isError, refetch } = useMaintenanceSpareParts({
    search,
    status: statusFilter,
    page,
    pageSize,
  });

  const spareParts = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // Calculate local KPI summary
  const safeCount = spareParts.filter((p) => p.status === 'safe').length;
  const lowCount = spareParts.filter((p) => p.status === 'low').length;
  const criticalCount = spareParts.filter((p) => p.status === 'critical').length;
  const totalEstimatedValue = spareParts.reduce(
    (acc, curr) => acc + curr.currentStock * curr.standardCost,
    0
  );

  return (
    <div className="space-y-4">
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Kho Phụ Tùng & Vật Tư Tiêu Hao Thiết Bị
            </h3>
            <p className="text-xs text-muted-foreground">
              Dữ liệu được liên kết trực tiếp theo thời gian thực từ <strong>Kho Vật Tư (Warehouse)</strong>. Theo dõi mức tồn an toàn và kế hoạch cấp phát bảo trì.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/warehouse/stock"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 text-xs bg-background/80')}
          >
            <Warehouse className="h-3.5 w-3.5 text-primary" />
            Xem Kho Tổng
          </Link>
          <Link
            to="/warehouse/transactions"
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 text-xs')}
          >
            <Boxes className="h-3.5 w-3.5" />
            Phiếu Nhập / Xuất Kho
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Boxes className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Tổng phụ tùng cơ điện</p>
            <p className="text-lg font-bold text-foreground">{totalCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Mức an toàn</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{safeCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <TrendingDown className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Dưới mức an toàn / Cần mua</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {lowCount + criticalCount}
              {criticalCount > 0 && (
                <span className="ml-1 text-xs text-destructive">({criticalCount} khẩn)</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Coins className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate">Tổng giá trị tồn ước tính</p>
            <p className="text-sm font-bold text-foreground">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                totalEstimatedValue
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên phụ tùng..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'Tất cả trạng thái' },
              { id: 'safe', label: 'An toàn' },
              { id: 'low', label: 'Dưới an toàn' },
              { id: 'critical', label: 'Cần mua khẩn' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => {
                setStatusFilter(filter.id);
                setPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === filter.id
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {filter.label}
            </button>
          ))}

          {(search || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setPage(1);
              }}
              className="h-7 px-2 text-xs text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Đặt lại
            </Button>
          )}
        </div>
      </div>

      {/* Spare Parts Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <th className="py-3 px-4">Mã phụ tùng</th>
                <th className="py-3 px-4">Tên phụ tùng & Quy cách</th>
                <th className="py-3 px-4">Kho liên kết</th>
                <th className="py-3 px-4 text-right">Tồn kho / Khả dụng</th>
                <th className="py-3 px-4 text-right">Định mức an toàn</th>
                <th className="py-3 px-4 text-right">Đơn giá định mức</th>
                <th className="py-3 px-4 text-center">Cảnh báo tồn</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3 px-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-48 bg-muted rounded" /></td>
                    <td className="py-3 px-4"><div className="h-4 w-32 bg-muted rounded" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 w-16 bg-muted rounded ml-auto" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 w-16 bg-muted rounded ml-auto" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 w-20 bg-muted rounded ml-auto" /></td>
                    <td className="py-3 px-4 text-center"><div className="h-4 w-20 bg-muted rounded mx-auto" /></td>
                    <td className="py-3 px-4 text-right"><div className="h-4 w-12 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
                    <p className="text-xs font-semibold text-destructive">Không thể tải dữ liệu phụ tùng từ kho</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2 text-xs">
                      Thử lại
                    </Button>
                  </td>
                </tr>
              ) : spareParts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    <Package className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs font-medium">Không tìm thấy phụ tùng phù hợp</p>
                    <p className="text-[11px] text-muted-foreground/70">
                      Hãy điều chỉnh bộ lọc hoặc kiểm tra danh mục vật tư trong phân hệ Kho.
                    </p>
                  </td>
                </tr>
              ) : (
                spareParts.map((sp) => (
                  <tr key={sp.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      <span className="rounded bg-accent/60 px-2 py-0.5 border border-border/80">
                        {sp.code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{sp.name}</div>
                      <div className="text-[11px] text-muted-foreground">Nhóm: {sp.category}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <Warehouse className="h-3.5 w-3.5 text-primary" />
                        <span>{sp.warehouseName || 'Kho Phụ Tùng (K-PT)'}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        Mã kho: {sp.warehouseCode || 'K-PT'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-foreground">
                        {sp.currentStock} {sp.unit}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Khả dụng: {sp.availableStock} {sp.unit}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-semibold text-foreground">
                        {sp.minStock} {sp.unit}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Đặt lại: {sp.reorderPoint} {sp.unit}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-foreground">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                        sp.standardCost
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {sp.status === 'safe' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          An toàn
                        </span>
                      )}
                      {sp.status === 'low' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="h-3 w-3" />
                          Dưới mức an toàn
                        </span>
                      )}
                      {sp.status === 'critical' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-[11px] font-semibold text-destructive border border-destructive/20">
                          <AlertTriangle className="h-3 w-3" />
                          Cần mua khẩn cấp
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/warehouse/stock?search=${encodeURIComponent(sp.code)}`}
                        className={cn(
                          buttonVariants({ variant: 'ghost', size: 'sm' }),
                          'h-7 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10 gap-1'
                        )}
                      >
                        Kho
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground bg-card">
            <div>
              Hiển thị{' '}
              <span className="font-semibold text-foreground">
                {(page - 1) * pageSize + 1}
              </span>{' '}
              -{' '}
              <span className="font-semibold text-foreground">
                {Math.min(page * pageSize, totalCount)}
              </span>{' '}
              trong tổng số{' '}
              <span className="font-semibold text-foreground">{totalCount}</span> phụ tùng
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 font-medium">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
