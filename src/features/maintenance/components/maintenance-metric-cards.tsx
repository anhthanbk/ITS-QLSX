import React from 'react';
import { Cpu, CheckCircle2, Wrench, AlertTriangle, ClipboardList } from 'lucide-react';
import type { MaintenanceMetrics } from '../types';

interface MaintenanceMetricCardsProps {
  metrics?: MaintenanceMetrics;
  isLoading: boolean;
}

export const MaintenanceMetricCards: React.FC<MaintenanceMetricCardsProps> = ({
  metrics,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl border border-border bg-card/60 p-4"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Tổng số thiết bị',
      value: metrics?.totalMachines ?? 0,
      icon: Cpu,
      iconBg: 'bg-primary/10 text-primary',
      description: 'Tổng danh mục máy móc',
    },
    {
      title: 'Đang vận hành',
      value: metrics?.operationalMachines ?? 0,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      description: 'Sẵn sàng sản xuất',
    },
    {
      title: 'Đang bảo dưỡng',
      value: metrics?.inMaintenanceMachines ?? 0,
      icon: Wrench,
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      description: 'Đang thực hiện PM/CM',
    },
    {
      title: 'Sự cố / Dừng máy',
      value: metrics?.breakdownMachines ?? 0,
      icon: AlertTriangle,
      iconBg: 'bg-destructive/10 text-destructive',
      description: 'Cần can thiệp khẩn cấp',
    },
    {
      title: 'Phiếu sửa chữa mở',
      value: metrics?.activeWorkOrders ?? 0,
      icon: ClipboardList,
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      description: 'Đang xử lý / Chờ vật tư',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconBg} transition-transform group-hover:scale-110`}
              >
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold tracking-tight text-foreground">{card.value}</div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{card.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
