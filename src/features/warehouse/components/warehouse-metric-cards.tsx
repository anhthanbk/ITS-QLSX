import React from 'react';
import { Warehouse as WarehouseIcon, PackageCheck, Layers, ArrowLeftRight } from 'lucide-react';
import type { WarehouseMetrics } from '@/features/warehouse/types';

interface WarehouseMetricCardsProps {
  metrics?: WarehouseMetrics;
  isLoading: boolean;
}

export const WarehouseMetricCards: React.FC<WarehouseMetricCardsProps> = ({ metrics, isLoading }) => {
  const cards = [
    {
      label: 'Tổng số kho',
      value: metrics?.totalWarehouses ?? 0,
      subtext: `${metrics?.activeWarehouses ?? 0} kho đang vận hành`,
      icon: WarehouseIcon,
      color: 'text-primary bg-primary/10 border-primary/20',
    },
    {
      label: 'Kho hoạt động',
      value: metrics?.activeWarehouses ?? 0,
      subtext: 'Sẵn sàng lưu trữ & luân chuyển',
      icon: PackageCheck,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Danh mục mặt hàng tồn',
      value: metrics?.totalStockItems ?? 0,
      subtext: 'Gồm NVL & thành phẩm có tồn',
      icon: Layers,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Tổng giao dịch nhập/xuất',
      value: metrics?.totalTransactionsCount ?? 0,
      subtext: 'Lịch sử lưu vết toàn hệ thống',
      icon: ArrowLeftRight,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${card.color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground truncate">{card.label}</p>
              {isLoading ? (
                <div className="mt-1 h-5 w-12 animate-pulse rounded bg-accent" />
              ) : (
                <p className="text-lg font-bold text-foreground tracking-tight">{card.value.toLocaleString('vi-VN')}</p>
              )}
              <p className="text-[10px] text-muted-foreground truncate">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
