import React from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Truck,
  PackageCheck,
  Building2,
} from 'lucide-react';
import type { SalesMetrics } from '../types';

interface SalesMetricCardsProps {
  metrics?: SalesMetrics;
  isLoading: boolean;
}

export const SalesMetricCards: React.FC<SalesMetricCardsProps> = ({
  metrics,
  isLoading,
}) => {
  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-border bg-card/60 p-4"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {/* 1. Doanh thu bán hàng */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Tổng doanh thu bán</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-lg font-bold tracking-tight text-foreground">
          {formatCurrency(metrics?.totalSalesAmount)}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Hợp đồng & đơn bán hàng</p>
      </div>

      {/* 2. Đơn hàng bán ra */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Đơn đặt hàng (SO)</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ShoppingCart className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-lg font-bold tracking-tight text-foreground">
          {metrics?.confirmedSalesOrders ?? 0}{' '}
          <span className="text-xs font-normal text-muted-foreground">
            / {metrics?.totalSalesOrders ?? 0} đơn
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Đã xác nhận & sản xuất</p>
      </div>

      {/* 3. Khách hàng đối tác */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Khách hàng B2B</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-lg font-bold tracking-tight text-foreground">
          {metrics?.totalCustomers ?? 0}{' '}
          <span className="text-xs font-normal text-muted-foreground">đối tác</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Danh bạ thương mại</p>
      </div>

      {/* 4. Tổng chi phí thu mua PO */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Tổng chi mua hàng</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Truck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-lg font-bold tracking-tight text-foreground">
          {formatCurrency(metrics?.totalPurchaseAmount)}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Chi mua nguyên vật liệu</p>
      </div>

      {/* 5. Đơn mua hàng NCC */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Đơn mua hàng (PO)</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <PackageCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-lg font-bold tracking-tight text-foreground">
          {metrics?.confirmedPurchaseOrders ?? 0}{' '}
          <span className="text-xs font-normal text-muted-foreground">
            / {metrics?.totalPurchaseOrders ?? 0} PO
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Đã xác nhận & đang giao</p>
      </div>

      {/* 6. Nhà cung ứng vật tư */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Nhà cung cấp (NCC)</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Building2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-lg font-bold tracking-tight text-foreground">
          {metrics?.totalSuppliers ?? 0}{' '}
          <span className="text-xs font-normal text-muted-foreground">nhà cung ứng</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Đối tác cung ứng xưởng</p>
      </div>
    </div>
  );
};
