import React from 'react';
import {
  Package,
  Sliders,
  Clock,
  Gauge,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { ProductionMetrics } from '../types';
import { cn } from '@/lib/utils';

interface ProductionMetricCardsProps {
  metrics: ProductionMetrics | undefined;
  isLoading: boolean;
}

interface SvgDonutProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  strokeColor: string;
  trackColor?: string;
  centerLabel: string;
  centerSubLabel?: string;
}

const SvgDonut: React.FC<SvgDonutProps> = ({
  percentage,
  size = 80,
  strokeWidth = 8,
  strokeColor,
  trackColor = 'stroke-muted/40',
  centerLabel,
  centerSubLabel,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackColor}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn('transition-all duration-700 ease-out', strokeColor)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-bold leading-tight text-foreground">{centerLabel}</span>
        {centerSubLabel && (
          <span className="text-[9px] font-medium leading-tight text-muted-foreground">
            {centerSubLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export const ProductionMetricCards: React.FC<ProductionMetricCardsProps> = ({
  metrics,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex h-36 items-center justify-center rounded-xl border border-border bg-card p-4 shadow-sm animate-pulse"
          >
            <div className="h-6 w-24 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  // 1. Output Metrics
  const plannedOutput = metrics?.monthlyPlannedOutputTons ?? 0;
  const actualOutput = metrics?.actualMonthlyOutputTons ?? 0;
  const outputProgress =
    plannedOutput > 0 ? Number(((actualOutput / plannedOutput) * 100).toFixed(1)) : 0;

  // 2. Techno-Economic Norms (Recovery Rate)
  const plannedRecovery = metrics?.plannedRecoveryRatePct ?? 0;
  const actualRecovery = metrics?.avgRecoveryRatePct ?? 0;
  const hasRecoveryData = actualRecovery > 0;
  const recoveryVariance = hasRecoveryData ? Number((actualRecovery - plannedRecovery).toFixed(1)) : 0;
  const recoveryScore =
    plannedRecovery > 0 && hasRecoveryData
      ? Number(((actualRecovery / plannedRecovery) * 100).toFixed(1))
      : 0;

  // 3. Operating Time & Downtime
  const actualOperating = metrics?.actualOperatingHours ?? 0;
  const actualDowntime = metrics?.actualDowntimeHours ?? 0;
  const plannedOperating = metrics?.plannedOperatingHours ?? 0;
  const plannedDowntime = metrics?.plannedDowntimeHours ?? 0;
  const totalActualShiftHours = actualOperating + actualDowntime;
  const hasOperatingData = totalActualShiftHours > 0;
  const availabilityRate =
    totalActualShiftHours > 0
      ? Number(((actualOperating / totalActualShiftHours) * 100).toFixed(1))
      : (metrics?.availabilityPct ?? 0);

  // 4. OEE & Breakdown
  const hasOeeData = hasOperatingData && (actualOutput > 0 || actualOperating > 0);
  const availabilityScore = hasOeeData ? (metrics?.availabilityScore ?? Math.min(100, availabilityRate)) : 0;
  const performanceScore = hasOeeData ? (metrics?.performanceScore ?? 0) : 0;
  const qualityScore = hasOeeData ? (metrics?.qualityScore ?? 0) : 0;
  const oee = hasOeeData ? (metrics?.oeePct ?? 0) : 0;

  const getOeeStatus = (val: number, hasData: boolean) => {
    if (!hasData || val === 0)
      return {
        text: 'Chưa có dữ liệu ca',
        color: 'text-muted-foreground',
        bg: 'bg-muted text-muted-foreground',
      };
    if (val >= 85)
      return {
        text: 'Đẳng cấp thế giới (>=85%)',
        color: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-100 dark:bg-emerald-950/60',
      };
    if (val >= 70)
      return {
        text: 'Vận hành tốt (>=70%)',
        color: 'text-blue-700 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-950/60',
      };
    return {
      text: 'Cần cải tiến (<70%)',
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-950/60',
    };
  };
  const oeeStatus = getOeeStatus(oee, hasOeeData);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* 1. Sản lượng Thực tế / Kế hoạch */}
      <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">Sản lượng Thực tế / KH</h4>
              <p className="text-[10px] text-muted-foreground">Tiến độ sản xuất tháng này</p>
            </div>
          </div>
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            {outputProgress}%
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <SvgDonut
            percentage={outputProgress}
            strokeColor="stroke-emerald-500"
            centerLabel={`${outputProgress}%`}
            centerSubLabel="Đạt KH"
          />
          <div className="flex-1 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Thực tế:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {actualOutput.toLocaleString()} Tấn
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Kế hoạch:</span>
              <span className="font-semibold text-foreground">
                {plannedOutput.toLocaleString()} Tấn
              </span>
            </div>
            <div className="border-t border-border pt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Còn lại:</span>
              <span className="font-medium text-foreground">
                {Math.max(0, plannedOutput - actualOutput).toLocaleString()} Tấn
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Định mức KT - KT Thực tế / Kế hoạch */}
      <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">Tỉ lệ thu hồi</h4>
              <p className="text-[10px] text-muted-foreground">Tỷ lệ thu hồi cát sạch</p>
            </div>
          </div>
          {hasRecoveryData ? (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold',
                recoveryVariance >= 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
              )}
            >
              {recoveryVariance >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {recoveryVariance > 0 ? `+${recoveryVariance}%` : `${recoveryVariance}%`}
            </span>
          ) : (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              0%
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <SvgDonut
            percentage={actualRecovery}
            strokeColor={hasRecoveryData && recoveryVariance < 0 ? 'stroke-amber-500' : 'stroke-blue-500'}
            centerLabel={`${actualRecovery}%`}
            centerSubLabel="Thu hồi"
          />
          <div className="flex-1 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Thu hồi thực tế:</span>
              <span className="font-bold text-foreground">{actualRecovery}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Định mức chuẩn:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {plannedRecovery}%
              </span>
            </div>
            <div className="border-t border-border pt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Độ hoàn thành:</span>
              <span
                className={cn(
                  'font-medium',
                  recoveryScore >= 100
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-foreground',
                )}
              >
                {recoveryScore}% định mức
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Thời gian Dừng / Chạy Thực tế / Kế hoạch */}
      <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">Thời gian Dừng / Chạy</h4>
              <p className="text-[10px] text-muted-foreground">Khả dụng vận hành máy</p>
            </div>
          </div>
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-semibold',
              hasOperatingData
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {hasOperatingData ? `${availabilityRate}% khả dụng` : '0% khả dụng'}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <SvgDonut
            percentage={availabilityRate}
            strokeColor="stroke-amber-500"
            centerLabel={`${availabilityRate}%`}
            centerSubLabel="Khả dụng"
          />
          <div className="flex-1 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Chạy máy thực:</span>
              <span className="font-bold text-foreground">{actualOperating}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Dừng chuyền:</span>
              <span className="font-semibold text-rose-500">{actualDowntime}h</span>
            </div>
            <div className="border-t border-border pt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>KH tháng:</span>
              <span className="font-medium text-foreground">
                {plannedOperating}h chạy / {plannedDowntime}h dừng
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Biểu đồ OEE Tổng Thể */}
      <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-600 dark:text-purple-400">
              <Gauge className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-foreground">Hiệu suất OEE Tổng thể</h4>
              <p className="text-[10px] text-muted-foreground">A × P × Q Hiệu quả thiết bị</p>
            </div>
          </div>
          <span
            className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', oeeStatus.bg, oeeStatus.color)}
          >
            {hasOeeData ? `${oee}%` : '0%'}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <SvgDonut
            percentage={oee}
            strokeColor={hasOeeData ? 'stroke-purple-600 dark:stroke-purple-400' : 'stroke-muted'}
            centerLabel={`${oee}%`}
            centerSubLabel="OEE"
          />
          <div className="flex-1 space-y-1 text-xs">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">A (Khả dụng):</span>
              <span className="font-bold text-foreground">{availabilityScore}%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">P (Hiệu suất):</span>
              <span className="font-bold text-foreground">{performanceScore}%</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Q (Chất lượng):</span>
              <span className="font-bold text-foreground">{qualityScore}%</span>
            </div>
            <div className="border-t border-border pt-0.5 text-[10px]">
              <span className={cn('font-semibold', oeeStatus.color)}>{oeeStatus.text}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
