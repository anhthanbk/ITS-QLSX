import React from 'react';
import {
  TrendingUp,
  Truck,
  Building2,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  Plus,
  ArrowRight,
  Layers,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  SalesProcurementDashboardData,
  SalesActionAlert,
  SalesFunnelStage,
  TopPartnerSummary,
  CarrierLogisticsSummary,
} from '../types';
import type { SalesTab } from '../pages/sales-page';

interface SalesProcurementDashboardProps {
  data?: SalesProcurementDashboardData;
  isLoading: boolean;
  onNavigateTab: (tab: SalesTab) => void;
  onOpenCreateSO?: () => void;
  onOpenCreatePO?: () => void;
  canManageSales: boolean;
  canManagePurchase: boolean;
}

export const SalesProcurementDashboard: React.FC<SalesProcurementDashboardProps> = ({
  data,
  isLoading,
  onNavigateTab,
  onOpenCreateSO,
  onOpenCreatePO,
  canManageSales,
  canManagePurchase,
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-border bg-card/60 p-4"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card/60 lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card/60" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card/60" />
          <div className="h-64 animate-pulse rounded-2xl border border-border bg-card/60" />
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;
  const alerts: SalesActionAlert[] = data?.alerts || [];
  const funnelStages: SalesFunnelStage[] = data?.funnelStages || [];
  const topCustomers: TopPartnerSummary[] = data?.topCustomers || [];
  const topSuppliers: TopPartnerSummary[] = data?.topSuppliers || [];
  const carriers: CarrierLogisticsSummary[] = data?.carriers || [];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Quick Action Center */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Executive Command Center
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Tổng Quan Điều Hành Kinh Doanh & Chuỗi Cung Ứng
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Giám sát doanh thu bán cát, chi phí thu mua khoáng sản, tình trạng đơn hàng và điều phối logistics theo thời gian thực.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {canManageSales && onOpenCreateSO && (
              <Button
                size="sm"
                onClick={onOpenCreateSO}
                className="gap-1.5 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo đơn bán (SO)</span>
              </Button>
            )}
            {canManagePurchase && onOpenCreatePO && (
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenCreatePO}
                className="gap-1.5 shadow-sm border-primary/30 text-foreground hover:bg-primary/5"
              >
                <Plus className="h-4 w-4" />
                <span>Lập đơn mua (PO)</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onNavigateTab('procurement-requests')}
              className="gap-1.5 shadow-sm"
            >
              <FileQuestion className="h-4 w-4 text-amber-500" />
              <span>Duyệt đề xuất (PR)</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Cards Grid (6 cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* KPI 1: Doanh thu bán hàng */}
        <div className="group relative rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Doanh thu bán SO</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-foreground truncate" title={formatCurrency(kpis?.totalSalesRevenue)}>
            {formatCurrency(kpis?.totalSalesRevenue)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Đã xác nhận / Tổng:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {kpis?.confirmedSalesOrdersCount ?? 0}/{kpis?.salesOrdersCount ?? 0}
            </span>
          </div>
        </div>

        {/* KPI 2: Tổng chi phí thu mua */}
        <div className="group relative rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-blue-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Chi mua hàng PO</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-foreground truncate" title={formatCurrency(kpis?.totalPurchaseCost)}>
            {formatCurrency(kpis?.totalPurchaseCost)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Đã nhận hàng / Tổng:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {kpis?.receivedPurchaseOrdersCount ?? 0}/{kpis?.purchaseOrdersCount ?? 0}
            </span>
          </div>
        </div>

        {/* KPI 3: Cân đối Doanh số Bán - Mua sắm */}
        <div className="group relative rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-purple-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Cân đối Bán - Mua</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-foreground truncate" title={formatCurrency(kpis?.grossCommercialMargin)}>
            {formatCurrency(kpis?.grossCommercialMargin)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Dòng tiền SO/PO:</span>
            <span
              className={cn(
                'font-bold text-xs',
                (kpis?.grossCommercialMargin ?? 0) >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              )}
            >
              {(kpis?.grossCommercialMargin ?? 0) >= 0
                ? `+${(kpis?.commercialMarginRate ?? 0).toFixed(1)}%`
                : `${(kpis?.commercialMarginRate ?? 0).toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* KPI 4: Tỷ lệ giao hàng bán thành công */}
        <div className="group relative rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-amber-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tỷ lệ giao hàng SO</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-foreground">
            {(kpis?.salesDeliveryRate ?? 0).toFixed(0)}%
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, kpis?.salesDeliveryRate ?? 0))}%` }}
            />
          </div>
        </div>

        {/* KPI 5: Đơn hàng cần hành động */}
        <div className="group relative rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-rose-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">SO đang triển khai</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-foreground">
            {kpis?.pendingSOActionCount ?? 0}{' '}
            <span className="text-xs font-normal text-muted-foreground">đơn SO</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>PO chờ nhận hàng:</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {kpis?.pendingPOReceiveCount ?? 0} đơn PO
            </span>
          </div>
        </div>

        {/* KPI 6: Đề xuất mua sắm chờ duyệt (PR) */}
        <div className="group relative rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:border-cyan-500/40 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Phiếu PR chờ duyệt</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
              <FileQuestion className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-lg font-bold tracking-tight text-foreground">
            {kpis?.pendingPRReviewCount ?? 0}{' '}
            <span className="text-xs font-normal text-muted-foreground">phiếu</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Đối tác hoạt động:</span>
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
              {(kpis?.activeCustomersCount ?? 0) + (kpis?.activeSuppliersCount ?? 0)} đối tác
            </span>
          </div>
        </div>
      </div>

      {/* 3. Action Alerts & Sales Funnel Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Col (2/3): Action Center - Cảnh báo khẩn cấp & Hành động ngay */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Trung Tâm Hành Động & Cảnh Báo Điều Hành
                </h3>
                <p className="text-xs text-muted-foreground">
                  Phát hiện sự cố giao chậm, trễ hạn nhà cung ứng hoặc đề xuất khẩn cấp cần phê duyệt
                </p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {alerts.length} việc cần xử lý
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Mọi đơn hàng và đề xuất đều đang trong tầm kiểm soát!
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Không phát hiện đơn hàng quá hạn hoặc đề xuất mua sắm khẩn cấp tồn đọng.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert: SalesActionAlert) => {
                const targetTab: SalesTab =
                  alert.type === 'so_urgent_delivery'
                    ? 'orders'
                    : alert.type === 'po_overdue_delivery'
                    ? 'procurement-orders'
                    : 'procurement-requests';

                const actionText =
                  alert.type === 'so_urgent_delivery'
                    ? 'Mở đơn bán'
                    : alert.type === 'po_overdue_delivery'
                    ? 'Kiểm tra PO'
                    : 'Xem đề xuất PR';

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3.5 transition-all',
                      alert.severity === 'critical'
                        ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50'
                        : alert.severity === 'warning'
                        ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                        : 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                          alert.severity === 'critical'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : alert.severity === 'warning'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        )}
                      >
                        {alert.severity === 'critical' ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : alert.severity === 'warning' ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground">
                            {alert.title}
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.2 text-[10px] font-semibold',
                              alert.severity === 'critical'
                                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                                : alert.severity === 'warning'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                            )}
                          >
                            {alert.type === 'so_urgent_delivery'
                              ? 'Bán hàng'
                              : alert.type === 'po_overdue_delivery'
                              ? 'Thu mua'
                              : 'Đề xuất PR'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {alert.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNavigateTab(targetTab)}
                        className="h-8 gap-1 text-xs font-medium text-primary hover:bg-primary/10"
                      >
                        <span>{actionText}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col (1/3): Sales Pipeline Funnel */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Layers className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Phễu Tiến Độ Bán Hàng (SO)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Luồng trạng thái đơn hàng bán
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-medium text-primary hover:underline"
            >
              Chi tiết
            </button>
          </div>

          <div className="space-y-3.5">
            {funnelStages.map((stage: SalesFunnelStage) => {
              const totalOrders = kpis?.salesOrdersCount || 1;
              const percentage = Math.round((stage.count / totalOrders) * 100);

              return (
                <div key={stage.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {stage.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        {stage.count} đơn
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        ({formatCurrency(stage.amount)})
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full transition-all rounded-full', stage.color || 'bg-primary')}
                      style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Cân đối dòng tiền: </span>
            Doanh số bán {formatCurrency(kpis?.totalSalesRevenue)}, chi phí thu mua vật tư {formatCurrency(kpis?.totalPurchaseCost)}.
          </div>
        </div>
      </div>

      {/* 4. Top Partners & Logistics Carrier Matrix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top 5 Khách hàng lớn nhất */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Top 5 Khách Hàng Tiêu Biểu (B2B)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Đối tác mua cát thành phẩm có doanh số tích lũy lớn nhất
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('customers')}
              className="text-xs font-medium text-primary hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          {topCustomers.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Chưa có dữ liệu khách hàng phát sinh đơn
            </p>
          ) : (
            <div className="space-y-3">
              {topCustomers.map((customer: TopPartnerSummary, idx: number) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-xs font-bold text-purple-600 dark:text-purple-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {customer.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Mã: {customer.code} • {customer.orderCount} đơn hàng
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(customer.totalAmount)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {customer.percentage.toFixed(1)}% doanh số
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 5 Nhà cung cấp vật tư chính */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Top 5 Nhà Cung Ứng Trọng Yếu
                </h3>
                <p className="text-xs text-muted-foreground">
                  Đối tác cung ứng khoáng sản thô, phụ trợ & phụ tùng bảo dưỡng
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('suppliers')}
              className="text-xs font-medium text-primary hover:underline"
            >
              Xem tất cả
            </button>
          </div>

          {topSuppliers.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Chưa có dữ liệu nhà cung ứng phát sinh đơn
            </p>
          ) : (
            <div className="space-y-3">
              {topSuppliers.map((supplier: TopPartnerSummary, idx: number) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {supplier.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Mã: {supplier.code} • {supplier.orderCount} đơn PO
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(supplier.totalAmount)}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {supplier.percentage.toFixed(1)}% chi phí mua
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Carrier & Logistics Fleet Summary */}
      {carriers.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Truck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Mạng Lưới Đơn Vị Vận Tải & Nhà Xe Tiêu Biểu
                </h3>
                <p className="text-xs text-muted-foreground">
                  Theo dõi số lượng đơn hàng đang được điều phối vận chuyển
                </p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
              {carriers.length} nhà xe / đối tác
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {carriers.map((carrier: CarrierLogisticsSummary) => (
              <div
                key={carrier.carrierName}
                className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground truncate max-w-[180px]" title={carrier.carrierName}>
                    {carrier.carrierName}
                  </span>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary">
                    {carrier.activeOrdersCount} đơn
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <span>Biển số: {carrier.recentVehiclePlate || 'N/A'}</span>
                  {carrier.recentDeliveryDate && (
                    <span>
                      Hẹn: {new Date(carrier.recentDeliveryDate).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
