import React from 'react';
import {
  Boxes,
  AlertOctagon,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  ShoppingCart,
  ArrowRight,
  CheckCircle2,
  Package,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MaterialDashboardData } from '../types';

export interface MaterialInventoryDashboardProps {
  data?: MaterialDashboardData;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  canTransact?: boolean;
  onOpenInbound?: () => void;
  onOpenOutbound?: () => void;
  onOpenAdjustment?: () => void;
  onNavigateToCatalog?: () => void;
  onNavigateToRequests?: () => void;
}

export const MaterialInventoryDashboard: React.FC<MaterialInventoryDashboardProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
  canTransact = false,
  onOpenInbound,
  onOpenOutbound,
  onOpenAdjustment,
  onNavigateToCatalog,
  onNavigateToRequests,
}) => {
  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-3">
        <AlertOctagon className="h-10 w-10 text-destructive mx-auto" />
        <h3 className="text-base font-bold text-foreground">Không thể tải dữ liệu Dashboard Vật tư</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Đã xảy ra lỗi khi tổng hợp số liệu tồn kho và luân chuyển vật tư. Vui lòng thử lại.
        </p>
        <Button size="sm" variant="outline" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          <span>Thử lại</span>
        </Button>
      </div>
    );
  }

  const kpis = data?.kpis;
  const alerts = data?.alerts || [];
  const categories = data?.categories || [];
  const topConsumed = data?.topConsumed || [];
  const recentTx = data?.recentTransactions || [];

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar with Quick Action shortcuts */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Boxes className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold text-foreground">
              Trung Tâm Điều Hành Kho Vật Tư
            </h2>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Thời gian thực
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Giám sát mức tồn an toàn, cảnh báo thiếu hụt nguyên phụ liệu & phân tích luân chuyển cấp phát xưởng
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canTransact && (
            <>
              {onOpenInbound && (
                <Button
                  size="sm"
                  onClick={onOpenInbound}
                  className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                  <span>+ Nhập kho VT</span>
                </Button>
              )}
              {onOpenOutbound && (
                <Button
                  size="sm"
                  onClick={onOpenOutbound}
                  variant="outline"
                  className="gap-1.5 h-8 text-xs border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>+ Xuất cấp phát</span>
                </Button>
              )}
              {onOpenAdjustment && (
                <Button
                  size="sm"
                  onClick={onOpenAdjustment}
                  variant="outline"
                  className="gap-1.5 h-8 text-xs"
                >
                  <span>Kiểm kê / Cân đối</span>
                </Button>
              )}
            </>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={onRetry}
            disabled={isLoading}
            className="h-8 w-8 p-0"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={cn('h-4 w-4 text-muted-foreground', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* 2. Primary KPI Health Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total Materials */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Tổng danh mục VT</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-6 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-xl font-extrabold text-foreground tracking-tight">
                {(kpis?.totalMaterials || 0).toLocaleString('vi-VN')}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {kpis?.activeMaterials || 0} mã đang sử dụng
            </p>
          </div>
        </div>

        {/* Out of Stock (Critical) */}
        <div className={cn(
          'rounded-xl border p-4 shadow-sm hover:shadow-md transition-all',
          (kpis?.outOfStockCount || 0) > 0
            ? 'border-red-500/40 bg-red-500/5'
            : 'border-border bg-card'
        )}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
              {(kpis?.outOfStockCount || 0) > 0 && <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />}
              Hết hàng (0 tồn)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertOctagon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-6 w-12 bg-muted animate-pulse rounded" />
            ) : (
              <p className={cn(
                'text-xl font-extrabold tracking-tight',
                (kpis?.outOfStockCount || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'
              )}>
                {kpis?.outOfStockCount || 0}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {(kpis?.outOfStockCount || 0) > 0 ? 'Cần lập đơn mua sắm gấp' : 'Tất cả đều có tồn'}
            </p>
          </div>
        </div>

        {/* Below Safety Level */}
        <div className={cn(
          'rounded-xl border p-4 shadow-sm hover:shadow-md transition-all',
          (kpis?.lowStockCount || 0) > 0
            ? 'border-amber-500/40 bg-amber-500/5'
            : 'border-border bg-card'
        )}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Dưới mức tối thiểu
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-6 w-12 bg-muted animate-pulse rounded" />
            ) : (
              <p className={cn(
                'text-xl font-extrabold tracking-tight',
                (kpis?.lowStockCount || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
              )}>
                {kpis?.lowStockCount || 0}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Chạm ngưỡng min_stock
            </p>
          </div>
        </div>

        {/* Overstock Warning */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Vượt trần tồn kho</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-6 w-12 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-xl font-extrabold text-foreground tracking-tight">
                {kpis?.overstockCount || 0}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Vượt ngưỡng max_stock
            </p>
          </div>
        </div>

        {/* Total Inventory Valuation */}
        <div className="col-span-2 sm:col-span-1 rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Ước tính giá trị vốn</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            {isLoading ? (
              <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-lg font-extrabold text-foreground tracking-tight truncate">
                {(kpis?.totalInventoryValue || 0).toLocaleString('vi-VN')} <span className="text-xs font-normal text-muted-foreground">đ</span>
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Theo standard_cost
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Center: Critical Alerts & Category Breakdown (2 Columns) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 spans): Critical Stock Alerts Table */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Cảnh Báo Thiếu Hụt & Điểm Đặt Hàng Lại
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Danh sách vật tư chạm ngưỡng an toàn hoặc hết hàng cần lập đề xuất mua sắm
                </p>
              </div>
            </div>

            {alerts.length > 0 && onNavigateToRequests && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToRequests}
                className="gap-1.5 h-7 text-xs border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Lập đề xuất mua (PR)</span>
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p>Đang đối soát định mức tồn kho...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-foreground">
                Tất cả vật tư đều đạt định mức an toàn
              </p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Không có mã vật tư nào bị chạm ngưỡng tối thiểu hoặc hết hàng trong toàn bộ kho.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">Mã & Tên vật tư</th>
                    <th className="py-2.5 px-3">Phân loại</th>
                    <th className="py-2.5 px-3 text-right">Tồn hiện tại</th>
                    <th className="py-2.5 px-3 text-right">Định mức an toàn</th>
                    <th className="py-2.5 px-3 text-right">Thiếu hụt</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {alerts.map((item) => {
                    const isOut = item.severity === 'out_of_stock';
                    const isCritical = item.severity === 'critical_low';

                    return (
                      <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2 px-3">
                          <div className="font-bold text-foreground font-mono">{item.code}</div>
                          <div className="text-[11px] text-muted-foreground line-clamp-1">{item.name}</div>
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[11px] text-muted-foreground">{item.category}</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          <span className={cn(isOut ? 'text-red-600 font-extrabold' : isCritical ? 'text-amber-600' : 'text-foreground')}>
                            {item.current_stock.toLocaleString('vi-VN')} {item.unit_of_measure}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                          {item.min_stock_level.toLocaleString('vi-VN')} {item.unit_of_measure}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-red-600 dark:text-red-400">
                          {item.shortage_quantity > 0 ? `+${item.shortage_quantity.toLocaleString('vi-VN')}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {isOut ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/10 text-red-600 border border-red-500/20">
                              HẾT HÀNG
                            </span>
                          ) : isCritical ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              DƯỚI MIN
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                              ĐIỂM ĐẶT
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column (1 span): Category Distribution Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Cơ Cấu Nhóm Vật Tư
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Phân bổ số lượng mã & cảnh báo theo nhóm
                </p>
              </div>
            </div>

            {onNavigateToCatalog && (
              <button
                type="button"
                onClick={onNavigateToCatalog}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Xem kho</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {categories.map((cat) => {
              const hasAlert = cat.lowStockCount > 0;

              return (
                <div
                  key={cat.category}
                  className="rounded-xl border border-border/60 bg-muted/15 p-2.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground text-xs">{cat.label}</span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {cat.materialCount} mã
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Tổng tồn: <strong className="text-foreground font-mono">{cat.totalQuantity.toLocaleString('vi-VN')}</strong></span>
                    {hasAlert ? (
                      <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {cat.lowStockCount} mã thiếu
                      </span>
                    ) : (
                      <span className="text-emerald-600 text-[10px] font-medium flex items-center gap-0.5">
                        <CheckCircle2 className="h-3 w-3" /> An toàn
                      </span>
                    )}
                  </div>

                  {cat.totalValue > 0 && (
                    <div className="mt-1 text-[10px] text-muted-foreground/80 text-right">
                      Giá trị: {cat.totalValue.toLocaleString('vi-VN')} đ
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Monthly Movement & Top Consumed Materials */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Inbound & Outbound Summary */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Luân Chuyển Vật Tư Trong Tháng
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Tổng lượng vật tư nhập mua PO và xuất cấp phát sản xuất
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Tháng {new Date().getMonth() + 1} / {new Date().getFullYear()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Monthly Inbound */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <ArrowDownLeft className="h-4 w-4" />
                <span>Nhập mua sắm (Inbound)</span>
              </div>
              <div className="mt-2 text-xl font-extrabold text-foreground font-mono">
                {(kpis?.monthlyInboundQty || 0).toLocaleString('vi-VN')}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Giá trị: {(kpis?.monthlyInboundValue || 0).toLocaleString('vi-VN')} đ
              </div>
            </div>

            {/* Monthly Outbound */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold">
                <ArrowUpRight className="h-4 w-4" />
                <span>Xuất cấp phát xưởng (Outbound)</span>
              </div>
              <div className="mt-2 text-xl font-extrabold text-foreground font-mono">
                {(kpis?.monthlyOutboundQty || 0).toLocaleString('vi-VN')}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Giá trị: {(kpis?.monthlyOutboundValue || 0).toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>

          {/* Recent Material Transactions list */}
          <div className="space-y-1.5 pt-1">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Giao dịch vật tư gần nhất
            </h4>
            {recentTx.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">Chưa có giao dịch vật tư gần đây</p>
            ) : (
              <div className="divide-y divide-border/60">
                {recentTx.slice(0, 4).map((tx) => {
                  const isIn = tx.transaction_type === 'inbound_receipt' || tx.quantity > 0;
                  return (
                    <div key={tx.id} className="py-1.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className={cn(
                          'p-1 rounded shrink-0',
                          isIn ? 'bg-emerald-500/10 text-emerald-600' : 'bg-blue-500/10 text-blue-600'
                        )}>
                          {isIn ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        </span>
                        <div className="truncate">
                          <span className="font-semibold text-foreground">{tx.item_code}</span> - {tx.item_name}
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono font-semibold">
                        <span className={isIn ? 'text-emerald-600' : 'text-blue-600'}>
                          {isIn ? '+' : '-'}{Math.abs(tx.quantity).toLocaleString('vi-VN')} {tx.unit_of_measure}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Most Consumed Materials */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Top Vật Tư Tiêu Hao Nhiều Nhất
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Xếp hạng theo khối lượng xuất cấp phát cho sản xuất trong tháng
                </p>
              </div>
            </div>
          </div>

          {topConsumed.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground space-y-1">
              <Boxes className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p>Chưa có dữ liệu tiêu hao vật tư trong tháng này</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topConsumed.map((item, idx) => {
                const maxVal = topConsumed[0]?.totalQuantity || 1;
                const percent = Math.min(100, Math.round((item.totalQuantity / maxVal) * 100));

                return (
                  <div key={item.material_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-foreground font-mono">{item.code}</span>
                        <span className="text-muted-foreground truncate">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-foreground shrink-0">
                        {item.totalQuantity.toLocaleString('vi-VN')} {item.unit_of_measure}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
