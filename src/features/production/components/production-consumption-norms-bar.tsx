import React from 'react';
import {
  Zap,
  Fuel,
  Layers,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
} from 'lucide-react';
import type { ConsumptionNormMetric } from '../types';
import { cn } from '@/lib/utils';

interface ProductionConsumptionNormsBarProps {
  norms?: ConsumptionNormMetric[];
  isLoading?: boolean;
}

export const ProductionConsumptionNormsBar: React.FC<ProductionConsumptionNormsBarProps> = ({
  norms,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-sm animate-pulse">
        <div className="h-4 w-60 rounded bg-muted mb-3" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-muted/60" />
          ))}
        </div>
      </div>
    );
  }

  if (!norms || norms.length === 0) {
    return null;
  }

  const getResourceIcon = (key: string, category: string) => {
    if (key === 'electricity' || category === 'fuel_energy') {
      return <Zap className="h-3.5 w-3.5 text-amber-500" />;
    }
    if (key === 'diesel' || category === 'fuel') {
      return <Fuel className="h-3.5 w-3.5 text-blue-500" />;
    }
    if (key === 'raw_material' || category === 'material') {
      return <Layers className="h-3.5 w-3.5 text-emerald-500" />;
    }
    return <Sparkles className="h-3.5 w-3.5 text-purple-500" />;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'energy':
        return 'Năng lượng';
      case 'fuel':
        return 'Nhiên liệu';
      case 'material':
        return 'Nguyên liệu';
      case 'supply':
        return 'Vật tư phụ';
      default:
        return 'Tiêu hao';
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Định mức tiêu hao Kế hoạch so với Thực tế</span>
              <span className="text-[10px] font-normal text-muted-foreground">
                (Kèm % tỷ lệ so với định mức)
              </span>
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            &le; ĐM: Tiết kiệm
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            &gt; ĐM: Vượt định mức
          </span>
        </div>
      </div>

      {/* Grid of Consumption Norms */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {norms.map((norm) => {
          const hasData = norm.actualNorm > 0;
          const ratioPct =
            norm.plannedNorm > 0 && hasData
              ? Number(((norm.actualNorm / norm.plannedNorm) * 100).toFixed(1))
              : 0;

          return (
            <div
              key={norm.key}
              className="flex flex-col justify-between rounded-lg border border-border/80 bg-background/50 p-2.5 transition-all hover:bg-muted/10 hover:shadow-xs"
            >
              {/* Row 1: Resource name & Category tag */}
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  {getResourceIcon(norm.key, norm.categoryGroup)}
                  <span className="text-xs font-semibold text-foreground truncate" title={norm.resourceName}>
                    {norm.resourceName}
                  </span>
                </div>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground shrink-0">
                  {getCategoryLabel(norm.categoryGroup)}
                </span>
              </div>

              {/* Row 2: Values (Actual vs Planned) */}
              <div className="my-1 flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-[10px] text-muted-foreground">Thực tế:</div>
                  <div className="text-sm font-bold text-foreground tracking-tight">
                    {hasData ? (
                      <>
                        <span
                          className={cn(
                            norm.status === 'better'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : norm.status === 'worse'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-foreground',
                          )}
                        >
                          {norm.actualNorm.toLocaleString('vi-VN')}
                        </span>{' '}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {norm.unit}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">Chưa có DL</span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground">ĐM kế hoạch:</div>
                  <div className="text-xs font-semibold text-foreground">
                    {norm.plannedNorm.toLocaleString('vi-VN')}{' '}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      {norm.unit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Percentage and Status badge */}
              <div className="mt-1.5 pt-1.5 border-t border-border/50 flex items-center justify-between text-[11px]">
                {hasData ? (
                  <>
                    <span className="text-[10px] text-muted-foreground">
                      Tỷ lệ:{' '}
                      <strong
                        className={cn(
                          norm.status === 'better'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : norm.status === 'worse'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-foreground',
                        )}
                      >
                        {ratioPct}%
                      </strong>
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold',
                        norm.status === 'better'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : norm.status === 'worse'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
                      )}
                    >
                      {norm.status === 'better' && (
                        <>
                          <TrendingDown className="h-3 w-3" />
                          <span>{norm.variancePct}% (Tiết kiệm)</span>
                        </>
                      )}
                      {norm.status === 'worse' && (
                        <>
                          <TrendingUp className="h-3 w-3" />
                          <span>+{norm.variancePct}% (Vượt ĐM)</span>
                        </>
                      )}
                      {norm.status === 'neutral' && (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Chuẩn ĐM</span>
                        </>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-muted-foreground">Định mức: 100%</span>
                    <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <Minus className="h-2.5 w-2.5" />
                      0% thực tế
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
