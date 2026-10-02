import React from 'react';
import {
  Factory,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import type { ProductionMetrics } from '../types';

interface ProductionMetricCardsProps {
  metrics: ProductionMetrics | undefined;
  isLoading: boolean;
}

export const ProductionMetricCards: React.FC<ProductionMetricCardsProps> = ({
  metrics,
  isLoading,
}) => {
  const cards = [
    {
      title: 'Dây chuyền hoạt động',
      value: isLoading ? '...' : `${metrics?.activeLines ?? 0}`,
      subtext: 'Chuyền sản xuất trực tuyến',
      icon: Factory,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      title: 'Kế hoạch tháng này',
      value: isLoading ? '...' : `${(metrics?.monthlyPlannedOutputTons ?? 0).toLocaleString()} Tấn`,
      subtext: `${metrics?.totalMonthlyPlans ?? 0} kế hoạch dây chuyền`,
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
    },
    {
      title: 'Sản lượng thu hồi thực tế',
      value: isLoading ? '...' : `${(metrics?.actualMonthlyOutputTons ?? 0).toLocaleString()} Tấn`,
      subtext: 'Tổng sản lượng đã ghi nhận ca',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: 'Công suất & Thu hồi TB',
      value: isLoading
        ? '...'
        : `${metrics?.avgCapacityTph ?? 0} TPH (${metrics?.avgRecoveryRatePct ?? 0}%)`,
      subtext: 'Hiệu suất vận hành trung bình',
      icon: TrendingUp,
      color: 'text-sky-600 dark:text-sky-400',
      bgColor: 'bg-sky-50 dark:bg-sky-950/50',
    },
    {
      title: 'Tổng giờ dừng chuyền',
      value: isLoading ? '...' : `${metrics?.totalDowntimeHours ?? 0} giờ`,
      subtext: 'Sự cố & bảo dưỡng định kỳ',
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
    },
    {
      title: 'Lệnh sản xuất đang chạy',
      value: isLoading ? '...' : `${metrics?.activeOrdersCount ?? 0}`,
      subtext: 'Đang theo dõi tiến độ gia công',
      icon: ClipboardList,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl font-bold tracking-tight text-foreground">
                {card.value}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
